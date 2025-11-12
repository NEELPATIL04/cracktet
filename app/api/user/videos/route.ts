import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { videos, users } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const session = request.cookies.get("user_session");
    if (!session) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    let userInfo;
    try {
      userInfo = JSON.parse(session.value);
    } catch (e) {
      return NextResponse.json(
        { error: "Invalid authentication" },
        { status: 401 }
      );
    }

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, userInfo.email))
      .limit(1);

    if (!user || !user.isActive) {
      return NextResponse.json(
        { error: "Active account required" },
        { status: 403 }
      );
    }

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
        createdAt: videos.createdAt,
      })
      .from(videos)
      .where(eq(videos.isActive, true))
      .orderBy(desc(videos.sortOrder), desc(videos.createdAt));

    const accessibleVideos = user.paymentStatus === "completed" 
      ? activeVideos 
      : activeVideos.filter(v => !v.isPremium);

    return NextResponse.json({
      success: true,
      videos: accessibleVideos,
      hasFullAccess: user.paymentStatus === "completed",
    });
  } catch (error) {
    console.error("Error fetching user videos:", error);
    return NextResponse.json(
      { error: "Failed to fetch videos" },
      { status: 500 }
    );
  }
}