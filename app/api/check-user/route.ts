import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq, or } from "drizzle-orm";

export async function POST(request: NextRequest) {
  try {
    const { email, mobile } = await request.json();

    if (!email || !mobile) {
      return NextResponse.json(
        { error: "Email and mobile are required" },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existingEmail = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existingEmail.length > 0) {
      return NextResponse.json(
        { error: "Email already registered", field: "email" },
        { status: 400 }
      );
    }

    // Check if mobile number already exists
    const existingMobile = await db
      .select()
      .from(users)
      .where(eq(users.mobile, mobile))
      .limit(1);

    if (existingMobile.length > 0) {
      return NextResponse.json(
        { error: "Mobile number already registered", field: "mobile" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "User details are available",
    });
  } catch (error) {
    console.error("Error checking user:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
