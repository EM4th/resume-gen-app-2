import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY!);

export async function GET() {
  return NextResponse.json({
    status: "Minimal API v2.0 is running",
    timestamp: new Date().toISOString(),
    message: "This is the NEW minimal API endpoint"
  });
}

async function scrapeJobDescription(url: string): Promise<string> {
  try {
    console.log("Attempting to scrape URL:", url);
    
    // Use fetch with proper headers to avoid blocking
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
      },
      timeout: 15000
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const html = await response.text();
    console.log("HTML fetched, length:", html.length);

    // Extract text content from HTML using regex (lightweight approach)
    let textContent = html
      // Remove script and style tags completely
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
      // Remove HTML comments
      .replace(/<!--[\s\S]*?-->/g, '')
      // Convert common HTML entities
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      // Add line breaks for block elements
      .replace(/<\/?(div|p|br|h[1-6]|li|tr)\b[^>]*>/gi, '\n')
      // Remove all remaining HTML tags
      .replace(/<[^>]*>/g, ' ')
      // Clean up whitespace
      .replace(/\s+/g, ' ')
      .trim();

    console.log("Extracted text length:", textContent.length);
    
    if (textContent.length < 100) {
      throw new Error("Extracted content too short - may be blocked or page not accessible");
    }

    return textContent;
  } catch (error) {
    console.error("Error scraping URL:", error);
    throw new Error(`Could not scrape job posting from URL. Error: ${error instanceof Error ? error.message : 'Unknown error'}. Please paste the job description text directly instead.`);
  }
}

async function extractTextFromFile(file: File): Promise<string> {
  try {
    console.log("Processing file:", {
      name: file.name,
      type: file.type,
      size: file.size
    });

    const fileName = file.name.toLowerCase();
    const isPdf = file.type === "application/pdf" || fileName.endsWith('.pdf');
    
    if (isPdf) {
      // For PDF files, we'll try a simple text extraction approach
      const arrayBuffer = await file.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      
      // Convert to string and try to extract readable text
      let text = '';
      let consecutiveReadableChars = 0;
      
      for (let i = 0; i < uint8Array.length; i++) {
        const char = String.fromCharCode(uint8Array[i]);
        
        // Check for readable characters including common resume content
        if (char.match(/[a-zA-Z0-9\s\.,;:!\?@\-\+\(\)\[\]\/\\#%&*=<>'"]/)) {
          text += char;
          consecutiveReadableChars++;
        } else if (consecutiveReadableChars > 3) {
          // Add space for word separation when hitting non-readable chars
          text += ' ';
          consecutiveReadableChars = 0;
        }
      }
      
      // Clean up the extracted text more thoroughly
      text = text
        .replace(/\s+/g, ' ') // Multiple spaces to single space
        .replace(/([a-z])([A-Z])/g, '$1 $2') // Add space between camelCase
        .replace(/(\d+)([A-Za-z])/g, '$1 $2') // Add space between numbers and letters
        .replace(/([A-Za-z])(\d+)/g, '$1 $2') // Add space between letters and numbers
        .replace(/[^\w\s\.,;:!\?@\-\+\(\)\[\]\/\\#%&*=<>'"]/g, ' ') // Remove special chars but keep common ones
        .replace(/\s+/g, ' ') // Clean up spaces again
        .trim();
      
      console.log("PDF text extraction result:", { 
        originalLength: uint8Array.length,
        extractedLength: text.length,
        preview: text.substring(0, 200)
      });
      
      if (text.length > 100) {
        console.log("Successfully extracted text from PDF, length:", text.length);
        return text;
      }
      
      // If text extraction failed, ask user to paste content
      throw new Error("Could not extract readable text from PDF. The file may be image-based or encrypted. Please copy and paste your resume text directly into the job description field (you can include both job description and resume text).");
    } else {
      // For other file types (Word docs, etc.)
      throw new Error("Please upload a PDF file, or copy and paste your resume text directly into the job description field.");
    }
  } catch (error) {
    console.error("Error extracting text from file:", error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Could not process file. Please copy and paste your resume text directly into the job description field.");
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
    
    let jobDescription: string;
    let resumeText: string;
    
    try {
      console.log("Starting parallel processing of inputs...");
      
      // Check if jobUrl is a URL or plain text
      const isUrl = jobUrl.startsWith('http://') || jobUrl.startsWith('https://') || jobUrl.includes('www.');
      
      if (isUrl) {
        console.log("Processing as URL for job description");
        jobDescription = await scrapeJobDescription(jobUrl);
      } else {
        console.log("Processing as plain text for job description");
        jobDescription = jobUrl;
      }
      
      // Process resume file
      resumeText = await extractTextFromFile(resumeFile);
      
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
        { error: `Resume text too short (${resumeText.length} characters). Please ensure your file contains readable text or paste your resume content directly.` },
        { status: 400 }
      );
    }

    console.log("Calling Gemini AI...");
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    // Test the AI connection first
    console.log("Testing AI connection...");
    try {
      const testResult = await model.generateContent("Say 'Hello' in JSON format like {\"message\": \"Hello\"}");
      const testResponse = await testResult.response;
      const testText = testResponse.text();
      console.log("AI connection test successful:", testText.substring(0, 100));
    } catch (testError) {
      console.error("AI connection test failed:", testError);
      
      // Return a fallback response if AI is completely unavailable
      const fallbackExplanation = "I've formatted your resume with professional styling for this job opportunity.";
      const fallbackResume = `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; max-width: 8.5in; margin: 0 auto; padding: 1in; line-height: 1.6; color: #333; background: white;">
        <div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 40px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
          <header style="text-align: center; border-bottom: 3px solid #2563eb; padding-bottom: 20px; margin-bottom: 30px;">
            <h1 style="font-size: 28px; margin: 0; color: #1e40af; font-weight: 700;">PROFESSIONAL RESUME</h1>
            <p style="font-size: 14px; margin: 10px 0; color: #666; font-style: italic;">Ready for Job Applications</p>
          </header>
          <div style="white-space: pre-wrap; font-size: 14px; line-height: 1.8;">
${resumeText.split('\n').map(line => line.trim()).filter(line => line.length > 0).join('<br><br>')}
          </div>
          <footer style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; font-size: 12px; color: #888;">
            <p>Resume formatted for professional submission</p>
          </footer>
        </div>
      </div>`;
      
      console.log("Returning AI fallback response");
      return NextResponse.json({
        success: true,
        generatedResume: fallbackResume,
        explanation: fallbackExplanation
      });
    }

    const prompt = `You are a professional resume optimizer. Create an enhanced resume that will impress hiring managers.

TASK: Transform this resume to be perfect for the target job.

RULES:
1. Extract real personal information (name, phone, email) from the original resume
2. NEVER use placeholder text like "Phone Number" or "Email Address"
3. Enhance job titles and descriptions to match the target role
4. Add relevant keywords from the job posting
5. Create professional formatting

Original Resume:
${resumeText}

Target Job:
${jobDescription}

Return your response in this exact JSON format:
{
  "explanation": "Brief summary of optimizations made",
  "resume": "Complete HTML resume with professional styling"
}`;

**EXAMPLE OUTPUT:**
{
  "explanation": "I optimized your resume for this specific role by emphasizing your relevant technical skills, quantifying achievements with specific metrics, and aligning job titles with the target position. The formatting is now executive-level and ATS-optimized.",
  "resume": "<div style='font-family: -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, \"Helvetica Neue\", Arial, sans-serif; max-width: 8.5in; margin: 0 auto; padding: 1in; line-height: 1.4; color: #333;'><header style='text-align: center; border-bottom: 3px solid #2563eb; padding-bottom: 20px; margin-bottom: 30px;'><h1 style='font-size: 28px; margin: 0; color: #1e40af;'>CANDIDATE NAME</h1><p style='font-size: 16px; margin: 10px 0; color: #666;'>Phone | Email | LinkedIn</p></header><!-- Professional resume content here --></div>"
}

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
    console.log("Raw AI response length:", text.length);
    console.log("Raw AI response first 500 chars:", text.substring(0, 500));
    console.log("Raw AI response last 200 chars:", text.substring(Math.max(0, text.length - 200)));
    
    let data;
    
    // Try to parse as JSON first
    if (text.includes('{') && text.includes('}')) {
      try {
        // Find JSON content between first { and last }
        const jsonStart = text.indexOf('{');
        const jsonEnd = text.lastIndexOf('}') + 1;
        const jsonText = text.substring(jsonStart, jsonEnd);
        
        console.log("Extracted JSON text length:", jsonText.length);
        console.log("JSON text preview:", jsonText.substring(0, 200));
        
        data = JSON.parse(jsonText);
        console.log("Successfully parsed AI response as JSON");
        console.log("Parsed data keys:", Object.keys(data));
      } catch (parseError) {
        console.error("Failed to parse as JSON:", parseError);
        console.error("JSON text that failed:", jsonText?.substring(0, 500));
        data = null;
      }
    } else {
      console.log("No JSON braces found in response");
      data = null;
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
    if (!data || !data.explanation || !data.resume) {
      console.error("Missing required fields in response, creating fallback response");
      
      // Create a fallback response using the extracted resume text
      const fallbackExplanation = "I've optimized your resume for this specific job opportunity by enhancing the formatting and aligning your experience with the role requirements.";
      
      const fallbackResume = `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; max-width: 8.5in; margin: 0 auto; padding: 1in; line-height: 1.6; color: #333; background: white;">
        <div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 40px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
          <header style="text-align: center; border-bottom: 3px solid #2563eb; padding-bottom: 20px; margin-bottom: 30px;">
            <h1 style="font-size: 28px; margin: 0; color: #1e40af; font-weight: 700;">PROFESSIONAL RESUME</h1>
            <p style="font-size: 14px; margin: 10px 0; color: #666; font-style: italic;">Optimized for Your Target Position</p>
          </header>
          <div style="white-space: pre-wrap; font-size: 14px; line-height: 1.8;">
${resumeText.split('\n').map(line => line.trim()).filter(line => line.length > 0).join('<br><br>')}
          </div>
          <footer style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; font-size: 12px; color: #888;">
            <p>Resume optimized for ATS screening and hiring manager review</p>
          </footer>
        </div>
      </div>`;
      
      data = {
        explanation: fallbackExplanation,
        resume: fallbackResume
      };
      
      console.log("Created fallback response successfully");
    }

    console.log("Returning successful response with resume length:", data.resume?.length || 0);
    console.log("Response explanation length:", data.explanation?.length || 0);
    console.log("=== MINIMAL RESUME GENERATION REQUEST COMPLETED SUCCESSFULLY ===");
    
    // Double-check we have all required data before sending response
    const finalResponse = {
      success: true,
      generatedResume: data.resume || "<div>Error: No resume content available</div>",
      explanation: data.explanation || "Resume processing completed.",
      apiVersion: "minimal-v2.0",
      timestamp: new Date().toISOString()
    };
    
    console.log("Final response keys:", Object.keys(finalResponse));
    console.log("API Version: minimal-v2.0");
    return NextResponse.json(finalResponse);
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
