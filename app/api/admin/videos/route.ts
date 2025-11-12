import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { videos } from "@/db/schema";
import { desc, eq } from "drizzle-orm";

// GET all videos for admin
export async function GET(request: NextRequest) {
  try {
    // Verify admin session
    const session = request.cookies.get("admin-auth");
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized - Admin access required" },
        { status: 401 }
      );
    }

    const allVideos = await db
      .select()
      .from(videos)
      .orderBy(desc(videos.sortOrder), desc(videos.createdAt));

    return NextResponse.json({
      success: true,
      videos: allVideos,
    });
  } catch (error) {
    console.error("Error fetching videos:", error);
    return NextResponse.json(
      { error: "Failed to fetch videos" },
      { status: 500 }
    );
  }
}

// POST create new video
export async function POST(request: NextRequest) {
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
      // Session is a simple token, not JSON
    }

    const body = await request.json();
    const {
      title,
      description,
      videoUrl,
      videoType,
      thumbnailUrl,
      duration,
      category,
      tags,
      isPremium,
      sortOrder,
    } = body;

    if (!title || !videoUrl || !videoType) {
      return NextResponse.json(
        { error: "Title, video URL, and video type are required" },
        { status: 400 }
      );
    }

    // Generate UUID
    const { randomUUID } = await import("crypto");
    const videoUuid = randomUUID();

    const adminId = adminData?.id || 1;

    const [newVideo] = await db
      .insert(videos)
      .values({
        uuid: videoUuid,
        title,
        description: description || "",
        videoUrl,
        videoType,
        thumbnailUrl: thumbnailUrl || null,
        duration: duration || null,
        category: category || null,
        tags: tags || null,
        isPremium: isPremium || false,
        sortOrder: sortOrder || 0,
        uploadedBy: adminId,
        isActive: true,
      })
      .returning();

    return NextResponse.json({
      success: true,
      video: newVideo,
      message: "Video added successfully",
    });
  } catch (error) {
    console.error("Error creating video:", error);
    return NextResponse.json(
      { error: "Failed to create video" },
      { status: 500 }
    );
  }
}