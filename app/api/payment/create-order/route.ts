import { NextRequest, NextResponse } from 'next/server';
import { razorpayInstance } from '@/lib/razorpay';
import { getRegistrationFee } from '@/lib/settings';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq, or } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, mobile, name, registrationData } = body;

    // Handle new registration flow (with registrationData)
    if (registrationData) {
      const { name, email, district, address, mobile, password } = registrationData;

      if (!name || !email || !mobile) {
        return NextResponse.json(
          { error: 'Name, email, and mobile are required' },
          { status: 400 }
        );
      }

      // Double-check if user already exists
      const existingUser = await db
        .select()
        .from(users)
        .where(
          or(
            eq(users.email, email),
            eq(users.mobile, mobile)
          )
        )
        .limit(1);

      if (existingUser.length > 0) {
        return NextResponse.json(
          { error: 'Email or mobile number already registered' },
          { status: 400 }
        );
      }

      // Get registration fee from settings
      const registrationFee = await getRegistrationFee();
      const amountInPaise = registrationFee * 100;

      // Create Razorpay order with registration data in notes
      const order = await razorpayInstance.orders.create({
        amount: amountInPaise,
        currency: 'INR',
        receipt: `reg_new_${Date.now()}`,
        notes: {
          name,
          email,
          district,
          address,
          mobile,
          password, // Store temporarily, will be used after payment
          registrationFlow: 'true',
        },
      });

      return NextResponse.json({
        orderId: order.id,
        amount: registrationFee,
        currency: 'INR',
        keyId: process.env.RAZORPAY_KEY_ID,
      });
    }

    // Handle existing user payment flow (legacy)
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
    const amountInPaise = registrationFee * 100;

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
        email: user.email,
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