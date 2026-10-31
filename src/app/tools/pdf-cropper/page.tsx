import type { Metadata } from "next";
import { ToolLayout } from "@/components/shared/ToolLayout";
import { PdfCropperTool } from "@/modules/pdf-cropper/PdfCropperTool";

export const metadata: Metadata = {
  title: "PDF Cropper – Trim Page Margins Online Free | Utilby",
  description:
    "Crop PDF page margins with a live preview. Set top, bottom, left, and right margins, apply to one page or all pages, and keep vector text sharp. Private in-browser PDF cropping.",
  keywords: [
    "pdf cropper",
    "crop PDF pages",
    "trim PDF margins",
    "crop PDF online free",
    "remove white space from PDF",
    "crop PDF page size",
    "PDF margin cutter",
  ],
  alternates: { canonical: "/tools/pdf-cropper" },
  openGraph: {
    title: "PDF Cropper – Trim Page Margins Privately | Utilby",
    description: "Preview page margins, crop one page or the whole PDF, and save without re-rendering its text or images.",
    url: "https://utilby.com/tools/pdf-cropper",
    type: "website",
    images: [{ url: "https://utilby.com/og/tools/pdf-cropper.png", width: 1200, height: 630 }],
  },
  twitter: { card: "summary_large_image", images: ["https://utilby.com/og/tools/pdf-cropper.png"] },
};

export default function PdfCropperPage() {
  const howToSteps = [
    {
      step: "1",
      title: "Choose a PDF",
      description: "Open a PDF with up to 300 pages. It is read in your browser and never uploaded.",
    },
    {
      step: "2",
      title: "Set the crop margins",
      description: "Enter how many millimeters to trim from each edge. The preview shows the remaining page area.",
    },
    {
      step: "3",
      title: "Choose which pages to crop",
      description: "Apply the same margins to every page or crop only the page currently shown in the preview.",
    },
    {
      step: "4",
      title: "Download the cropped PDF",
      description: "Save a new PDF copy. Text and vector graphics remain sharp, and your original file stays unchanged.",
    },
  ];

  const technicalDetails = {
    title: "Crop margins without reducing quality",
    content: (
      <>
        <p>
          The crop is saved as a PDF page boundary. Pages are not flattened into images, so searchable text, vector graphics, and embedded images keep their original quality.
        </p>
        <p>
          <strong>Important:</strong> Cropping hides content outside the new visible page boundary; it does not erase that content from the PDF. Someone may be able to restore the original page area. Use a proper redaction tool when sensitive text or images must be permanently removed.
        </p>
        <p>
          Your source PDF stays on your device. The tool creates a separate cropped download and never changes the original file.
        </p>
      </>
    ),
  };

  const faqs = [
    {
      question: "Does this crop every page the same way?",
      answer: "You can apply the entered top, right, bottom, and left margins to every page, or crop only the page shown in the preview.",
    },
    {
      question: "Will cropping make text or images blurry?",
      answer: "No. The tool changes the PDF page boundary without turning the page into an image. Text and vector artwork remain sharp.",
    },
    {
      question: "Does cropping permanently delete the parts outside the page?",
      answer: "No. It changes what is visible; the original content can still remain in the PDF and may be restored. Cropping is not a secure way to remove private information.",
    },
    {
      question: "Are my PDF files uploaded?",
      answer: "No. The PDF is processed in your browser and stays on your device.",
    },
    {
      question: "Can I undo the crop?",
      answer: "Your original file is never changed. Keep it and open it again if you want to choose different margins.",
    },
  ];

  return (
    <ToolLayout
      toolId="pdf-cropper"
      title="PDF Cropper"
      subtitle="Trim extra page margins with a live preview. Crop one page or all pages while keeping text and images sharp."
      category="PDF Tools"
      categorySlug="pdf"
      howToSteps={howToSteps}
      technicalDetails={technicalDetails}
      faqs={faqs}
    >
      <PdfCropperTool />
    </ToolLayout>
  );
}
