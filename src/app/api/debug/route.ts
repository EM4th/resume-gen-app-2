import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ 
    message: "Debug endpoint working",
    timestamp: new Date().toISOString(),
    env: {
      hasGeminiKey: !!process.env.GOOGLE_GEMINI_API_KEY,
      nodeEnv: process.env.NODE_ENV
    }
  });
}

export async function POST(req: NextRequest) {
  try {
    console.log("Debug POST endpoint hit");
    
    // Test basic functionality without external dependencies
    const body = await req.json().catch(() => ({}));
    
    return NextResponse.json({ 
      message: "Debug POST working",
      receivedBody: body,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("Debug POST error:", error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
