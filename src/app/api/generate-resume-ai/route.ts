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
    
    const prompt = `You are an expert resume writer and career coach. Your task is to optimize a resume for a specific job posting while maintaining the candidate's authentic experience and PRESERVING THE EXACT ORIGINAL FORMATTING AND STRUCTURE.

ORIGINAL RESUME:
${originalResume}

TARGET JOB POSTING:
${jobDescription}

CRITICAL INSTRUCTIONS - FORMAT PRESERVATION:
1. **MAINTAIN EXACT STRUCTURE** - Keep the same sections, headers, and layout as the original
2. **PRESERVE FORMATTING** - Keep the same font styling, spacing, bullet points, and visual hierarchy
3. **SAME SECTION ORDER** - Do not reorder or reorganize sections from the original
4. **IDENTICAL VISUAL STYLE** - Match the original's presentation style exactly
5. **ENHANCE CONTENT ONLY** - Only improve the text content within the existing structure

CONTENT OPTIMIZATION GOALS:
1. **Strategic Keywords** - Add relevant keywords from the job posting naturally into existing text
2. **Quantify Achievements** - Add specific metrics and numbers where appropriate
3. **Strengthen Language** - Use more impactful action verbs and professional terminology
4. **Highlight Relevance** - Emphasize experience and skills that match job requirements
5. **Professional Polish** - Enhance descriptions while keeping authentic experience

SPECIFIC ENHANCEMENT AREAS:
- **Summary/Objective**: Tailor to directly address the target role
- **Experience Bullets**: Strengthen with metrics, keywords, and relevant achievements
- **Skills Section**: Add relevant technical skills the candidate likely has
- **Education/Certifications**: Highlight relevant qualifications
- **Professional Language**: Use industry terminology from the job posting

FORMAT REQUIREMENTS:
- Keep EXACT same section headers as original
- Maintain same bullet point style and indentation
- Preserve all contact information and layout
- Keep same font hierarchy and spacing
- Do not add new sections unless they exist in original
- Match the original's professional tone and style

OUTPUT: Provide the complete optimized resume that looks IDENTICAL to the original in structure and formatting, but with enhanced content that better matches the job requirements.

IMPORTANT: The output should look like the candidate personally rewrote their existing resume for this specific job, not like it was generated by AI.

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
  // Clean and preserve the resume formatting more carefully
  let processedContent = resumeContent
    // Preserve line breaks and structure
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    // Handle common resume sections
    .replace(/^([A-Z][A-Z\s&]{2,}):?\s*$/gm, '<h2 class="section-header">$1</h2>')
    .replace(/^([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*):?\s*$/gm, '<h3 class="subsection-header">$1</h3>')
    // Handle contact info and names (typically at the top)
    .replace(/^([A-Z][a-z]+\s+[A-Z][a-z]+)\s*$/gm, '<h1 class="name-header">$1</h1>')
    // Handle job titles and companies
    .replace(/^(.+)\s*\|\s*(.+)\s*\|\s*(.+)$/gm, '<p class="job-entry"><strong>$1</strong> | <em>$2</em> | <span class="date">$3</span></p>')
    // Handle bullet points
    .replace(/^[•·‣▪▫⁃◦‣]\s*(.+)$/gm, '<li>$1</li>')
    .replace(/^-\s*(.+)$/gm, '<li>$1</li>')
    // Handle phone/email patterns
    .replace(/(\(\d{3}\)\s*\d{3}-\d{4})/g, '<span class="phone">$1</span>')
    .replace(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g, '<a href="mailto:$1" class="email">$1</a>')
    // Handle paragraphs
    .split('\n\n')
    .map(paragraph => {
      if (paragraph.trim() === '') return '';
      if (paragraph.includes('<h1>') || paragraph.includes('<h2>') || paragraph.includes('<h3>')) {
        return paragraph;
      }
      if (paragraph.includes('<li>')) {
        return '<ul>' + paragraph.replace(/\n/g, '') + '</ul>';
      }
      return '<p>' + paragraph.replace(/\n/g, '<br>') + '</p>';
    })
    .join('\n');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>AI-Optimized Resume</title>
      <style>
        body { 
          font-family: 'Times New Roman', Times, serif; 
          line-height: 1.4; 
          max-width: 8.5in; 
          margin: 0 auto; 
          padding: 0.5in; 
          color: #000;
          background: white;
          font-size: 11pt;
        }
        .header-info { 
          text-align: center; 
          margin-bottom: 20px; 
          border-bottom: 2px solid #2563eb; 
          padding-bottom: 15px;
        }
        .header-info h1 { 
          margin: 0; 
          color: #1e40af; 
          font-size: 1.8em;
          font-weight: 700;
        }
        .optimization-note { 
          background: #f0f9ff; 
          border-left: 4px solid #2563eb; 
          padding: 15px; 
          margin: 20px 0; 
          border-radius: 0 5px 5px 0;
          font-size: 10pt;
        }
        .optimization-note h3 { 
          margin-top: 0; 
          color: #1e40af; 
          font-size: 1.1em;
        }
        .resume-content { 
          background: white;
          font-family: 'Times New Roman', Times, serif;
          line-height: 1.4;
        }
        .name-header {
          text-align: center;
          font-size: 18pt;
          font-weight: bold;
          margin: 0 0 5px 0;
          color: #000;
        }
        .section-header { 
          color: #000; 
          border-bottom: 1px solid #000; 
          padding-bottom: 2px; 
          margin-top: 18px;
          margin-bottom: 8px;
          font-size: 12pt;
          font-weight: bold;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .subsection-header {
          color: #000;
          font-size: 11pt;
          font-weight: bold;
          margin: 12px 0 6px 0;
        }
        .job-entry {
          margin: 8px 0;
          font-weight: normal;
        }
        .job-entry strong {
          font-weight: bold;
        }
        .job-entry em {
          font-style: italic;
        }
        .date {
          font-style: italic;
        }
        .resume-content p { 
          margin: 6px 0; 
          text-align: left;
        }
        .resume-content ul { 
          margin: 8px 0; 
          padding-left: 20px; 
        }
        .resume-content li { 
          margin: 4px 0; 
          line-height: 1.3;
        }
        .phone, .email {
          font-style: normal;
        }
        .email {
          color: #0066cc;
          text-decoration: none;
        }
        @media print {
          body { margin: 0; padding: 0.5in; }
          .optimization-note { display: none; }
          .header-info { border-bottom: none; }
        }
      </style>
    </head>
    <body>
      <div class="header-info">
        <h1>🎯 AI-Optimized Resume</h1>
        <p style="color: #666; font-size: 10pt; margin: 5px 0;">
          Enhanced for: <strong>${jobUrl.length > 60 ? jobUrl.substring(0, 60) + '...' : jobUrl}</strong>
        </p>
        <p style="color: #888; font-size: 9pt;">
          Generated ${new Date().toLocaleDateString()} | AI v5.0
        </p>
      </div>

      <div class="optimization-note">
        <h3>🚀 Enhancement Summary</h3>
        <p style="margin: 0; font-size: 10pt; line-height: 1.4;">
          ${explanation}
        </p>
      </div>

      <div class="resume-content">
        ${processedContent}
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
