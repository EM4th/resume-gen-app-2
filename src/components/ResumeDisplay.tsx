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
    <div className="space-y-6">
      {/* AI Explanation Card */}
      {explanation && (
        <div className="bg-white rounded-3xl p-6 shadow-xl">
          <div className="flex items-center gap-3 mb-4">
            <div className="text-2xl">🤖</div>
            <h3 className="text-xl font-bold text-gray-800">
              AI&apos;s Enhancement Strategy
            </h3>
          </div>
          <div className="prose prose-sm max-w-none text-gray-600">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {explanation}
            </ReactMarkdown>
          </div>
        </div>
      )}

      {/* Resume Preview Card */}
      {generatedResume && (
        <div className="bg-white rounded-3xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="text-2xl">📄</div>
              <h3 className="text-xl font-bold text-gray-800">Enhanced Resume</h3>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleDownloadPdf}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
              >
                📄 PDF
              </button>
              <button
                onClick={handleDownloadDocx}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                📝 Word
              </button>
            </div>
          </div>
          
          <div className="bg-gray-50 rounded-2xl p-4 max-h-96 overflow-y-auto">
            <div
              ref={resumeRef}
              className="bg-white p-8 rounded-lg shadow-sm text-sm leading-relaxed"
              style={{ 
                fontFamily: 'Arial, sans-serif',
                maxWidth: '210mm', // A4 width
                minHeight: '297mm', // A4 height
                margin: '0 auto'
              }}
              dangerouslySetInnerHTML={{ __html: generatedResume }}
            />
          </div>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="bg-white rounded-3xl p-8 shadow-xl text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">
            AI is analyzing and enhancing your resume...
          </p>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !generatedResume && !explanation && (
        <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 text-center border border-white/20">
          <div className="text-4xl mb-4">✨</div>
          <h3 className="text-xl font-bold text-white mb-2">Ready to Transform Your Resume?</h3>
          <p className="text-white/80">
            Upload your resume and job description above to get started
          </p>
        </div>
      )}
    </div>
  );
}
