"use client";

import { useRef } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { saveAs } from "file-saver";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface ResumeDisplayProps {
  generatedResume: string;
  explanation: string;
  isLoading: boolean;
}

export default function ResumeDisplay({
  generatedResume,
  explanation,
  isLoading,
}: ResumeDisplayProps) {
  const resumeRef = useRef<HTMLDivElement>(null);

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
      const response = await fetch("/api/generate-docx", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ html: generatedResume }),
      });

      if (response.ok) {
        const blob = await response.blob();
        saveAs(blob, "resume.docx");
      } else {
        alert("Error generating .docx file.");
      }
    }
  };

  return (
    <div className="card bg-base-100 shadow-xl col-span-1 md:col-span-2">
      <div className="card-body">
        <h2 className="card-title text-2xl">Your Enhanced Resume</h2>
        {isLoading && (
          <div className="text-center p-8">
            <span className="loading loading-lg loading-infinity"></span>
            <p className="mt-4">
              Our AI is analyzing the job description and crafting your perfect
              resume...
            </p>
          </div>
        )}
        {generatedResume && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-2">
                AI's Enhancement Strategy
              </h3>
              <div className="prose prose-sm max-w-none p-4 bg-base-200 rounded-lg">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {explanation}
                </ReactMarkdown>
              </div>
            </div>
            <div>
              <h3 className="text-xl font-bold mb-2">Preview</h3>
              <div
                ref={resumeRef}
                className="prose lg:prose-xl max-w-none p-6 bg-white rounded-lg shadow-inner"
                dangerouslySetInnerHTML={{ __html: generatedResume }}
              />
              <div className="mt-6 flex gap-4">
                <button
                  className="btn btn-primary btn-lg"
                  onClick={handleDownloadPdf}
                >
                  Download PDF
                </button>
                <button
                  className="btn btn-secondary btn-lg"
                  onClick={handleDownloadDocx}
                >
                  Download Word Doc
                </button>
              </div>
            </div>
          </div>
        )}
        {!isLoading && !generatedResume && (
          <div className="text-center text-gray-500 p-12">
            <h3 className="text-xl">Your new resume will appear here</h3>
            <p>
              Just paste a job URL, upload your current resume, and let our AI
              do the rest.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
