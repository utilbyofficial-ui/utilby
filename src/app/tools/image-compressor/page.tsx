import type { Metadata } from "next";
import { ToolLayout } from "@/components/shared/ToolLayout";
import { ImageCompressorTool } from "@/modules/image-compressor/ImageCompressorTool";

export const metadata: Metadata = {
  title: "Image Compressor – Compress JPG, PNG & WebP Online Free | Utilby",
  description:
    "Reduce image file size by up to 90% without visible quality loss. Compress JPG, PNG and WebP in bulk, convert to WebP, resize, and download as ZIP. Private — images never leave your browser.",
  keywords: [
    "image compressor",
    "compress image",
    "compress jpg",
    "compress png",
    "reduce image size",
    "image size reducer",
    "convert to webp",
    "bulk image compressor",
  ],
  alternates: {
    canonical: "/tools/image-compressor",
  },
  openGraph: {
    title: "Free Image Compressor – JPG, PNG, WebP | Utilby",
    description: "Shrink images in bulk without quality loss. No upload — everything happens in your browser.",
    url: "https://utilby.com/tools/image-compressor",
    type: "website",
  },
};

export default function ImageCompressorPage() {
  const howToSteps = [
    {
      step: "1",
      title: "Add Your Images",
      description:
        "Drag and drop one or many images into the box, or click to browse. JPG, PNG, WebP, GIF and BMP files up to 50 MB each are supported.",
    },
    {
      step: "2",
      title: "Adjust Quality & Format",
      description:
        "A quality of 70–80% gives the best balance of size and sharpness. Choose WebP for the smallest files, or keep the original format.",
    },
    {
      step: "3",
      title: "Resize if Needed (Optional)",
      description:
        "Photos from phones and cameras are often 4000+ pixels wide. Limiting the longest side to 1920 px cuts file size dramatically for web and social media.",
    },
    {
      step: "4",
      title: "Compare & Download",
      description:
        "Use the before/after slider to check quality, then download each image or get all of them at once as a ZIP file.",
    },
  ];

  const technicalDetails = {
    title: "How Browser-Based Image Compression Works",
    content: (
      <>
        <p>
          Your images are decoded and re-encoded locally using the browser&apos;s built-in Canvas image encoders. Nothing is
          uploaded, so even private photos and documents stay on your device.
        </p>
        <p>
          <strong>Lossy formats (JPG, WebP):</strong> The quality setting controls how aggressively fine detail the human
          eye barely notices is discarded. Going from 100% to 75% typically shrinks files by 60–80% with no visible
          difference at normal viewing size.
        </p>
        <p>
          <strong>PNG:</strong> PNG is lossless, so re-encoding it rarely makes it much smaller. Converting a PNG photo or
          screenshot to <strong>WebP</strong> usually reduces size by 50–90% while keeping transparency.
        </p>
        <p>
          <strong>Privacy bonus:</strong> Re-encoding strips EXIF metadata such as GPS location, camera model, and capture
          time from your photos, while keeping the correct orientation.
        </p>
      </>
    ),
  };

  const faqs = [
    {
      question: "Are my images uploaded to a server?",
      answer:
        "No. All compression happens inside your browser on your own device. Your images are never uploaded, stored, or seen by anyone — the tool even works offline once the page has loaded.",
    },
    {
      question: "Will compressing reduce the quality of my images?",
      answer:
        "At the recommended 70–80% quality the difference is practically invisible, while the file becomes much smaller. Use the before/after comparison slider to check, and raise the quality if you need more detail.",
    },
    {
      question: "What is the best format for the smallest file size?",
      answer:
        "WebP. It produces files roughly 25–35% smaller than JPG at the same visual quality and supports transparency like PNG. All modern browsers, WordPress, and most social platforms accept WebP.",
    },
    {
      question: "Why did my PNG barely get smaller?",
      answer:
        "PNG is a lossless format, so there is little to remove without changing the format. Choose WebP (keeps transparency) or JPG (for photos without transparency) in Output Format for a big reduction.",
    },
    {
      question: "Can I compress many images at once?",
      answer:
        "Yes. Drop as many images as you like — they are processed one by one, and you can download them individually or all together in a single ZIP file.",
    },
    {
      question: "Does it support HEIC photos from iPhone?",
      answer:
        "Not yet. Most browsers cannot decode HEIC. On iPhone, set Camera → Formats → Most Compatible to save photos as JPG, or share the photo and choose JPG first.",
    },
  ];

  return (
    <ToolLayout
      toolId="image-compressor"
      title="Image Compressor"
      subtitle="Reduce JPG, PNG, and WebP file sizes by up to 90% without visible quality loss. Bulk compress, convert to WebP, resize, and download as ZIP — all inside your browser."
      category="Image Tools"
      categorySlug="image"
      howToSteps={howToSteps}
      technicalDetails={technicalDetails}
      faqs={faqs}
    >
      <ImageCompressorTool />
    </ToolLayout>
  );
}
