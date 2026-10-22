import type { Metadata } from "next";
import { ToolLayout } from "@/components/shared/ToolLayout";
import { PdfToJpgTool } from "@/modules/pdf-to-jpg/PdfToJpgTool";

export const metadata: Metadata = {
  title: "PDF to JPG – Convert PDF Pages to Images Online Free | Utilby",
  description:
    "Convert PDF pages into high-resolution JPG or PNG images directly in your browser. Choose 72, 150, or 300 DPI print quality. Download individual pages or all as a ZIP. 100% free and private.",
  keywords: [
    "pdf to jpg",
    "convert pdf to jpg",
    "pdf to png",
    "pdf to image converter",
    "extract images from pdf",
    "save pdf as jpg",
    "pdf to high resolution jpg",
    "free pdf to jpg",
  ],
  alternates: {
    canonical: "/tools/pdf-to-jpg",
  },
  openGraph: {
    title: "PDF to JPG Converter – High-Resolution Images Free | Utilby",
    description: "Convert PDF pages to JPG or PNG with print-ready 300 DPI quality. 100% private in-browser conversion.",
    url: "https://utilby.com/tools/pdf-to-jpg",
    type: "website",
    images: [{ url: "https://utilby.com/og/tools/pdf-to-jpg.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    images: ["https://utilby.com/og/tools/pdf-to-jpg.png"],
  },
};

export default function PdfToJpgPage() {
  const howToSteps = [
    {
      step: "1",
      title: "Select Your PDF",
      description: "Drop your PDF document into the box or browse from your device. Files up to 200 MB are supported.",
    },
    {
      step: "2",
      title: "Choose Format & Quality",
      description: "Pick JPG for smaller file sizes or PNG for lossless sharpness. Select Standard (72 DPI), High (150 DPI), or Ultra (300 DPI).",
    },
    {
      step: "3",
      title: "Select Pages",
      description: "Convert all pages at once, or click individual page thumbnails to extract only the specific pages you need.",
    },
    {
      step: "4",
      title: "Download Images",
      description: "Download any page with 1 click, or click 'Convert & Download ZIP' to save all pages packaged together.",
    },
  ];

  const technicalDetails = {
    title: "Client-Side Vector to Raster Rendering",
    content: (
      <>
        <p>
          Unlike traditional online converters that upload your confidential documents to a remote server, Utilby renders
          PDF pages locally using PDF.js and the HTML5 Canvas API inside your browser.
        </p>
        <p>
          <strong>DPI resolution control:</strong> Standard computer screens render at 72 DPI. For crisp reading, our
          150 DPI mode doubles the pixel density. For professional printing or legal archiving, our 300 DPI mode renders
          ultra-sharp, high-definition images that preserve every font serif and vector curve.
        </p>
        <p>
          <strong>Memory management:</strong> Pages are rendered sequentially to prevent browser memory exhaustion even
          on large documents with hundreds of pages.
        </p>
        <p>
          <strong>Zero server uploads:</strong> Your sensitive financial reports, legal agreements, and personal PDFs never
          leave your machine, ensuring 100% compliance with privacy standards.
        </p>
      </>
    ),
  };

  const faqs = [
    {
      question: "Are my PDF files uploaded to your server?",
      answer:
        "No. Every single step of the conversion happens entirely on your device inside your web browser. Your PDF is never sent to our servers or stored anywhere.",
    },
    {
      question: "Is there a limit on how many pages or PDFs I can convert?",
      answer:
        "No. Unlike other websites that limit free users to 2 or 3 pages and charge monthly subscriptions, Utilby is 100% free and unlimited. You can convert documents with as many pages as you want.",
    },
    {
      question: "What is the difference between JPG and PNG?",
      answer:
        "JPG is best for documents with photos or complex graphics because it provides much smaller file sizes with great visual clarity. PNG is lossless and produces the absolute highest quality, ideal for text-heavy documents, charts, and blueprints.",
    },
    {
      question: "What resolution should I choose?",
      answer:
        "Use 72 DPI for web sharing, emails, or chat apps. Use 150 DPI for presentations and crystal-clear reading on Retina/4K displays. Use 300 DPI if you plan to print the images or need maximum archival detail.",
    },
    {
      question: "Can I extract only one page from my PDF?",
      answer:
        "Yes! Every page preview has its own individual download button. Simply click the download icon on the page you want, and it will save instantly without having to convert the entire file.",
    },
  ];

  return (
    <ToolLayout
      toolId="pdf-to-jpg"
      title="PDF to JPG"
      subtitle="Convert PDF pages into high-resolution JPG or PNG images. Choose custom DPI, download individual pages, or save all pages as a ZIP."
      category="PDF Tools"
      categorySlug="pdf"
      howToSteps={howToSteps}
      technicalDetails={technicalDetails}
      faqs={faqs}
    >
      <PdfToJpgTool />
    </ToolLayout>
  );
}
