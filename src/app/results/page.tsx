"use client";

import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import AdSense from '../../components/AdSense';
import PDFViewer from '../../components/PDFViewer';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { saveAs } from 'file-saver';

export default function ResultsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [generatedResume, setGeneratedResume] = useState<string>('');
  const [explanation, setExplanation] = useState<string>('');
  const [pdfData, setPdfData] = useState<string | null>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  useEffect(() => {
    // Get data from URL params (you'll pass this when redirecting)
    const resume = searchParams.get('resume');
    const exp = searchParams.get('explanation');
    
    if (resume && exp) {
      setGeneratedResume(decodeURIComponent(resume));
      setExplanation(decodeURIComponent(exp));
    } else {
      // Redirect back to home if no data
      router.push('/');
    }
  }, [searchParams, router]);

  // Generate PDF when resume content is available
  useEffect(() => {
    if (generatedResume && !pdfData && !isGeneratingPdf) {
      generatePdfPreview();
    }
  }, [generatedResume, pdfData, isGeneratingPdf]);

  const generatePdfPreview = async () => {
    if (!generatedResume) return;
    
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
      saveAs(blob, 'enhanced-resume.pdf');
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
        saveAs(blob, "enhanced-resume.docx");
      } else {
        alert("Error generating .docx file.");
      }
    }
  };

  const handleCreateAnother = () => {
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-800">
      <div className="container mx-auto p-4">
        <div className="max-w-4xl mx-auto">
          
          {/* Header Ad */}
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

          {/* Back Button */}
          <div className="mb-6">
            <button
              onClick={handleCreateAnother}
              className="bg-white/10 backdrop-blur-lg text-white px-6 py-3 rounded-2xl hover:bg-white/20 transition-all border border-white/20"
            >
              ← Create Another Resume
            </button>
          </div>

          {/* AI Explanation Card */}
          {explanation && (
            <div className="bg-white rounded-3xl p-6 shadow-xl mb-6">
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

          {/* Mid-page Ad */}
          <div className="mb-6">
            <AdSense 
              adSlot="9830843584" 
              adFormat="auto"
              className="text-center"
              style={{ display: 'block', textAlign: 'center', minHeight: '250px' }}
            />
          </div>

          {/* Resume Preview */}
          {generatedResume && (
            <div className="space-y-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="text-2xl">📄</div>
                <h3 className="text-xl font-bold text-white">Your Enhanced Resume is Ready!</h3>
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
            </div>
          )}

          {/* Results Page Ad - This will be a fourth ad unit */}
          <div className="mb-6">
            <AdSense 
              adSlot="9876543210" 
              adFormat="auto"
              className="text-center"
              style={{ display: 'block', textAlign: 'center', minHeight: '300px' }}
            />
          </div>

          {/* Action Buttons */}
          <div className="bg-white rounded-3xl p-6 shadow-xl mb-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">What's Next?</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={handleCreateAnother}
                className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-4 rounded-2xl hover:from-purple-700 hover:to-blue-700 transition-all font-semibold"
              >
                🚀 Create Another Resume
              </button>
              <button
                onClick={() => window.open('https://www.linkedin.com/jobs/', '_blank')}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-4 rounded-2xl hover:from-blue-700 hover:to-indigo-700 transition-all font-semibold"
              >
                💼 Find Jobs on LinkedIn
              </button>
            </div>
          </div>

          {/* Footer Ad */}
          <div className="mb-6">
            <AdSense 
              adSlot="5211311414" 
              adFormat="auto"
              className="text-center"
              style={{ display: 'block', textAlign: 'center', minHeight: '100px' }}
            />
          </div>

          {/* Footer */}
          <div className="text-center">
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
  );
}
