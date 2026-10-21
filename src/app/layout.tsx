import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

export const metadata: Metadata = {
  metadataBase: new URL("https://utilby.com"),
  title: {
    default: "Utilby - 100% Free Online Utility Tools Network",
    template: "%s | Utilby",
  },
  description:
    "Free, fast, and secure online utility tools network. Word counter, JSON formatter, percentage calculator, case converter, and secure password generator with zero server uploads.",
  applicationName: "Utilby Network",
  authors: [{ name: "Utilby Network Team" }],
  keywords: [
    "free online tools",
    "utility tools",
    "word counter",
    "json formatter",
    "percentage calculator",
    "password generator",
    "case converter",
    "client-side utilities",
  ],
  creator: "Utilby Network",
  publisher: "Utilby Network",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://utilby.com",
    siteName: "Utilby Network",
    title: "Utilby - 100% Free Online Utility Tools Network",
    description:
      "Fast, private, and free browser-based online tools for everyday work.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Utilby - Free Online Utility Tools",
    description: "Fast, private, and free browser utilities with zero server upload.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export const viewport: Viewport = {
  themeColor: "#4f46e5",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className="min-h-screen flex flex-col font-sans bg-slate-50/70 text-slate-900 antialiased selection:bg-indigo-100 selection:text-indigo-900">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
