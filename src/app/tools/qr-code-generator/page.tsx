import type { Metadata } from "next";
import { ToolLayout } from "@/components/shared/ToolLayout";
import { QrCodeGeneratorTool } from "@/modules/qr-code/QrCodeGeneratorTool";

export const metadata: Metadata = {
  title: "QR Code Generator – Free QR Code Generator for URL, Wi-Fi & Text | Utilby",
  description:
    "Create free QR codes for websites, Wi-Fi, contacts, email, phone and SMS. Add a logo, customize colors, and download high-resolution PNG or SVG files. Generated in your browser.",
  keywords: [
    "qr code generator",
    "free qr code generator",
    "create qr code",
    "wifi qr code",
    "vcard qr code",
    "qr code svg",
    "qr code png download",
    "qr code with logo",
  ],
  alternates: {
    canonical: "/tools/qr-code-generator",
  },
  openGraph: {
    title: "Free QR Code Generator – URL, Wi-Fi, vCard | Utilby",
    description: "Make QR codes for links, Wi-Fi, contacts and more. Download PNG or SVG. 100% in your browser.",
    url: "https://utilby.com/tools/qr-code-generator",
    type: "website",
    images: [{ url: "https://utilby.com/og/tools/qr-code-generator.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    images: ["https://utilby.com/og/tools/qr-code-generator.png"],
  },
};

export default function QrCodeGeneratorPage() {
  const howToSteps = [
    {
      step: "1",
      title: "Choose a Content Type",
      description:
        "Pick what the QR code should do: open a website, show text, join a Wi-Fi network, save a contact, start an email, call, or send an SMS.",
    },
    {
      step: "2",
      title: "Enter Your Details",
      description:
        "Fill in the fields. The preview updates instantly as you type, so you can see the QR code change in real time.",
    },
    {
      step: "3",
      title: "Customize the Design",
      description:
        "Set the QR and background colors, add a small logo, and adjust the error correction, quiet zone, and PNG size. Adding a logo automatically selects High error correction; test the code before printing.",
    },
    {
      step: "4",
      title: "Download or Copy",
      description:
        "Download a high-resolution PNG for screens and social media, or an SVG vector file for print, signage, and packaging where it must scale without blur.",
    },
  ];

  const technicalDetails = {
    title: "How QR Codes Work & Choosing Error Correction",
    content: (
      <>
        <p>
          A QR code stores data in a grid of dark and light modules. Scanners locate it using the three square finder
          patterns in the corners and then decode the data using Reed–Solomon error correction.
        </p>
        <p>
          <strong>Error correction levels:</strong> Low (≈7%), Medium (≈15%), Quartile (≈25%), and High (≈30%) describe
          how much of the code can be damaged or covered and still scan. Higher levels make the code denser, so use
          Medium for everyday use and High when adding a logo or printing on rough surfaces. A logo can still affect
          scanning, so test the finished code on several phones before printing or sharing it widely.
        </p>
        <p>
          <strong>Static codes:</strong> The data is encoded directly in the image — there is no redirect server. Your
          QR codes never expire and keep working forever, and nobody can track who scans them.
        </p>
        <p>
          <strong>Wi-Fi format:</strong> Wi-Fi codes use the standard{" "}
          <code className="text-indigo-600 dark:text-indigo-400 font-mono">WIFI:T:WPA;S:name;P:password;;</code> format
          supported by the built-in camera apps on iOS and Android.
        </p>
      </>
    ),
  };

  const faqs = [
    {
      question: "Is this QR code generator really free? Do the codes expire?",
      answer:
        "Yes, it is completely free with no sign-up. These are static QR codes, so the data is stored inside the image itself. They never expire and do not depend on any server to keep working.",
    },
    {
      question: "Is my data (like my Wi-Fi password) uploaded anywhere?",
      answer:
        "No. The QR code is generated entirely inside your browser using JavaScript. Your text, links, Wi-Fi passwords, and contact details are never sent to a server or stored.",
    },
    {
      question: "Should I download PNG or SVG?",
      answer:
        "Use PNG for websites, social media, and documents. Use SVG for printing — it is a vector file, so it stays perfectly sharp on business cards, flyers, banners, and product packaging at any size.",
    },
    {
      question: "Can I add my logo to the QR code?",
      answer:
        "Yes. Choose a PNG, JPG, or WebP image up to 5 MB. The logo is resized and added in your browser, with a small background pad behind it. High error correction is selected automatically. Always scan the downloaded code with a phone before printing, because a logo can reduce scan reliability.",
    },
    {
      question: "Why won't my colored QR code scan?",
      answer:
        "Scanners need strong contrast between the QR color and the background. Use a dark QR color on a light background, and keep a quiet zone (margin) around the code. The tool warns you when contrast is too low.",
    },
    {
      question: "Can I edit the link after printing the QR code?",
      answer:
        "No. Static QR codes cannot be changed after they are created. If you need to change the destination later, point the QR code at a page you control and update that page instead.",
    },
  ];

  return (
    <ToolLayout
      toolId="qr-code-generator"
      title="Free QR Code Generator"
      subtitle="Create QR codes for links, Wi-Fi, contacts, email, phone, and SMS. Add a logo, choose custom colors, and download PNG or SVG — all in your browser."
      category="Developer Tools"
      categorySlug="developer"
      howToSteps={howToSteps}
      technicalDetails={technicalDetails}
      faqs={faqs}
    >
      <QrCodeGeneratorTool />
    </ToolLayout>
  );
}
