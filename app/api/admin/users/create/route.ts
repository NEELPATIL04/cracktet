import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq, or } from "drizzle-orm"; // Import operators
import bcrypt from "bcrypt";

export async function POST(request: NextRequest) {
  try {
    // Verify admin session
    const session = request.cookies.get("admin-auth");
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name, email, mobile, district, address, password } = await request.json();

    // Validate required fields
    if (!name || !email || !mobile || !district || !password) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    // Validate password length
    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    // Check if user already exists - FIXED SYNTAX
    const existingUsers = await db
      .select()
      .from(users)
      .where(
        or(
          eq(users.email, email),
          eq(users.mobile, mobile)
        )
      )
      .limit(1);

    if (existingUsers.length > 0) {
      return NextResponse.json(
        { error: "User with this email or mobile already exists" },
        { status: 400 }
      );
    }

    // Hash password before storing
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user with active status (no payment required)
    const [newUser] = await db
      .insert(users)
      .values({
        name,
        email,
        mobile,
        district,
        address: address || "",
        password: hashedPassword, // Store hashed password
        isActive: true,
        paymentStatus: "admin_added",
        paymentAmount: "0",
      })
      .returning();

    return NextResponse.json({
      success: true,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        mobile: newUser.mobile,
      },
      message: "User created successfully",
    });
  } catch (error) {
    console.error("Create user error:", error);
    return NextResponse.json(
      { error: "Failed to create user" },
      { status: 500 }
    );
  }
}
