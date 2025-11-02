import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { resources } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    // Verify user session
    const sessionCookie = request.cookies.get("user_session");
    console.log("🔍 Resources API - Session cookie:", sessionCookie ? "exists" : "missing");

    if (!sessionCookie) {
      console.log("❌ No session cookie found");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Try to parse the session to verify it's valid
    try {
      const sessionData = JSON.parse(sessionCookie.value);
      console.log("✅ Session valid for user:", sessionData.email);
    } catch (e) {
      console.log("❌ Invalid session data");
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    // Fetch only active resources with UUID
    const activeResources = await db
      .select({
        id: resources.id,
        uuid: resources.uuid,
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
