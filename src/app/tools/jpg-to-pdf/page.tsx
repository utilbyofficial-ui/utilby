import type { Metadata } from "next";
import { PdfToolPage } from "@/modules/pdf/PdfToolPage";
import { pdfToolMetadata } from "@/modules/pdf/seo";

export const metadata: Metadata = pdfToolMetadata("jpg-to-pdf");

export default function JpgToPdfPage() {
  return <PdfToolPage slug="jpg-to-pdf" />;
}
