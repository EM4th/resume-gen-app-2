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
    
    const prompt = `You are an expert resume writer. Your task is to create a professionally formatted resume that matches the job requirements while preserving the candidate's original structure and authentic experience.

ORIGINAL RESUME:
${originalResume}

TARGET JOB POSTING:
${jobDescription}

INSTRUCTIONS:
1. **PRESERVE EXACT STRUCTURE** - Keep the same sections and order as the original resume
2. **ENHANCE CONTENT STRATEGICALLY** - Improve descriptions with job-relevant keywords and quantified achievements
3. **MAINTAIN PROFESSIONAL TONE** - Use action verbs and professional language
4. **ADD STRATEGIC KEYWORDS** - Incorporate relevant terms from the job posting naturally
5. **QUANTIFY ACHIEVEMENTS** - Add specific metrics and results where appropriate

OUTPUT FORMAT REQUIREMENTS:
- Use the EXACT same section headers as the original
- Keep the same contact information format
- Maintain the same job title and company structure
- Preserve bullet point formatting
- Keep the same education format
- Use consistent professional formatting throughout

CRITICAL: Output ONLY the resume content in clean, structured format. Do not add explanatory text, HTML tags, or formatting instructions. Just provide the clean resume text that can be formatted.

Begin the enhanced resume now:`;

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

function formatResumeAsHTML(resumeContent: string): string {
  const lines = resumeContent.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  
  let formattedHTML = '';
  let inHeader = true;

  // Group name and contact info
  formattedHTML += '<div class="resume-header">';
  let headerLines = 0;
  while(headerLines < lines.length) {
    const line = lines[headerLines];
    // Stop when a clear section header is found
    if (line.match(/^(Experience|Education|Skills|Summary|Objective|Qualifications|Certifications|Projects)$/i) || (line.length < 25 && line.match(/^[A-Z][A-Z\s&]+$/))) {
      break; 
    }
    if (headerLines === 0) {
      formattedHTML += `<h1 class="name">${line}</h1>\n`;
    } else {
      formattedHTML += `<p class="contact">${line}</p>\n`;
    }
    headerLines++;
  }
  formattedHTML += '</div>';

  let inList = false;

  for (let i = headerLines; i < lines.length; i++) {
    const line = lines[i];
    
    // Section headers (all caps or specific keywords)
    if ((line.length < 25 && line.match(/^[A-Z][A-Z\s&]+$/)) || line.match(/^(Experience|Education|Skills|Summary|Objective|Qualifications|Certifications|Projects)$/i)) {
      if (inList) {
        formattedHTML += '</ul>\n';
        inList = false;
      }
      formattedHTML += `<div class="section">\n<h2>${line}</h2>\n`;
      continue;
    }
    
    // Bullet points
    if (line.match(/^\s*[•·‣▪▫⁃◦‣-●]\s*/)) {
      if (!inList) {
        formattedHTML += '<ul class="bullet-list">\n';
        inList = true;
      }
      const bulletText = line.replace(/^\s*[•·‣▪▫⁃◦‣-●]\s*/, '');
      formattedHTML += `<li>${bulletText}</li>\n`;
    } else {
       if (inList) {
        formattedHTML += '</ul>\n';
        inList = false;
      }
      // Check for job title/company/date line
      if (line.match(/[a-zA-Z]\s*,\s*[A-Z][a-z]+|\d{4}/) && line.length < 150) {
         formattedHTML += `<p class="job-header"><strong>${line}</strong></p>\n`;
      } else {
         formattedHTML += `<p class="job-description">${line}</p>\n`;
      }
    }
  }
  
  if (inList) {
    formattedHTML += '</ul>\n';
  }
  if (lines.length > 0) formattedHTML += '</div>\n';

  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Professional Resume</title>
    <style>
        body {
            font-family: 'Garamond', 'Times New Roman', serif;
            font-size: 11pt;
            line-height: 1.3;
            color: #111;
            background: #fff;
            margin: 0;
            padding: 0.5in; /* Standard resume margin */
            box-sizing: border-box;
            width: 8.5in;
        }
        .resume-header {
            text-align: center;
            margin-bottom: 0.25in;
            padding-bottom: 0.1in;
            border-bottom: 1px solid #ccc;
        }
        .name {
            font-size: 22pt;
            font-weight: bold;
            color: #000;
            margin-bottom: 8px;
        }
        .contact {
            font-size: 10pt;
            color: #333;
            margin: 1px 0;
        }
        .section {
            margin-bottom: 0.2in;
        }
        .section h2 {
            font-size: 13pt;
            font-weight: bold;
            color: #000;
            text-transform: uppercase;
            border-bottom: 1.5px solid #000;
            padding-bottom: 3px;
            margin-bottom: 0.15in;
            letter-spacing: 1px;
        }
        .job-header {
            margin: 6px 0 2px 0;
            font-size: 11pt;
        }
        .job-description {
            margin: 4px 0;
            text-align: justify;
        }
        .bullet-list {
            margin: 5px 0 10px 0;
            padding-left: 0.25in;
            list-style-type: none;
        }
        .bullet-list li {
            margin-bottom: 4px;
            line-height: 1.3;
            position: relative;
            padding-left: 12px;
        }
        .bullet-list li::before {
            content: '•';
            position: absolute;
            left: 0;
            top: 1px;
            color: #000;
            font-weight: bold;
        }
    </style>
</head>
<body>
    ${formattedHTML}
</body>
</html>`;
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
    const formattedHTML = formatResumeAsHTML(optimizedResume);

    console.log("✅ Resume generation complete!");
    
    return NextResponse.json({
      success: true,
      generatedResume: formattedHTML,
      originalLength: originalResume.length,
      optimizedLength: optimizedResume.length,
      jobDescriptionLength: jobDescription.length,
      apiVersion: "ai-generator-v5.1-hotfix", // Updated version
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
