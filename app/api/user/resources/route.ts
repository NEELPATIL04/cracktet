import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { resources } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    // Verify user session
    const session = request.cookies.get("user_session");
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Fetch all active resources
    const allResources = await db
      .select({
        id: resources.id,
        title: resources.title,
        description: resources.description,
        fileName: resources.fileName,
        fileSize: resources.fileSize,
        createdAt: resources.createdAt,
      })
      .from(resources)
      .where(eq(resources.isActive, true))
      .orderBy(resources.createdAt);

    return NextResponse.json({
      success: true,
      resources: allResources,
    });
  } catch (error) {
    console.error("Error fetching resources:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
