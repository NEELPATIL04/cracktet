import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { videos, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { promises as fs } from "fs";
import jwt from "jsonwebtoken";
import { getVideoFilePath } from "@/lib/video-utils";

const JWT_SECRET = process.env.VIDEO_JWT_SECRET || "your-secret-key-change-in-production";

interface TokenPayload {
  userId: number;
  videoId: string;
  exp: number;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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
      } catch (error) {
        return NextResponse.json(
          { error: "Invalid or expired token" },
          { status: 401 }
        );
      }
    }

    // Verify video exists and is active
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

    // Get video file path with fallbacks
    const videoFile = await getVideoFilePath(id, false);
    
    if (!videoFile.type || videoFile.type !== 'mp4') {
      return NextResponse.json(
        { error: "Video file not found" },
        { status: 404 }
      );
    }
    
    const videoPath = videoFile.path;

    const stats = await fs.stat(videoPath);
    const fileSize = stats.size;

    // Handle range requests
    const range = request.headers.get("range");
    
    if (range) {
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunksize = (end - start) + 1;
      
      const fileBuffer = await fs.readFile(videoPath);
      const chunk = fileBuffer.slice(start, end + 1);
      
      const headers = new Headers({
        "Content-Range": `bytes ${start}-${end}/${fileSize}`,
        "Accept-Ranges": "bytes",
        "Content-Length": chunksize.toString(),
        "Content-Type": "video/mp4",
        "Cache-Control": "no-cache, no-store, must-revalidate",
      });
      
      return new NextResponse(chunk, { 
        status: 206,
        headers 
      });
    }

    // Serve entire file
    const fileBuffer = await fs.readFile(videoPath);
    
    const headers = new Headers({
      "Content-Type": "video/mp4",
      "Content-Length": fileSize.toString(),
      "Accept-Ranges": "bytes",
      "Cache-Control": "no-cache, no-store, must-revalidate",
    });

    return new NextResponse(fileBuffer, { headers });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to serve video" },
      { status: 500 }
    );
  }
}