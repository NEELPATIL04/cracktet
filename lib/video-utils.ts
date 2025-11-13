import path from 'path';
import { promises as fs } from 'fs';

// Get reliable storage path for production
export function getStoragePath(): string {
  // Use environment variable if available (recommended for production)
  if (process.env.STORAGE_PATH) {
    return process.env.STORAGE_PATH;
  }
  
  // Fallback to relative path from project root
  // This is more reliable than process.cwd() in production
  const projectRoot = path.resolve(path.dirname(require.main?.filename || __dirname), '..');
  return path.join(projectRoot, 'storage');
}

// Check if a file exists
export async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

// Ensure directory exists
export async function ensureDir(dir: string): Promise<void> {
  try {
    await fs.access(dir);
  } catch {
    await fs.mkdir(dir, { recursive: true });
  }
}

// Get video file path with fallbacks
export async function getVideoFilePath(videoId: string, preferHls: boolean = true): Promise<{
  path: string;
  type: 'hls' | 'mp4' | null;
}> {
  const storagePath = getStoragePath();
  const videoDir = path.join(storagePath, 'videos', videoId);
  
  // Check for HLS files first
  if (preferHls) {
    const hlsPath = path.join(videoDir, 'hls', 'index.m3u8');
    if (await fileExists(hlsPath)) {
      return { path: hlsPath, type: 'hls' };
    }
  }
  
  // Fallback to MP4
  const mp4Paths = [
    path.join(videoDir, 'hls', 'video.mp4'),
    path.join(videoDir, 'original.mp4'),
    path.join(videoDir, 'video.mp4')
  ];
  
  for (const mp4Path of mp4Paths) {
    if (await fileExists(mp4Path)) {
      return { path: mp4Path, type: 'mp4' };
    }
  }
  
  return { path: '', type: null };
}