import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { resources } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { readFile } from "fs/promises";
import path from "path";
import { PDFDocument } from "pdf-lib";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: uuidParam } = await params;
    console.log("📄 Public preview stream for resource UUID:", uuidParam);

    // Fetch resource by UUID (must be active) - NO AUTH REQUIRED for preview
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
    console.log(`📄 Preview pages: ${resource.previewPages} of ${resource.pageCount}`);

    // Read the original PDF file from private storage
    const filePath = path.join(process.cwd(), resource.fileUrl.substring(1), "original.pdf");
    console.log("📁 Reading file from:", filePath);

    const fileBuffer = await readFile(filePath);
    console.log("✅ File read successfully, size:", fileBuffer.length, "bytes");

    // Create a new PDF with only the preview pages
    const originalPdf = await PDFDocument.load(fileBuffer);
    const previewPdf = await PDFDocument.create();

    // Copy only the preview pages
    const maxPages = Math.min(resource.previewPages, resource.pageCount);
    
    if (maxPages > 0) {
      const pageIndices = Array.from({ length: maxPages }, (_, i) => i);
      const copiedPages = await previewPdf.copyPages(originalPdf, pageIndices);
      
      copiedPages.forEach(page => previewPdf.addPage(page));
    }

    // Generate the preview PDF
    const previewPdfBytes = await previewPdf.save();

    console.log(`✅ Preview PDF generated with ${maxPages} pages, size: ${previewPdfBytes.length} bytes`);

    // Return the preview PDF with proper headers
    return new NextResponse(Buffer.from(previewPdfBytes), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": "inline",
        "Cache-Control": "public, max-age=3600", // Cache for 1 hour since it's public
        "X-Preview-Pages": maxPages.toString(),
        "X-Total-Pages": resource.pageCount.toString(),
        "X-Resource-Title": resource.title,
        "X-Is-Preview": "true",
        // Security headers
        "X-Content-Type-Options": "nosniff",
        "X-Frame-Options": "SAMEORIGIN",
      },
    });
  } catch (error) {
    console.error("❌ Error streaming preview resource:", error);
    console.error("❌ Error stack:", error instanceof Error ? error.stack : 'Unknown error');
    return NextResponse.json(
      { error: `Failed to stream preview resource: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}