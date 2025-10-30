import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const session = request.cookies.get("user_session");

    if (!session) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    const userData = JSON.parse(session.value);

    return NextResponse.json({
      authenticated: true,
      user: userData,
    });
  } catch (error) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
}
