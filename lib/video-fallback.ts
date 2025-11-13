import { promises as fs } from 'fs';
import path from 'path';
import { getStoragePath, ensureDir } from './video-utils';

interface VideoFallbackResult {
  success: boolean;
  error?: string;
  fallbackPath?: string;
}

/**
 * Create a fallback video structure when FFmpeg is not available
 * This copies the original video file to expected locations for direct MP4 streaming
 */
export async function createVideoFallback(
  videoId: string,
  originalVideoPath: string
): Promise<VideoFallbackResult> {
  try {
    const storagePath = getStoragePath();
    const videoDir = path.join(storagePath, 'videos', videoId);
    const hlsDir = path.join(videoDir, 'hls');
    
    // Ensure directories exist
    await ensureDir(videoDir);
    await ensureDir(hlsDir);
    
    // Copy original video to expected locations
    const fallbackPath = path.join(hlsDir, 'video.mp4');
    
    try {
      await fs.copyFile(originalVideoPath, fallbackPath);
      
      // Create a simple M3U8 manifest for single file playback
      const manifestContent = `#EXTM3U
#EXT-X-VERSION:3
#EXT-X-TARGETDURATION:3600
#EXT-X-MEDIA-SEQUENCE:0
#EXT-X-PLAYLIST-TYPE:VOD
#EXTINF:3600.0,
video.mp4
#EXT-X-ENDLIST`;
      
      const manifestPath = path.join(hlsDir, 'index.m3u8');
      await fs.writeFile(manifestPath, manifestContent);
      
      return {
        success: true,
        fallbackPath
      };
      
    } catch (copyError) {
      return {
        success: false,
        error: `Failed to create video fallback: ${copyError}`
      };
    }
    
  } catch (error) {
    return {
      success: false,
      error: `Failed to setup fallback structure: ${error}`
    };
  }
}

/**
 * Check if video files exist and are accessible
 */
export async function validateVideoFiles(videoId: string): Promise<{
  hasHLS: boolean;
  hasMP4: boolean;
  hlsPath?: string;
  mp4Path?: string;
}> {
  const storagePath = getStoragePath();
  const videoDir = path.join(storagePath, 'videos', videoId);
  const hlsDir = path.join(videoDir, 'hls');
  
  const hlsManifestPath = path.join(hlsDir, 'index.m3u8');
  const mp4Path = path.join(hlsDir, 'video.mp4');
  
  let hasHLS = false;
  let hasMP4 = false;
  
  try {
    await fs.access(hlsManifestPath);
    hasHLS = true;
  } catch {
    // HLS not available
  }
  
  try {
    await fs.access(mp4Path);
    hasMP4 = true;
  } catch {
    // MP4 not available
  }
  
  return {
    hasHLS,
    hasMP4,
    hlsPath: hasHLS ? hlsManifestPath : undefined,
    mp4Path: hasMP4 ? mp4Path : undefined
  };
}