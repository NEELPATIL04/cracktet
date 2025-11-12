import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { resources } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    // Check for user session (optional for public viewing)
    const sessionCookie = request.cookies.get("user_session");
    let isAuthenticated = false;
    
    if (sessionCookie) {
      try {
        const sessionData = JSON.parse(sessionCookie.value);
        console.log("✅ Session valid for user:", sessionData.email);
        isAuthenticated = true;
      } catch (e) {
        console.log("❌ Invalid session data, treating as guest user");
        isAuthenticated = false;
      }
    } else {
      console.log("🔍 Guest user accessing resources");
      isAuthenticated = false;
    }

    // Fetch only active resources with UUID and premium info
    const activeResources = await db
      .select({
        id: resources.id,
        uuid: resources.uuid,
        title: resources.title,
        description: resources.description,
        fileName: resources.fileName,
        fileSize: resources.fileSize,
        pageCount: resources.pageCount,
        isPremium: resources.isPremium,
        previewPages: resources.previewPages,
        createdAt: resources.createdAt,
      })
      .from(resources)
      .where(eq(resources.isActive, true))
      .orderBy(resources.createdAt);

    return NextResponse.json({
      resources: activeResources,
    });
  } catch (error) {
    console.error("Error fetching resources:", error);
    return NextResponse.json(
      { error: "Failed to fetch resources" },
      { status: 500 }
    );
  }
}
