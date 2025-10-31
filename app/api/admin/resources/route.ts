import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { resources } from "@/db/schema";
import { desc } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    // ✅ Verify admin session (matches your login format)
    const session = request.cookies.get("admin-auth");
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized - Admin access required" },
        { status: 401 }
      );
    }

    // ✅ Try to parse session (optional, if you store admin data)
    try {
      const adminData = JSON.parse(session.value);
      console.log("Admin accessing resources:", adminData);
    } catch (e) {
      // If parsing fails, session is just a simple string token
      console.log("Admin session token:", session.value);
    }

    const allResources = await db
      .select({
        id: resources.id,
        title: resources.title,
        description: resources.description,
        fileName: resources.fileName,
        fileSize: resources.fileSize,
        fileUrl: resources.fileUrl,
        isActive: resources.isActive,
        createdAt: resources.createdAt,
      })
      .from(resources)
      .orderBy(desc(resources.createdAt));

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
