import { NextRequest, NextResponse } from "next/server";
import mammoth from "mammoth";
import { extractText } from "unpdf";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const fileName = file.name.toLowerCase();
    const arrayBuffer = await file.arrayBuffer();

    let extractedText = "";

    if (fileName.endsWith(".pdf")) {
      // Extract text from PDF using unpdf
      const { text } = await extractText(new Uint8Array(arrayBuffer));
      extractedText = Array.isArray(text) ? text.join('\n') : text;
    } else if (fileName.endsWith(".docx")) {
      // Extract text from Word document
      const buffer = Buffer.from(arrayBuffer);
      const result = await mammoth.extractRawText({ buffer });
      extractedText = result.value;
    } else if (fileName.endsWith(".doc")) {
      return NextResponse.json(
        { error: "Legacy .doc format is not supported. Please convert to .docx or PDF." },
        { status: 400 }
      );
    } else {
      return NextResponse.json(
        { error: "Unsupported file format. Please upload a PDF or Word document (.docx)." },
        { status: 400 }
      );
    }

    // Clean up the extracted text
    extractedText = extractedText
      .replace(/\s+/g, " ")
      .replace(/\n\s*\n/g, "\n\n")
      .trim();

    if (!extractedText) {
      return NextResponse.json(
        { error: "Could not extract text from the file. The file may be empty or corrupted." },
        { status: 400 }
      );
    }

    return NextResponse.json({ text: extractedText });
  } catch (error) {
    console.error("Error extracting text:", error);
    return NextResponse.json(
      { error: "Failed to extract text from file", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
