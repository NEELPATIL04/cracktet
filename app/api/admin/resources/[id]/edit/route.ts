import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { resources } from "@/db/schema";
import { eq } from "drizzle-orm";
import { writeFile, unlink } from "fs/promises";
import path from "path";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify admin session
    const session = request.cookies.get("admin-auth");
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: idParam } = await params;
    const id = parseInt(idParam);
    const contentType = request.headers.get("content-type");

    // Check if it's a file upload (multipart/form-data)
    if (contentType?.includes("multipart/form-data")) {
      const formData = await request.formData();
      const title = formData.get("title") as string;
      const description = formData.get("description") as string;
      const file = formData.get("file") as File;

      if (!title) {
        return NextResponse.json({ error: "Title is required" }, { status: 400 });
      }

      if (!file) {
        return NextResponse.json({ error: "File is required" }, { status: 400 });
      }

      // Validate file type
      if (file.type !== "application/pdf") {
        return NextResponse.json({ error: "Only PDF files are allowed" }, { status: 400 });
      }

      // Get the current resource to delete old file
      const [currentResource] = await db
        .select()
        .from(resources)
        .where(eq(resources.id, id))
        .limit(1);

      if (!currentResource) {
        return NextResponse.json({ error: "Resource not found" }, { status: 404 });
      }

      // Delete old file
      try {
        const oldFilePath = path.join(process.cwd(), "public", "uploads", currentResource.fileName);
        await unlink(oldFilePath);
      } catch (error) {
        console.log("Old file not found or already deleted");
      }

      // Save new file
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const fileName = `${Date.now()}-${file.name}`;
      const uploadDir = path.join(process.cwd(), "public", "uploads");
      const filePath = path.join(uploadDir, fileName);

      await writeFile(filePath, buffer);

      const fileSize = `${(file.size / (1024 * 1024)).toFixed(2)} MB`;

      // Update resource with new file
      const [updatedResource] = await db
        .update(resources)
        .set({
          title,
          description: description || null,
          fileName,
          fileSize,
          fileUrl: `/uploads/${fileName}`,
          updatedAt: new Date(),
        })
        .where(eq(resources.id, id))
        .returning();

      return NextResponse.json({
        success: true,
        resource: updatedResource,
      });
    } else {
      // JSON update (only title/description)
      const { title, description } = await request.json();

      if (!title) {
        return NextResponse.json({ error: "Title is required" }, { status: 400 });
      }

      // Update resource
      const [updatedResource] = await db
        .update(resources)
        .set({
          title,
          description: description || null,
          updatedAt: new Date(),
        })
        .where(eq(resources.id, id))
        .returning();

      if (!updatedResource) {
        return NextResponse.json({ error: "Resource not found" }, { status: 404 });
      }

      return NextResponse.json({
        success: true,
        resource: updatedResource,
      });
    }
  } catch (error) {
    console.error("Error updating resource:", error);
    return NextResponse.json({ error: "Failed to update resource" }, { status: 500 });
  }
}
