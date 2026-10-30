import type { Metadata } from "next";
import { ToolLayout } from "@/components/shared/ToolLayout";
import { PdfOcrTool } from "@/modules/pdf-ocr/PdfOcrTool";

export const metadata: Metadata = {
  title: "PDF OCR – Extract Bengali & English Text from Scanned PDFs | Utilby",
  description:
    "Recognize Bengali and English text in scanned PDFs. Copy or download extracted text, or create a searchable PDF privately in your browser.",
  keywords: [
    "pdf ocr",
    "Bengali OCR PDF",
    "Bangla PDF text extractor",
    "English OCR PDF",
    "searchable PDF maker",
    "extract text from scanned PDF",
    "PDF to text",
    "OCR Bengali online",
  ],
  alternates: { canonical: "/tools/pdf-ocr" },
  openGraph: {
    title: "PDF OCR – Bengali & English Text Extraction | Utilby",
    description: "Extract text from scanned PDFs and make them searchable. Your PDF stays in your browser.",
    url: "https://utilby.com/tools/pdf-ocr",
    type: "website",
    images: [{ url: "https://utilby.com/og/tools/pdf-ocr.png", width: 1200, height: 630 }],
  },
  twitter: { card: "summary_large_image", images: ["https://utilby.com/og/tools/pdf-ocr.png"] },
};

export default function PdfOcrPage() {
  const howToSteps = [
    {
      step: "1",
      title: "Choose a scanned PDF",
      description: "Select a PDF with up to 100 pages. The document is opened in your browser and never uploaded.",
    },
    {
      step: "2",
      title: "Select the text language",
      description: "Choose Bengali, English, or both for a mixed-language document.",
    },
    {
      step: "3",
      title: "Extract the text",
      description: "Pages are processed one at a time. Follow progress and review the recognized text page by page.",
    },
    {
      step: "4",
      title: "Copy or download",
      description: "Copy the result, download a .txt file, or create a searchable PDF copy with an invisible text layer.",
    },
  ];

  const technicalDetails = {
    title: "Private OCR for Bengali and English PDFs",
    content: (
      <>
        <p>
          This tool uses OCR to read text from scanned pages that are stored as images. It can also extract text already present in a regular PDF. The PDF is processed in your browser; only the OCR engine and language data are included as site assets.
        </p>
        <p>
          <strong>Searchable PDF:</strong> When you download a searchable copy, an invisible Unicode text layer is placed over OCR-read words. The original page artwork remains in the PDF, while the text can be found and selected in compatible PDF readers.
        </p>
        <p>
          Recognition depends on scan sharpness, contrast, page angle, and the language chosen. Review important details such as names, dates, and account numbers against the original scan.
        </p>
        <p>
          <strong>Large files:</strong> Pages are rendered sequentially with a pixel limit to control memory use. PDFs with more than 100 pages or over 100 MB need to be split or reduced first.
        </p>
      </>
    ),
  };

  const faqs = [
    {
      question: "Does the PDF leave my device?",
      answer: "No. The document stays in your browser. The OCR worker and Bengali or English language models are served by Utilby, but your PDF pages are not sent to a server.",
    },
    {
      question: "Can it read Bengali and English together?",
      answer: "Yes. Choose Bengali + English for mixed-language pages. You can also select either language on its own.",
    },
    {
      question: "Will OCR always be exact?",
      answer: "No OCR can guarantee a perfect reading. Clear, upright scans usually work best. Check names, numbers, and other important details against the original PDF.",
    },
    {
      question: "What is the searchable PDF option?",
      answer: "It creates a copy of the PDF with an invisible text layer over recognized words, so you can search and select text while keeping the original page image visible.",
    },
    {
      question: "Why does the first run take longer?",
      answer: "The browser loads the OCR engine and selected language data the first time. The browser can cache these files for later use; processing time also depends on your device and PDF size.",
    },
  ];

  return (
    <ToolLayout
      toolId="pdf-ocr"
      title="PDF OCR"
      subtitle="Extract Bengali or English text from scanned PDFs. Copy it, download a text file, or make a searchable PDF — all in your browser."
      category="PDF Tools"
      categorySlug="pdf"
      howToSteps={howToSteps}
      technicalDetails={technicalDetails}
      faqs={faqs}
    >
      <PdfOcrTool />
    </ToolLayout>
  );
}
