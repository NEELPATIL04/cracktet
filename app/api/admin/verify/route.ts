import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET(_request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const adminAuth = cookieStore.get("admin-auth");

    if (!adminAuth || !adminAuth.value) {
      return NextResponse.json(
        { authenticated: false },
        { status: 401 }
      );
    }

    return NextResponse.json(
      {
        authenticated: true,
        adminId: adminAuth.value,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Admin verify error:", error);
    return NextResponse.json(
      { authenticated: false },
      { status: 500 }
    );
  }
}
