import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { violations } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function PATCH(request: NextRequest) {
  try {
    // Verify admin session
    const session = request.cookies.get("admin-auth");
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized - Admin access required" },
        { status: 401 }
      );
    }

    const { violationId } = await request.json();

    if (!violationId) {
      return NextResponse.json(
        { error: "Violation ID is required" },
        { status: 400 }
      );
    }

    // Update violation as notified
    const [updatedViolation] = await db
      .update(violations)
      .set({ notified: true })
      .where(eq(violations.id, violationId))
      .returning();

    if (!updatedViolation) {
      return NextResponse.json(
        { error: "Violation not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      violation: updatedViolation,
    });
  } catch (error) {
    console.error("Error marking violation as notified:", error);
    return NextResponse.json(
      { error: "Failed to update violation" },
      { status: 500 }
    );
  }
}
