import type { Metadata } from "next";
import { PdfToolPage } from "@/modules/pdf/PdfToolPage";
import { pdfToolMetadata } from "@/modules/pdf/seo";

export const metadata: Metadata = pdfToolMetadata("delete-pdf-pages");

export default function DeletePdfPagesPage() {
  return <PdfToolPage slug="delete-pdf-pages" />;
}
