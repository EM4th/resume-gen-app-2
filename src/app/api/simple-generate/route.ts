import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY!);

export async function POST(req: NextRequest) {
  try {
    console.log("Simple resume generation request received");
    
    if (!process.env.GOOGLE_GEMINI_API_KEY) {
      console.error("GOOGLE_GEMINI_API_KEY not found in environment");
      return NextResponse.json(
        { error: "API configuration error: Missing API key" },
        { status: 500 }
      );
    }

    const formData = await req.formData();
    const jobDescription = formData.get("jobDescription") as string | null;
    const resumeText = formData.get("resumeText") as string | null;

    if (!jobDescription || !resumeText) {
      return NextResponse.json(
        { error: "Missing job description or resume text" },
        { status: 400 }
      );
    }

    console.log("Job description length:", jobDescription.length);
    console.log("Resume text length:", resumeText.length);

    if (jobDescription.length < 20) {
      return NextResponse.json(
        { error: "Job description too short" },
        { status: 400 }
      );
    }

    if (resumeText.length < 50) {
      return NextResponse.json(
        { error: "Resume text too short" },
        { status: 400 }
      );
    }

    console.log("Calling Gemini AI...");
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `You are a career coach. Rewrite this resume to match the job description.

Job Description:
${jobDescription}

Current Resume:
${resumeText}

Return a JSON object with:
- "explanation": Brief explanation of changes made
- "resume": Enhanced resume in HTML format

Example: {"explanation": "I focused on highlighting React skills...", "resume": "<div>Enhanced resume content...</div>"}`;

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
    
    const text = response.text().replace(/```json/g, "").replace(/```/g, "").trim();
    
    let data;
    try {
      data = JSON.parse(text);
      console.log("Successfully parsed AI response");
    } catch (parseError) {
      console.error("Failed to parse AI response as JSON:", parseError);
      console.error("Raw response first 500 chars:", text.substring(0, 500));
      return NextResponse.json(
        { error: "AI response parsing error. Please try again." },
        { status: 500 }
      );
    }

    if (!data.explanation || !data.resume) {
      console.error("AI response missing required fields:", Object.keys(data));
      return NextResponse.json(
        { error: "AI response format error. Missing explanation or resume." },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Unexpected error in simple resume generation:", error);
    
    return NextResponse.json(
      { 
        error: `Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`
      },
      { status: 500 }
    );
  }
}
