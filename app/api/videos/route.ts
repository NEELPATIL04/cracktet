import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { videos, users } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

// Public API endpoint for listing videos - accessible to everyone for previews
export async function GET(request: NextRequest) {
  try {
    // Check if user is authenticated (optional)
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

    // Fetch all active videos with preview duration
    const activeVideos = await db
      .select({
        id: videos.id,
        uuid: videos.uuid,
        title: videos.title,
        description: videos.description,
        thumbnailUrl: videos.thumbnailUrl,
        duration: videos.duration,
        category: videos.category,
        tags: videos.tags,
        views: videos.views,
        isPremium: videos.isPremium,
        previewDuration: videos.previewDuration,
        createdAt: videos.createdAt,
      })
      .from(videos)
      .where(eq(videos.isActive, true))
      .orderBy(desc(videos.sortOrder), desc(videos.createdAt));

    return NextResponse.json({
      success: true,
      videos: activeVideos, // Show all videos to everyone
      isAuthenticated,
      hasFullAccess: user?.paymentStatus === "completed" || false,
      userStatus: user ? {
        isActive: user.isActive,
        paymentStatus: user.paymentStatus
      } : null,
      totalCount: activeVideos.length,
      premiumCount: activeVideos.filter(v => v.isPremium).length,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch videos" },
      { status: 500 }
    );
  }
}