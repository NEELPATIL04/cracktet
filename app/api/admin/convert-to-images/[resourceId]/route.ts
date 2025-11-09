import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { resources } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { writeFile } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

// Configure route segment for Next.js 15
export const runtime = 'nodejs';
export const maxDuration = 600; // 10 minutes timeout for large PDF conversions

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ resourceId: string }> }
) {
  try {
    // Verify admin session
    const sessionCookie = request.cookies.get("admin_session");
    
    if (!sessionCookie) {
      return NextResponse.json({ error: "Unauthorized - Admin access required" }, { status: 401 });
    }

    const { resourceId } = await params;
    console.log(`🖼️ Converting resource ${resourceId} to images...`);

    // Fetch resource by UUID
    const [resource] = await db
      .select()
      .from(resources)
      .where(and(eq(resources.uuid, resourceId), eq(resources.isActive, true)))
      .limit(1);

    if (!resource) {
      return NextResponse.json({ error: "Resource not found" }, { status: 404 });
    }

    const resourceDir = path.join(
      process.cwd(),
      "storage",
      "pdfs",
      `resource_${resource.uuid}`
    );

    const imagesDir = path.join(resourceDir, "images");
    const originalPdfPath = path.join(resourceDir, "original.pdf");

    if (!existsSync(originalPdfPath)) {
      return NextResponse.json({ error: "Original PDF not found" }, { status: 404 });
    }

    // Check if images already exist (check both formats for backwards compatibility)
    const firstImagePath = path.join(imagesDir, "page-0001.jpg");
    const legacyFirstImagePath = path.join(imagesDir, "page_1.jpg");
    if (existsSync(firstImagePath) || existsSync(legacyFirstImagePath)) {
      return NextResponse.json({ 
        message: "Images already exist", 
        converted: 0,
        skipped: resource.pageCount 
      });
    }

    console.log(`📖 Converting ${resource.pageCount} pages to images...`);

    // Try different conversion methods
    let convertedCount = 0;

    // Method 1: Try using poppler-utils (pdftoppm)
    try {
      const pdftoppmPath = process.platform === 'darwin' ? '/opt/homebrew/bin/pdftoppm' : 'pdftoppm';
      const popplerCmd = `${pdftoppmPath} -jpeg -r 150 "${originalPdfPath}" "${path.join(imagesDir, 'page')}"`;
      await execAsync(popplerCmd);
      
      // Rename files to match our convention with 4-digit padding
      for (let i = 1; i <= resource.pageCount; i++) {
        const sourcePath = path.join(imagesDir, `page-${i.toString().padStart(2, '0')}.jpg`);
        const targetPath = path.join(imagesDir, `page-${i.toString().padStart(4, '0')}.jpg`);
        
        if (existsSync(sourcePath)) {
          const fs = await import('fs/promises');
          await fs.rename(sourcePath, targetPath);
          convertedCount++;
        }
      }
      
      if (convertedCount > 0) {
        console.log(`✅ Converted ${convertedCount} pages using poppler-utils`);
        return NextResponse.json({ 
          success: true, 
          message: `Converted ${convertedCount} pages to images using poppler-utils`,
          converted: convertedCount,
          method: "poppler-utils"
        });
      }
    } catch (error) {
      console.log("⚠️ poppler-utils not available, trying next method...");
    }

    // Method 2: Try using ImageMagick
    try {
      const magickCmd = `convert -density 150 "${originalPdfPath}" -quality 90 "${path.join(imagesDir, 'page_%d.jpg')}"`;
      await execAsync(magickCmd);
      
      // ImageMagick creates page_0.jpg, page_1.jpg, etc., rename to our 4-digit format
      for (let i = 0; i < resource.pageCount; i++) {
        const sourcePath = path.join(imagesDir, `page_${i}.jpg`);
        const targetPath = path.join(imagesDir, `page-${(i + 1).toString().padStart(4, '0')}.jpg`);
        
        if (existsSync(sourcePath)) {
          const fs = await import('fs/promises');
          await fs.rename(sourcePath, targetPath);
          convertedCount++;
        }
      }
      
      if (convertedCount > 0) {
        console.log(`✅ Converted ${convertedCount} pages using ImageMagick`);
        return NextResponse.json({ 
          success: true, 
          message: `Converted ${convertedCount} pages to images using ImageMagick`,
          converted: convertedCount,
          method: "imagemagick"
        });
      }
    } catch (error) {
      console.log("⚠️ ImageMagick not available, trying next method...");
    }

    // Method 3: Create placeholder images with text indicating PDF viewing
    console.log("📝 Creating placeholder images...");
    const placeholderSvg = `
      <svg width="1080" height="1400" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#f3f4f6"/>
        <text x="50%" y="45%" text-anchor="middle" font-family="Arial, sans-serif" font-size="32" fill="#374151">
          PDF Page Not Available as Image
        </text>
        <text x="50%" y="55%" text-anchor="middle" font-family="Arial, sans-serif" font-size="24" fill="#6b7280">
          Please use desktop version for full PDF viewing
        </text>
        <text x="50%" y="65%" text-anchor="middle" font-family="Arial, sans-serif" font-size="20" fill="#9ca3af">
          Resource: ${resource.title}
        </text>
      </svg>
    `;

    for (let i = 1; i <= Math.min(resource.pageCount, 10); i++) { // Only create first 10 placeholder images
      const imagePath = path.join(imagesDir, `page-${i.toString().padStart(4, '0')}.jpg`);
      // For now, just create a simple text file indicating the issue
      await writeFile(imagePath.replace('.jpg', '.txt'), `PDF Page ${i} - Requires system dependencies for image conversion`);
      convertedCount++;
    }

    return NextResponse.json({ 
      success: true, 
      message: `Created ${convertedCount} placeholder files. Install poppler-utils or ImageMagick for proper image conversion.`,
      converted: convertedCount,
      method: "placeholder",
      warning: "System dependencies required for PDF to image conversion"
    });

  } catch (error) {
    console.error("❌ Error converting to images:", error);
    return NextResponse.json(
      { error: `Failed to convert to images: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}