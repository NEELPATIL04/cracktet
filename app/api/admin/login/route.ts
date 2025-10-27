import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { admins } from "@/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

const loginSchema = z.object({
  adminId: z.string().min(1, "Admin ID is required"),
  password: z.string().min(1, "Password is required"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const validatedData = loginSchema.parse(body);

    // Find admin by adminId
    const admin = await db
      .select()
      .from(admins)
      .where(eq(admins.adminId, validatedData.adminId))
      .limit(1);

    if (admin.length === 0) {
      return NextResponse.json(
        { error: "Invalid admin ID or password" },
        { status: 401 }
      );
    }

    // Check password (In production, use bcrypt.compare!)
    if (admin[0].password !== validatedData.password) {
      return NextResponse.json(
        { error: "Invalid admin ID or password" },
        { status: 401 }
      );
    }

    // Create response with auth cookie
    const response = NextResponse.json(
      {
        success: true,
        message: "Login successful",
        admin: {
          id: admin[0].id,
          adminId: admin[0].adminId,
          name: admin[0].name,
        },
      },
      { status: 200 }
    );

    // Set httpOnly cookie for authentication
    response.cookies.set("admin-auth", admin[0].adminId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24, // 24 hours
      path: "/",
    });

    return response;
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }

    console.error("Admin login error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
