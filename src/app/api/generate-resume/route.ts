import { NextRequest, NextResponse } from "next/server";
import pdf from "pdf-parse";
import mammoth from "mammoth";
import { GoogleGenerativeAI } from "@google/generative-ai";
import puppeteer from "puppeteer-core";
import chromium from "@sparticuz/chromium";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY!);

async function getJobDescription(url: string): Promise<string> {
  let browser = null;
  try {
    const executablePath = await chromium.executablePath();

    browser = await puppeteer.launch({
      args: chromium.args,
      executablePath,
      headless: true, // Use true for headless mode
    });

    const page = await browser.newPage();
    await page.goto(url, { waitUntil: "networkidle2" });

    // Extract text from the body of the page
    const jobDescription = await page.evaluate(() => document.body.innerText);
    
    return jobDescription;
  } catch (error) {
    console.error("Error fetching job description with Puppeteer:", error);
    // Fallback to basic fetch
    try {
        const response = await fetch(url);
        const text = await response.text();
        // This is a very naive way to get content. A real implementation needs a proper scraper.
        const jobDescription = text.substring(text.indexOf("<body"), text.indexOf("</body>"));
        return jobDescription;
    } catch (fetchError) {
        console.error("Error fetching job description with basic fetch:", fetchError);
        throw new Error("Could not fetch job description from URL.");
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
    const formData = await req.formData();
    const jobUrl = formData.get("jobUrl") as string | null;
    const resumeFile = formData.get("resume") as File | null;

    if (!jobUrl || !resumeFile) {
      return NextResponse.json(
        { error: "Missing jobUrl or resume file" },
        { status: 400 }
      );
    }

    const [jobDescription, resumeText] = await Promise.all([
      getJobDescription(jobUrl),
      extractTextFromResume(resumeFile),
    ]);

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

      **Job Description:**
      ---
      ${jobDescription}
      ---

      **Original Resume Text:**
      ---
      ${resumeText}
      ---

      **Your Output:**
      You MUST return a single, valid JSON object with two keys: "explanation" and "resume".
      - "explanation": A markdown-formatted string. In this string, first provide a brief, high-level summary of your strategy. Then, detail the key changes you made and, most importantly, *why* you made them, referencing the job description.
      - "resume": A string containing the full, rewritten resume in clean, well-structured HTML.

      **JSON Output Example:**
      {
        "explanation": "### Resume Enhancement Strategy\\nBased on the Frontend Engineer role, I focused on highlighting your React and UI/UX skills...",
        "resume": "<html>...</html>"
      }

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
    
    // Clean the response to ensure it's valid JSON
    const text = response.text().replace(/```json/g, "").replace(/```/g, "").trim();
    const data = JSON.parse(text);

    return NextResponse.json(data);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
