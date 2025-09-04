"use client";

import { useRef, useState, useEffect } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { saveAs } from "file-saver";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import PDFViewer from "./PDFViewer";

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
  const [pdfData, setPdfData] = useState<string | null>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  // Generate PDF when resume content is available
  useEffect(() => {
    if (generatedResume && !pdfData && !isGeneratingPdf) {
      generatePdfPreview();
    }
  }, [generatedResume, pdfData, isGeneratingPdf]);

  const generatePdfPreview = async () => {
    if (!generatedResume || !resumeRef.current) return;
    
    setIsGeneratingPdf(true);
    try {
      // Create a temporary element with A4 dimensions
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = generatedResume;
      tempDiv.style.width = '210mm';
      tempDiv.style.minHeight = '297mm';
      tempDiv.style.padding = '20mm';
      tempDiv.style.backgroundColor = 'white';
      tempDiv.style.fontFamily = 'Arial, sans-serif';
      tempDiv.style.fontSize = '12px';
      tempDiv.style.lineHeight = '1.4';
      tempDiv.style.position = 'absolute';
      tempDiv.style.left = '-9999px';
      tempDiv.style.top = '0';
      
      document.body.appendChild(tempDiv);

      // Convert to canvas with high quality
      const canvas = await html2canvas(tempDiv, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        width: 794, // 210mm at 96dpi
        height: 1123, // 297mm at 96dpi
      });

      // Remove temp element
      document.body.removeChild(tempDiv);

      // Create PDF
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const imgData = canvas.toDataURL('image/png');
      pdf.addImage(imgData, 'PNG', 0, 0, 210, 297);

      // Convert to base64 data URL for the PDF viewer
      const pdfDataUrl = pdf.output('datauristring');
      setPdfData(pdfDataUrl);

    } catch (error) {
      console.error('PDF generation error:', error);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleDownloadPdf = () => {
    if (pdfData) {
      // Extract base64 data and create blob
      const base64Data = pdfData.split(',')[1];
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'application/pdf' });
      saveAs(blob, 'resume.pdf');
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

      {/* Resume PDF Preview */}
      {generatedResume && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="text-2xl">📄</div>
            <h3 className="text-xl font-bold text-white">Your Customized Resume is Ready!</h3>
          </div>
          
          {isGeneratingPdf ? (
            <div className="bg-white rounded-3xl p-8 shadow-xl text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
              <p className="text-gray-600 font-medium">
                Generating PDF preview...
              </p>
            </div>
          ) : pdfData ? (
            <PDFViewer 
              pdfData={pdfData}
              onDownloadPdf={handleDownloadPdf}
              onDownloadDocx={handleDownloadDocx}
            />
          ) : null}
          
          {/* Hidden div for PDF generation */}
          <div style={{ position: 'absolute', left: '-9999px', top: '0' }}>
            <div
              ref={resumeRef}
              style={{ 
                width: '210mm',
                minHeight: '297mm',
                padding: '20mm',
                backgroundColor: 'white',
                fontFamily: 'Arial, sans-serif',
                fontSize: '12px',
                lineHeight: '1.4'
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
