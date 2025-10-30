import { NextRequest, NextResponse } from 'next/server';
import { verifyRazorpaySignature, razorpayInstance } from '@/lib/razorpay';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = await request.json();

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json(
        { error: 'Missing payment verification details' },
        { status: 400 }
      );
    }

    // Verify signature
    const isValid = verifyRazorpaySignature(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    );

    if (!isValid) {
      return NextResponse.json(
        { error: 'Payment verification failed' },
        { status: 400 }
      );
    }

    // Fetch order details from Razorpay to get notes
    const order = await razorpayInstance.orders.fetch(razorpay_order_id);

    // Check if this is a new registration (has registrationFlow flag)
    if (order.notes && order.notes.registrationFlow === 'true') {
      // Create new user after successful payment
      const { name, email, district, address, mobile, password } = order.notes;

      const newUser = await db
        .insert(users)
        .values({
          name,
          email,
          district,
          address,
          mobile,
          password, // In production, hash this password!
          paymentStatus: 'completed',
          razorpayOrderId: razorpay_order_id,
          razorpayPaymentId: razorpay_payment_id,
          razorpaySignature: razorpay_signature,
          paymentAmount: (order.amount / 100).toString(),
          paymentCompletedAt: new Date(),
        })
        .returning();

      return NextResponse.json({
        success: true,
        message: 'Payment verified and registration completed successfully',
        user: {
          id: newUser[0].id,
          name: newUser[0].name,
          mobile: newUser[0].mobile,
          paymentStatus: 'completed',
        },
      });
    }

    // Handle existing user payment flow (legacy)
    // Find user by order ID
    const userResult = await db
      .select()
      .from(users)
      .where(eq(users.razorpayOrderId, razorpay_order_id))
      .limit(1);

    if (userResult.length === 0) {
      return NextResponse.json(
        { error: 'User not found for this order' },
        { status: 404 }
      );
    }

    const user = userResult[0];

    // Update user payment status
    await db
      .update(users)
      .set({
        paymentStatus: 'completed',
        razorpayPaymentId: razorpay_payment_id,
        razorpaySignature: razorpay_signature,
        paymentCompletedAt: new Date(),
      })
      .where(eq(users.id, user.id));

    return NextResponse.json({
      success: true,
      message: 'Payment verified successfully',
      user: {
        id: user.id,
        name: user.name,
        mobile: user.mobile,
        paymentStatus: 'completed',
      },
    });
  } catch (error) {
    console.error('Error verifying payment:', error);
    return NextResponse.json(
      { error: 'Payment verification failed' },
      { status: 500 }
    );
  }
}