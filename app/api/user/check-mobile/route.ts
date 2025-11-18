import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const session = request.cookies.get("user_session");

    if (!session) {
      return NextResponse.json({ 
        authenticated: false, 
        isMobileOS: false,
        userOS: 'Unknown' 
      }, { status: 401 });
    }

    const userData = JSON.parse(session.value);
    
    // Extract OS information from JWT token
    const userOS = userData.userOS || 'Unknown';
    const isMobileOS = userData.isMobileOS || false;
    
    console.log(`🔍 Server OS Check - User: ${userData.email}, OS: ${userOS}, isMobileOS: ${isMobileOS}`);

    return NextResponse.json({
      authenticated: true,
      isMobileOS,
      userOS,
      user: {
        email: userData.email,
        name: userData.name
      }
    });
  } catch (error) {
    console.error("Error checking mobile OS:", error);
    return NextResponse.json({ 
      authenticated: false, 
      isMobileOS: false,
      userOS: 'Unknown' 
    }, { status: 401 });
  }
}