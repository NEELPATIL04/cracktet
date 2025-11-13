import path from 'path';
import { promises as fs } from 'fs';
import crypto from 'crypto';

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
    return keyPath;
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

      // Simple approach: Copy the video file and create a basic HLS manifest
      const videoPath = path.join(outputDir, 'video.mp4');
      await fs.copyFile(inputPath, videoPath);
      
      // Create a simple M3U8 manifest that points to the single MP4 file
      const hlsManifest = `#EXTM3U
#EXT-X-VERSION:3
#EXT-X-TARGETDURATION:3600
#EXT-X-MEDIA-SEQUENCE:0
#EXT-X-PLAYLIST-TYPE:VOD
#EXTINF:3600.0,
video.mp4
#EXT-X-ENDLIST`;
      
      await fs.writeFile(outputPath, hlsManifest);

      return {
        success: true,
        outputPath,
        manifestPath: outputFileName,
        encryptionKey,
        duration: 0, // Duration will be determined by the client
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error during processing'
      };
    }
  }

  public static formatDuration(seconds: number): string {
    // Since we can't extract duration without FFprobe, return unknown
    return "00:00:00";
  }

  public static async extractVideoInfo(inputPath: string): Promise<{ duration: number; resolution: string }> {
    // Without FFprobe, we can't extract metadata
    // Return default values and let the client determine actual values
    return { 
      duration: 0, 
      resolution: 'Unknown' 
    };
  }
}