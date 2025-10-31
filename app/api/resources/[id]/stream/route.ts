import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { resources } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { readFile } from "fs/promises";
import path from "path";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify user session
    const sessionCookie = request.cookies.get("user_session");
    console.log("🔍 Stream API - Session cookie:", sessionCookie ? "exists" : "missing");

    if (!sessionCookie) {
      console.log("❌ Stream: No session cookie found");
      return NextResponse.json({ error: "Unauthorized - Please log in again" }, { status: 401 });
    }

    console.log("✅ Stream: Session valid, streaming resource");

    const { id: uuidParam } = await params;
    console.log("📄 Fetching resource UUID:", uuidParam);

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

    console.log("✅ Resource found:", resource.fileName);
    console.log("📄 File URL from DB:", resource.fileUrl);

    // Read the PDF file using fileUrl which has the correct timestamp prefix
    // fileUrl is like "/uploads/1234567890_filename.pdf"
    const filePath = path.join(process.cwd(), "public", resource.fileUrl);
    console.log("📁 Reading file from:", filePath);

    const fileBuffer = await readFile(filePath);
    console.log("✅ File read successfully, size:", fileBuffer.length, "bytes");

    // Return the PDF file with proper headers
    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": "inline",
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "Pragma": "no-cache",
        "Expires": "0",
      },
    });
  } catch (error: any) {
    console.error("❌ Error streaming resource:", error);
    console.error("❌ Error stack:", error.stack);
    return NextResponse.json(
      { error: `Failed to stream resource: ${error.message}` },
      { status: 500 }
    );
  }
}
