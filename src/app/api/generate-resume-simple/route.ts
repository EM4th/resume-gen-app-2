import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ 
    message: "Simple generate endpoint working",
    timestamp: new Date().toISOString()
  });
}

export async function POST(req: NextRequest) {
  try {
    console.log("Simple POST request received");
    
    return NextResponse.json({ 
      message: "Simple POST working",
      timestamp: new Date().toISOString(),
      success: true,
      generatedResume: "<h1>Test Resume</h1><p>This is a test resume to verify the API is working.</p>",
      explanation: "This is a test response to verify the API endpoints are functioning."
    });
  } catch (error) {
    console.error("Simple POST error:", error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
