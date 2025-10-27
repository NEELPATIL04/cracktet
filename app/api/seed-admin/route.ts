import { NextResponse } from "next/server";
import { db } from "@/db";
import { admins } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  try {
    // Check if admin already exists
    const existingAdmin = await db
      .select()
      .from(admins)
      .where(eq(admins.adminId, "admin123"))
      .limit(1);

    if (existingAdmin.length > 0) {
      return NextResponse.json(
        {
          message: "Admin user already exists!",
          credentials: {
            adminId: "admin123",
            password: "admin@cracktet",
          },
        },
        { status: 200 }
      );
    }

    // Create default admin
    await db.insert(admins).values({
      adminId: "admin123",
      password: "admin@cracktet", // In production, this should be hashed!
      name: "Super Admin",
    });

    return NextResponse.json(
      {
        message: "Admin user created successfully!",
        credentials: {
          adminId: "admin123",
          password: "admin@cracktet",
        },
        warning: "Please change these credentials in production!",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error seeding admin:", error);
    return NextResponse.json(
      { error: "Failed to seed admin user" },
      { status: 500 }
    );
  }
}
