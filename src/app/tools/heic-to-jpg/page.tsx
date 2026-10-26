import type { Metadata } from "next";
import { ToolLayout } from "@/components/shared/ToolLayout";
import { HeicConverterTool } from "@/modules/heic-converter/HeicConverterTool";

export const metadata: Metadata = {
  title: "HEIC to JPG or PNG Converter – Free, Private | Utilby",
  description:
    "Convert iPhone HEIC and HEIF photos to JPG or PNG in your browser. Adjust JPG quality, preview results, convert a batch, and download a ZIP. Photos stay on your device.",
  keywords: [
    "heic to jpg",
    "heic to png",
    "heif to jpg",
    "iphone photo converter",
    "convert heic online",
    "heic converter free",
    "batch heic converter",
  ],
  alternates: { canonical: "/tools/heic-to-jpg" },
  openGraph: {
    title: "Free HEIC to JPG & PNG Converter | Utilby",
    description: "Convert iPhone photos on your device. Choose JPG quality or lossless PNG, preview, and download a batch as ZIP.",
    url: "https://utilby.com/tools/heic-to-jpg",
    type: "website",
    images: [{ url: "https://utilby.com/og/tools/heic-to-jpg.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    images: ["https://utilby.com/og/tools/heic-to-jpg.png"],
  },
};

export default function HeicToJpgPage() {
  const howToSteps = [
    {
      step: "1",
      title: "Add HEIC photos",
      description: "Drop one or more .heic or .heif photos into the box, or choose them from your device. Photos are processed one at a time to keep memory use under control.",
    },
    {
      step: "2",
      title: "Choose JPG or PNG",
      description: "JPG is smaller and has an adjustable quality setting. PNG keeps all decoded image detail and does not use the JPG quality slider.",
    },
    {
      step: "3",
      title: "Convert and preview",
      description: "Start conversion and check each result, file size, and photo preview. If a photo cannot be read, the list shows a clear reason and lets you retry it.",
    },
    {
      step: "4",
      title: "Download your photos",
      description: "Download each converted photo, or save the completed batch together as a ZIP file. Output names keep the original photo names.",
    },
  ];

  const technicalDetails = {
    title: "Private HEIC conversion on your device",
    content: (
      <>
        <p>
          HEIC photos are decoded in a separate browser worker and redrawn as JPG or PNG. The decoder is loaded only when
          you start a conversion. Your photo contents stay on your device and are never sent to Utilby.
        </p>
        <p>
          <strong>File and memory limits:</strong> Each photo can be up to 50 MB and 32 megapixels. Photos are converted
          one at a time, with a two-minute limit for each one. Up to 120 MB of converted results can be kept in one batch;
          download and remove ready photos to make room for more. Larger images should be resized on your phone first.
        </p>
        <p>
          <strong>Photo details:</strong> Converted copies do not keep GPS or other camera metadata. HDR photos may look
          different in JPG or PNG, and a HEIF burst or sequence is converted as one still photo. Review important images
          before sharing them.
        </p>
        <p>
          <strong>Open-source decoder:</strong> Read the{" "}
          <a href="/licenses/heic-to-1.6.6-NOTICE.txt" className="font-semibold text-indigo-700 underline dark:text-indigo-300">
            heic-to 1.6.6 license and source notice
          </a>{" "}
          and the{" "}
          <a href="/licenses/heic-to-1.6.6-LICENSE.txt" className="font-semibold text-indigo-700 underline dark:text-indigo-300">
            LGPL-3.0 license text
          </a>
          .
        </p>
      </>
    ),
  };

  const faqs = [
    {
      question: "Are my photos uploaded?",
      answer: "No. The converter runs on your device in a browser worker. Your photo contents are not sent to Utilby or another conversion server.",
    },
    {
      question: "What is the difference between JPG and PNG?",
      answer: "JPG makes smaller files and lets you choose a quality level. PNG keeps all decoded image detail, but the result can be much larger.",
    },
    {
      question: "Why does a photo fail to convert?",
      answer: "The file may be damaged, use an unsupported HEIF variation, be larger than 32 megapixels, or take longer than two minutes. Try exporting the photo again from Photos, or resize it before converting.",
    },
    {
      question: "Will the converted photo keep its GPS location and camera details?",
      answer: "No. Converted copies remove GPS and other camera metadata, which helps protect your privacy.",
    },
    {
      question: "Can I convert many photos at once?",
      answer: "Yes. Add up to 20 photos and 100 MB total. The tool converts them one at a time and can keep up to 120 MB of converted results per batch. Download and remove ready photos to make room, then convert more. You can download individual results or one ZIP file.",
    },
    {
      question: "Why can the colors or brightness look different?",
      answer: "JPG and PNG are standard SDR formats. HDR photos may lose some of their original brightness range when converted. Preview the result before using it.",
    },
  ];

  return (
    <ToolLayout
      toolId="heic-to-jpg"
      title="HEIC to JPG or PNG Converter"
      subtitle="Convert iPhone HEIC/HEIF photos to JPG or PNG, adjust JPG quality, preview results, and download a batch as ZIP — privately in your browser."
      category="Image Tools"
      categorySlug="image"
      howToSteps={howToSteps}
      technicalDetails={technicalDetails}
      faqs={faqs}
    >
      <HeicConverterTool />
    </ToolLayout>
  );
}
