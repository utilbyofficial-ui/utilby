import type { Metadata } from "next";
import { ToolLayout } from "@/components/shared/ToolLayout";
import { WatermarkRemoverTool } from "@/modules/watermark-remover/WatermarkRemoverTool";

export const metadata: Metadata = {
  title: "Watermark Remover – Edit Images at Full Size | Utilby",
  description:
    "Remove small marks from images with a smart fill or clone brush. Keep original pixel dimensions and export as lossless PNG. Images stay in your browser.",
  keywords: [
    "watermark remover",
    "remove watermark from image",
    "photo watermark eraser",
    "image clone stamp",
    "remove logo from photo",
    "browser watermark remover",
  ],
  alternates: { canonical: "/tools/watermark-remover" },
  openGraph: {
    title: "Watermark Remover – Full-Size PNG Export | Utilby",
    description: "Brush over a small mark, fill it from nearby pixels or copy clean texture. Private, full-size PNG export.",
    url: "https://utilby.com/tools/watermark-remover",
    type: "website",
    images: [{ url: "https://utilby.com/og/tools/watermark-remover.png", width: 1200, height: 630 }],
  },
  twitter: { card: "summary_large_image", images: ["https://utilby.com/og/tools/watermark-remover.png"] },
};

export default function WatermarkRemoverPage() {
  const howToSteps = [
    {
      step: "1",
      title: "Choose an Image",
      description: "Open a JPG, PNG, WebP, or BMP file up to 50 MB and 24 megapixels. It is decoded and processed on your device.",
    },
    {
      step: "2",
      title: "Mark the Area",
      description: "Adjust the brush and paint over a small watermark. The red overlay shows the pixels that will be changed.",
    },
    {
      step: "3",
      title: "Fill or Clone",
      description: "Smart fill works best on smooth backgrounds. For fabric, grass, or detailed texture, pick a clean source area and use the Clone brush.",
    },
    {
      step: "4",
      title: "Compare and Save",
      description: "Compare with the original, undo or redo edits, then save a lossless PNG at the same pixel dimensions as the source.",
    },
  ];

  const technicalDetails = {
    title: "Full-Resolution Editing, Processed in Your Browser",
    content: (
      <>
        <p>
          The photo is processed locally in your browser. It is not uploaded to Utilby. The preview may be scaled down to keep the editor responsive, while brush strokes map back to the full-resolution image.
        </p>
        <p>
          <strong>Smart fill:</strong> Selected pixels are reconstructed from nearby unmarked pixels. This can look natural on small marks over simple backgrounds, but may blur detailed patterns. Use the Clone brush to copy a suitable clean area when texture matters.
        </p>
        <p>
          <strong>Image quality:</strong> The PNG download keeps the original pixel dimensions and avoids another lossy JPEG or WebP encoding step. Unselected decoded pixels remain unchanged. PNG can be larger than the source, and camera metadata such as EXIF is not retained.
        </p>
        <p>
          This tool is designed for images you own or have permission to edit. Large marks, complex patterns, and areas crossing important edges may need several careful passes and a full-size review.
        </p>
      </>
    ),
  };

  const faqs = [
    {
      question: "Does my image get uploaded?",
      answer: "No. The image is opened, edited, and exported inside your browser. It is not sent to Utilby.",
    },
    {
      question: "Will the exported image lose quality?",
      answer: "The download is a PNG at the same pixel dimensions. PNG is lossless, so it does not add another lossy compression step. The selected area is reconstructed, so inspect that area closely; the rest of the decoded image stays unchanged. The PNG may be larger and does not keep EXIF metadata.",
    },
    {
      question: "Which method should I use?",
      answer: "Use Smart fill for small marks on smooth surfaces such as a plain wall or sky. Use Clone from nearby for detailed texture such as fabric, grass, or a patterned surface.",
    },
    {
      question: "Will every watermark disappear perfectly?",
      answer: "No automatic fill can guarantee a perfect match for every image. Large marks and marks over detailed textures may leave visible artifacts. Use a smaller brush, make a few passes, try the Clone brush, and compare with the original before saving.",
    },
    {
      question: "What image size is supported?",
      answer: "JPG, PNG, WebP, and BMP images up to 50 MB and 24 megapixels are supported. Animated GIF files are not supported.",
    },
    {
      question: "Why is the PNG larger than my original image?",
      answer: "PNG preserves edited pixels without lossy compression. JPG and WebP are usually smaller, but re-encoding them can reduce image quality. This tool chooses PNG to protect quality.",
    },
  ];

  return (
    <ToolLayout
      toolId="watermark-remover"
      title="Watermark Remover"
      subtitle="Brush over small marks and fill them from nearby pixels or clone clean texture. Your photo stays in your browser and exports as full-size PNG."
      category="Image Tools"
      categorySlug="image"
      howToSteps={howToSteps}
      technicalDetails={technicalDetails}
      faqs={faqs}
    >
      <WatermarkRemoverTool />
    </ToolLayout>
  );
}
