import { NextRequest, NextResponse } from "next/server";
import pdf from "pdf-parse";
import mammoth from "mammoth";
import { GoogleGenerativeAI } from "@google/generative-ai";
import puppeteer from "puppeteer-core";
import chromium from "@sparticuz/chromium";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY!);

export async function GET() {
  return NextResponse.json({ 
    message: "AI Resume Generator v5.0 - Full AI Integration",
    timestamp: new Date().toISOString(),
    status: "operational",
    features: ["URL Scraping", "AI Analysis", "Content Generation", "Format Preservation"]
  });
}

async function scrapeJobPosting(url: string): Promise<string> {
  console.log("🕷️ Starting job posting scrape for:", url);
  
  try {
    let browser;
    
    if (process.env.NODE_ENV === "production") {
      browser = await puppeteer.launch({
        args: [...chromium.args, "--hide-scrollbars", "--disable-web-security"],
        defaultViewport: chromium.defaultViewport,
        executablePath: await chromium.executablePath(),
        headless: true,
        ignoreHTTPSErrors: true,
      });
    } else {
      browser = await puppeteer.launch({
        headless: true,
        args: ["--no-sandbox", "--disable-setuid-sandbox"]
      });
    }

    const page = await browser.newPage();
    
    // Set user agent to avoid blocking
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
    
    // Navigate with timeout
    await page.goto(url, { 
      waitUntil: 'networkidle0',
      timeout: 15000 
    });

    // Wait a bit for dynamic content
    await page.waitForTimeout(2000);

    // Extract job posting content with multiple selectors
    const jobContent = await page.evaluate(() => {
      // Common job posting selectors across different sites
      const selectors = [
        '[data-testid="job-description"]',  // LinkedIn
        '.job-description',
        '.jobDescriptionContent',
        '.job-details',
        '.description',
        '[class*="description"]',
        '[id*="description"]',
        'main',
        'article',
        '.content'
      ];
      
      for (const selector of selectors) {
        const element = document.querySelector(selector);
        if (element && element.textContent && element.textContent.length > 200) {
          return element.textContent.trim();
        }
      }
      
      // Fallback: get body text
      return document.body.textContent?.trim() || '';
    });

    await browser.close();
    
    console.log("✅ Successfully scraped job posting, length:", jobContent.length);
    return jobContent;
    
  } catch (error) {
    console.error("❌ Scraping failed:", error);
    
    // Fallback: try basic fetch
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      const html = await response.text();
      
      // Basic HTML text extraction
      const textContent = html
        .replace(/<script[^>]*>.*?<\/script>/gis, '')
        .replace(/<style[^>]*>.*?<\/style>/gis, '')
        .replace(/<[^>]*>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
        
      console.log("✅ Fallback fetch successful, length:", textContent.length);
      return textContent;
      
    } catch (fallbackError) {
      console.error("❌ Fallback fetch failed:", fallbackError);
      throw new Error(`Unable to scrape job posting: ${error.message}`);
    }
  }
}

async function extractResumeText(file: File): Promise<string> {
  try {
    console.log("📄 Processing resume file:", file.name, file.type);
    
    const buffer = Buffer.from(await file.arrayBuffer());
    const fileName = file.name.toLowerCase();
    
    if (file.type === "application/pdf" || fileName.endsWith('.pdf')) {
      console.log("📄 Extracting PDF text...");
      const data = await pdf(buffer);
      return data.text.trim();
      
    } else if (fileName.endsWith('.docx') || fileName.endsWith('.doc')) {
      console.log("📄 Extracting Word document text...");
      const result = await mammoth.extractRawText({ buffer });
      return result.value.trim();
      
    } else {
      // Plain text file
      return await file.text();
    }
    
  } catch (error) {
    console.error("❌ Resume extraction failed:", error);
    throw new Error(`Unable to extract resume text: ${error.message}`);
  }
}

async function generateOptimizedResume(originalResume: string, jobDescription: string): Promise<{ content: string, explanation: string }> {
  try {
    console.log("🤖 Starting AI resume optimization...");
    
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    const prompt = `You are an expert resume writer and career coach. Your task is to optimize a resume for a specific job posting while maintaining the candidate's authentic experience and the original formatting style.

ORIGINAL RESUME:
${originalResume}

TARGET JOB POSTING:
${jobDescription}

INSTRUCTIONS:
1. **Analyze the job requirements** - Extract key skills, qualifications, and requirements from the job posting
2. **Optimize content strategically** - Rewrite sections to highlight relevant experience and skills that match the job
3. **Preserve authentic experience** - Only enhance and reframe existing experience, don't fabricate new roles or skills
4. **Maintain original formatting** - Keep the same structure, sections, and visual hierarchy as the original
5. **Add strategic keywords** - Incorporate relevant keywords from the job posting naturally
6. **Quantify achievements** - Add metrics and numbers where appropriate to strengthen impact
7. **Tailor the summary/objective** - Rewrite to directly address the target role

OPTIMIZATION FOCUS:
- Rewrite bullet points to emphasize relevant skills and achievements
- Reorganize sections to prioritize most relevant experience
- Enhance language to match industry terminology from the job posting
- Add relevant technical skills that the candidate likely has
- Strengthen accomplishments with specific metrics
- Ensure ATS compatibility

OUTPUT FORMAT:
Provide the complete optimized resume in the same format as the original, maintaining all formatting, section headers, and structure. Make it look like the candidate specifically wrote this resume for this exact position.

Begin the optimized resume now:`;

    const result = await model.generateContent(prompt);
    const optimizedContent = result.response.text();
    
    // Generate explanation
    const explanationPrompt = `Based on the resume optimization you just performed, provide a brief professional explanation of the key changes made. Focus on:
1. What specific job requirements were addressed
2. Which sections were enhanced
3. Key improvements made
4. Why these changes make the candidate more competitive

Keep it concise and professional (2-3 sentences).`;

    const explanationResult = await model.generateContent(explanationPrompt);
    const explanation = explanationResult.response.text();
    
    console.log("✅ AI optimization complete");
    
    return {
      content: optimizedContent,
      explanation: explanation.trim()
    };
    
  } catch (error) {
    console.error("❌ AI generation failed:", error);
    throw new Error(`AI resume optimization failed: ${error.message}`);
  }
}

function formatResumeAsHTML(resumeContent: string, explanation: string, jobUrl: string): string {
  // Convert plain text resume to HTML while preserving formatting
  const htmlContent = resumeContent
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br>')
    .replace(/^/, '<p>')
    .replace(/$/, '</p>')
    // Make section headers bold
    .replace(/<p>([A-Z][A-Z\s]{2,})<\/p>/g, '<h2>$1</h2>')
    // Make job titles/companies bold
    .replace(/<p>([^<]+\|[^<]+)<\/p>/g, '<p><strong>$1</strong></p>')
    // Format bullet points
    .replace(/<p>•([^<]+)<\/p>/g, '<li>$1</li>')
    .replace(/(<li>.*<\/li>)/gs, '<ul>$1</ul>');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>AI-Optimized Resume</title>
      <style>
        body { 
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
          line-height: 1.6; 
          max-width: 850px; 
          margin: 0 auto; 
          padding: 20px; 
          color: #333;
          background: white;
        }
        .header { 
          text-align: center; 
          margin-bottom: 30px; 
          border-bottom: 3px solid #2563eb; 
          padding-bottom: 20px;
        }
        .header h1 { 
          margin: 0; 
          color: #1e40af; 
          font-size: 2.4em;
          font-weight: 700;
        }
        .optimization-info { 
          background: linear-gradient(135deg, #e0f2fe 0%, #f3e5f5 100%); 
          border-left: 4px solid #2563eb; 
          padding: 20px; 
          margin: 25px 0; 
          border-radius: 0 8px 8px 0;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .optimization-info h3 { 
          margin-top: 0; 
          color: #1e40af; 
          font-size: 1.2em;
        }
        .resume-content { 
          background: white;
          padding: 30px;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          border: 1px solid #e5e7eb;
        }
        .resume-content h2 { 
          color: #2563eb; 
          border-bottom: 2px solid #2563eb; 
          padding-bottom: 8px; 
          margin-top: 25px;
          margin-bottom: 15px;
          font-size: 1.3em;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .resume-content p { 
          margin: 12px 0; 
          text-align: justify;
        }
        .resume-content strong { 
          color: #1e40af; 
          font-weight: 600;
        }
        .resume-content ul { 
          margin: 10px 0; 
          padding-left: 25px; 
        }
        .resume-content li { 
          margin: 8px 0; 
          line-height: 1.5;
        }
        .footer { 
          text-align: center; 
          margin-top: 30px; 
          padding-top: 20px; 
          border-top: 1px solid #e5e7eb; 
          color: #666; 
          font-size: 0.9em;
        }
        @media print {
          body { margin: 0; padding: 15px; }
          .optimization-info { page-break-inside: avoid; }
          .resume-content { box-shadow: none; border: none; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>🎯 AI-Optimized Resume</h1>
        <p style="color: #666; font-size: 1.1em; margin: 10px 0;">
          Intelligently tailored for: <strong>${jobUrl}</strong>
        </p>
        <p style="color: #888; font-size: 0.9em;">
          Generated ${new Date().toLocaleDateString()} | AI-Powered Optimization v5.0
        </p>
      </div>

      <div class="optimization-info">
        <h3>🚀 Optimization Summary</h3>
        <p style="margin: 0; font-size: 1.05em; line-height: 1.6;">
          ${explanation}
        </p>
      </div>

      <div class="resume-content">
        ${htmlContent}
      </div>

      <div class="footer">
        <p>
          <strong>✨ AI-Enhanced Resume</strong> • 
          Optimized for ATS systems • 
          Ready for professional submission
        </p>
      </div>
    </body>
    </html>
  `;
}

export async function POST(req: NextRequest) {
  try {
    console.log("🚀 AI Resume Generator v5.0 - Processing request...");
    
    const formData = await req.formData();
    const jobUrl = formData.get("jobUrl") as string;
    const resumeFile = formData.get("resume") as File;

    console.log("📥 Input received:", {
      jobUrl: jobUrl?.substring(0, 100),
      resumeFile: resumeFile?.name
    });

    if (!jobUrl || !resumeFile) {
      return NextResponse.json({
        error: "Missing required fields: jobUrl and resume file are required",
        success: false
      }, { status: 400 });
    }

    // Step 1: Extract job description
    console.log("🔍 Step 1: Extracting job description...");
    let jobDescription: string;
    
    if (jobUrl.startsWith('http://') || jobUrl.startsWith('https://')) {
      jobDescription = await scrapeJobPosting(jobUrl);
    } else {
      jobDescription = jobUrl; // Treat as plain text job description
    }

    if (jobDescription.length < 50) {
      return NextResponse.json({
        error: "Could not extract sufficient job description. Please provide a valid job URL or paste the job description directly.",
        success: false
      }, { status: 400 });
    }

    // Step 2: Extract original resume
    console.log("📄 Step 2: Extracting original resume...");
    const originalResume = await extractResumeText(resumeFile);
    
    if (originalResume.length < 100) {
      return NextResponse.json({
        error: "Could not extract sufficient resume content. Please ensure your file is a valid PDF or Word document.",
        success: false
      }, { status: 400 });
    }

    // Step 3: AI optimization
    console.log("🤖 Step 3: AI optimization in progress...");
    const { content: optimizedResume, explanation } = await generateOptimizedResume(originalResume, jobDescription);

    // Step 4: Format as HTML
    console.log("🎨 Step 4: Formatting final output...");
    const formattedHTML = formatResumeAsHTML(optimizedResume, explanation, jobUrl);

    console.log("✅ Resume generation complete!");
    
    return NextResponse.json({
      success: true,
      generatedResume: formattedHTML,
      explanation: explanation,
      originalLength: originalResume.length,
      optimizedLength: optimizedResume.length,
      jobDescriptionLength: jobDescription.length,
      apiVersion: "ai-generator-v5.0",
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error("❌ Resume generation failed:", error);
    
    return NextResponse.json({
      error: `Resume generation failed: ${error.message}`,
      success: false,
      apiVersion: "ai-generator-v5.0",
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
