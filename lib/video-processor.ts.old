import path from 'path';
import { promises as fs } from 'fs';
import crypto from 'crypto';
import { exec } from 'child_process';
import { promisify } from 'util';
import { getVideoDurationInSeconds } from 'get-video-duration';

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
}

export class VideoProcessor {
  private static async ensureDirectory(dir: string): Promise<void> {
    try {
      await fs.access(dir);
    } catch {
      await fs.mkdir(dir, { recursive: true });
    }
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
    
    return keyInfoPath;
  }

  public static async processVideoToHLS(options: VideoProcessingOptions): Promise<ProcessingResult> {
    const { inputPath, outputDir, encrypt = true, watermark } = options;
    
    try {
      await this.ensureDirectory(outputDir);
      
      const outputFileName = 'index.m3u8';
      const outputPath = path.join(outputDir, outputFileName);
      const segmentPath = path.join(outputDir, 'segment%03d.ts');
      const thumbnailPath = path.join(outputDir, 'thumbnail.jpg');
      
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
#EXT-X-TARGETDURATION:0
#EXT-X-MEDIA-SEQUENCE:0
#EXTINF:0.0,
video.mp4
#EXT-X-ENDLIST`;
        
        await fs.writeFile(outputPath, simplePlaylist);
        
        return {
          success: true,
          outputPath,
          manifestPath: outputFileName,
          encryptionKey,
          duration: 0
        };
      }

      // Build ffmpeg command
      let watermarkFilter = '';
      if (watermark) {
        const text = watermark.text.replace(/'/g, "\\'");
        const positions: Record<string, string> = {
          topLeft: 'x=10:y=10',
          topRight: 'x=(w-text_w-10):y=10',
          bottomLeft: 'x=10:y=(h-text_h-10)',
          bottomRight: 'x=(w-text_w-10):y=(h-text_h-10)',
          center: 'x=(w-text_w)/2:y=(h-text_h)/2'
        };
        const position = positions[watermark.position || 'topRight'];
        watermarkFilter = `-vf "drawtext=text='${text}':fontcolor=white@0.5:fontsize=24:${position}:box=1:boxcolor=black@0.3:boxborderw=5"`;
      }

      let encryptionOptions = '';
      if (encrypt) {
        const keyInfoPath = path.join(outputDir, 'encryption.keyinfo');
        encryptionOptions = `-hls_key_info_file "${keyInfoPath}"`;
      }

      const ffmpegCommand = [
        `ffmpeg -i "${inputPath}"`,
        '-codec:v libx264',
        '-codec:a aac',
        '-hls_time 10',
        '-hls_playlist_type vod',
        `-hls_segment_filename "${segmentPath}"`,
        '-start_number 0',
        '-preset fast',
        '-crf 22',
        watermarkFilter,
        encryptionOptions,
        `"${outputPath}"`
      ].filter(Boolean).join(' ');

      await execAsync(ffmpegCommand);

      // Generate thumbnail
      try {
        await execAsync(`ffmpeg -i "${inputPath}" -ss 00:00:10 -vframes 1 -q:v 2 "${thumbnailPath}"`);
      } catch (e) {
        // Thumbnail generation failed, continue without it
      }

      // Get video duration
      let duration = 0;
      try {
        const { stdout } = await execAsync(`ffprobe -i "${inputPath}" -show_entries format=duration -v quiet -of csv="p=0"`);
        duration = parseFloat(stdout.trim()) || 0;
      } catch (e) {
        // Duration detection failed
      }

      return {
        success: true,
        outputPath,
        manifestPath: outputFileName,
        encryptionKey,
        duration,
        thumbnail: thumbnailPath
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private static async checkFFmpegAvailability(): Promise<boolean> {
    try {
      await execAsync('ffmpeg -version');
      return true;
    } catch (error) {
      return false;
    }
  }

  private static getWatermarkFilter(watermark: NonNullable<VideoProcessingOptions['watermark']>): string {
    const text = watermark.text.replace(/'/g, "\\'");
    const positions: Record<string, string> = {
      topLeft: 'x=10:y=10',
      topRight: 'x=(w-text_w-10):y=10',
      bottomLeft: 'x=10:y=(h-text_h-10)',
      bottomRight: 'x=(w-text_w-10):y=(h-text_h-10)',
      center: 'x=(w-text_w)/2:y=(h-text_h)/2'
    };
    
    const position = positions[watermark.position || 'topRight'];
    
    return `drawtext=text='${text}':fontcolor=white@0.5:fontsize=24:${position}:box=1:boxcolor=black@0.3:boxborderw=5`;
  }

  public static async extractVideoInfo(inputPath: string): Promise<{ duration: number; resolution: string }> {
    try {
      let duration = 0;
      let resolution = 'unknown';

      // Try to get duration using get-video-duration package first (works without ffmpeg)
      try {
        duration = await getVideoDurationInSeconds(inputPath);
      } catch (e) {
        
        // Fallback to ffprobe if available
        const ffmpegAvailable = await this.checkFFmpegAvailability();
        if (ffmpegAvailable) {
          try {
            const { stdout: durationOutput } = await execAsync(`ffprobe -i "${inputPath}" -show_entries format=duration -v quiet -of csv="p=0"`);
            duration = parseFloat(durationOutput.trim()) || 0;
          } catch (e) {
          }
        }
      }

      // Try to get resolution with ffprobe if available
      const ffmpegAvailable = await this.checkFFmpegAvailability();
      if (ffmpegAvailable) {
        try {
          const { stdout: resolutionOutput } = await execAsync(`ffprobe -v quiet -select_streams v:0 -show_entries stream=width,height -of csv=s=x:p=0 "${inputPath}"`);
          const [width, height] = resolutionOutput.trim().split('x');
          if (width && height) {
            resolution = `${width}x${height}`;
          }
        } catch (e) {
          // Resolution detection failed
        }
      }

      return { duration, resolution };
    } catch (error) {
      throw new Error(`Failed to extract video info: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  public static formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
}