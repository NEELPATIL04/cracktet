import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: { orderId: string } }
) {
  try {
    const { orderId } = params;

    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      );
    }

    // Find user by order ID
    const userResult = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        mobile: users.mobile,
        paymentStatus: users.paymentStatus,
        paymentAmount: users.paymentAmount,
        razorpayOrderId: users.razorpayOrderId,
        razorpayPaymentId: users.razorpayPaymentId,
        paymentCompletedAt: users.paymentCompletedAt,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.razorpayOrderId, orderId))
      .limit(1);

    if (userResult.length === 0) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    const user = userResult[0];

    return NextResponse.json({
      success: true,
      status: user.paymentStatus,
      order: {
        id: user.razorpayOrderId,
        amount: user.paymentAmount,
        status: user.paymentStatus,
        paymentId: user.razorpayPaymentId,
        completedAt: user.paymentCompletedAt,
        createdAt: user.createdAt,
      },
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        mobile: user.mobile,
      },
    });
  } catch (error) {
    console.error('Error fetching payment status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch payment status' },
      { status: 500 }
    );
  }
}