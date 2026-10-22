import type { Metadata } from "next";
import { PdfToolPage } from "@/modules/pdf/PdfToolPage";
import { pdfToolMetadata } from "@/modules/pdf/seo";

export const metadata: Metadata = pdfToolMetadata("pdf-merger");

export default function PdfMergerPage() {
  return <PdfToolPage slug="pdf-merger" />;
}
