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
  const buffer = Buffer.from(await file.arrayBuffer());
  if (file.type === "application/pdf") {
    const data = await pdf(buffer);
    return data.text;
  } else if (
    file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    file.type === "application/msword"
  ) {
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  }
  return "";
}

export async function POST(req: NextRequest) {
  try {
    console.log("Resume generation request received");
    const formData = await req.formData();
    const jobUrl = formData.get("jobUrl") as string | null;
    const resumeFile = formData.get("resume") as File | null;

    if (!jobUrl || !resumeFile) {
      console.error("Missing required fields:", { jobUrl: !!jobUrl, resumeFile: !!resumeFile });
      return NextResponse.json(
        { error: "Missing jobUrl or resume file" },
        { status: 400 }
      );
    }

    console.log("Processing job description and resume...");
    const [jobDescription, resumeText] = await Promise.all([
      getJobDescription(jobUrl),
      extractTextFromResume(resumeFile),
    ]);

    console.log("Job description length:", jobDescription.length);
    console.log("Resume text length:", resumeText.length);

    if (!process.env.GOOGLE_GEMINI_API_KEY) {
      console.error("Google Gemini API key not found");
      return NextResponse.json(
        { error: "API configuration error" },
        { status: 500 }
      );
    }

    console.log("Calling Gemini AI...");
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    const prompt = `
      You are a world-class career coach and expert resume writer with a deep understanding of HR and recruitment practices.
      Your task is to completely rewrite the provided resume to make it the perfect application for the given job description.
      Be aggressive and strategic in your changes.

      **Key Instructions:**
      1.  **Mirror the Job Description:** Analyze the job description for key skills, technologies, and qualifications. Rewrite the resume to highlight these, using the same language where appropriate.
      2.  **Aggressively Tailor Content:** Change job titles, job descriptions, and skill lists to directly match what the employer is looking for. If the resume has a "Software Developer" role and the job is for a "Frontend Engineer," change the title and tailor the description accordingly.
      3.  **Quantify Achievements:** Rephrase responsibilities as quantifiable achievements. Instead of "Wrote code," use "Developed a new feature that increased user engagement by 15%."
      4.  **Optimize for ATS (Applicant Tracking Systems):** Ensure the resume is rich with keywords from the job description to pass through automated screening systems.
      5.  **Maintain Professional Formatting:** The final output must be a complete resume in clean, well-structured HTML. Preserve the original resume's core structure (e.g., sections for Work Experience, Education, Skills) but enhance the content dramatically.
      6.  **Remove Irrelevant Information:** Eliminate any experience or skills from the original resume that are not relevant to the target job.

      **Your Output:**
      You MUST return a single, valid JSON object with two keys: "explanation" and "resume".
      - "explanation": A markdown-formatted string. In this string, first provide a brief, high-level summary of your strategy. Then, detail the key changes you made and, most importantly, *why* you made them, referencing the job description.
      - "resume": A string containing the full, rewritten resume in clean, well-structured HTML.

      **Job Description:**
      ---
      ${jobDescription}
      ---

      **Original Resume Text:**
      ---
      ${resumeText}
      ---
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    
    console.log("Gemini AI response received");
    
    // Clean the response to ensure it's valid JSON
    const text = response.text().replace(/```json/g, "").replace(/```/g, "").trim();
    
    let data;
    try {
      data = JSON.parse(text);
      console.log("Successfully parsed AI response");
    } catch (parseError) {
      console.error("Failed to parse AI response as JSON:", parseError);
      console.error("Raw response:", text.substring(0, 500));
      return NextResponse.json(
        { error: "AI response format error. Please try again." },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Resume generation error:", error);
    
    // Return more specific error messages
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { error: "An unexpected error occurred. Please try again." },
      { status: 500 }
    );
  }
}
