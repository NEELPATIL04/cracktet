import { NextRequest, NextResponse } from 'next/server';
import { razorpayInstance } from '@/lib/razorpay';
import { getRegistrationFee } from '@/lib/settings';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const { userId, mobile, name } = await request.json();

    if (!userId && !mobile) {
      return NextResponse.json(
        { error: 'User ID or mobile number is required' },
        { status: 400 }
      );
    }

    // Get user details
    let user;
    if (userId) {
      const result = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);
      user = result[0];
    } else if (mobile) {
      const result = await db
        .select()
        .from(users)
        .where(eq(users.mobile, mobile))
        .limit(1);
      user = result[0];
    }

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if payment already completed
    if (user.paymentStatus === 'completed') {
      return NextResponse.json(
        { error: 'Payment already completed for this user' },
        { status: 400 }
      );
    }

    // Get registration fee from settings
    const registrationFee = await getRegistrationFee();
    const amountInPaise = registrationFee * 100; // Razorpay expects amount in paise

    // Create Razorpay order
    const order = await razorpayInstance.orders.create({
      amount: amountInPaise,
      currency: 'INR',
      receipt: `reg_${user.id}_${Date.now()}`,
      notes: {
        userId: user.id.toString(),
        userName: user.name,
        userMobile: user.mobile,
      },
    });

    // Update user with order details
    await db
      .update(users)
      .set({
        razorpayOrderId: order.id,
        paymentAmount: registrationFee.toString(),
        paymentStatus: 'initiated',
      })
      .where(eq(users.id, user.id));

    return NextResponse.json({
      orderId: order.id,
      amount: registrationFee,
      currency: 'INR',
      keyId: process.env.RAZORPAY_KEY_ID,
      user: {
        name: user.name,
        mobile: user.mobile,
        email: user.email, // Use actual user email
      },
    });
  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    return NextResponse.json(
      { error: 'Failed to create payment order' },
      { status: 500 }
    );
  }
}