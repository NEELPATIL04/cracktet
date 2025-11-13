import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { videos } from "@/db/schema";
import path from "path";
import { promises as fs } from "fs";
import { randomUUID } from "crypto";
import { getStoragePath, ensureDir } from "@/lib/video-utils";
import { createVideoFallback } from "@/lib/video-fallback";

const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB
const ALLOWED_FORMATS = ['mp4', 'mov', 'avi', 'mkv', 'webm'];

export async function POST(request: NextRequest) {
  try {
    const session = request.cookies.get("admin-auth");
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized - Admin access required" },
        { status: 401 }
      );
    }

    let adminData = null;
    try {
      adminData = JSON.parse(session.value);
    } catch {
      adminData = { id: 1 };
    }

    const formData = await request.formData();
    const file = formData.get("video") as File;
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const category = formData.get("category") as string;
    const tags = formData.get("tags") as string;
    const isPremium = formData.get("isPremium") === "true";
    const sortOrder = parseInt(formData.get("sortOrder") as string) || 0;
    const addWatermark = formData.get("watermark") === "true";

    if (!file || !title) {
      return NextResponse.json(
        { error: "Video file and title are required" },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File size exceeds ${MAX_FILE_SIZE / (1024 * 1024)}MB limit` },
        { status: 400 }
      );
    }

    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    if (!fileExtension || !ALLOWED_FORMATS.includes(fileExtension)) {
      return NextResponse.json(
        { error: `Invalid file format. Allowed formats: ${ALLOWED_FORMATS.join(', ')}` },
        { status: 400 }
      );
    }

    const videoUuid = randomUUID();
    const storagePath = getStoragePath();
    const videoDir = path.join(storagePath, "videos", videoUuid);
    const hlsDir = path.join(videoDir, "hls");
    const tempFilePath = path.join(videoDir, `original.${fileExtension}`);

    await ensureDir(videoDir);
    await ensureDir(hlsDir);

    const buffer = Buffer.from(await file.arrayBuffer());
    await fs.writeFile(tempFilePath, buffer);

    // Try video processing, fallback to simple file copy if it fails
    let videoInfo = { duration: 0, resolution: "Unknown" };
    let duration = "00:00:00";
    let result = { success: false, thumbnail: false, error: "" };
    let processingAttempted = false;

    try {
      // Only attempt processing if we're not in a problematic environment
      if (process.env.NODE_ENV !== 'production' || process.env.ENABLE_VIDEO_PROCESSING === 'true') {
        const { VideoProcessor } = await import("@/lib/video-processor-safe");
        videoInfo = await VideoProcessor.extractVideoInfo(tempFilePath);
        duration = VideoProcessor.formatDuration(videoInfo.duration);

        const processingOptions = {
          inputPath: tempFilePath,
          outputDir: hlsDir,
          encrypt: true,
          watermark: addWatermark ? {
            text: 'CrackTET',
            position: 'topRight' as const
          } : undefined
        };

        result = await VideoProcessor.processVideoToHLS(processingOptions);
        processingAttempted = true;
      }
    } catch (error) {
      console.warn("Video processing failed, using fallback:", error);
      result = { success: false, error: error instanceof Error ? error.message : 'Processing failed' };
    }

    // If processing failed or wasn't attempted, use fallback
    if (!result.success) {
      console.log('Using video fallback method');
      const fallbackResult = await createVideoFallback(videoUuid, tempFilePath);
      
      if (fallbackResult.success) {
        result = { 
          success: true, 
          thumbnail: false,
          fallbackUsed: true
        };
      } else {
        result = {
          success: false,
          error: fallbackResult.error || 'Fallback processing failed'
        };
      }
    }

    if (!result.success) {
      await fs.rm(videoDir, { recursive: true, force: true });
      return NextResponse.json(
        { error: `Failed to process video: ${result.error}` },
        { status: 500 }
      );
    }

    const [newVideo] = await db
      .insert(videos)
      .values({
        uuid: videoUuid,
        title,
        description: description || "",
        videoUrl: `${videoUuid}/hls/index.m3u8`,
        videoType: "upload",
        thumbnailUrl: result.thumbnail ? `/api/videos/${videoUuid}/thumbnail` : null,
        duration,
        category: category || null,
        tags: tags || null,
        isPremium,
        sortOrder,
        uploadedBy: Number(adminData.id),
        isActive: true,
      })
      .returning();

    await fs.unlink(tempFilePath).catch(() => {});

    return NextResponse.json({
      success: true,
      video: newVideo,
      message: processingAttempted ? "Video uploaded and processed successfully" : "Video uploaded successfully (fallback mode)",
      processingInfo: {
        duration,
        resolution: videoInfo.resolution,
        encrypted: processingAttempted && !result.fallbackUsed,
        watermarked: addWatermark && processingAttempted && !result.fallbackUsed,
        fallbackUsed: result.fallbackUsed || false
      }
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: "Failed to upload video" },
      { status: 500 }
    );
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
};