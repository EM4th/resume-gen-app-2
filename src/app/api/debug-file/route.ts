import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("resume") as File | null;
    
    if (!file) {
      return NextResponse.json({ error: "No file uploaded" });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    
    return NextResponse.json({
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
      bufferSize: buffer.length,
      firstBytes: buffer.slice(0, 100).toString('hex')
    });
  } catch (error) {
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : "Unknown error" 
    });
  }
}
