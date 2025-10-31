import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { resources } from "@/db/schema";
import { eq } from "drizzle-orm";
import { unlink } from "fs/promises";
import path from "path";

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // ✅ Verify admin session (matches your login format)
    const session = request.cookies.get("admin-auth");
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized - Admin access required" },
        { status: 401 }
      );
    }

    const resourceId = parseInt(params.id);
    if (isNaN(resourceId)) {
      return NextResponse.json(
        { error: "Invalid resource ID" },
        { status: 400 }
      );
    }

    const [resource] = await db
      .select()
      .from(resources)
      .where(eq(resources.id, resourceId))
      .limit(1);

    if (!resource) {
      return NextResponse.json(
        { error: "Resource not found" },
        { status: 404 }
      );
    }

    // Delete file from filesystem
    try {
      const filePath = path.join(process.cwd(), "public", resource.fileUrl);
      await unlink(filePath);
    } catch (fileError) {
      console.error("Error deleting file:", fileError);
      // Continue even if file deletion fails
    }

    // Delete from database
    await db.delete(resources).where(eq(resources.id, resourceId));

    return NextResponse.json({
      success: true,
      message: "Resource deleted successfully",
    });
  } catch (error) {
    console.error("Delete error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
