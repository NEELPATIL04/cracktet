import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { desc, eq, and, ilike, or } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    
    const offset = (page - 1) * limit;

    // Build where conditions
    const whereConditions = [];
    
    if (search) {
      whereConditions.push(
        or(
          ilike(users.name, `%${search}%`),
          ilike(users.email, `%${search}%`),
          ilike(users.mobile, `%${search}%`),
          ilike(users.razorpayOrderId, `%${search}%`),
          ilike(users.razorpayPaymentId, `%${search}%`)
        )
      );
    }
    
    if (status) {
      whereConditions.push(eq(users.paymentStatus, status));
    }

    // Get transactions with user details
    const transactions = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        mobile: users.mobile,
        district: users.district,
        paymentStatus: users.paymentStatus,
        paymentAmount: users.paymentAmount,
        razorpayOrderId: users.razorpayOrderId,
        razorpayPaymentId: users.razorpayPaymentId,
        paymentCompletedAt: users.paymentCompletedAt,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
      .orderBy(desc(users.createdAt))
      .limit(limit)
      .offset(offset);

    // Get total count for pagination
    const totalResult = await db
      .select()
      .from(users)
      .where(whereConditions.length > 0 ? and(...whereConditions) : undefined);
    
    const total = totalResult.length;
    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      success: true,
      data: transactions,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch transactions' },
      { status: 500 }
    );
  }
}