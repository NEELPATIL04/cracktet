import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { resources } from "@/db/schema";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { existsSync } from "fs";
import { randomUUID } from "crypto";
import { PDFDocument } from "pdf-lib";

// Configure API route to accept large payloads (500MB)
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '500mb',
    },
  },
};

// Configure route segment for Next.js 15
export const runtime = 'nodejs';
export const maxDuration = 300; // 5 minutes timeout for large uploads

// Function to split PDF into individual pages
async function splitPDFIntoPages(
  pdfBuffer: Buffer, 
  resourceUuid: string, 
  uploadsDir: string
): Promise<{ 
  pageCount: number; 
  pageFiles: Array<{ pageNumber: number; fileName: string; filePath: string; size: number }>; 
  resourceDir: string;
}> {
  console.log(`📄 Starting PDF splitting for resource ${resourceUuid}`);
  
  // Load the original PDF
  const originalPdf = await PDFDocument.load(pdfBuffer);
  const pageCount = originalPdf.getPageCount();
  
  console.log(`📊 PDF has ${pageCount} pages`);
  
  // Create directory for this resource
  const resourceDir = path.join(uploadsDir, `resource_${resourceUuid}`);
  await mkdir(resourceDir, { recursive: true });
  
  const pageFiles = [];
  
  // Split each page
  for (let i = 0; i < pageCount; i++) {
    console.log(`📄 Processing page ${i + 1}/${pageCount}`);
    
    // Create new PDF document for single page
    const singlePagePdf = await PDFDocument.create();
    
    // Copy specific page (i is 0-indexed)
    const [copiedPage] = await singlePagePdf.copyPages(originalPdf, [i]);
    singlePagePdf.addPage(copiedPage);
    
    // Save as individual PDF
    const pageBytes = await singlePagePdf.save();
    const pageFileName = `page_${i + 1}.pdf`;
    const pageFilePath = path.join(resourceDir, pageFileName);
    
    await writeFile(pageFilePath, pageBytes);
    
    pageFiles.push({
      pageNumber: i + 1,
      fileName: pageFileName,
      filePath: pageFilePath,
      size: pageBytes.length
    });
    
    console.log(`✅ Page ${i + 1} saved: ${(pageBytes.length / 1024).toFixed(1)}KB`);
  }
  
  // Also save original PDF as backup
  const originalPath = path.join(resourceDir, 'original.pdf');
  await writeFile(originalPath, pdfBuffer);
  console.log(`✅ Original PDF saved as backup`);
  
  console.log(`🎉 PDF splitting completed: ${pageCount} pages created`);
  
  return {
    pageCount,
    pageFiles,
    resourceDir
  };
}

export async function POST(request: NextRequest) {
  try {
    // ✅ Verify admin session (matches your login format)
    const session = request.cookies.get("admin-auth");
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized - Admin access required" },
        { status: 401 }
      );
    }

    // ✅ Optional: Parse admin data if stored as JSON
    let adminData = null;
    try {
      adminData = JSON.parse(session.value);
    } catch (e) {
      // Session is a simple token, not JSON - that's fine
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const pageCountStr = formData.get("pageCount") as string;

    if (!file || !title || !pageCountStr) {
      return NextResponse.json(
        { error: "File, title, and page count are required" },
        { status: 400 }
      );
    }

    const pageCount = parseInt(pageCountStr);
    if (isNaN(pageCount) || pageCount <= 0) {
      return NextResponse.json(
        { error: "Page count must be a positive number" },
        { status: 400 }
      );
    }

    // Validate file type
    if (file.type !== "application/pdf") {
      return NextResponse.json(
        { error: "Only PDF files are allowed" },
        { status: 400 }
      );
    }

    // Validate file size (max 500MB for large PDFs)
    const maxSize = 500 * 1024 * 1024; // 500MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "File size must be less than 500MB" },
        { status: 400 }
      );
    }

    // Create unique filename
    const timestamp = Date.now();
    const originalName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const fileName = `${timestamp}_${originalName}`;

    // ✅ Ensure private storage directory exists
    const storageDir = path.join(process.cwd(), "storage", "pdfs");
    if (!existsSync(storageDir)) {
      await mkdir(storageDir, { recursive: true });
    }

    // Generate UUID for the resource
    const resourceUuid = randomUUID();

    // Save file and split into pages
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    console.log(`📄 Starting PDF processing for ${originalName}`);
    
    // Split PDF into individual pages
    const splitResult = await splitPDFIntoPages(buffer, resourceUuid, storageDir);
    
    // Calculate file size
    const fileSizeInMB = (file.size / (1024 * 1024)).toFixed(2);
    
    // Calculate total split pages size
    const totalSplitSize = splitResult.pageFiles.reduce((sum, page) => sum + page.size, 0);
    const splitSizeInMB = (totalSplitSize / (1024 * 1024)).toFixed(2);
    
    console.log(`📊 Original size: ${fileSizeInMB}MB, Split size: ${splitSizeInMB}MB`);

    // Save to database with UUID
    const adminId = adminData?.id || 1;
    
    const [newResource] = await db
      .insert(resources)
      .values({
        uuid: resourceUuid,
        title,
        description: description || "",
        fileName: originalName,
        fileUrl: `/storage/pdfs/resource_${resourceUuid}`, // Points to private storage directory
        fileSize: `${fileSizeInMB} MB`,
        pageCount: splitResult.pageCount, // Use actual page count from PDF
        uploadedBy: adminId,
        isActive: true,
      })
      .returning();

    return NextResponse.json({
      success: true,
      resource: newResource,
      splitInfo: {
        pageCount: splitResult.pageCount,
        originalSize: `${fileSizeInMB} MB`,
        splitSize: `${splitSizeInMB} MB`,
        pageFiles: splitResult.pageFiles.length
      },
      message: `Resource uploaded and split into ${splitResult.pageCount} pages successfully`,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 }
    );
  }
}
