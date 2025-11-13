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
    const originalFilePath = path.join(videoDir, `original.${fileExtension}`);

    // Create directories
    await ensureDir(videoDir);
    await ensureDir(hlsDir);

    // Save the original file
    const buffer = Buffer.from(await file.arrayBuffer());
    await fs.writeFile(originalFilePath, buffer);

    // Create fallback video structure for direct MP4 streaming
    const fallbackResult = await createVideoFallback(videoUuid, originalFilePath);
    
    if (!fallbackResult.success) {
      // Cleanup on failure
      await fs.rm(videoDir, { recursive: true, force: true }).catch(() => {});
      return NextResponse.json(
        { error: `Failed to process video: ${fallbackResult.error}` },
        { status: 500 }
      );
    }

    // Insert video record into database
    const [newVideo] = await db
      .insert(videos)
      .values({
        uuid: videoUuid,
        title,
        description: description || "",
        videoUrl: `${videoUuid}/hls/index.m3u8`,
        videoType: "upload",
        thumbnailUrl: null, // No thumbnail generation without FFmpeg
        duration: "00:00:00", // Duration will be determined by client
        category: category || null,
        tags: tags || null,
        isPremium,
        sortOrder,
        uploadedBy: Number(adminData.id),
        isActive: true,
        previewDuration: isPremium ? 20 : null, // 20 seconds for premium videos
      })
      .returning();

    // Clean up original file to save space
    await fs.unlink(originalFilePath).catch(() => {});

    return NextResponse.json({
      success: true,
      video: newVideo,
      message: "Video uploaded successfully (no processing applied)",
      processingInfo: {
        duration: "Unknown",
        resolution: "Unknown",
        encrypted: false,
        watermarked: false,
        fallback: true
      }
    });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { 
        error: "Failed to upload video",
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
};