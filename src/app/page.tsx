"use client";

import { useState, useRef } from "react";
import Script from "next/script";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { saveAs } from "file-saver";
import htmlToDocx from "html-to-docx";

export default function Home() {
  const [jobUrl, setJobUrl] = useState("");
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [generatedResume, setGeneratedResume] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const resumeRef = useRef<HTMLDivElement>(null);

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

  const handleDownloadPdf = () => {
    if (resumeRef.current) {
      html2canvas(resumeRef.current).then((canvas) => {
        const imgData = canvas.toDataURL("image/png");
        const pdf = new jsPDF("p", "mm", "a4");
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
        pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
        pdf.save("resume.pdf");
      });
    }
  };

  const handleDownloadDocx = async () => {
    if (generatedResume) {
      const fileBuffer = await htmlToDocx(generatedResume, undefined, {
        table: { row: { cantSplit: true } },
        footer: true,
        pageNumber: true,
      });

      saveAs(fileBuffer as Blob, "resume.docx");
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

          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <h2 className="card-title">Your Generated Resume</h2>
              {isLoading && (
                <div className="text-center p-8">
                  <span className="loading loading-lg"></span>
                  <p>Generating your resume... this may take a moment.</p>
                </div>
              )}
              {generatedResume && (
                <div>
                  <div
                    ref={resumeRef}
                    className="prose lg:prose-xl max-w-none p-4 bg-white"
                    dangerouslySetInnerHTML={{ __html: generatedResume }}
                  />
                  <div className="mt-4 flex gap-4">
                    <button
                      className="btn btn-secondary"
                      onClick={handleDownloadPdf}
                    >
                      Download PDF
                    </button>
                    <button
                      className="btn btn-accent"
                      onClick={handleDownloadDocx}
                    >
                      Download Word/Google Doc
                    </button>
                  </div>
                </div>
              )}
              {!isLoading && !generatedResume && (
                <div className="text-center text-gray-500 p-8">
                  Your generated resume will appear here.
                </div>
              )}
            </div>
          </div>
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
