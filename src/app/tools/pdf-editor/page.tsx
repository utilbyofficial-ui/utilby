import type { Metadata } from "next";
import { ToolLayout } from "@/components/shared/ToolLayout";
import { PdfEditorTool } from "@/modules/pdf-editor/PdfEditorTool";

export const metadata: Metadata = {
  title: "PDF Editor – Edit, Annotate & Sign PDFs Online | Utilby",
  description:
    "Edit supported PDF text, add text and images, draw, highlight, sign, and visually cover selected areas. Files are processed in your browser. Up to 100 MB and 500 pages.",
  keywords: [
    "pdf editor",
    "edit pdf online",
    "free pdf editor",
    "sign pdf online",
    "add text to pdf",
    "pdf whiteout",
    "pdf highlighter",
    "fill and sign pdf",
    "annotate pdf free",
    "no watermark pdf editor",
  ],
  alternates: {
    canonical: "/tools/pdf-editor",
  },
  openGraph: {
    title: "PDF Editor – Edit, Sign & Annotate PDFs | Utilby",
    description: "Edit supported text, add content, sign, draw, highlight, and visually cover areas in your PDF. Process files in your browser.",
    url: "https://utilby.com/tools/pdf-editor",
    type: "website",
    images: [{ url: "https://utilby.com/og/tools/pdf-editor.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    images: ["https://utilby.com/og/tools/pdf-editor.png"],
  },
};

export default function PdfEditorPage() {
  const howToSteps = [
    {
      step: "1",
      title: "Upload Your PDF Document",
      description: "Choose a PDF up to 100 MB and 500 pages. Scanned pages may be images, so their text cannot be edited as regular text.",
    },
    {
      step: "2",
      title: "Select an Editing Tool",
      description: "Edit supported text, add text or images, move elements, draw, highlight, add shapes, or place a signature.",
    },
    {
      step: "3",
      title: "Make changes and review them",
      description: "Use Compare to review the edited page beside the original. Whiteout visually covers an area but is not a guaranteed secure redaction method.",
    },
    {
      step: "4",
      title: "Download Edited PDF",
      description: "Download the edited PDF, then open the saved file and check that the result looks right before sharing it.",
    },
  ];

  const technicalDetails = {
    title: "What this PDF editor can change",
    content: (
      <>
        <p>
          Your PDF is processed in this browser session. The editor can change supported selectable text and add new text, images, drawings, highlights, shapes, and signatures. Scanned text is part of an image and cannot be rewritten as ordinary text here.
        </p>
        <p>
          <strong>Review edits:</strong> Use Compare and the Changes list to inspect additions, edits, moved items, and approximate background repairs before downloading.
        </p>
        <p>
          <strong>Whiteout is a visual cover.</strong> The editor attempts to remove selectable text beneath the covered area, but it cannot guarantee that every image, outlined character, or other PDF layer is removed. Do not rely on Whiteout to securely redact confidential information.
        </p>
      </>
    ),
  };

  const faqs = [
    {
      question: "Are my documents uploaded to any remote server?",
      answer:
        "The PDF content is processed in your browser and is not uploaded to Utilby. The editor does not send the document to a remote processing server.",
    },
    {
      question: "Can I edit any text in a PDF?",
      answer:
        "You can edit supported selectable text. Text in scanned pages is part of an image and cannot be rewritten here. Font, layout, or background details may also differ, so compare the result with the original.",
    },
    {
      question: "Does Whiteout securely redact private information?",
      answer:
        "Whiteout covers an area visually and attempts to remove selectable text beneath it. It cannot guarantee removal of every image, outlined character, or PDF layer, so do not use it as a secure redaction method for confidential information.",
    },
    {
      question: "Can I add a signature?",
      answer:
        "You can draw or type a signature mark and position it on the page. Whether that mark counts as a legally valid electronic signature depends on the document and the rules that apply to it.",
    },
    {
      question: "Is there a limit on file size or number of pages?",
      answer:
        "This editor supports PDFs up to 100 MB and 500 pages. Large or complex files may also need more memory and processing time on your device.",
    },
    {
      question: "Does this PDF Editor leave a watermark on exported files?",
      answer:
        "No. Utilby does not add a watermark to the exported PDF. Open the saved file and review it before sharing it.",
    },
  ];

  return (
    <ToolLayout
      toolId="pdf-editor"
      title="PDF Editor"
      subtitle="Edit supported PDF text, add text and images, draw, highlight, sign, or visually cover an area. Your PDF is processed in your browser."
      category="PDF Tools"
      categorySlug="pdf"
      howToSteps={howToSteps}
      technicalDetails={technicalDetails}
      faqs={faqs}
    >
      <PdfEditorTool />
    </ToolLayout>
  );
}
