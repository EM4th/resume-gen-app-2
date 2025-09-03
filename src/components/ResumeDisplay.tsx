"use client";

import { useRef } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { saveAs } from "file-saver";
import htmlToDocx from "html-to-docx";

interface ResumeDisplayProps {
  generatedResume: string;
  isLoading: boolean;
}

export default function ResumeDisplay({
  generatedResume,
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
      const fileBuffer = await htmlToDocx(generatedResume, undefined, {
        table: { row: { cantSplit: true } },
        footer: true,
        pageNumber: true,
      });
      saveAs(fileBuffer as Blob, "resume.docx");
    }
  };

  return (
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
              <button className="btn btn-accent" onClick={handleDownloadDocx}>
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
  );
}
