import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { resources } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify user session
    const sessionCookie = request.cookies.get("user_session");
    console.log("🔍 Resource Detail API - Session cookie:", sessionCookie ? "exists" : "missing");

    if (!sessionCookie) {
      console.log("❌ Resource Detail: No session cookie found");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("✅ Resource Detail: Session valid, fetching resource");

    // Parse session to get user data
    let userData = null;
    try {
      userData = JSON.parse(sessionCookie.value);
      console.log("📝 User data from session:", userData.email);
    } catch (e) {
      console.error("Failed to parse session:", e);
    }

    const { id: idParam } = await params;
    const id = parseInt(idParam);

    // Fetch resource (must be active)
    const [resource] = await db
      .select()
      .from(resources)
      .where(and(eq(resources.id, id), eq(resources.isActive, true)))
      .limit(1);

    if (!resource) {
      return NextResponse.json(
        { error: "Resource not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      resource: {
        id: resource.id,
        title: resource.title,
        description: resource.description,
        fileName: resource.fileName,
        fileSize: resource.fileSize,
        fileUrl: resource.fileUrl,
        createdAt: resource.createdAt,
      },
      user: userData, // Include user data from session
    });
  } catch (error) {
    console.error("Error fetching resource:", error);
    return NextResponse.json(
      { error: "Failed to fetch resource" },
      { status: 500 }
    );
  }
}
