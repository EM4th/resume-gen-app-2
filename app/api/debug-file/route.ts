import { NextRequest, NextResponse } from "next/server";
import pdf from "pdf-parse";
import mammoth from "mammoth";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("resume") as File | null;
    
    if (!file) {
      return NextResponse.json({ error: "No file uploaded" });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const fileName = file.name.toLowerCase();
    
    let extractedText = "";
    let processingMethod = "";
    
    try {
      if (fileName.endsWith('.pdf')) {
        processingMethod = "PDF parsing";
        const data = await pdf(buffer);
        extractedText = data.text;
      } else if (fileName.endsWith('.docx') || fileName.endsWith('.doc')) {
        processingMethod = "Word document parsing";
        const result = await mammoth.extractRawText({ buffer });
        extractedText = result.value;
      } else {
        processingMethod = "Plain text (fallback)";
        extractedText = buffer.toString('utf8');
      }
    } catch (parseError) {
      extractedText = `Parse error: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`;
    }
    
    return NextResponse.json({
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
      bufferSize: buffer.length,
      processingMethod,
      extractedTextLength: extractedText.length,
      extractedTextPreview: extractedText.substring(0, 500),
      firstBytes: buffer.slice(0, 50).toString('hex')
    });
  } catch (error) {
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : "Unknown error" 
    });
  }
}
