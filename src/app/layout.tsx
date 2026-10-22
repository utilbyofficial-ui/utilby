import type { Metadata, Viewport } from "next";
import "@fontsource-variable/dm-sans";
import "@fontsource-variable/bricolage-grotesque";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ADS_ENABLED, ADSENSE_CLIENT } from "@/lib/ads-config";
import { CF_ANALYTICS_ENABLED, CF_ANALYTICS_TOKEN } from "@/lib/analytics-config";

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
  icons: {
    icon: [
      { url: "/icon.png", type: "image/png" },
      { url: "/favicon.ico", sizes: "any" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://utilby.com",
    siteName: "Utilby",
    title: "Utilby – 100% Free Online Utility Tools",
    description:
      "Fast, private, and free browser-based online tools for everyday work.",
    images: [
      {
        url: "https://utilby.com/og/default.png",
        width: 1200,
        height: 630,
        alt: "Utilby – Free Online Utility Tools Network",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Utilby – Free Online Utility Tools",
    description: "Fast, private, and free browser utilities with zero server upload.",
    images: ["https://utilby.com/og/default.png"],
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
  themeColor: "#16141F",
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
      {ADS_ENABLED && (
        <head>
          <script async src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`} crossOrigin="anonymous" />
        </head>
      )}
      <body className="min-h-screen flex flex-col font-sans bg-white text-ink antialiased selection:bg-sun selection:text-ink">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
        {CF_ANALYTICS_ENABLED && (
          <script
            defer
            src="https://static.cloudflareinsights.com/beacon.min.js"
            data-cf-beacon={`{"token": "${CF_ANALYTICS_TOKEN}"}`}
          />
        )}
      </body>
    </html>
  );
}
