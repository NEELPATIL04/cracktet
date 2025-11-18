import { NextResponse } from 'next/server';
import { getRegistrationFee } from '@/lib/settings';

// Public endpoint to get registration fee (no authentication required)
export async function GET() {
  try {
    const registrationFee = await getRegistrationFee();

    return NextResponse.json({
      registrationFee,
    });
  } catch (error) {
    console.error('Error fetching registration fee:', error);
    return NextResponse.json(
      { error: 'Failed to fetch registration fee', registrationFee: 2500 },
      { status: 500 }
    );
  }
}
