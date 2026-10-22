import type { Metadata } from "next";
import { PdfToolPage } from "@/modules/pdf/PdfToolPage";
import { pdfToolMetadata } from "@/modules/pdf/seo";

export const metadata: Metadata = pdfToolMetadata("split-pdf");

export default function SplitPdfPage() {
  return <PdfToolPage slug="split-pdf" />;
}
