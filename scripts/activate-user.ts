import { db } from "../db/index";
import { users } from "../db/schema";
import { eq } from "drizzle-orm";

async function activateUser(email: string) {
  try {
    console.log(`Updating payment status for user: ${email}`);
    
    const result = await db
      .update(users)
      .set({ 
        paymentStatus: "completed",
        isActive: true,
        paymentCompletedAt: new Date()
      })
      .where(eq(users.email, email))
      .returning();

    if (result.length > 0) {
      console.log("✅ User activated successfully:", result[0]);
      console.log("- Payment Status: completed");
      console.log("- Account Status: active");
      console.log("- Can access premium videos: Yes");
    } else {
      console.log("❌ User not found");
    }
  } catch (error) {
    console.error("Error activating user:", error);
  }
  
  process.exit(0);
}

// Get email from command line argument or use default
const email = process.argv[2];
if (!email) {
  console.log("Usage: tsx scripts/activate-user.ts <email>");
  console.log("Example: tsx scripts/activate-user.ts user@example.com");
  process.exit(1);
}

activateUser(email);