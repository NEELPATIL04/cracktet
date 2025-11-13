import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { videos, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import path from "path";
import { promises as fs } from "fs";
import jwt from "jsonwebtoken";
import { getStoragePath, fileExists } from "@/lib/video-utils";

const JWT_SECRET = process.env.VIDEO_JWT_SECRET || "your-secret-key-change-in-production";

interface TokenPayload {
  userId: number;
  videoId: string;
  exp: number;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; segment: string }> }
) {
  try {
    const { id, segment } = await params;
    const token = request.nextUrl.searchParams.get("token");
    
    // Check authentication - allow preview access without token
    let user = null;
    let isAuthenticated = false;
    
    if (!token) {
      const session = request.cookies.get("user_session");
      if (session) {
        try {
          const userInfo = JSON.parse(session.value);
          [user] = await db
            .select()
            .from(users)
            .where(eq(users.email, userInfo.email))
            .limit(1);
          
          if (user && user.isActive) {
            isAuthenticated = true;
          }
        } catch (e) {
          // Invalid session, continue as guest
        }
      }
      // Allow guest access for preview - no authentication required
    } else {
      try {
        jwt.verify(token, JWT_SECRET) as TokenPayload;
        isAuthenticated = true;
      } catch (error) {
        return NextResponse.json(
          { error: "Invalid or expired token" },
          { status: 401 }
        );
      }
    }

    const [video] = await db
      .select()
      .from(videos)
      .where(eq(videos.uuid, id))
      .limit(1);

    if (!video || !video.isActive) {
      return NextResponse.json(
        { error: "Video not found" },
        { status: 404 }
      );
    }

    const storagePath = getStoragePath();
    const segmentPath = path.join(
      storagePath,
      "videos",
      id,
      "hls",
      segment
    );

    if (!(await fileExists(segmentPath))) {
      return NextResponse.json(
        { error: "Segment not found" },
        { status: 404 }
      );
    }

    const fileBuffer = await fs.readFile(segmentPath);
    
    const headers = new Headers();
    
    if (segment.endsWith('.m3u8')) {
      headers.set("Content-Type", "application/vnd.apple.mpegurl");
      headers.set("Cache-Control", "no-cache, no-store, must-revalidate");
      
      let content = fileBuffer.toString();
      const baseUrl = `${request.nextUrl.origin}/api/videos/${id}/hls`;
      
      // Check if this is a properly segmented HLS file
      const hasSegments = content.includes('segment') || content.includes('.ts');
      
      if (hasSegments) {
        // Handle segmented HLS
        content = content.replace(
          /segment(\d+)\.ts/g,
          (match) => `${baseUrl}/${match}${token ? `?token=${token}` : ''}`
        );
      } else {
        // Handle single file HLS (fallback for MP4)
        content = content.replace(
          /video\.mp4/g,
          `${baseUrl}/video.mp4${token ? `?token=${token}` : ''}`
        );
      }
      
      if (content.includes('encryption.key')) {
        content = content.replace(
          /URI="[^"]+"/g,
          `URI="${baseUrl}/key${token ? `?token=${token}` : ''}"`
        );
      }
      
      return new NextResponse(content, { headers });
    } else if (segment.endsWith('.ts') || segment.endsWith('.mp4')) {
      const contentType = segment.endsWith('.mp4') ? "video/mp4" : "video/mp2t";
      
      // Handle range requests for MP4 files
      const range = request.headers.get('range');
      
      if (range && segment.endsWith('.mp4')) {
        const stats = await fs.stat(segmentPath);
        const fileSize = stats.size;
        
        const parts = range.replace(/bytes=/, "").split("-");
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
        const chunksize = (end - start) + 1;
        
        const fileStream = await fs.readFile(segmentPath);
        const chunk = fileStream.slice(start, end + 1);
        
        headers.set("Content-Range", `bytes ${start}-${end}/${fileSize}`);
        headers.set("Accept-Ranges", "bytes");
        headers.set("Content-Length", chunksize.toString());
        headers.set("Content-Type", contentType);
        
        return new NextResponse(chunk, { 
          status: 206,
          headers 
        });
      }
      
      headers.set("Content-Type", contentType);
      headers.set("Cache-Control", "public, max-age=3600");
      headers.set("Accept-Ranges", "bytes");
      headers.set("X-Content-Type-Options", "nosniff");
      headers.set("Content-Length", fileBuffer.length.toString());
      
      return new NextResponse(fileBuffer, { headers });
    } else if (segment === 'key') {
      const keyPath = path.join(
        storagePath,
        "videos",
        id,
        "hls",
        "encryption.key"
      );
      
      const keyBuffer = await fs.readFile(keyPath);
      headers.set("Content-Type", "application/octet-stream");
      headers.set("Cache-Control", "no-cache, no-store, must-revalidate");
      
      return new NextResponse(keyBuffer, { headers });
    }

    return NextResponse.json(
      { error: "Invalid segment type" },
      { status: 400 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to serve segment" },
      { status: 500 }
    );
  }
}