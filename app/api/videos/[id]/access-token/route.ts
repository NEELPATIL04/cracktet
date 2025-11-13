import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { videos, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import jwt from "jsonwebtoken";
import { getVideoFilePath } from "@/lib/video-utils";

const JWT_SECRET = process.env.VIDEO_JWT_SECRET || "your-secret-key-change-in-production";
const TOKEN_EXPIRY = 4 * 60 * 60; // 4 hours

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Check if user is authenticated (optional for previews)
    const session = request.cookies.get("user_session");
    let user = null;
    let isAuthenticated = false;

    if (session) {
      try {
        const userInfo = JSON.parse(session.value);
        [user] = await db
          .select()
          .from(users)
          .where(eq(users.email, userInfo.email))
          .limit(1);
        
        if (user && user.isActive) {
          isAuthenticated = true;
        }
      } catch (e) {
        // Invalid session, continue as guest
      }
    }

    const [video] = await db
      .select()
      .from(videos)
      .where(eq(videos.uuid, id))
      .limit(1);

    if (!video || !video.isActive) {
      return NextResponse.json(
        { error: "Video not found" },
        { status: 404 }
      );
    }

    // Determine access level
    const hasFullAccess = isAuthenticated && user?.paymentStatus === "completed";
    const isPreviewOnly = !isAuthenticated || (video.isPremium && user?.paymentStatus !== "completed");

    await db
      .update(videos)
      .set({ views: (video.views || 0) + 1 })
      .where(eq(videos.id, video.id));

    const token = jwt.sign(
      {
        userId: user?.id || null,
        videoId: video.uuid,
        exp: Math.floor(Date.now() / 1000) + TOKEN_EXPIRY
      },
      JWT_SECRET
    );

    // Determine the best streaming method
    let streamUrl = video.videoUrl;
    
    if (video.videoType === "upload") {
      const videoFile = await getVideoFilePath(video.uuid, true);
      
      if (videoFile.type === 'hls') {
        // Use HLS streaming
        streamUrl = `/api/videos/${video.uuid}/hls/index.m3u8`;
      } else if (videoFile.type === 'mp4') {
        // Fallback to direct MP4 streaming
        streamUrl = `/api/videos/${video.uuid}/stream`;
      } else {
        // If no video file found, try the stored URL or stream endpoint
        streamUrl = video.videoUrl || `/api/videos/${video.uuid}/stream`;
      }
    }

    return NextResponse.json({
      success: true,
      token,
      streamUrl,
      videoType: video.videoType,
      title: video.title,
      description: video.description,
      duration: video.duration,
      isAuthenticated,
      hasFullAccess,
      isPreviewOnly,
      previewDuration: video.previewDuration,
      isPremium: video.isPremium,
      expiresIn: TOKEN_EXPIRY,
      playerConfig: {
        controls: true,
        autoplay: false,
        muted: false,
        loop: false,
        playbackRates: [0.5, 1, 1.5, 2],
        disablePictureInPicture: true,
        controlsList: "nodownload",
        contextMenu: false
      }
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to generate access token" },
      { status: 500 }
    );
  }
}