"use client";

import { useState } from "react";
import Script from "next/script";
import dynamic from "next/dynamic";

const ResumeDisplay = dynamic(() => import("../components/ResumeDisplay"), {
  ssr: false,
});

export default function Home() {
  const [jobUrl, setJobUrl] = useState("");
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [generatedResume, setGeneratedResume] = useState("");
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
      <Script
        async
        src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-7524647518323966"
        crossOrigin="anonymous"
      />
      <div className="container mx-auto p-4">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold">AI Resume Generator</h1>
          <p className="text-lg text-gray-600">
            Tailor your resume for any job description instantly.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <h2 className="card-title">Create Your Perfect Resume</h2>
              <form onSubmit={handleSubmit}>
                <div className="form-control w-full mb-4">
                  <label className="label">
                    <span className="label-text">Job Posting URL</span>
                  </label>
                  <input
                    type="url"
                    placeholder="https://example.com/job-posting"
                    className="input input-bordered w-full"
                    value={jobUrl}
                    onChange={(e) => setJobUrl(e.target.value)}
                    required
                  />
                </div>
                <div className="form-control w-full mb-4">
                  <label className="label">
                    <span className="label-text">Upload Your Resume</span>
                  </label>
                  <input
                    type="file"
                    className="file-input file-input-bordered w-full"
                    onChange={handleFileChange}
                    accept=".pdf,.doc,.docx"
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="btn btn-primary w-full"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <span className="loading loading-spinner"></span>
                  ) : (
                    "Generate Resume"
                  )}
                </button>
              </form>
            </div>
          </div>

          <ResumeDisplay
            generatedResume={generatedResume}
            isLoading={isLoading}
          />
        </div>
        <footer className="text-center mt-8 text-gray-500">
          <p>
            Monetized with{" "}
            <a
              href="https://www.google.com/adsense"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:underline"
            >
              Google AdSense
            </a>
          </p>
        </footer>
      </div>
    </>
  );
}
