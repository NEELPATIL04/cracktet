import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { videos } from "@/db/schema";
import { eq, isNull, or } from "drizzle-orm";

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
      adminData = { id: 1 };
    }

    // Get all videos that don't have thumbnailUrl
    const videosToUpdate = await db
      .select()
      .from(videos)
      .where(or(isNull(videos.thumbnailUrl), eq(videos.thumbnailUrl, "")));

    let updatedCount = 0;

    // Update each video individually
    for (const video of videosToUpdate) {
      await db
        .update(videos)
        .set({ 
          thumbnailUrl: `/api/videos/${video.uuid}/thumbnail`,
          updatedAt: new Date()
        })
        .where(eq(videos.id, video.id));
      updatedCount++;
    }

    const allVideos = await db
      .select({
        id: videos.id,
        uuid: videos.uuid,
        title: videos.title,
        thumbnailUrl: videos.thumbnailUrl
      })
      .from(videos)
      .where(eq(videos.isActive, true));

    return NextResponse.json({
      success: true,
      message: `Updated thumbnail URLs for ${updatedCount} videos`,
      updatedCount,
      videos: allVideos
    });

  } catch (error) {
    console.error("Error updating thumbnails:", error);
    return NextResponse.json(
      { error: "Failed to update thumbnails" },
      { status: 500 }
    );
  }
}

