"use client";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-800 flex items-center justify-center">
      <div className="text-white text-center">
        <h1 className="text-4xl font-bold mb-4">🚀 AI Resume Generator</h1>
        <p className="text-xl mb-4">Site restoration in progress...</p>
        <p className="text-lg">Clearing cache and rebuilding - v2</p>
        <div className="mt-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
        </div>
      </div>
    </div>
  );
}

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setResumeFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Form submitted!", { jobUrl, resumeFile });
    
    if (!jobUrl || !resumeFile) {
      alert("Please provide both a job URL and a resume file.");
      return;
    }
    
    console.log("Validation passed, starting API call...");
    setIsLoading(true);

    const formData = new FormData();
    formData.append("jobUrl", jobUrl);
    formData.append("resume", resumeFile);

    try {
      console.log("Making API request to /api/generate-resume-ai (AI-powered)");
      
      // Add timeout to prevent infinite spinning
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout after 90 seconds')), 90000)
      );
      
      const fetchPromise = fetch(`/api/generate-resume-ai?t=${Date.now()}`, {
        method: "POST",
        body: formData,
      });
      
      const response = await Promise.race([fetchPromise, timeoutPromise]) as Response;

      console.log("API response status:", response.status);
      const data = await response.json();
      console.log("API response data:", data);
      console.log("API version received:", data.apiVersion);
      console.log("Response timestamp:", data.timestamp);
      
      // Show user which API version they're getting
      if (data.apiVersion !== "ai-generator-v5.0") {
        console.warn("WARNING: Not using the latest AI generator API version!");
        console.warn("Expected: ai-generator-v5.0, Got:", data.apiVersion);
      }

      if (data.success) {
        try {
          // Store resume data in localStorage to avoid URL length issues
          localStorage.setItem('generatedResume', data.generatedResume);
          localStorage.setItem('resumeExplanation', data.explanation);
          console.log("Resume data stored in localStorage");
          console.log("Resume length:", data.generatedResume?.length || 0);
          
          // Redirect to results page (no URL params needed)
          console.log("Redirecting to results page...");
          window.location.href = '/results';
        } catch (storageError) {
          console.error("localStorage error, falling back to alert:", storageError);
          // Fallback if localStorage fails
          alert(`Resume generated successfully!\n\nExplanation: ${data.explanation}\n\nPlease copy the generated resume from the console.`);
          console.log("Generated Resume HTML:", data.generatedResume);
        }
      } else {
        console.error("API returned success: false", data);
        console.error("API version that failed:", data.apiVersion);
        alert(`API Error (${data.apiVersion || 'unknown'}): ${data.error || "There was an error generating your resume. Please try again."}`);
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
              <div className="text-6xl mb-4">🤖</div>
              <h1 className="text-3xl font-bold text-white mb-4">
                AI Resume Generator
              </h1>
              <p className="text-white/80 text-lg">
                🎯 AI analyzes job postings & optimizes your resume content<br/>
                🚀 Scrapes URLs & tailors your experience to match requirements
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

                <div>
                  <label className="block text-gray-700 font-semibold mb-3 text-lg">
                    🎯 Job Posting URL or Description:
                  </label>
                  <textarea
                    placeholder="Enter a job posting URL (LinkedIn, Indeed, etc.) OR paste the complete job description text here. Our AI will analyze the requirements and optimize your resume accordingly..."
                    className="w-full h-32 p-4 border border-gray-300 rounded-2xl resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    value={jobUrl}
                    onChange={(e) => setJobUrl(e.target.value)}
                    required
                  />
                  <p className="text-sm text-gray-600 mt-2">
                    💡 <strong>Pro tip:</strong> For best results, provide the complete job posting URL or copy the entire job description including requirements, qualifications, and responsibilities.
                  </p>
                </div>

                {/* Ad placement after job description section */}
                <div className="my-6">
                  <AdSense 
                    adSlot="9830843584" 
                    adFormat="auto"
                    className="text-center"
                    style={{ display: 'block', textAlign: 'center', minHeight: '250px' }}
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
