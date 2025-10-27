import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

const registerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  district: z.string().min(1, "District is required"),
  mobile: z.string().regex(/^\d{10}$/, "Mobile number must be exactly 10 digits"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const validatedData = registerSchema.parse(body);

    // Check if mobile number already exists
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.mobile, validatedData.mobile))
      .limit(1);

    if (existingUser.length > 0) {
      return NextResponse.json(
        { error: "Mobile number already registered" },
        { status: 400 }
      );
    }

    // Insert new user
    const newUser = await db
      .insert(users)
      .values({
        name: validatedData.name,
        district: validatedData.district,
        mobile: validatedData.mobile,
        password: validatedData.password, // In production, hash this password!
      })
      .returning();

    return NextResponse.json(
      {
        success: true,
        message: "Registration successful",
        user: {
          id: newUser[0].id,
          name: newUser[0].name,
          district: newUser[0].district,
          mobile: newUser[0].mobile,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }

    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
