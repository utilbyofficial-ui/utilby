import type { Metadata } from "next";
import { ToolLayout } from "@/components/shared/ToolLayout";
import { ImageResizerTool } from "@/modules/image-resizer/ImageResizerTool";

export const metadata: Metadata = {
  title: "Image Resizer – Resize Images to Exact Pixels Online Free | Utilby",
  description:
    "Resize JPG, PNG and WebP images to exact pixels, by percentage, or with Instagram, Facebook, YouTube and LinkedIn presets. Batch resize and download as ZIP. Private — no upload.",
  keywords: [
    "image resizer",
    "resize image",
    "resize image online",
    "resize photo to pixels",
    "resize image for instagram",
    "youtube thumbnail size",
    "batch image resizer",
    "change image size",
  ],
  alternates: {
    canonical: "/tools/image-resizer",
  },
  openGraph: {
    title: "Free Image Resizer – Pixels, Percent & Social Presets | Utilby",
    description: "Resize images for Instagram, YouTube, Facebook and more. Batch resize in your browser — nothing is uploaded.",
    url: "https://utilby.com/tools/image-resizer",
    type: "website",
  },
};

export default function ImageResizerPage() {
  const howToSteps = [
    {
      step: "1",
      title: "Add Your Images",
      description:
        "Drag and drop one or more images, or click to browse. JPG, PNG, WebP, GIF and BMP are supported, up to 50 MB each.",
    },
    {
      step: "2",
      title: "Choose How to Resize",
      description:
        "Enter exact pixels (with the aspect-ratio lock on or off), scale by a percentage, or pick a ready-made size for Instagram, Facebook, YouTube, X, LinkedIn and more.",
    },
    {
      step: "3",
      title: "Handle Different Shapes",
      description:
        "When the target shape differs from your photo, choose Crop to fill (no borders), Fit inside (adds padding in a color you choose), or Stretch.",
    },
    {
      step: "4",
      title: "Download",
      description:
        "Check the live preview and new dimensions, then download a single image or all resized images together in one ZIP file.",
    },
  ];

  const technicalDetails = {
    title: "High-Quality Resizing in Your Browser",
    content: (
      <>
        <p>
          Images are decoded and redrawn locally with the browser&apos;s Canvas API. Nothing is uploaded, so your photos stay
          private on your own device.
        </p>
        <p>
          <strong>Sharp downscaling:</strong> Shrinking a large photo in one step can create jagged edges and moiré
          patterns. This tool halves the image in several high-quality passes before the final resize, producing a
          noticeably cleaner result.
        </p>
        <p>
          <strong>Aspect ratio:</strong> The ratio of width to height (for example 16:9 or 4:5). Keeping it locked prevents
          faces and objects from looking squashed or stretched.
        </p>
        <p>
          <strong>Orientation:</strong> Photos from phones are automatically rotated using their EXIF orientation, and
          other metadata such as GPS location is removed from the resized file.
        </p>
      </>
    ),
  };

  const faqs = [
    {
      question: "Are my images uploaded to a server?",
      answer:
        "No. Resizing happens entirely inside your browser. Your images are never uploaded, stored, or shared, and the tool keeps working even if you go offline after the page loads.",
    },
    {
      question: "How do I resize without stretching or distorting the image?",
      answer:
        "Keep the aspect-ratio lock turned on in By Pixels mode, or use By Percentage. If you need an exact size with a different shape, choose Crop to fill or Fit inside instead of Stretch.",
    },
    {
      question: "What size should I use for Instagram, YouTube or Facebook?",
      answer:
        "Use the Social Presets tab: Instagram posts are 1080×1080 (square) or 1080×1350 (portrait), stories and reels are 1080×1920, YouTube thumbnails are 1280×720, and Facebook link posts are 1200×630.",
    },
    {
      question: "Can I resize many images at once?",
      answer:
        "Yes. Add as many images as you need — the same settings are applied to all of them, and you can download them individually or together as a ZIP file.",
    },
    {
      question: "Will enlarging an image make it sharper?",
      answer:
        "No. Enlarging can't add detail that isn't in the original, so big enlargements look soft. Turn on “Don't enlarge images that are already smaller” to keep small images at their original size.",
    },
  ];

  return (
    <ToolLayout
      toolId="image-resizer"
      title="Image Resizer"
      subtitle="Resize images to exact pixels, by percentage, or with ready-made sizes for Instagram, YouTube, Facebook and more. Batch resize and download as ZIP — all inside your browser."
      category="Image Tools"
      categorySlug="image"
      howToSteps={howToSteps}
      technicalDetails={technicalDetails}
      faqs={faqs}
    >
      <ImageResizerTool />
    </ToolLayout>
  );
}
