import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { resources } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { readFile, writeFile } from "fs/promises";
import path from "path";
import { existsSync } from "fs";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

// Configure route segment for Next.js 15 - longer timeout for on-demand conversion
export const runtime = 'nodejs';
export const maxDuration = 60; // 1 minute timeout for on-demand image conversion

// On-demand image conversion for requested pages - returns image buffer directly
async function convertSinglePageAndServe(
  resourceUuid: string, 
  pageNumber: number, 
  outputImagePath: string
): Promise<Buffer | null> {
  try {
    const resourceDir = path.join(process.cwd(), "storage", "pdfs", `resource_${resourceUuid}`);
    const originalPdfPath = path.join(resourceDir, "original.pdf");
    
    if (!existsSync(originalPdfPath)) {
      console.log(`❌ Original PDF not found: ${originalPdfPath}`);
      return null;
    }

    console.log(`🔄 On-demand converting page ${pageNumber} for resource ${resourceUuid}`);
    
    // Convert single page using pdftoppm (cross-platform)
    const tempOutputPrefix = path.join(path.dirname(outputImagePath), `temp_page_${pageNumber}_${Date.now()}`);
    const pdftoppmPath = process.platform === 'darwin' ? '/opt/homebrew/bin/pdftoppm' : 'pdftoppm';
    const command = `${pdftoppmPath} -jpeg -r 150 -f ${pageNumber} -l ${pageNumber} "${originalPdfPath}" "${tempOutputPrefix}"`;
    
    console.log(`📝 Executing command: ${command}`);
    const { stdout, stderr } = await execAsync(command);
    console.log(`📤 Command output:`, { stdout, stderr });
    
    // pdftoppm creates files with different formats depending on page number
    // For single page: temp_page_X_timestamp-01.jpg (small numbers)
    // For specific page: temp_page_X_timestamp-XXXX.jpg (actual page number)
    const sourceFile1 = `${tempOutputPrefix}-01.jpg`;
    const sourceFile2 = `${tempOutputPrefix}-${pageNumber.toString().padStart(4, '0')}.jpg`;
    const sourceFile3 = `${tempOutputPrefix}-${pageNumber}.jpg`;
    
    console.log(`🔍 Looking for converted files:`);
    console.log(`  - ${sourceFile1} (exists: ${existsSync(sourceFile1)})`);
    console.log(`  - ${sourceFile2} (exists: ${existsSync(sourceFile2)})`);
    console.log(`  - ${sourceFile3} (exists: ${existsSync(sourceFile3)})`);
    
    const sourceFile = existsSync(sourceFile1) ? sourceFile1 :
                       existsSync(sourceFile2) ? sourceFile2 :
                       existsSync(sourceFile3) ? sourceFile3 : null;
    
    if (sourceFile) {
      // Read the image buffer directly
      const imageBuffer = await readFile(sourceFile);
      
      // Save for future requests (async, don't wait)
      readFile(sourceFile).then(async (buffer) => {
        try {
          // Ensure the images directory exists
          const fs = await import('fs/promises');
          const imagesDir = path.dirname(outputImagePath);
          console.log(`📁 Creating directory if needed: ${imagesDir}`);
          await fs.mkdir(imagesDir, { recursive: true });
          
          // Save the image with 4-digit padding format
          console.log(`💾 Saving image to: ${outputImagePath}`);
          await writeFile(outputImagePath, buffer);
          
          // Verify the file was saved
          if (existsSync(outputImagePath)) {
            console.log(`✅ Page ${pageNumber} successfully saved to: ${outputImagePath}`);
            // Clean up temp file only after successful save
            await fs.unlink(sourceFile).catch(() => {});
          } else {
            console.error(`❌ Failed to verify saved file at: ${outputImagePath}`);
          }
        } catch (saveError) {
          console.error(`❌ Error saving page ${pageNumber}:`, saveError);
        }
      }).catch(err => {
        console.error(`⚠️ Failed to read source file for caching page ${pageNumber}:`, err);
      });
      
      console.log(`✅ Page ${pageNumber} converted and served directly (${(imageBuffer.length / 1024).toFixed(1)}KB)`);
      return imageBuffer;
    }
    
    console.log(`❌ Conversion failed - no source file found among: ${sourceFile1}, ${sourceFile2}, ${sourceFile3}`);
    return null;
  } catch (error) {
    console.error(`❌ Error converting page ${pageNumber} on-demand:`, error);
    console.error(`❌ Error details:`, {
      message: error instanceof Error ? error.message : 'Unknown error',
      outputDir: path.dirname(outputImagePath)
    });
    return null;
  }
}

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
      console.log("❌ Image API: No session cookie found");
      return NextResponse.json({ error: "Unauthorized - Please log in again" }, { status: 401 });
    }
    
    console.log(`🖼️ Loading image for page ${pageNum} of resource ${uuidParam}`);

    // Validate page number
    if (isNaN(pageNum) || pageNum < 1) {
      return NextResponse.json({ error: "Invalid page number" }, { status: 400 });
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
      return NextResponse.json({ 
        error: `Page number ${pageNum} exceeds total pages ${resource.pageCount}` 
      }, { status: 400 });
    }

    console.log(`✅ Resource found: ${resource.fileName}, loading image ${pageNum}/${resource.pageCount}`);

    // Construct path to the image file in private storage - always use 4-digit format
    const imagePath = path.join(
      process.cwd(), 
      "storage", 
      "pdfs", 
      `resource_${resource.uuid}`, 
      "images",
      `page-${pageNum.toString().padStart(4, '0')}.jpg`
    );

    // Also check non-padded naming for backwards compatibility
    const legacyImagePath = path.join(
      process.cwd(), 
      "storage", 
      "pdfs", 
      `resource_${resource.uuid}`, 
      "images",
      `page_${pageNum}.jpg`
    );

    // Check if image file exists (try both naming conventions)
    const finalImagePath = existsSync(imagePath) ? imagePath : 
                          existsSync(legacyImagePath) ? legacyImagePath : 
                          null;

    if (!finalImagePath) {
      console.log(`❌ Image file not found: ${imagePath} or ${legacyImagePath}`);
      
      // Try on-demand conversion and serve directly
      const imageBuffer = await convertSinglePageAndServe(resource.uuid, pageNum, imagePath);
      
      if (imageBuffer) {
        console.log(`🚀 Page ${pageNum} converted and served directly to user`);
        
        return new NextResponse(imageBuffer, {
          headers: {
            "Content-Type": "image/jpeg",
            "Cache-Control": "private, max-age=3600",
            "X-Page-Number": pageNum.toString(),
            "X-Total-Pages": resource.pageCount.toString(),
            "X-Resource-Title": resource.title,
            "X-On-Demand-Converted": "true",
            "X-Served-Direct": "true",
            "X-Content-Type-Options": "nosniff",
            "X-Frame-Options": "SAMEORIGIN",
          },
        });
      }
      
      // If conversion failed, create SVG placeholder
      const placeholderSvg = `
        <svg width="800" height="1000" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
              <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#e5e7eb" stroke-width="1"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="white"/>
          <rect width="100%" height="100%" fill="url(#grid)" opacity="0.1"/>
          
          <!-- Header -->
          <rect x="0" y="0" width="100%" height="80" fill="#3b82f6"/>
          <text x="50%" y="45" text-anchor="middle" font-family="Arial, sans-serif" font-size="24" fill="white" font-weight="bold">
            📄 PDF Page ${pageNum}
          </text>
          
          <!-- Content Area -->
          <rect x="50" y="120" width="700" height="800" fill="#f9fafb" stroke="#d1d5db" stroke-width="2" rx="8"/>
          
          <!-- Title -->
          <text x="50%" y="180" text-anchor="middle" font-family="Arial, sans-serif" font-size="20" fill="#1f2937" font-weight="bold">
            ${resource.title}
          </text>
          
          <!-- Page Info -->
          <text x="50%" y="220" text-anchor="middle" font-family="Arial, sans-serif" font-size="16" fill="#6b7280">
            Page ${pageNum} of ${resource.pageCount}
          </text>
          
          <!-- Message -->
          <text x="50%" y="300" text-anchor="middle" font-family="Arial, sans-serif" font-size="18" fill="#374151">
            📱 Mobile Viewing Optimized
          </text>
          
          <text x="50%" y="340" text-anchor="middle" font-family="Arial, sans-serif" font-size="14" fill="#6b7280">
            PDF content is protected and optimized for mobile viewing.
          </text>
          
          <text x="50%" y="370" text-anchor="middle" font-family="Arial, sans-serif" font-size="14" fill="#6b7280">
            Use the navigation controls to browse through pages.
          </text>
          
          <!-- Placeholder content lines -->
          <g opacity="0.3">
            <rect x="80" y="420" width="640" height="12" fill="#d1d5db" rx="6"/>
            <rect x="80" y="450" width="580" height="12" fill="#e5e7eb" rx="6"/>
            <rect x="80" y="480" width="620" height="12" fill="#d1d5db" rx="6"/>
            <rect x="80" y="510" width="560" height="12" fill="#e5e7eb" rx="6"/>
            <rect x="80" y="540" width="600" height="12" fill="#d1d5db" rx="6"/>
            
            <rect x="80" y="590" width="640" height="12" fill="#d1d5db" rx="6"/>
            <rect x="80" y="620" width="580" height="12" fill="#e5e7eb" rx="6"/>
            <rect x="80" y="650" width="620" height="12" fill="#d1d5db" rx="6"/>
          </g>
          
          <!-- Footer -->
          <rect x="0" y="950" width="100%" height="50" fill="#f3f4f6"/>
          <text x="50%" y="980" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" fill="#9ca3af">
            🔒 CrackTET - Protected Educational Content
          </text>
        </svg>
      `;
      
      console.log(`📱 Serving placeholder image for mobile page ${pageNum}`);
      
      return new NextResponse(placeholderSvg, {
        headers: {
          "Content-Type": "image/svg+xml",
          "Cache-Control": "private, max-age=300",
          "X-Page-Number": pageNum.toString(),
          "X-Total-Pages": resource.pageCount.toString(),
          "X-Placeholder": "true",
        },
      });
    }

    // Read the image file
    const imageBuffer = await readFile(finalImagePath);
    
    console.log(`✅ Image ${pageNum} loaded successfully, size: ${(imageBuffer.length / 1024).toFixed(1)}KB`);

    // Return the image with appropriate headers
    return new NextResponse(imageBuffer, {
      headers: {
        "Content-Type": "image/jpeg",
        "Cache-Control": "private, max-age=3600", // Cache for 1 hour
        "X-Page-Number": pageNum.toString(),
        "X-Total-Pages": resource.pageCount.toString(),
        "X-Resource-Title": resource.title,
        // Security headers
        "X-Content-Type-Options": "nosniff",
        "X-Frame-Options": "SAMEORIGIN",
      },
    });

  } catch (error) {
    console.error(`❌ Error loading image for page ${pageNum}:`, error);
    return NextResponse.json(
      { error: `Failed to load image: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}