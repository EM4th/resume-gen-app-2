import { NextRequest, NextResponse } from "next/server";
import pdf from "pdf-parse";
import mammoth from "mammoth";
import { GoogleGenerativeAI } from "@google/generative-ai";
import puppeteer from "puppeteer-core";
import chromium from "@sparticuz/chromium";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY!);

async function getJobDescription(input: string): Promise<string> {
  // Check if input is a URL or plain text
  const isUrl = input.startsWith('http://') || input.startsWith('https://') || input.includes('www.');
  
  if (!isUrl) {
    // If it's not a URL, treat it as plain text job description
    console.log("Input detected as plain text job description");
    return input;
  }

  // If it's a URL, try to scrape it
  let browser = null;
  try {
    console.log("Attempting to scrape URL:", input);
    const executablePath = await chromium.executablePath();

    browser = await puppeteer.launch({
      args: chromium.args,
      executablePath,
      headless: true,
    });

    const page = await browser.newPage();
    await page.goto(input, { waitUntil: "networkidle2", timeout: 30000 });

    // Extract text from the body of the page
    const jobDescription = await page.evaluate(() => document.body.innerText);
    console.log("Successfully scraped job description, length:", jobDescription.length);
    
    return jobDescription;
  } catch (error) {
    console.error("Error fetching job description with Puppeteer:", error);
    // Fallback to basic fetch
    try {
        console.log("Trying fallback fetch method for URL:", input);
        const response = await fetch(input);
        const text = await response.text();
        // Extract text content from HTML
        const htmlContent = text.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
                               .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
                               .replace(/<[^>]*>/g, ' ')
                               .replace(/\s+/g, ' ')
                               .trim();
        console.log("Fallback fetch successful, content length:", htmlContent.length);
        return htmlContent;
    } catch (fetchError) {
        console.error("Error fetching job description with basic fetch:", fetchError);
        throw new Error("Could not fetch job description from URL. Please paste the job description text directly instead.");
    }
  } finally {
    if (browser) {
      await browser.close();
    }
  }
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

    const formData = await req.formData();
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

    console.log("Processing job description and resume...");
    
    let jobDescription: string;
    let resumeText: string;
    
    try {
      [jobDescription, resumeText] = await Promise.all([
        getJobDescription(jobUrl),
        extractTextFromResume(resumeFile),
      ]);
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

    const prompt = `You are a world-class career coach and expert resume writer. Your task is to rewrite the provided resume to perfectly match the job description while PRESERVING the original formatting, style, and structure.

**CRITICAL FORMATTING REQUIREMENTS:**
1. **Preserve Original Style**: Maintain the exact same visual structure, headings, and layout as the original resume
2. **Keep Same Length**: Do not exceed the original resume's length (same number of pages/sections)
3. **Match Professional Formatting**: Preserve fonts, spacing, bullet points, and visual hierarchy
4. **Maintain Color Scheme**: Keep any existing color schemes or styling elements
5. **Professional Presentation**: Ensure the output is immediately ready for job submission

**CONTENT OPTIMIZATION STRATEGY:**
- Mirror key skills and technologies from the job description
- Rewrite job responsibilities to highlight relevant experience
- Quantify achievements where possible (add metrics and numbers)
- Use exact keywords from the job posting for ATS optimization
- Remove or de-emphasize irrelevant experience
- Adjust job titles and descriptions to match the target role

**Job Description:**
${jobDescription}

**Original Resume:**
${resumeText}

**OUTPUT REQUIREMENTS:**
Return a JSON object with exactly these two keys:
- "explanation": A markdown-formatted strategy explanation (2-3 paragraphs max)
- "resume": Complete enhanced resume in clean HTML that preserves the original's visual style

**IMPORTANT**: The HTML should maintain the same professional appearance, section structure, and visual hierarchy as the original resume. Focus on content enhancement while preserving the proven formatting that makes the resume look professional and submission-ready.

Example output:
{
  "explanation": "### Resume Enhancement Strategy\\n\\nI focused on highlighting your React and JavaScript experience to match the Frontend Developer role requirements. I quantified your achievements and emphasized modern web development skills.\\n\\nKey changes include repositioning your technical skills section, adding specific metrics to your project descriptions, and aligning your job titles with the target role's requirements.",
  "resume": "<div style='font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; line-height: 1.6;'><!-- Enhanced resume with preserved formatting --></div>"
}`;

    let result;
    try {
      result = await model.generateContent(prompt);
    } catch (aiError) {
      console.error("Gemini AI error:", aiError);
      return NextResponse.json(
        { error: `AI service error: ${aiError instanceof Error ? aiError.message : 'Unknown AI error'}` },
        { status: 500 }
      );
    }

    const response = await result.response;
    console.log("Gemini AI response received");
    
    // Get the raw text response
    const text = response.text().trim();
    console.log("Raw AI response first 200 chars:", text.substring(0, 200));
    
    let data;
    
    // Try to parse as JSON first
    if (text.startsWith('{') && text.endsWith('}')) {
      try {
        const cleanText = text.replace(/```json/g, "").replace(/```/g, "").trim();
        data = JSON.parse(cleanText);
        console.log("Successfully parsed AI response as JSON");
      } catch (parseError) {
        console.error("Failed to parse as JSON:", parseError);
        // Fall back to text parsing
        data = null;
      }
    }
    
    // If JSON parsing failed or response isn't JSON format, parse as text
    if (!data) {
      console.log("Parsing AI response as plain text");
      // Split response by common delimiters to extract explanation and resume
      const lines = text.split('\n');
      const explanation = "I enhanced your resume to better match the job requirements by optimizing keywords and highlighting relevant experience.";
      
      // Assume the whole response is the resume content
      const resume = `<div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; line-height: 1.6; padding: 20px;">
        <h1 style="color: #333; border-bottom: 2px solid #4a90e2; padding-bottom: 10px;">Enhanced Resume</h1>
        <div style="white-space: pre-wrap; font-size: 14px; color: #444;">
          ${text.replace(/\n/g, '<br>')}
        </div>
      </div>`;
      
      data = {
        explanation: explanation,
        resume: resume
      };
    }

    if (!data.explanation || !data.resume) {
      console.error("AI response missing required fields:", Object.keys(data));
      return NextResponse.json(
        { error: "AI response format error. Missing explanation or resume." },
        { status: 500 }
      );
    }

    console.log("Returning successful response");
    return NextResponse.json({ 
      success: true, 
      generatedResume: data.resume, 
      explanation: data.explanation 
    });
  } catch (error) {
    console.error("Unexpected error in resume generation:", error);
    
    return NextResponse.json(
      { 
        error: `Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
