import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { resources, users } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { readFile } from "fs/promises";
import path from "path";
import { existsSync } from "fs";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; pageNumber: string }> }
) {
  const { id: uuidParam, pageNumber } = await params;
  const pageNum = parseInt(pageNumber);

  try {
    // Verify user session
    const sessionCookie = request.cookies.get("user_session");

    if (!sessionCookie) {
      console.log("❌ Page API: No session cookie found");
      return NextResponse.json(
        { error: "Unauthorized - Please log in again" },
        { status: 401 }
      );
    }

    // Parse session to get user data
    let sessionData = null;
    try {
      sessionData = JSON.parse(sessionCookie.value);
    } catch (e) {
      console.error("Failed to parse session:", e);
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    // Fetch user data to check premium access
    const [user] = await db
      .select({
        id: users.id,
        paymentStatus: users.paymentStatus,
        isActive: users.isActive,
      })
      .from(users)
      .where(eq(users.id, sessionData.id))
      .limit(1);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    console.log(`📄 Loading page ${pageNum} for resource ${uuidParam}`);

    // Validate page number
    if (isNaN(pageNum) || pageNum < 1) {
      return NextResponse.json(
        { error: "Invalid page number" },
        { status: 400 }
      );
    }

    // Fetch resource by UUID (must be active)
    const [resource] = await db
      .select()
      .from(resources)
      .where(and(eq(resources.uuid, uuidParam), eq(resources.isActive, true)))
      .limit(1);

    if (!resource) {
      console.log("❌ Resource not found or inactive");
      return NextResponse.json(
        { error: "Resource not found or inactive" },
        { status: 404 }
      );
    }

    // Check if page number is valid
    if (pageNum > resource.pageCount) {
      return NextResponse.json(
        {
          error: `Page number ${pageNum} exceeds total pages ${resource.pageCount}`,
        },
        { status: 400 }
      );
    }

    // Check premium access and page restrictions
    const hasPremiumAccess = user.paymentStatus === "completed" && user.isActive;
    const isPreviewMode = resource.isPremium && !hasPremiumAccess;
    
    if (isPreviewMode && pageNum > resource.previewPages) {
      console.log(`❌ Access denied: User requesting page ${pageNum} but only has preview access to first ${resource.previewPages} pages`);
      return NextResponse.json(
        {
          error: `Access denied. This is a premium resource. You can only view the first ${resource.previewPages} pages. Please upgrade to access all ${resource.pageCount} pages.`,
          isPremiumContent: true,
          availablePages: resource.previewPages,
          totalPages: resource.pageCount,
        },
        { status: 403 }
      );
    }

    console.log(
      `✅ Resource found: ${resource.fileName}, loading page ${pageNum}/${resource.pageCount}`
    );

    // Construct path to the specific page file in private storage
    const pagePath = path.join(
      process.cwd(),
      "storage",
      "pdfs",
      `resource_${resource.uuid}`,
      `page_${pageNum}.pdf`
    );

    // Check if page file exists
    if (!existsSync(pagePath)) {
      console.log(`❌ Page file not found: ${pagePath}`);
      return NextResponse.json(
        {
          error: `Page ${pageNum} file not found. The PDF may not be properly split.`,
        },
        { status: 404 }
      );
    }

    // Read the page file
    const pageBuffer = await readFile(pagePath);

    console.log(
      `✅ Page ${pageNum} loaded successfully, size: ${(
        pageBuffer.length / 1024
      ).toFixed(1)}KB`
    );

    // Return the single page PDF with appropriate headers
    return new NextResponse(pageBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": "inline",
        "Cache-Control": "private, max-age=300", // Cache for 5 minutes
        "X-Page-Number": pageNum.toString(),
        "X-Total-Pages": resource.pageCount.toString(),
        "X-Resource-Title": resource.title,
        // Security headers
        "X-Content-Type-Options": "nosniff",
        "X-Frame-Options": "SAMEORIGIN",
      },
    });
  } catch (error) {
    console.error(`❌ Error loading page ${pageNum}:`, error);
    return NextResponse.json(
      {
        error: `Failed to load page: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      },
      { status: 500 }
    );
  }
}
