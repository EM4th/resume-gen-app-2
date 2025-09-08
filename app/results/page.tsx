"use client";

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import AdSense from '../../components/AdSense';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { saveAs } from 'file-saver';

function ResultsContent() {
  const router = useRouter();
  const [generatedResume, setGeneratedResume] = useState<string>('');
  const [explanation, setExplanation] = useState<string>('');
  const [pdfUrl, setPdfUrl] = useState<string>('');
  const [isGeneratingPdf, setIsGeneratingPdf] = useState<boolean>(false);

  useEffect(() => {
    // Get data from localStorage instead of URL params to avoid URI malformed errors
    const resume = localStorage.getItem('generatedResume');
    const exp = localStorage.getItem('resumeExplanation');
    
    if (resume && exp) {
      setGeneratedResume(resume);
      setExplanation(exp);
      console.log("Resume data loaded from localStorage");
      
      // Generate PDF preview immediately
      generatePdfPreview(resume);
      
      // Clear localStorage after loading to prevent stale data
      localStorage.removeItem('generatedResume');
      localStorage.removeItem('resumeExplanation');
    } else {
      // Redirect back to home if no data
      console.log("No resume data found, redirecting to home");
      router.push('/');
    }
  }, [router]);

  const generatePdfPreview = async (resumeHtml: string) => {
    setIsGeneratingPdf(true);
    try {
      const tempDiv = document.createElement('div');
      // This container holds the HTML and is styled to match the final resume paper size
      tempDiv.style.cssText = `
        position: absolute;
        left: -9999px;
        top: 0;
        width: 8.5in; /* US Letter width */
        background: white;
        box-sizing: border-box;
      `;
      tempDiv.innerHTML = resumeHtml;
      document.body.appendChild(tempDiv);

      // Allow time for content to render fully
      await new Promise(resolve => setTimeout(resolve, 500));

      const canvas = await html2canvas(tempDiv, {
        scale: 2, // Use a high scale for sharp text
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
      });

      // Clean up the temporary div from the DOM
      document.body.removeChild(tempDiv);

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'in',
        format: 'letter' // Standard US Letter size
      });

      const margin = 0.5; // 0.5-inch margin
      const imgWidth = 8.5 - 2 * margin; // Adjust for margins
      const pageHeight = 11 - 2 * margin; // Adjust for margins
      const imgHeight = canvas.height * imgWidth / canvas.width;
      let heightLeft = imgHeight;
      let position = margin;

      // Add the first page with margins
      pdf.addImage(imgData, 'PNG', margin, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      // Loop to add new pages if the content is longer than one page
      while (heightLeft > 0) {
        position = heightLeft - imgHeight + margin;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', margin, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      
      const pdfBlob = pdf.output('blob');
      const url = URL.createObjectURL(pdfBlob);
      setPdfUrl(url);

    } catch (error) {
      console.error('PDF generation failed:', error);
      setPdfUrl('');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!pdfUrl) return;
    const link = document.createElement('a');
    link.href = pdfUrl;
    link.download = 'enhanced-resume.pdf';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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

          {/* Download Actions - Right After Preview */}
          <div className="bg-white rounded-3xl p-6 shadow-xl mb-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4 text-center">📥 Download Your Resume</h3>
            
            {/* Download Options */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <button
                onClick={handleDownloadPdf}
                className="bg-gradient-to-r from-red-500 to-red-600 text-white px-8 py-4 rounded-2xl hover:from-red-600 hover:to-red-700 transition-all font-semibold flex items-center justify-center gap-2 text-lg"
              >
                📄 Download PDF
              </button>
              <button
                onClick={handleDownloadDocx}
                className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-8 py-4 rounded-2xl hover:from-blue-600 hover:to-blue-700 transition-all font-semibold flex items-center justify-center gap-2 text-lg"
              >
                📝 Download Word
              </button>
            </div>
            
            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={handleCreateAnother}
                className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 rounded-2xl hover:from-purple-700 hover:to-blue-700 transition-all font-semibold"
              >
                🚀 Create Another Resume
              </button>
              <button
                onClick={() => window.open('https://www.linkedin.com/jobs/', '_blank')}
                className="bg-gradient-to-r from-green-600 to-teal-600 text-white px-6 py-3 rounded-2xl hover:from-green-700 hover:to-teal-700 transition-all font-semibold"
              >
                🔍 Browse Jobs
              </button>
            </div>
          </div>

          {/* Mid-page Ad */}
          <div className="mb-6">
            <AdSense 
              adSlot="9830843584" 
              adFormat="auto"
              className="text-center"
              style={{ display: 'block', textAlign: 'center', minHeight: '250px' }}
            />
          </div>

          {/* Clean PDF Preview Only */}
          {generatedResume && (
            <div className="space-y-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="text-2xl">📄</div>
                <h3 className="text-xl font-bold text-white">Your Professional Resume</h3>
              </div>
              
              {/* PDF Preview Window - Clean and Simple */}
              <div className="bg-white rounded-3xl p-6 shadow-xl">
                {isGeneratingPdf ? (
                  <div className="flex items-center justify-center py-20">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                      <p className="text-gray-600">Generating your professional resume...</p>
                    </div>
                  </div>
                ) : pdfUrl ? (
                  <div className="w-full">
                    <iframe
                      src={pdfUrl}
                      className="w-full h-[1100px] border-2 border-gray-200 rounded-lg"
                      title="Professional Resume Preview"
                      style={{ 
                        backgroundColor: 'white',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                      }}
                    />
                  </div>
                ) : (
                  <div className="flex items-center justify-center py-20 bg-gray-50 rounded-lg">
                    <div className="text-center">
                      <div className="text-4xl mb-4">📄</div>
                      <p className="text-gray-600 text-lg">Your resume is being processed...</p>
                      <p className="text-gray-500 text-sm mt-2">PDF preview will appear here shortly</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Final Ad */}
          <div className="mb-6">
            <AdSense 
              adSlot="9876543210" 
              adFormat="auto"
              className="text-center"
              style={{ display: 'block', textAlign: 'center', minHeight: '300px' }}
            />
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

export default function ResultsPage() {
  return <ResultsContent />;
}
