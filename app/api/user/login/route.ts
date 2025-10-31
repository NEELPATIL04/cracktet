import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq, or } from "drizzle-orm";
import bcrypt from "bcrypt"; // Add this import

export async function POST(request: NextRequest) {
  try {
    const { identifier, password } = await request.json();

    if (!identifier || !password) {
      return NextResponse.json(
        { error: "Email/Phone and password are required" },
        { status: 400 }
      );
    }

    // Find user by email or mobile
    const [user] = await db
      .select()
      .from(users)
      .where(
        or(
          eq(users.email, identifier),
          eq(users.mobile, identifier)
        )
      )
      .limit(1);

    if (!user) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    // Check if user is active or payment is completed
    if (!user.isActive || (user.paymentStatus !== "completed" && user.paymentStatus !== "admin_added")) {
      return NextResponse.json(
        { error: "Your account is not active. Please complete payment or contact admin." },
        { status: 403 }
      );
    }

    // ✅ FIXED: Use bcrypt.compare() to verify hashed password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    // Create session
    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        district: user.district,
        isActive: user.isActive,
      },
    });

    // Set cookie
    const sessionData = {
      id: user.id,
      name: user.name,
      email: user.email,
    };

    console.log("✅ Setting user_session cookie for:", user.email);

    response.cookies.set("user_session", JSON.stringify(sessionData), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/", // Ensure cookie is available site-wide
    });

    console.log("🍪 Cookie set with path: /");

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
