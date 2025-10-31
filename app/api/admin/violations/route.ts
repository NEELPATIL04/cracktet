import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { violations } from "@/db/schema";
import { desc } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    // Verify admin session
    const session = request.cookies.get("admin-auth");
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized - Admin access required" },
        { status: 401 }
      );
    }

    // Fetch all violations, ordered by most recent first
    const allViolations = await db
      .select()
      .from(violations)
      .orderBy(desc(violations.timestamp));

    return NextResponse.json({
      success: true,
      violations: allViolations,
    });
  } catch (error) {
    console.error("Error fetching violations:", error);
    return NextResponse.json(
      { error: "Failed to fetch violations" },
      { status: 500 }
    );
  }
}
