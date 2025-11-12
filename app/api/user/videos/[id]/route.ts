import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { videos, users } from "@/db/schema";
import { eq, and, ne } from "drizzle-orm";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Check for user session (optional for demo viewing)
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
        // Invalid session, treat as guest user
        user = null;
        isAuthenticated = false;
      }
    }

    const [video] = await db
      .select()
      .from(videos)
      .where(and(
        eq(videos.uuid, id),
        eq(videos.isActive, true)
      ))
      .limit(1);

    if (!video) {
      return NextResponse.json(
        { error: "Video not found" },
        { status: 404 }
      );
    }

    // Determine access level
    const hasPremiumAccess = isAuthenticated && user?.paymentStatus === "completed";
    const isPreviewMode = !hasPremiumAccess; // All non-premium users (including guests) get preview mode for premium videos

    const relatedVideos = await db
      .select({
        uuid: videos.uuid,
        title: videos.title,
        thumbnailUrl: videos.thumbnailUrl,
        duration: videos.duration,
        views: videos.views,
        isPremium: videos.isPremium,
      })
      .from(videos)
      .where(and(
        eq(videos.isActive, true),
        ne(videos.uuid, id),
        video.category ? eq(videos.category, video.category) : undefined
      ))
      .limit(5);

    const filteredRelated = hasPremiumAccess
      ? relatedVideos
      : relatedVideos; // Show all videos to non-premium users (they'll get previews)

    return NextResponse.json({
      success: true,
      video: {
        uuid: video.uuid,
        title: video.title,
        description: video.description,
        category: video.category,
        tags: video.tags,
        views: video.views,
        isPremium: video.isPremium,
        duration: video.duration,
        createdAt: video.createdAt,
        videoUrl: video.videoUrl,
        videoType: video.videoType,
        thumbnailUrl: video.thumbnailUrl,
        // Add preview information for non-premium users
        isPreviewMode: isPreviewMode,
        previewDuration: isPreviewMode ? video.previewDuration : null,
        hasPremiumAccess: hasPremiumAccess,
      },
      relatedVideos: filteredRelated,
    });
  } catch (error) {
    console.error("Error fetching video details:", error);
    return NextResponse.json(
      { error: "Failed to fetch video details" },
      { status: 500 }
    );
  }
}