import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY!);

async function extractTextFromFile(file: File): Promise<string> {
  try {
    console.log("Processing file:", {
      name: file.name,
      type: file.type,
      size: file.size
    });

    // For now, just return a placeholder since we're removing heavy dependencies
    // TODO: Re-implement proper file parsing once we fix the timeout issues
    return "PLACEHOLDER RESUME TEXT - Please paste your resume content directly in the job description field for now while we fix file upload issues.";
  } catch (error) {
    console.error("Error extracting text from file:", error);
    throw new Error("File processing temporarily unavailable. Please paste your resume text directly.");
  }
}

export async function POST(req: NextRequest) {
  console.log("=== MINIMAL RESUME GENERATION REQUEST STARTED ===");
  
  try {
    // Check environment variables first
    if (!process.env.GOOGLE_GEMINI_API_KEY) {
      console.error("GOOGLE_GEMINI_API_KEY not found in environment");
      return NextResponse.json(
        { error: "API configuration error: Missing API key" },
        { status: 500 }
      );
    }

    console.log("Environment check passed");
    
    let formData;
    try {
      formData = await req.formData();
      console.log("Form data parsed successfully");
    } catch (parseError) {
      console.error("Failed to parse form data:", parseError);
      return NextResponse.json(
        { error: "Invalid form data" },
        { status: 400 }
      );
    }

    const jobUrl = formData.get("jobUrl") as string | null;
    const resumeFile = formData.get("resume") as File | null;

    console.log("Form data received:", { 
      hasJobUrl: !!jobUrl, 
      hasResumeFile: !!resumeFile,
      jobUrlLength: jobUrl?.length || 0,
      resumeFileName: resumeFile?.name || 'none'
    });

    if (!jobUrl || !resumeFile) {
      console.error("Missing required fields:", { jobUrl: !!jobUrl, resumeFile: !!resumeFile });
      return NextResponse.json(
        { error: "Missing job description or resume file" },
        { status: 400 }
      );
    }

    console.log("Basic validation passed, processing inputs...");
    
    // Simplified processing - treat jobUrl as plain text
    const jobDescription = jobUrl;
    const resumeText = await extractTextFromFile(resumeFile);
    
    console.log("Job description length:", jobDescription.length);
    console.log("Resume text length:", resumeText.length);

    if (jobDescription.length < 10) {
      return NextResponse.json(
        { error: "Job description too short" },
        { status: 400 }
      );
    }

    console.log("Calling Gemini AI...");
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `Create a professional resume optimized for this job posting. Return JSON format with "explanation" and "resume" fields.

Job Posting:
${jobDescription}

Resume Text:
${resumeText}

Return format:
{
  "explanation": "Brief explanation of changes made",
  "resume": "HTML formatted resume ready for display"
}`;

    let result;
    try {
      console.log("Sending request to Gemini AI...");
      result = await model.generateContent(prompt);
      console.log("Gemini AI request completed");
    } catch (aiError) {
      console.error("Gemini AI error:", aiError);
      return NextResponse.json(
        { error: `AI service error: ${aiError instanceof Error ? aiError.message : 'Unknown AI error'}` },
        { status: 500 }
      );
    }

    let response;
    try {
      response = await result.response;
      console.log("Gemini AI response received successfully");
    } catch (responseError) {
      console.error("Error getting response from AI result:", responseError);
      return NextResponse.json(
        { error: `AI response error: ${responseError instanceof Error ? responseError.message : 'Unknown response error'}` },
        { status: 500 }
      );
    }
    
    // Get the raw text response
    const text = response.text().trim();
    console.log("Raw AI response first 300 chars:", text.substring(0, 300));
    
    let data;
    
    // Try to parse as JSON first
    if (text.includes('{') && text.includes('}')) {
      try {
        // Find JSON content between first { and last }
        const jsonStart = text.indexOf('{');
        const jsonEnd = text.lastIndexOf('}') + 1;
        const jsonText = text.substring(jsonStart, jsonEnd);
        
        data = JSON.parse(jsonText);
        console.log("Successfully parsed AI response as JSON");
      } catch (parseError) {
        console.error("Failed to parse as JSON:", parseError);
        data = null;
      }
    }
    
    // If JSON parsing failed, create a formatted response
    if (!data) {
      console.log("Creating formatted response from AI text");
      
      const explanation = "Enhanced your resume to match the job posting requirements with professional formatting.";
      
      const resume = `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; max-width: 8.5in; margin: 0 auto; padding: 1in; line-height: 1.6; color: #333; background: white;">
        <div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 40px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
          <header style="text-align: center; border-bottom: 3px solid #2563eb; padding-bottom: 20px; margin-bottom: 30px;">
            <h1 style="font-size: 28px; margin: 0; color: #1e40af; font-weight: 700;">ENHANCED RESUME</h1>
            <p style="font-size: 14px; margin: 10px 0; color: #666; font-style: italic;">Optimized for Your Target Position</p>
          </header>
          <div style="white-space: pre-wrap; font-size: 14px; line-height: 1.8;">
${text.replace(/\n/g, '<br>').replace(/\*/g, '•')}
          </div>
          <footer style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; font-size: 12px; color: #888;">
            <p>Resume optimized for ATS screening and hiring manager review</p>
          </footer>
        </div>
      </div>`;
      
      data = {
        explanation: explanation,
        resume: resume
      };
    }

    // Ensure we have the required fields
    if (!data.explanation || !data.resume) {
      console.error("Missing required fields in response");
      return NextResponse.json(
        { error: "AI response incomplete. Please try again." },
        { status: 500 }
      );
    }

    console.log("Returning successful response with resume length:", data.resume.length);
    console.log("=== MINIMAL RESUME GENERATION REQUEST COMPLETED SUCCESSFULLY ===");
    return NextResponse.json({ 
      success: true, 
      generatedResume: data.resume, 
      explanation: data.explanation 
    });
  } catch (error) {
    console.error("=== UNEXPECTED ERROR IN MINIMAL RESUME GENERATION ===");
    console.error("Error details:", error);
    console.error("Error stack:", error instanceof Error ? error.stack : 'No stack trace');
    
    return NextResponse.json(
      { 
        error: `Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
