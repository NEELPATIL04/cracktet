import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { videos } from "@/db/schema";
import { eq } from "drizzle-orm";
import path from "path";
import { existsSync } from "fs";

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  if (hours > 0) {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  } else {
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verify admin session (you might want to add admin authentication here)
    
    const body = await request.json();
    const { videoId, duration } = body;

    if (!videoId || typeof duration !== 'number' || duration <= 0) {
      return NextResponse.json(
        { error: "Invalid video ID or duration" },
        { status: 400 }
      );
    }

    // Update video duration in database
    const formattedDuration = formatDuration(duration);
    
    const [updatedVideo] = await db
      .update(videos)
      .set({ 
        duration: formattedDuration,
        updatedAt: new Date()
      })
      .where(eq(videos.id, videoId))
      .returning({
        id: videos.id,
        title: videos.title,
        duration: videos.duration
      });

    if (!updatedVideo) {
      return NextResponse.json(
        { error: "Video not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      video: updatedVideo,
      message: `Duration updated to ${formattedDuration}`
    });

  } catch (error) {
    console.error("Error updating video duration:", error);
    return NextResponse.json(
      { error: "Failed to update video duration" },
      { status: 500 }
    );
  }
}

// Get all videos with missing or zero duration
export async function GET() {
  try {
    const videosWithoutDuration = await db
      .select({
        id: videos.id,
        uuid: videos.uuid,
        title: videos.title,
        duration: videos.duration,
        videoUrl: videos.videoUrl,
        videoType: videos.videoType
      })
      .from(videos)
      .where(eq(videos.isActive, true));

    // Filter videos that need duration update
    const needsUpdate = videosWithoutDuration.filter(video => 
      !video.duration || 
      video.duration === "00:00:00" || 
      video.duration === "00:00" ||
      video.duration === null
    );

    return NextResponse.json({
      success: true,
      videos: needsUpdate,
      total: needsUpdate.length,
      message: `Found ${needsUpdate.length} videos that need duration updates`
    });

  } catch (error) {
    console.error("Error fetching videos:", error);
    return NextResponse.json(
      { error: "Failed to fetch videos" },
      { status: 500 }
    );
  }
}