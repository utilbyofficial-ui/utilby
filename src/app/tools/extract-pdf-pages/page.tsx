import type { Metadata } from "next";
import { PdfToolPage } from "@/modules/pdf/PdfToolPage";
import { pdfToolMetadata } from "@/modules/pdf/seo";

export const metadata: Metadata = pdfToolMetadata("extract-pdf-pages");

export default function ExtractPdfPagesPage() {
  return <PdfToolPage slug="extract-pdf-pages" />;
}
