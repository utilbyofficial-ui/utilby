import type { Metadata } from "next";
import { ToolLayout } from "@/components/shared/ToolLayout";
import { BackgroundRemoverTool } from "@/modules/background-remover/BackgroundRemoverTool";

export const metadata: Metadata = {
  title: "Image Background Remover – Free AI Photo Cutout | Utilby",
  description:
    "Remove photo backgrounds in your browser, refine edges with erase and restore brushes, add a color or custom photo background, and download a transparent PNG.",
  keywords: [
    "image background remover",
    "remove background from image",
    "remove photo background online",
    "transparent background maker",
    "photo background changer",
    "background eraser",
    "product photo background remover",
  ],
  alternates: { canonical: "/tools/image-background-remover" },
  openGraph: {
    title: "Free Image Background Remover | Utilby",
    description: "Remove a photo background, touch up edges, and replace it with a color, blur, or your own image. Your photo stays on your device.",
    url: "https://utilby.com/tools/image-background-remover",
    type: "website",
    images: [{ url: "https://utilby.com/og/tools/image-background-remover.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    images: ["https://utilby.com/og/tools/image-background-remover.png"],
  },
};

export default function ImageBackgroundRemoverPage() {
  const howToSteps = [
    {
      step: "1",
      title: "Choose a Photo",
      description: "Add one JPG, PNG, WebP, or BMP image up to 30 MB and 24 megapixels. Your photo is prepared on your device.",
    },
    {
      step: "2",
      title: "Remove the Background",
      description: "The browser downloads and runs the AI model on your device. Its first use can take longer; the model is cached for later visits.",
    },
    {
      step: "3",
      title: "Touch Up and Replace",
      description: "Compare the original and result, erase leftover background, restore missed subject areas, and undo or redo brush strokes. Add a color, blur, or your own background photo.",
    },
    {
      step: "4",
      title: "Download at Full Size",
      description: "Save a transparent PNG or choose WebP or JPG. Adjust quality for the smaller formats; JPG uses white when the background is transparent.",
    },
  ];

  const technicalDetails = {
    title: "AI Background Removal with Manual Edge Control",
    content: (
      <>
        <p>
          The segmentation model runs inside your browser. Your image is not sent to Utilby or the model host; only the model files are downloaded when needed.
        </p>
        <p>
          <strong>Better edge control:</strong> After the automatic cutout, paint with Erase to remove missed background or Restore to bring back part of the subject. Undo, redo, reset, and edge softness help you tune the result before saving.
        </p>
        <p>
          <strong>Background options:</strong> Keep transparent pixels for PNG or WebP, use a solid color, blur the original scene, or place the subject over a photo of your choice. PNG is the best choice when you need transparency.
        </p>
        <p>
          Results depend on the photo. Fine hair, glass, shadows, and subjects that blend into the background may need brush touch-up. This tool keeps the original photo resolution for export and limits input size to keep browser memory use predictable.
        </p>
      </>
    ),
  };

  const faqs = [
    {
      question: "Is my photo uploaded anywhere?",
      answer: "No. The photo is decoded and processed in your browser and is never uploaded. Your browser downloads the AI model separately the first time you use this tool.",
    },
    {
      question: "Will the background removal always be perfect?",
      answer: "Automatic results depend on the image, especially around fine hair, glass, shadows, and similar-colored edges. Use Erase and Restore to correct missed areas, and compare the result with the original before downloading.",
    },
    {
      question: "Can I add a new background?",
      answer: "Yes. Choose a solid color, blur the original background, or upload another photo. You can also keep the background transparent for PNG and WebP.",
    },
    {
      question: "Why does the first image take longer?",
      answer: "The browser needs to download the AI model the first time. It is cached on your device when possible, so later use is usually faster. If the first model cannot produce a clear cutout, the tool can try a portrait-focused model.",
    },
    {
      question: "What image size is supported?",
      answer: "Choose a JPG, PNG, WebP, or BMP under 30 MB and up to 24 megapixels. The AI works on a carefully reduced preview, then the result is exported at the original photo dimensions.",
    },
    {
      question: "Which download format should I use?",
      answer: "Choose PNG for transparent backgrounds and maximum quality. WebP can make a smaller file while preserving transparency. JPG has no transparency, so it uses white when you choose a transparent background.",
    },
  ];

  return (
    <ToolLayout
      toolId="image-background-remover"
      title="Image Background Remover"
      subtitle="Remove a photo background, fix the edges by hand, and replace it with a color, blur, or your own image. Your photo stays in your browser."
      category="Image Tools"
      categorySlug="image"
      howToSteps={howToSteps}
      technicalDetails={technicalDetails}
      faqs={faqs}
    >
      <BackgroundRemoverTool />
    </ToolLayout>
  );
}
