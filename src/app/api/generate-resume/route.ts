import { NextRequest, NextResponse } from "next/server";
import pdf from "pdf-parse";
import mammoth from "mammoth";
import { GoogleGenerativeAI } from "@google/generative-ai";
import puppeteer from "puppeteer-core";
import chromium from "@sparticuz/chromium";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY!);

async function getJobDescription(input: string): Promise<string> {
  // TEMPORARY FIX: Disable web scraping to isolate API issues
  // Always treat input as plain text for now
  console.log("Input received (treating as plain text):", input.substring(0, 100));
  
  // Check if it looks like a URL
  const isUrl = input.startsWith('http://') || input.startsWith('https://') || input.includes('www.');
  
  if (isUrl) {
    console.log("URL detected, but web scraping is temporarily disabled");
    return "PLEASE PASTE THE JOB DESCRIPTION TEXT DIRECTLY. URL scraping is temporarily disabled while we fix technical issues.";
  }
  
  // Return the plain text input
  return input;
}

async function extractTextFromResume(file: File): Promise<string> {
  try {
    console.log("Processing file:", {
      name: file.name,
      type: file.type,
      size: file.size
    });

    const buffer = Buffer.from(await file.arrayBuffer());
    console.log("Buffer created, size:", buffer.length);

    // Check file extension if MIME type is not reliable
    const fileName = file.name.toLowerCase();
    const isPdf = file.type === "application/pdf" || fileName.endsWith('.pdf');
    const isWordDoc = file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" || 
                     file.type === "application/msword" || 
                     fileName.endsWith('.docx') || 
                     fileName.endsWith('.doc');

    if (isPdf) {
      console.log("Processing as PDF...");
      try {
        const data = await pdf(buffer);
        console.log("PDF parsed, text length:", data.text.length);
        console.log("PDF text preview:", data.text.substring(0, 200));
        return data.text;
      } catch (pdfError) {
        console.error("PDF parsing failed:", pdfError);
        throw new Error(`PDF parsing failed: ${pdfError instanceof Error ? pdfError.message : 'Unknown PDF error'}`);
      }
    } else if (isWordDoc) {
      console.log("Processing as Word document...");
      try {
        const result = await mammoth.extractRawText({ buffer });
        console.log("Word document parsed, text length:", result.value.length);
        console.log("Word text preview:", result.value.substring(0, 200));
        return result.value;
      } catch (wordError) {
        console.error("Word parsing failed:", wordError);
        throw new Error(`Word document parsing failed: ${wordError instanceof Error ? wordError.message : 'Unknown Word error'}`);
      }
    } else {
      console.log("Unsupported file:", { type: file.type, name: file.name });
      throw new Error(`Unsupported file: ${file.name}. Please upload a PDF (.pdf) or Word document (.docx, .doc). Detected type: ${file.type}`);
    }
  } catch (error) {
    console.error("Error extracting text from resume:", error);
    throw error; // Re-throw the original error to preserve the specific message
  }
}

export async function POST(req: NextRequest) {
  console.log("=== RESUME GENERATION REQUEST STARTED ===");
  
  try {
    console.log("Resume generation request received");
    
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
    
    let jobDescription: string;
    let resumeText: string;
    
    try {
      console.log("Starting parallel processing of inputs...");
      [jobDescription, resumeText] = await Promise.all([
        getJobDescription(jobUrl),
        extractTextFromResume(resumeFile),
      ]);
      console.log("Parallel processing completed successfully");
    } catch (processingError) {
      console.error("Error processing inputs:", processingError);
      return NextResponse.json(
        { error: `Processing error: ${processingError instanceof Error ? processingError.message : 'Unknown error'}` },
        { status: 500 }
      );
    }

    console.log("Job description length:", jobDescription.length);
    console.log("Resume text length:", resumeText.length);

    if (jobDescription.length < 10) {
      return NextResponse.json(
        { error: "Job description too short or could not be extracted" },
        { status: 400 }
      );
    }

    if (resumeText.length < 50) {
      return NextResponse.json(
        { error: `Resume text too short (${resumeText.length} characters). Extracted text: "${resumeText.substring(0, 100)}"` },
        { status: 400 }
      );
    }

    console.log("Calling Gemini AI...");
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `You are a world-class resume writer and career strategist. Your task is to create a PERFECTLY FORMATTED, SUBMISSION-READY resume that will get this person hired.

**CRITICAL SUCCESS REQUIREMENTS:**
1. **Perfect Job Match**: Tailor EVERY section to match the job requirements exactly
2. **ATS Optimization**: Use exact keywords from the job posting for maximum ATS score
3. **Professional Formatting**: Create a visually stunning, executive-level resume format
4. **Quantified Achievements**: Add specific metrics, percentages, and dollar amounts where possible
5. **Submission Ready**: This resume must be immediately ready to submit for the job

**FORMATTING STANDARDS:**
- Clean, professional HTML with excellent typography
- Consistent spacing and visual hierarchy
- Modern design that stands out to hiring managers
- Perfect alignment and professional styling
- Ready for PDF conversion and printing

**CONTENT STRATEGY:**
- Rewrite job titles and descriptions to align with target role
- Highlight technical skills that match job requirements
- Quantify all achievements with numbers and percentages  
- Add relevant industry keywords throughout
- Emphasize leadership and impact metrics
- Create compelling bullet points that sell the candidate

**Job Posting to Match:**
${jobDescription}

**Original Resume Text:**
${resumeText}

**OUTPUT FORMAT:**
You must return a JSON object with exactly these fields:
{
  "explanation": "Brief strategy summary explaining key changes made",
  "resume": "Complete HTML resume with professional styling that's ready to submit"
}

**EXAMPLE OUTPUT:**
{
  "explanation": "I optimized your resume for this specific role by emphasizing your relevant technical skills, quantifying achievements with specific metrics, and aligning job titles with the target position. The formatting is now executive-level and ATS-optimized.",
  "resume": "<div style='font-family: -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, \"Helvetica Neue\", Arial, sans-serif; max-width: 8.5in; margin: 0 auto; padding: 1in; line-height: 1.4; color: #333;'><header style='text-align: center; border-bottom: 3px solid #2563eb; padding-bottom: 20px; margin-bottom: 30px;'><h1 style='font-size: 28px; margin: 0; color: #1e40af;'>CANDIDATE NAME</h1><p style='font-size: 16px; margin: 10px 0; color: #666;'>Phone | Email | LinkedIn</p></header><!-- Professional resume content here --></div>"
}

Create a resume that will immediately impress hiring managers and get this person hired for this specific job!`;

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
    console.log("Gemini AI response received");
    
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
        console.log("Attempting fallback parsing...");
        data = null;
      }
    }
    
    // If JSON parsing failed, create a formatted response
    if (!data) {
      console.log("Creating formatted response from AI text");
      
      const explanation = "I've enhanced your resume to perfectly match this job posting by optimizing keywords, quantifying achievements, and ensuring professional formatting that will impress hiring managers and pass ATS screening.";
      
      // Create a professionally formatted resume from the AI response
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
    console.log("=== RESUME GENERATION REQUEST COMPLETED SUCCESSFULLY ===");
    return NextResponse.json({ 
      success: true, 
      generatedResume: data.resume, 
      explanation: data.explanation 
    });
  } catch (error) {
    console.error("=== UNEXPECTED ERROR IN RESUME GENERATION ===");
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
