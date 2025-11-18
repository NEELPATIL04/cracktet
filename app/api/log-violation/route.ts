import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { violations } from "@/db/schema";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, userEmail, userName, resourceTitle, violationNumber, timestamp } = body;

    // Log violation to database
    await db.insert(violations).values({
      type,
      userEmail,
      userName,
      resourceTitle,
      violationNumber,
      timestamp: new Date(timestamp),
      notified: false, // Admin hasn't been notified yet
    });

    console.log(`⚠️ VIOLATION LOGGED: ${userName} (${userEmail}) - ${type} on ${resourceTitle} - Strike #${violationNumber}`);

    return NextResponse.json({
      success: true,
      message: "Violation logged successfully",
    });
  } catch (error) {
    console.error("Error logging violation:", error);
    return NextResponse.json(
      { error: "Failed to log violation" },
      { status: 500 }
    );
  }
}
