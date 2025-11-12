import 'dotenv/config';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { users } from '../db/schema';
import bcrypt from 'bcrypt';

async function createTestUsers() {
  try {
    const sql = postgres(process.env.DATABASE_URL || 'postgresql://postgres:postgres123@localhost:5455/cracktet_db');
    const db = drizzle(sql);
    
    // Hash password for both users
    const hashedPassword = await bcrypt.hash('password123', 10);
    
    // Create premium user
    const [premiumUser] = await db
      .insert(users)
      .values({
        name: 'Premium User',
        email: 'premium@test.com',
        district: 'Mumbai',
        address: '123 Premium Street',
        mobile: '9999999901',
        password: hashedPassword,
        isActive: true,
        paymentStatus: 'completed', // Premium user
        paymentAmount: '999.00',
        razorpayOrderId: 'test_order_premium',
        razorpayPaymentId: 'test_payment_premium',
        paymentCompletedAt: new Date(),
      })
      .returning()
      .onConflictDoNothing();
    
    // Create normal (free) user  
    const [normalUser] = await db
      .insert(users)
      .values({
        name: 'Normal User',
        email: 'normal@test.com', 
        district: 'Delhi',
        address: '456 Normal Street',
        mobile: '9999999902',
        password: hashedPassword,
        isActive: true,
        paymentStatus: 'pending', // Free user
      })
      .returning()
      .onConflictDoNothing();
    
    console.log('✅ Test users created successfully!');
    console.log('\n📧 Premium User:');
    console.log('   Email: premium@test.com');
    console.log('   Password: password123');
    console.log('   Status: Premium (paymentStatus: completed)');
    
    console.log('\n📧 Normal User:'); 
    console.log('   Email: normal@test.com');
    console.log('   Password: password123');
    console.log('   Status: Free (paymentStatus: pending)');
    
    console.log('\n🎬 Testing Scenarios:');
    console.log('1. Guest: Can see all videos, limited to preview duration');
    console.log('2. Normal User: Can see all videos, full access to free videos, preview only for premium videos');
    console.log('3. Premium User: Full access to all videos');
    
    await sql.end();
  } catch (error) {
    if (error instanceof Error && error.message?.includes('duplicate key')) {
      console.log('⚠️ Test users already exist. Skipping creation.');
      console.log('\n📧 Existing Test Users:');
      console.log('   Premium: premium@test.com / password123');
      console.log('   Normal: normal@test.com / password123');
    } else {
      console.error('Error creating test users:', error);
    }
  }
}

createTestUsers();