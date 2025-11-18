import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { videos } from "@/db/schema";
import { eq } from "drizzle-orm";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { existsSync } from "fs";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify admin session
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

    const { id: uuid } = await params;

    // Verify video exists
    const [video] = await db
      .select()
      .from(videos)
      .where(eq(videos.uuid, uuid))
      .limit(1);

    if (!video) {
      return NextResponse.json({ error: "Video not found" }, { status: 404 });
    }

    const formData = await request.formData();
    const thumbnailFile = formData.get("thumbnail") as File;

    if (!thumbnailFile || thumbnailFile.size === 0) {
      return NextResponse.json(
        { error: "No thumbnail file provided" },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!allowedTypes.includes(thumbnailFile.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Only JPEG, PNG, and WebP are allowed." },
        { status: 400 }
      );
    }

    // Validate file size (max 5MB)
    if (thumbnailFile.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File size too large. Maximum size is 5MB." },
        { status: 400 }
      );
    }

    // Create video directory if it doesn't exist
    const videoDir = path.join(process.cwd(), "storage", "videos", uuid);
    if (!existsSync(videoDir)) {
      await mkdir(videoDir, { recursive: true });
    }

    // Save thumbnail file
    const thumbnailPath = path.join(videoDir, "thumbnail.jpg");
    const thumbnailBuffer = Buffer.from(await thumbnailFile.arrayBuffer());
    await writeFile(thumbnailPath, thumbnailBuffer);

    // Update video record with thumbnail URL
    const [updatedVideo] = await db
      .update(videos)
      .set({ 
        thumbnailUrl: `/api/videos/${uuid}/thumbnail`,
        updatedAt: new Date()
      })
      .where(eq(videos.uuid, uuid))
      .returning();

    console.log(`✅ Thumbnail uploaded for video: ${uuid}`);

    return NextResponse.json({
      success: true,
      message: "Thumbnail uploaded successfully",
      video: {
        uuid: updatedVideo.uuid,
        title: updatedVideo.title,
        thumbnailUrl: updatedVideo.thumbnailUrl
      }
    });

  } catch (error) {
    console.error("Error uploading thumbnail:", error);
    return NextResponse.json(
      { error: "Failed to upload thumbnail" },
      { status: 500 }
    );
  }
}

// DELETE endpoint to remove thumbnail
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify admin session
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

    const { id: uuid } = await params;

    // Update video record to remove thumbnail URL
    const [updatedVideo] = await db
      .update(videos)
      .set({ 
        thumbnailUrl: null,
        updatedAt: new Date()
      })
      .where(eq(videos.uuid, uuid))
      .returning();

    if (!updatedVideo) {
      return NextResponse.json({ error: "Video not found" }, { status: 404 });
    }

    // Remove thumbnail file
    const thumbnailPath = path.join(process.cwd(), "storage", "videos", uuid, "thumbnail.jpg");
    if (existsSync(thumbnailPath)) {
      await import("fs/promises").then(fs => fs.unlink(thumbnailPath));
    }

    return NextResponse.json({
      success: true,
      message: "Thumbnail removed successfully"
    });

  } catch (error) {
    console.error("Error removing thumbnail:", error);
    return NextResponse.json(
      { error: "Failed to remove thumbnail" },
      { status: 500 }
    );
  }
}