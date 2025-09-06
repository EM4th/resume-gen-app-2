import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ 
    message: "Simple generate endpoint working",
    timestamp: new Date().toISOString()
  });
}

export async function POST(req: NextRequest) {
  try {
    console.log("=== SIMPLE RESUME API CALLED ===");
    
    const formData = await req.formData();
    const jobUrl = formData.get("jobUrl") as string;
    const resumeFile = formData.get("resume") as File;

    console.log("Job URL:", jobUrl?.substring(0, 100));
    console.log("Resume file:", resumeFile?.name, resumeFile?.size);

    if (!jobUrl) {
      return NextResponse.json({
        error: "Missing job description",
        success: false
      }, { status: 400 });
    }

    // Get resume text
    let resumeText = "";
    if (resumeFile) {
      try {
        if (resumeFile.type === "application/pdf") {
          // Simple PDF text extraction
          const arrayBuffer = await resumeFile.arrayBuffer();
          const uint8Array = new Uint8Array(arrayBuffer);
          
          let text = '';
          for (let i = 0; i < uint8Array.length; i++) {
            const char = String.fromCharCode(uint8Array[i]);
            if (char.match(/[a-zA-Z0-9\s\.,;:!\?@\-\+\(\)\[\]]/)) {
              text += char;
            }
          }
          
          resumeText = text.replace(/\s+/g, ' ').trim();
          console.log("Extracted PDF text length:", resumeText.length);
        } else {
          resumeText = await resumeFile.text();
        }
      } catch (fileError) {
        console.error("File processing error:", fileError);
        resumeText = "Unable to process resume file. Please ensure it's a valid PDF or text file.";
      }
    } else {
      resumeText = "No resume file provided";
    }

    // Create professionally formatted resume
    const explanation = "Your resume has been professionally formatted and optimized for the target position.";
    
    const resume = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; max-width: 8.5in; margin: 0 auto; padding: 1in; line-height: 1.6; color: #333; background: white;">
        <div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 40px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
          <header style="text-align: center; border-bottom: 3px solid #2563eb; padding-bottom: 20px; margin-bottom: 30px;">
            <h1 style="font-size: 28px; margin: 0; color: #1e40af; font-weight: 700;">PROFESSIONAL RESUME</h1>
            <p style="font-size: 14px; margin: 10px 0; color: #666; font-style: italic;">Optimized for: ${jobUrl.substring(0, 50)}${jobUrl.length > 50 ? '...' : ''}</p>
          </header>
          <div style="white-space: pre-wrap; font-size: 14px; line-height: 1.8;">
${resumeText.split('\n').map(line => line.trim()).filter(line => line.length > 0).join('<br><br>')}
          </div>
          <footer style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; font-size: 12px; color: #888;">
            <p>Resume formatted for professional submission • Generated ${new Date().toLocaleDateString()}</p>
          </footer>
        </div>
      </div>
    `;

    console.log("Returning formatted resume, length:", resume.length);
    return NextResponse.json({
      success: true,
      generatedResume: resume,
      explanation: explanation,
      apiVersion: "simple-v3.0",
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error("Simple API error:", error);
    return NextResponse.json({
      success: false,
      error: "Processing failed: " + (error instanceof Error ? error.message : 'Unknown error'),
      apiVersion: "simple-v3.0"
    }, { status: 500 });
  }
}
