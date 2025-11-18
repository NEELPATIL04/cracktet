import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { videos } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { readFile } from "fs/promises";
import path from "path";
import { existsSync } from "fs";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: uuid } = await params;

    // Fetch video by UUID (must be active)
    const [video] = await db
      .select()
      .from(videos)
      .where(and(eq(videos.uuid, uuid), eq(videos.isActive, true)))
      .limit(1);

    if (!video) {
      return NextResponse.json(
        { error: "Video not found" },
        { status: 404 }
      );
    }

    // Check if custom thumbnail exists
    const thumbnailPath = path.join(process.cwd(), "storage", "videos", uuid, "thumbnail.jpg");
    
    if (existsSync(thumbnailPath)) {
      const thumbnailBuffer = await readFile(thumbnailPath);
      
      return new NextResponse(thumbnailBuffer, {
        headers: {
          "Content-Type": "image/jpeg",
          "Cache-Control": "public, max-age=86400", // Cache for 1 day
          "X-Video-UUID": uuid,
        },
      });
    }

    // If no custom thumbnail, return a default thumbnail or generate one
    return generateDefaultThumbnail(video.title, uuid);

  } catch (error) {
    console.error("Error serving thumbnail:", error);
    return NextResponse.json(
      { error: "Failed to serve thumbnail" },
      { status: 500 }
    );
  }
}

// Generate a default thumbnail with video title
function generateDefaultThumbnail(title: string, uuid: string): NextResponse {
  // Create a simple SVG thumbnail with video title
  const svg = `
    <svg width="320" height="180" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#1e293b"/>
      <rect x="10" y="10" width="300" height="160" fill="#334155" stroke="#64748b" stroke-width="2"/>
      <circle cx="160" cy="90" r="30" fill="rgba(59, 130, 246, 0.8)"/>
      <polygon points="150,75 150,105 175,90" fill="white"/>
      <text x="160" y="140" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="12" font-weight="bold">
        ${title.length > 30 ? title.substring(0, 27) + '...' : title}
      </text>
      <text x="160" y="155" text-anchor="middle" fill="#94a3b8" font-family="Arial, sans-serif" font-size="10">
        Video Thumbnail
      </text>
    </svg>
  `;

  return new NextResponse(svg, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=3600", // Cache for 1 hour
      "X-Video-UUID": uuid,
      "X-Thumbnail-Type": "generated",
    },
  });
}