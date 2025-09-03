import { NextRequest, NextResponse } from "next/server";
import htmlToDocx from "html-to-docx";

export async function POST(req: NextRequest) {
  try {
    const { html } = await req.json();

    if (!html) {
      return NextResponse.json({ error: "HTML content is missing" }, { status: 400 });
    }

    const fileBuffer = await htmlToDocx(html, undefined, {
      table: { row: { cantSplit: true } },
      footer: true,
      pageNumber: true,
    });

    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": "attachment; filename=resume.docx",
      },
    });
  } catch (error) {
    console.error("Error generating DOCX:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
