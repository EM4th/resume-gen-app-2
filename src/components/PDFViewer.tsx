"use client";

import { useState, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';

// Set up PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

interface PDFViewerProps {
  pdfData: string; // base64 PDF data
  onDownloadPdf: () => void;
  onDownloadDocx: () => void;
}

export default function PDFViewer({ pdfData, onDownloadPdf, onDownloadDocx }: PDFViewerProps) {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(0.8);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
  };

  const goToPrevPage = () => {
    setPageNumber(prev => Math.max(1, prev - 1));
  };

  const goToNextPage = () => {
    setPageNumber(prev => Math.min(numPages || 1, prev + 1));
  };

  const zoomIn = () => {
    setScale(prev => Math.min(2.0, prev + 0.1));
  };

  const zoomOut = () => {
    setScale(prev => Math.max(0.3, prev - 0.1));
  };

  return (
    <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
      {/* PDF Toolbar */}
      <div className="bg-gray-800 text-white px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <button 
              onClick={goToPrevPage} 
              disabled={pageNumber <= 1}
              className="p-1 rounded hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ←
            </button>
            <span className="text-sm">
              {pageNumber} / {numPages || '?'}
            </span>
            <button 
              onClick={goToNextPage}
              disabled={pageNumber >= (numPages || 1)}
              className="p-1 rounded hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              →
            </button>
          </div>
          
          <div className="h-4 w-px bg-gray-600"></div>
          
          <div className="flex items-center space-x-2">
            <button 
              onClick={zoomOut}
              className="p-1 rounded hover:bg-gray-700"
            >
              −
            </button>
            <span className="text-sm min-w-[50px] text-center">
              {Math.round(scale * 100)}%
            </span>
            <button 
              onClick={zoomIn}
              className="p-1 rounded hover:bg-gray-700"
            >
              +
            </button>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={onDownloadPdf}
            className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm font-medium transition-colors"
          >
            📄 PDF
          </button>
          <button
            onClick={onDownloadDocx}
            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm font-medium transition-colors"
          >
            📝 Word
          </button>
        </div>
      </div>

      {/* PDF Viewer */}
      <div className="bg-gray-100 p-4 max-h-[600px] overflow-auto flex justify-center">
        <Document
          file={pdfData}
          onLoadSuccess={onDocumentLoadSuccess}
          loading={
            <div className="flex items-center justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-800"></div>
              <span className="ml-2 text-gray-600">Loading PDF...</span>
            </div>
          }
          error={
            <div className="text-center p-8 text-red-600">
              Failed to load PDF preview
            </div>
          }
        >
          <Page
            pageNumber={pageNumber}
            scale={scale}
            renderTextLayer={true}
            renderAnnotationLayer={true}
          />
        </Document>
      </div>
    </div>
  );
}
