import type { Metadata } from "next";
import { ToolLayout } from "@/components/shared/ToolLayout";
import { Base64Tool } from "@/modules/base64-tool/Base64Tool";

export const metadata: Metadata = {
  title: "Base64 Encoder & Decoder – Convert Text and Files | Utilby",
  description:
    "Encode Unicode text or files to Base64 and decode Base64 or data URLs back to text or files. Supports URL-safe output and runs privately in your browser.",
  keywords: [
    "Base64 encoder",
    "Base64 decoder",
    "encode text to Base64",
    "decode Base64 online",
    "URL-safe Base64",
    "file to Base64",
    "Base64 to file",
  ],
  alternates: { canonical: "/tools/base64-encoder-decoder" },
  openGraph: {
    title: "Base64 Encoder & Decoder | Utilby",
    description: "Convert text and files to and from Base64. Your data stays in your browser.",
    url: "https://utilby.com/tools/base64-encoder-decoder",
    type: "website",
    images: [{ url: "https://utilby.com/og/tools/base64-encoder-decoder.png", width: 1200, height: 630 }],
  },
  twitter: { card: "summary_large_image", images: ["https://utilby.com/og/tools/base64-encoder-decoder.png"] },
};

export default function Base64EncoderDecoderPage() {
  const howToSteps = [
    { step: "1", title: "Choose Encode or Decode", description: "Select a direction. You can enter text, paste Base64, or choose a file to encode." },
    { step: "2", title: "Set the output options", description: "For encoding, choose URL-safe characters, omit padding, or include a data URL prefix." },
    { step: "3", title: "Preview the result", description: "Select Convert. Unicode text is handled as UTF-8, and binary data is identified for file download." },
    { step: "4", title: "Copy or save", description: "Copy Base64 text, save encoded text, or download decoded bytes as a file with a chosen name and type." },
  ];

  const technicalDetails = {
    title: "Base64 conversion for text and binary data",
    content: (
      <>
        <p>Text is encoded as UTF-8 before Base64 conversion, so Bengali, emoji, and other Unicode characters round-trip correctly. File bytes are preserved without interpreting them as text.</p>
        <p>The decoder accepts standard and URL-safe Base64, missing padding, whitespace, and Base64 data URLs. Binary values that are not valid UTF-8 can still be saved as files.</p>
        <p><strong>Security:</strong> Base64 is an encoding format, not encryption. It does not protect passwords, API keys, or private content. Files are processed locally in your browser and are not uploaded.</p>
        <p>Inputs are limited to 5 MB of text or file data to keep the browser responsive.</p>
      </>
    ),
  };

  const faqs = [
    { question: "Is Base64 encryption?", answer: "No. Anyone can decode Base64. It only changes how bytes are represented; do not use it to hide or protect passwords or confidential information." },
    { question: "Does it support Bengali and emoji?", answer: "Yes. Text is converted through UTF-8, so Unicode text can be encoded and decoded without corrupting characters." },
    { question: "Can I convert a file?", answer: "Yes. In Encode mode, choose a file smaller than 5 MB. In Decode mode, binary data can be downloaded with a filename and MIME type." },
    { question: "Why does decoded data not appear as text?", answer: "Some Base64 values represent images, PDFs, or other binary bytes rather than UTF-8 text. Use Save decoded file to download those original bytes." },
    { question: "What is URL-safe Base64?", answer: "URL-safe Base64 replaces + and / with - and _, which makes it easier to place in URLs. Padding can optionally be omitted; the decoder accepts both forms." },
  ];

  return (
    <ToolLayout
      toolId="base64-encoder-decoder"
      title="Base64 Encoder & Decoder"
      subtitle="Encode text and files or decode Base64 back to readable text and downloadable files. Private, quick, and fully in your browser."
      category="Developer Tools"
      categorySlug="developer"
      howToSteps={howToSteps}
      technicalDetails={technicalDetails}
      faqs={faqs}
    >
      <Base64Tool />
    </ToolLayout>
  );
}
