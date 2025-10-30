import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";

export async function POST(request: NextRequest) {
  try {
    // Verify admin session
    const session = request.cookies.get("admin_session");
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

    // Check if user already exists
    const existingUsers = await db
      .select()
      .from(users)
      .where((u) => u.email === email || u.mobile === mobile)
      .limit(1);

    if (existingUsers.length > 0) {
      return NextResponse.json(
        { error: "User with this email or mobile already exists" },
        { status: 400 }
      );
    }

    // Create user with active status (no payment required)
    const [newUser] = await db
      .insert(users)
      .values({
        name,
        email,
        mobile,
        district,
        address: address || "",
        password, // In production, hash this password
        isActive: true, // Directly activate user
        paymentStatus: "completed",
        paymentAmount: "0", // Free access by admin
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
