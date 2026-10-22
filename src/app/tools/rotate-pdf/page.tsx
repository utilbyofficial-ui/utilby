import type { Metadata } from "next";
import { PdfToolPage } from "@/modules/pdf/PdfToolPage";
import { pdfToolMetadata } from "@/modules/pdf/seo";

export const metadata: Metadata = pdfToolMetadata("rotate-pdf");

export default function RotatePdfPage() {
  return <PdfToolPage slug="rotate-pdf" />;
}
