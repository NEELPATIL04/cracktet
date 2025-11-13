import path from 'path';
import { promises as fs } from 'fs';
import crypto from 'crypto';
import { exec } from 'child_process';
import { promisify } from 'util';
import { getStoragePath, ensureDir } from './video-utils';

const execAsync = promisify(exec);

interface VideoProcessingOptions {
  inputPath: string;
  outputDir: string;
  encrypt?: boolean;
  watermark?: {
    text: string;
    position?: 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight' | 'center';
  };
}

interface ProcessingResult {
  success: boolean;
  outputPath?: string;
  manifestPath?: string;
  encryptionKey?: string;
  error?: string;
  duration?: number;
  thumbnail?: string;
  fallbackUsed?: boolean;
}

export class VideoProcessor {
  private static async ensureDirectory(dir: string): Promise<void> {
    await ensureDir(dir);
  }

  private static generateEncryptionKey(): string {
    return crypto.randomBytes(16).toString('hex');
  }

  private static async generateKeyFile(outputDir: string, key: string): Promise<string> {
    const keyPath = path.join(outputDir, 'encryption.key');
    const keyInfoPath = path.join(outputDir, 'encryption.keyinfo');
    
    await fs.writeFile(keyPath, Buffer.from(key, 'hex'));
    
    const keyInfo = [
      `http://localhost:3000/api/videos/key/${path.basename(outputDir)}`,
      keyPath,
      key
    ].join('\n');
    
    await fs.writeFile(keyInfoPath, keyInfo);
    return keyPath;
  }

  private static async checkFFmpegAvailability(): Promise<boolean> {
    try {
      await execAsync('ffmpeg -version');
      return true;
    } catch {
      return false;
    }
  }

  private static async getDurationWithFFmpeg(inputPath: string): Promise<number> {
    try {
      const { stdout } = await execAsync(`ffprobe -i "${inputPath}" -show_entries format=duration -v quiet -of csv="p=0"`);
      return parseFloat(stdout.trim()) || 0;
    } catch {
      return 0;
    }
  }

  public static async processVideoToHLS(options: VideoProcessingOptions): Promise<ProcessingResult> {
    const { inputPath, outputDir, encrypt = false } = options;
    
    try {
      await this.ensureDirectory(outputDir);
      
      const outputFileName = "index.m3u8";
      const outputPath = path.join(outputDir, outputFileName);
      
      let encryptionKey: string | undefined;
      
      if (encrypt) {
        encryptionKey = this.generateEncryptionKey();
        await this.generateKeyFile(outputDir, encryptionKey);
      }

      // Check if ffmpeg is available
      const ffmpegAvailable = await this.checkFFmpegAvailability();
      
      if (!ffmpegAvailable) {
        // Fallback: Just copy the video file for direct streaming
        const fallbackPath = path.join(outputDir, 'video.mp4');
        await fs.copyFile(inputPath, fallbackPath);
        
        // Create a simple m3u8 playlist for the single file
        const simplePlaylist = `#EXTM3U
#EXT-X-VERSION:3
#EXT-X-TARGETDURATION:3600
#EXT-X-MEDIA-SEQUENCE:0
#EXT-X-PLAYLIST-TYPE:VOD
#EXTINF:3600.0,
video.mp4
#EXT-X-ENDLIST`;
        
        await fs.writeFile(outputPath, simplePlaylist);
        
        return {
          success: true,
          outputPath,
          manifestPath: outputFileName,
          encryptionKey,
          duration: 0,
          fallbackUsed: true
        };
      }

      // Use FFmpeg for proper HLS processing
      const segmentDuration = 10;
      const ffmpegCommand = [
        `ffmpeg -i "${inputPath}"`,
        '-c:v libx264',
        '-c:a aac',
        '-f hls',
        `-hls_time ${segmentDuration}`,
        '-hls_list_size 0',
        '-hls_segment_filename', `"${path.join(outputDir, 'segment%03d.ts')}"`,
        `"${outputPath}"`
      ].join(' ');

      await execAsync(ffmpegCommand);

      // Generate thumbnail
      try {
        const thumbnailPath = path.join(outputDir, 'thumbnail.jpg');
        await execAsync(`ffmpeg -i "${inputPath}" -ss 00:00:10 -vframes 1 -q:v 2 "${thumbnailPath}"`);
      } catch {
        // Thumbnail generation failed, continue without it
      }

      return {
        success: true,
        outputPath,
        manifestPath: outputFileName,
        encryptionKey,
        duration: await this.getDurationWithFFmpeg(inputPath)
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error during processing'
      };
    }
  }

  public static formatDuration(seconds: number): string {
    if (!seconds || seconds === 0) return "00:00:00";
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  public static async extractVideoInfo(inputPath: string): Promise<{ duration: number; resolution: string }> {
    try {
      let duration = 0;
      let resolution = 'unknown';

      // Only use FFmpeg for video info extraction
      const ffmpegAvailable = await this.checkFFmpegAvailability();
      if (ffmpegAvailable) {
        try {
          // Get duration
          const { stdout: durationOutput } = await execAsync(`ffprobe -i "${inputPath}" -show_entries format=duration -v quiet -of csv="p=0"`);
          duration = parseFloat(durationOutput.trim()) || 0;

          // Get resolution
          const { stdout: resolutionOutput } = await execAsync(`ffprobe -v quiet -select_streams v:0 -show_entries stream=width,height -of csv=s=x:p=0 "${inputPath}"`);
          const [width, height] = resolutionOutput.trim().split('x');
          if (width && height) {
            resolution = `${width}x${height}`;
          }
        } catch {
          // FFprobe failed, use defaults
        }
      }

      return { duration, resolution };

    } catch {
      return { duration: 0, resolution: 'unknown' };
    }
  }
}