"use client";

import { useState } from "react";
import AdSense from "../components/AdSense";

export default function Home() {
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [jobUrl, setJobUrl] = useState<string>("");
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

      const data = await response.json();

      if (data.success) {
        // Redirect to results page with data as URL params
        const resumeParam = encodeURIComponent(data.generatedResume);
        const explanationParam = encodeURIComponent(data.explanation);
        window.location.href = `/results?resume=${resumeParam}&explanation=${explanationParam}`;
      } else {
        alert(data.error || "There was an error generating your resume. Please try again.");
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
                    Upload Your Resume:
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="file"
                      className="flex-1 text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 file:cursor-pointer cursor-pointer"
                      onChange={handleFileChange}
                      accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                      required
                    />
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
                  <a 
                    href="/terms" 
                    className="hover:text-white transition-colors underline"
                  >
                    Terms of Service
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
