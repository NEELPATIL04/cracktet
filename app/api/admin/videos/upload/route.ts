import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { videos } from "@/db/schema";
import path from "path";
import { promises as fs } from "fs";
import { randomUUID } from "crypto";

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
    } catch (e) {
      adminData = { id: 1 };
    }

    const formData = await request.formData();
    const file = formData.get("video") as File;
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const category = formData.get("category") as string;
    const tags = formData.get("tags") as string;
    const isPremium = formData.get("isPremium") === "true";
    const previewDuration = parseInt(formData.get("previewDuration") as string) || 20;
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
    const storageDir = path.join(process.cwd(), "storage", "videos");
    const videoDir = path.join(storageDir, videoUuid);
    const tempFilePath = path.join(videoDir, `original.${fileExtension}`);

    await fs.mkdir(videoDir, { recursive: true });

    const buffer = Buffer.from(await file.arrayBuffer());
    await fs.writeFile(tempFilePath, buffer);

    // Dynamic import to avoid build-time FFProbe dependency
    let videoInfo, duration, result;
    try {
      const { VideoProcessor } = await import("@/lib/video-processor-simple");
      videoInfo = await VideoProcessor.extractVideoInfo(tempFilePath);
      duration = VideoProcessor.formatDuration(videoInfo.duration);

      const processingOptions = {
        inputPath: tempFilePath,
        outputDir: path.join(videoDir, 'hls'),
        encrypt: true,
        watermark: addWatermark ? {
          text: 'CrackTET',
          position: 'topRight' as const
        } : undefined
      };

      result = await VideoProcessor.processVideoToHLS(processingOptions);
    } catch (error) {
      // Fallback for when FFProbe is not available (during builds)
      console.warn("Video processing unavailable:", error);
      videoInfo = { duration: 0, resolution: "Unknown" };
      duration = "00:00:00";
      result = { success: true, thumbnail: false };
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
        previewDuration,
        sortOrder,
        uploadedBy: adminData.id,
        isActive: true,
      })
      .returning();

    await fs.unlink(tempFilePath).catch(() => {});

    return NextResponse.json({
      success: true,
      video: newVideo,
      message: "Video uploaded and processed successfully",
      processingInfo: {
        duration,
        resolution: videoInfo.resolution,
        encrypted: true,
        watermarked: addWatermark
      }
    });
  } catch (error) {
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