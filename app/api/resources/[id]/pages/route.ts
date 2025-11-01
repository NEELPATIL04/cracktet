import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { resources } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { readFile } from "fs/promises";
import path from "path";
import { PDFDocument } from "pdf-lib";
import sharp from "sharp";
import { createCanvas, loadImage } from "canvas";

// Convert PDF pages to images with watermarks
async function convertPDFPagesToImages(pdfBuffer: Buffer, userInfo: { name: string; email: string; mobile: string }) {
  try {
    const pdfDoc = await PDFDocument.load(pdfBuffer);
    const pageCount = pdfDoc.getPageCount();
    const pages = [];

    for (let i = 0; i < pageCount; i++) {
      // Extract individual page
      const singlePageDoc = await PDFDocument.create();
      const [copiedPage] = await singlePageDoc.copyPages(pdfDoc, [i]);
      singlePageDoc.addPage(copiedPage);
      
      const pageBytes = await singlePageDoc.save();
      
      // Convert to image using sharp (you might need pdf2pic or similar)
      // For now, we'll return the page data and handle conversion client-side
      pages.push({
        pageNumber: i + 1,
        data: Buffer.from(pageBytes).toString('base64')
      });
    }

    return { pageCount, pages };
  } catch (error) {
    console.error("❌ Error converting PDF pages:", error);
    throw error;
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify user session
    const sessionCookie = request.cookies.get("user_session");
    console.log("🔍 Pages API - Session cookie:", sessionCookie ? "exists" : "missing");

    if (!sessionCookie) {
      console.log("❌ Pages: No session cookie found");
      return NextResponse.json({ error: "Unauthorized - Please log in again" }, { status: 401 });
    }

    // Parse user session to get user info
    const userData = JSON.parse(sessionCookie.value);
    console.log("📱 Pages API - User:", userData.name);

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

    // Read the PDF file
    const filePath = path.join(process.cwd(), "public", resource.fileUrl);
    const fileBuffer = await readFile(filePath);
    console.log("✅ File read successfully, size:", fileBuffer.length, "bytes");

    // Convert PDF to page data
    const pagesData = await convertPDFPagesToImages(fileBuffer, {
      name: userData.name || 'User',
      email: userData.email || 'No Email',
      mobile: userData.mobile || 'No Mobile'
    });

    return NextResponse.json({
      success: true,
      resource: {
        title: resource.title,
        pageCount: resource.pageCount
      },
      user: {
        name: userData.name,
        email: userData.email,
        mobile: userData.mobile
      },
      pages: pagesData.pages
    });

  } catch (error) {
    console.error("❌ Error generating pages:", error);
    return NextResponse.json(
      { error: `Failed to generate pages: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}