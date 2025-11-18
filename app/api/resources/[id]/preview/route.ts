import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { resources } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: uuidParam } = await params;

    // Fetch resource by UUID (must be active) - NO AUTH REQUIRED for preview
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

    // For public preview, always return preview pages limit
    const availablePages = resource.previewPages;

    return NextResponse.json({
      resource: {
        uuid: resource.uuid,
        title: resource.title,
        description: resource.description,
        pageCount: resource.pageCount,
        isPremium: resource.isPremium,
        previewPages: resource.previewPages,
        availablePages: availablePages,
        isPreviewMode: true, // Always preview mode for public access
      },
      user: null, // No user data for public preview
    });
  } catch (error) {
    console.error("Error fetching resource preview:", error);
    return NextResponse.json(
      { error: "Failed to fetch resource preview" },
      { status: 500 }
    );
  }
}