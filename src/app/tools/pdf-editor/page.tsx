import type { Metadata } from "next";
import { ToolLayout } from "@/components/shared/ToolLayout";
import { PdfEditorTool } from "@/modules/pdf-editor/PdfEditorTool";

export const metadata: Metadata = {
  title: "PDF Editor – Edit PDF Online Free, Add Text & Sign | Utilby",
  description:
    "Free online PDF Editor: edit text, draw freehand, add signatures, highlight text, whiteout sensitive details, and insert images or shapes directly in your browser. 100% private, no server upload.",
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
    title: "PDF Editor – Edit, Sign & Annotate PDF Documents Free | Utilby",
    description: "Add text, draw, sign, highlight, redact with whiteout, and insert shapes into any PDF directly in your browser. 100% free and client-side private.",
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
      description: "Drag and drop any PDF file into the editor, or click 'Select PDF File' to browse from your device. Files up to 100 MB are supported.",
    },
    {
      step: "2",
      title: "Select an Editing Tool",
      description: "Choose from the top toolbar: Add Text, Freehand Pen, Highlighter, Whiteout Redaction, Shapes (Rectangle, Circle), or Signatures.",
    },
    {
      step: "3",
      title: "Annotate, Sign or Redact",
      description: "Click and place text boxes, draw signatures with mouse or stylus, black out or white out sensitive information, and customize fonts and colors.",
    },
    {
      step: "4",
      title: "Download Edited PDF",
      description: "Click 'Download PDF' to bake all annotations, text, and signatures into a clean, professional vector PDF file instantly.",
    },
  ];

  const technicalDetails = {
    title: "100% Client-Side Vector PDF Burning Engine",
    content: (
      <>
        <p>
          Most online PDF editors require you to upload your sensitive contracts, tax forms, and IDs to remote cloud servers.
          Utilby operates on a zero-upload architecture: the entire editing, rendering, and vector modification pipeline runs directly in your browser using WebAssembly and Web Standards.
        </p>
        <p>
          <strong>Vector Font and Element Embedding:</strong> When you add text or drawings, our engine denormalizes coordinate systems from DOM space to PDF vector coordinate space and embeds standard PostScript fonts (Helvetica, Times, Courier) or rasterized vector streams via <code>pdf-lib</code>.
        </p>
        <p>
          <strong>Real Whiteout & Redaction:</strong> Our whiteout tool writes pure opaque vector color rectangles over the document layer, ensuring clean redaction without degrading the underlying vector text of the rest of your document.
        </p>
        <p>
          <strong>Cross-Device Responsive Normalization:</strong> All annotations are stored as resolution-independent normalized percentages (0.0 to 1.0). Whether you view the PDF at 100% zoom, 250% zoom, on a high-DPI Retina display, or on a smartphone, annotations stay perfectly aligned to the exact PDF coordinates.
        </p>
      </>
    ),
  };

  const faqs = [
    {
      question: "Are my documents uploaded to any remote server?",
      answer:
        "Never. All PDF rendering, text editing, signature stamping, and document generation occur 100% locally on your computer or phone using your browser's internal engine. Your sensitive files never leave your machine.",
    },
    {
      question: "Can I add legal signatures to contracts with this tool?",
      answer:
        "Yes! You can draw your signature using a mouse, trackpad, or touch screen, or type your name to generate a clean cursive signature stamp. You can drag and position it anywhere on signature lines.",
    },
    {
      question: "How do I whiteout or hide sensitive numbers or private details?",
      answer:
        "Select the 'Whiteout' tool from the toolbar and drag a box across the sensitive text, account numbers, or details you want to conceal. The editor renders a clean white opaque block over that area.",
    },
    {
      question: "Is there a limit on file size or number of pages?",
      answer:
        "Utilby is completely free with no artificial page limits or daily quotas. You can edit multi-page documents seamlessly.",
    },
    {
      question: "Does this PDF Editor leave a watermark on exported files?",
      answer:
        "No. Utilby never adds watermarks, stamps, or promotional logos to your edited PDFs. The downloaded file is 100% clean and ready for professional, business, or legal use.",
    },
  ];

  return (
    <ToolLayout
      toolId="pdf-editor"
      title="PDF Editor"
      subtitle="Edit PDF documents online for free. Add text, draw, sign, highlight, whiteout sensitive data, and insert images with zero server uploads."
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
