import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { videos } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getVideoFilePath, getStoragePath, fileExists } from "@/lib/video-utils";
import path from "path";
import { promises as fs } from "fs";
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Get video from database
    const [video] = await db
      .select()
      .from(videos)
      .where(eq(videos.uuid, id))
      .limit(1);
    
    if (!video) {
      return NextResponse.json({
        error: "Video not found in database",
        videoId: id
      }, { status: 404 });
    }
    
    // Check storage paths
    const storagePath = getStoragePath();
    const videoDir = path.join(storagePath, 'videos', id);
    const hlsDir = path.join(videoDir, 'hls');
    
    // Check what files exist
    const files: Record<string, boolean> = {};
    const filesToCheck = [
      'original.mp4',
      'video.mp4',
      'hls/video.mp4',
      'hls/index.m3u8',
      'hls/segment0.ts',
      'hls/encryption.key'
    ];
    
    for (const file of filesToCheck) {
      const filePath = path.join(videoDir, file);
      files[file] = await fileExists(filePath);
    }
    
    // Check FFmpeg availability
    let ffmpegAvailable = false;
    let ffmpegVersion = null;
    try {
      const { stdout } = await execAsync('ffmpeg -version');
      ffmpegAvailable = true;
      ffmpegVersion = stdout.split('\n')[0];
    } catch {
      ffmpegAvailable = false;
    }
    
    // Get recommended video path
    const videoFile = await getVideoFilePath(id, true);
    
    // Check HLS manifest content if it exists
    let hlsManifestInfo = null;
    if (files['hls/index.m3u8']) {
      try {
        const manifestPath = path.join(hlsDir, 'index.m3u8');
        const content = await fs.readFile(manifestPath, 'utf-8');
        const hasSegments = content.includes('.ts') || content.includes('segment');
        const isEncrypted = content.includes('#EXT-X-KEY');
        hlsManifestInfo = {
          hasSegments,
          isEncrypted,
          firstLines: content.split('\n').slice(0, 10).join('\n')
        };
      } catch (e) {
        hlsManifestInfo = { error: 'Could not read manifest' };
      }
    }
    
    // Get file sizes
    const fileSizes: Record<string, number> = {};
    for (const [file, exists] of Object.entries(files)) {
      if (exists) {
        try {
          const filePath = path.join(videoDir, file);
          const stats = await fs.stat(filePath);
          fileSizes[file] = stats.size;
        } catch {
          fileSizes[file] = 0;
        }
      }
    }
    
    // Get directory listing
    let directoryListing: string[] = [];
    try {
      if (await fileExists(videoDir)) {
        directoryListing = await fs.readdir(videoDir, { recursive: true }) as string[];
      }
    } catch {
      directoryListing = [];
    }
    
    return NextResponse.json({
      debug: true,
      video: {
        id: video.uuid,
        title: video.title,
        videoType: video.videoType,
        videoUrl: video.videoUrl,
        isActive: video.isActive,
        isPremium: video.isPremium,
        duration: video.duration,
        previewDuration: video.previewDuration
      },
      storage: {
        storagePath,
        videoDir,
        exists: await fileExists(videoDir)
      },
      files: {
        exists: files,
        sizes: fileSizes,
        recommendedPath: videoFile.path,
        recommendedType: videoFile.type
      },
      hls: hlsManifestInfo,
      system: {
        ffmpegAvailable,
        ffmpegVersion,
        nodeVersion: process.version,
        platform: process.platform,
        cwd: process.cwd()
      },
      directoryListing: directoryListing.slice(0, 50), // Limit to first 50 files
      streamingUrls: {
        hls: `/api/videos/${id}/hls/index.m3u8`,
        mp4: `/api/videos/${id}/stream`,
        recommended: videoFile.type === 'hls' 
          ? `/api/videos/${id}/hls/index.m3u8` 
          : `/api/videos/${id}/stream`
      }
    });
    
  } catch (error) {
    return NextResponse.json({
      error: "Debug endpoint error",
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}