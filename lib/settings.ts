import { db } from '@/db';
import { appSettings } from '@/db/schema';
import { eq } from 'drizzle-orm';

export const DEFAULT_REGISTRATION_FEE = 2500;

export async function getRegistrationFee(): Promise<number> {
  try {
    const setting = await db
      .select()
      .from(appSettings)
      .where(eq(appSettings.key, 'registration_fee'))
      .limit(1);

    if (setting.length > 0) {
      return parseFloat(setting[0].value);
    }

    // Create default setting if not exists
    await db
      .insert(appSettings)
      .values({
        key: 'registration_fee',
        value: DEFAULT_REGISTRATION_FEE.toString(),
        description: 'Registration fee amount in INR',
      })
      .onConflictDoNothing();

    return DEFAULT_REGISTRATION_FEE;
  } catch (error) {
    console.error('Error fetching registration fee:', error);
    return DEFAULT_REGISTRATION_FEE;
  }
}

export async function updateRegistrationFee(amount: number): Promise<void> {
  await db
    .insert(appSettings)
    .values({
      key: 'registration_fee',
      value: amount.toString(),
      description: 'Registration fee amount in INR',
    })
    .onConflictDoUpdate({
      target: appSettings.key,
      set: {
        value: amount.toString(),
        updatedAt: new Date(),
      },
    });
}