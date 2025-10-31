import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { resources, users } from "@/db/schema";
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
    let sessionData = null;
    try {
      sessionData = JSON.parse(sessionCookie.value);
      console.log("📝 User data from session:", sessionData.email);
    } catch (e) {
      console.error("Failed to parse session:", e);
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    const { id: uuidParam } = await params;

    // Fetch complete user data from database
    const [user] = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        mobile: users.mobile,
      })
      .from(users)
      .where(eq(users.id, sessionData.id))
      .limit(1);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Fetch resource by UUID (must be active)
    const [resource] = await db
      .select()
      .from(resources)
      .where(and(eq(resources.uuid, uuidParam), eq(resources.isActive, true)))
      .limit(1);

    if (!resource) {
      return NextResponse.json(
        { error: "Resource not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      resource: {
        uuid: resource.uuid,
        title: resource.title,
        description: resource.description,
      },
      user: user, // Include complete user data from database
    });
  } catch (error) {
    console.error("Error fetching resource:", error);
    return NextResponse.json(
      { error: "Failed to fetch resource" },
      { status: 500 }
    );
  }
}
