import type { Metadata } from "next";
import { PdfToolPage } from "@/modules/pdf/PdfToolPage";
import { pdfToolMetadata } from "@/modules/pdf/seo";

export const metadata: Metadata = pdfToolMetadata("add-page-numbers-pdf");

export default function AddPdfPageNumbersPage() {
  return <PdfToolPage slug="add-page-numbers-pdf" />;
}
