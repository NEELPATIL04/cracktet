import { NextRequest, NextResponse } from 'next/server';
import { getRegistrationFee, updateRegistrationFee } from '@/lib/settings';
import { cookies } from 'next/headers';
import { db } from '@/db';
import { admins, appSettings } from '@/db/schema';
import { eq } from 'drizzle-orm';

async function verifyAdmin(request: NextRequest): Promise<boolean> {
  const cookieStore = await cookies();
  const adminId = cookieStore.get('adminId')?.value;

  if (!adminId) {
    return false;
  }

  const admin = await db
    .select()
    .from(admins)
    .where(eq(admins.adminId, adminId))
    .limit(1);

  return admin.length > 0;
}

export async function GET(request: NextRequest) {
  try {
    const isAdmin = await verifyAdmin(request);
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const registrationFee = await getRegistrationFee();
    
    // Get all settings
    const allSettings = await db.select().from(appSettings);
    
    return NextResponse.json({
      registrationFee,
      settings: allSettings,
    });
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const isAdmin = await verifyAdmin(request);
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { registrationFee } = await request.json();

    if (typeof registrationFee !== 'number' || registrationFee <= 0) {
      return NextResponse.json(
        { error: 'Invalid registration fee amount' },
        { status: 400 }
      );
    }

    await updateRegistrationFee(registrationFee);

    return NextResponse.json({
      success: true,
      message: 'Registration fee updated successfully',
      registrationFee,
    });
  } catch (error) {
    console.error('Error updating settings:', error);
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    );
  }
}