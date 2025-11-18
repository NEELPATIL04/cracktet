import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { videos } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const session = request.cookies.get("admin-auth");
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized - Admin access required" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { isActive } = body;

    const [video] = await db
      .select()
      .from(videos)
      .where(eq(videos.uuid, id))
      .limit(1);

    if (!video) {
      return NextResponse.json(
        { error: "Video not found" },
        { status: 404 }
      );
    }

    await db
      .update(videos)
      .set({ isActive, updatedAt: new Date() })
      .where(eq(videos.uuid, id));

    return NextResponse.json({
      success: true,
      message: `Video ${isActive ? 'activated' : 'deactivated'} successfully`,
    });
  } catch (error) {
    console.error("Error toggling video status:", error);
    return NextResponse.json(
      { error: "Failed to update video status" },
      { status: 500 }
    );
  }
}