import * as dotenv from "dotenv";

// Load environment variables from project root
dotenv.config();

import { db } from "../db";
import { admins } from "../db/schema";
import { eq } from "drizzle-orm";

async function seedAdmin() {
  try {
    console.log("🌱 Seeding admin user...");

    // Check if admin already exists
    const existingAdmin = await db
      .select()
      .from(admins)
      .where(eq(admins.adminId, "admin123"))
      .limit(1);

    if (existingAdmin.length > 0) {
      console.log("✅ Admin user already exists!");
      console.log("Admin ID: admin123");
      console.log("Password: admin@cracktet");
      return;
    }

    // Create default admin
    await db.insert(admins).values({
      adminId: "admin123",
      password: "admin@cracktet", // In production, this should be hashed!
      name: "Super Admin",
    });

    console.log("✅ Admin user created successfully!");
    console.log("\n📋 Admin Credentials:");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("Admin ID:  admin123");
    console.log("Password:  admin@cracktet");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("\n🔐 Please change these credentials in production!");
  } catch (error) {
    console.error("❌ Error seeding admin:", error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

seedAdmin();
