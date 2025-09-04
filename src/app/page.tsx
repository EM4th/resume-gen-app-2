"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import AdSense from "../components/AdSense";

// Force redeploy with new design
const ResumeDisplay = dynamic(() => import("../components/ResumeDisplay"), {
  ssr: false,
});

export default function Home() {
  const [jobUrl, setJobUrl] = useState("");
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [outputFormat, setOutputFormat] = useState("PDF");
  const [generatedResume, setGeneratedResume] = useState("");
  const [explanation, setExplanation] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setResumeFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jobUrl || !resumeFile) {
      alert("Please provide both a job URL and a resume file.");
      return;
    }
    setIsLoading(true);
    setGeneratedResume("");
    setExplanation("");

    const formData = new FormData();
    formData.append("jobUrl", jobUrl);
    formData.append("resume", resumeFile);

    try {
      const response = await fetch("/api/generate-resume", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setGeneratedResume(data.resume);
        setExplanation(data.explanation);
      } else {
        console.error("Error generating resume");
        alert("There was an error generating your resume. Please try again.");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-800">
        <div className="container mx-auto p-4 flex items-center justify-center min-h-screen">
          <div className="w-full max-w-md">
            {/* Header Card */}
            <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 mb-6 text-center border border-white/20">
              <div className="text-6xl mb-4">🚀</div>
              <h1 className="text-3xl font-bold text-white mb-4">
                AI Resume Generator
              </h1>
              <p className="text-white/80 text-lg">
                Transform your resume with AI to match any job description perfectly
              </p>
            </div>

            {/* Header Ad - Real AdSense */}
            <div className="mb-6">
              <AdSense 
                adSlot="3104022820" 
                adFormat="auto"
                className="header-ad"
                style={{ 
                  display: 'block', 
                  textAlign: 'center', 
                  minHeight: '200px'
                }}
              />
            </div>

            {/* Main Form Card */}
            <div className="bg-white rounded-3xl p-8 shadow-2xl">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-gray-700 font-semibold mb-3 text-lg">
                    Upload Your Resume (PDF):
                  </label>
                  <div className="relative">
                    <input
                      type="file"
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      onChange={handleFileChange}
                      accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                      required
                    />
                    <div className="border-2 border-gray-300 border-dashed rounded-2xl p-6 text-center hover:border-blue-400 transition-colors">
                      <div className="text-gray-500">
                        <div className="text-3xl mb-2">📄</div>
                        {resumeFile ? (
                          <span className="text-blue-600 font-medium">
                            {resumeFile.name}
                          </span>
                        ) : (
                          <>
                            <button
                              type="button"
                              className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
                            >
                              Choose File
                            </button>
                            <span className="ml-2">No file chosen</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Ad placement after file upload section */}
                <div className="my-6">
                  <AdSense 
                    adSlot="9830843584" 
                    adFormat="auto"
                    className="text-center"
                    style={{ display: 'block', textAlign: 'center', minHeight: '250px' }}
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-semibold mb-3 text-lg">
                    Job Description (URL or Text):
                  </label>
                  <textarea
                    placeholder="Paste job description text or enter a job posting URL..."
                    className="w-full h-32 p-4 border border-gray-300 rounded-2xl resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    value={jobUrl}
                    onChange={(e) => setJobUrl(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-semibold mb-3 text-lg">
                    Output Format:
                  </label>
                  <select 
                    className="w-full p-4 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={outputFormat}
                    onChange={(e) => setOutputFormat(e.target.value)}
                  >
                    <option>PDF</option>
                    <option>Word Document</option>
                  </select>
                </div>

                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold text-lg py-4 rounded-2xl hover:from-purple-700 hover:to-blue-700 transition-all transform hover:scale-105 disabled:opacity-50 disabled:transform-none flex items-center justify-center gap-2"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Generating...
                    </>
                  ) : (
                    <>
                      🎯 Generate Enhanced Resume
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Results */}
            {(generatedResume || explanation) && (
              <div className="mt-6">
                <ResumeDisplay
                  generatedResume={generatedResume}
                  explanation={explanation}
                  isLoading={isLoading}
                />
                
                {/* Ad placement after results */}
                <div className="mt-8">
                  <AdSense 
                    adSlot="RESULTS_AD_UNIT_ID" 
                    adFormat="auto"
                    className="text-center"
                    style={{ display: 'block', textAlign: 'center', minHeight: '300px' }}
                  />
                </div>
              </div>
            )}

            {/* Bottom banner ad for all users */}
            <div className="mt-8 mb-4">
              <AdSense 
                adSlot="5211311414" 
                adFormat="auto"
                className="text-center"
                style={{ display: 'block', textAlign: 'center', minHeight: '100px' }}
              />
            </div>

            {/* Footer */}
            <div className="mt-8 text-center">
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-4 border border-white/20">
                <p className="text-white/80 text-sm">
                  <a 
                    href="/privacy" 
                    className="hover:text-white transition-colors underline"
                  >
                    Privacy Policy
                  </a>
                  {" | "}
                  <span>© 2025 AI Resume Generator</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
