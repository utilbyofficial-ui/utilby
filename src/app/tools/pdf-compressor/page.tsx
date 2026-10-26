import type { Metadata } from "next";
import { ToolLayout } from "@/components/shared/ToolLayout";
import { PdfCompressorTool } from "@/modules/pdf-compressor/PdfCompressorTool";

export const metadata: Metadata = {
  title: "PDF Compressor – Reduce PDF File Size Online Free | Utilby",
  description:
    "Compress PDF files in your browser. Reduce embedded JPEG image sizes and remove repeated streams while keeping text and vector graphics sharp. Private, with no upload.",
  keywords: [
    "pdf compressor",
    "compress pdf online",
    "reduce pdf file size",
    "shrink pdf",
    "optimize pdf",
    "compress pdf without upload",
    "free pdf size reducer",
  ],
  alternates: { canonical: "/tools/pdf-compressor" },
  openGraph: {
    title: "Free PDF Compressor – Reduce File Size Privately | Utilby",
    description: "Optimize PDF images and repeated streams right in your browser. Your files stay on your device.",
    url: "https://utilby.com/tools/pdf-compressor",
    type: "website",
    images: [{ url: "https://utilby.com/og/tools/pdf-compressor.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    images: ["https://utilby.com/og/tools/pdf-compressor.png"],
  },
};

export default function PdfCompressorPage() {
  const howToSteps = [
    {
      step: "1",
      title: "Choose a PDF",
      description: "Drop a PDF into the workspace or browse your device. Files up to 100 MB are processed locally.",
    },
    {
      step: "2",
      title: "Pick a compression level",
      description: "Recommended balances quality and size. Strong and Maximum use lower image quality and smaller dimensions.",
    },
    {
      step: "3",
      title: "Compress the file",
      description: "The tool reduces supported embedded JPEG images, removes repeated PDF streams, and keeps vector text as vector content.",
    },
    {
      step: "4",
      title: "Download your PDF",
      description: "Compare the original and new file sizes, then download the compressed PDF to your device.",
    },
  ];

  const technicalDetails = {
    title: "How PDF compression works",
    content: (
      <>
        <p>
          The PDF is opened and optimized on your device. Supported JPEG image streams can be resized and re-encoded at the quality level you choose. Identical PDF streams are shared to avoid storing the same content more than once.
        </p>
        <p>
          <strong>Text and vector graphics:</strong> Pages are not rasterized. Text, paths, and other vector content remain PDF objects, so they stay sharp when zoomed or printed.
        </p>
        <p>
          PDFs can contain several image formats and color profiles. When an image cannot be safely recompressed, the tool keeps it as it is. Already optimized files may not become smaller.
        </p>
        <p>
          <strong>Privacy:</strong> Your PDF is processed in this browser session and is never uploaded to a server.
        </p>
      </>
    ),
  };

  const faqs = [
    {
      question: "Are my PDF files uploaded?",
      answer: "No. The PDF is processed in your browser and stays on your device.",
    },
    {
      question: "Will this make every PDF smaller?",
      answer: "Not always. PDFs that already use compressed images or mostly vector content may not shrink. In that case, the original file is kept for download.",
    },
    {
      question: "Does compression make text blurry?",
      answer: "No. The pages are not flattened into images. Text and vector graphics remain vector content; the selected quality setting applies to supported JPEG images.",
    },
    {
      question: "What do the compression levels change?",
      answer: "Recommended keeps more image detail, Strong aims for smaller files, and Maximum uses the smallest image dimensions and lowest JPEG quality. Some PDFs may contain image formats that are left unchanged for safety.",
    },
    {
      question: "Can I compress a password-protected PDF?",
      answer: "No. Unlock the PDF first, then select the unlocked copy to compress it.",
    },
  ];

  return (
    <ToolLayout
      toolId="pdf-compressor"
      title="PDF Compressor"
      subtitle="Reduce PDF file size in your browser. Optimize supported embedded images while keeping text and vector graphics sharp — no upload required."
      category="PDF Tools"
      categorySlug="pdf"
      howToSteps={howToSteps}
      technicalDetails={technicalDetails}
      faqs={faqs}
    >
      <PdfCompressorTool />
    </ToolLayout>
  );
}
