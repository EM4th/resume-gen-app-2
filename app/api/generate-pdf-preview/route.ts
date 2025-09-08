import { NextRequest, NextResponse } from 'next/server';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export async function POST(request: NextRequest) {
  try {
    const { htmlContent } = await request.json();

    if (!htmlContent) {
      return NextResponse.json(
        { error: 'HTML content is required' },
        { status: 400 }
      );
    }

    // Create a temporary DOM element to render the HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlContent;
    tempDiv.style.width = '8.5in';
    tempDiv.style.minHeight = '11in';
    tempDiv.style.padding = '0.5in';
    tempDiv.style.backgroundColor = 'white';
    tempDiv.style.fontFamily = 'Arial, sans-serif';
    tempDiv.style.fontSize = '12px';
    tempDiv.style.lineHeight = '1.4';
    tempDiv.style.position = 'absolute';
    tempDiv.style.left = '-9999px';
    
    document.body.appendChild(tempDiv);

    // Convert to canvas
    const canvas = await html2canvas(tempDiv, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      width: 816, // 8.5in at 96dpi
      height: 1056, // 11in at 96dpi
    });

    // Remove temp element
    document.body.removeChild(tempDiv);

    // Create PDF
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'in',
      format: 'letter'
    });

    const imgData = canvas.toDataURL('image/png');
    pdf.addImage(imgData, 'PNG', 0, 0, 8.5, 11);

    // Return PDF as base64
    const pdfBase64 = pdf.output('datauristring');
    
    return NextResponse.json({ pdfData: pdfBase64 });

  } catch (error) {
    console.error('PDF generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate PDF preview' },
      { status: 500 }
    );
  }
}
