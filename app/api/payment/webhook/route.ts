import { NextRequest, NextResponse } from 'next/server';
import { verifyWebhookSignature } from '@/lib/razorpay';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get('x-razorpay-signature');

    if (!signature) {
      return NextResponse.json(
        { error: 'Missing webhook signature' },
        { status: 400 }
      );
    }

    // Verify webhook signature
    const isValid = verifyWebhookSignature(rawBody, signature);

    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid webhook signature' },
        { status: 401 }
      );
    }

    const payload = JSON.parse(rawBody);
    const event = payload.event;
    const paymentEntity = payload.payload.payment.entity;

    // Handle different webhook events
    switch (event) {
      case 'payment.captured':
      case 'payment.authorized':
        // Payment successful
        const orderId = paymentEntity.order_id;
        const paymentId = paymentEntity.id;
        const amount = paymentEntity.amount / 100; // Convert from paise to rupees

        // Find user by order ID
        const userResult = await db
          .select()
          .from(users)
          .where(eq(users.razorpayOrderId, orderId))
          .limit(1);

        if (userResult.length > 0) {
          const user = userResult[0];

          // Update payment status
          await db
            .update(users)
            .set({
              paymentStatus: 'completed',
              razorpayPaymentId: paymentId,
              paymentCompletedAt: new Date(),
            })
            .where(eq(users.id, user.id));

          console.log(`Payment completed for user ${user.id}: ${user.name}`);
        }
        break;

      case 'payment.failed':
        // Payment failed
        const failedOrderId = paymentEntity.order_id;
        const failureReason = paymentEntity.error_description;

        // Find user by order ID
        const failedUserResult = await db
          .select()
          .from(users)
          .where(eq(users.razorpayOrderId, failedOrderId))
          .limit(1);

        if (failedUserResult.length > 0) {
          const user = failedUserResult[0];

          // Update payment status
          await db
            .update(users)
            .set({
              paymentStatus: 'failed',
            })
            .where(eq(users.id, user.id));

          console.log(`Payment failed for user ${user.id}: ${failureReason}`);
        }
        break;

      default:
        console.log(`Unhandled webhook event: ${event}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}