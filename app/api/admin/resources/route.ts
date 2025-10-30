import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { resources } from "@/db/schema";

export async function GET(request: NextRequest) {
  try {
    // Verify admin session
    const session = request.cookies.get("admin_session");
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch all resources
    const allResources = await db
      .select()
      .from(resources)
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
