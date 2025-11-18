import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { videos, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import jwt from "jsonwebtoken";
import path from "path";
import { promises as fs } from "fs";

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
    // Preview mode ONLY for premium videos when user doesn't have full access
    const isPreviewOnly = video.isPremium && (!isAuthenticated || user?.paymentStatus !== "completed");

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

    // Check if HLS files exist and are properly formatted
    let streamUrl = video.videoUrl;
    
    if (video.videoType === "upload") {
      // For uploaded videos, check if we should use HLS or direct MP4
      const hlsPath = path.join(
        process.cwd(),
        "storage",
        "videos",
        video.uuid,
        "hls",
        "index.m3u8"
      );
      
      try {
        const hlsContent = await fs.readFile(hlsPath, 'utf-8');
        // Check if this is a properly segmented HLS file (has .ts segments)
        const hasSegments = hlsContent.includes('.ts') || hlsContent.includes('segment');
        
        if (hasSegments) {
          // Use HLS streaming - no token required for preview access
          streamUrl = `/api/videos/${video.uuid}/hls/index.m3u8`;
        } else {
          // Fallback to direct MP4 streaming - no token required for preview access
          streamUrl = `/api/videos/${video.uuid}/stream`;
        }
      } catch {
        // If HLS file doesn't exist, use direct MP4 streaming - no token required for preview access
        streamUrl = `/api/videos/${video.uuid}/stream`;
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
      previewDuration: isPreviewOnly ? video.previewDuration : null,
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