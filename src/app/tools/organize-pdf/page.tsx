import type { Metadata } from "next";
import { PdfToolPage } from "@/modules/pdf/PdfToolPage";
import { pdfToolMetadata } from "@/modules/pdf/seo";

export const metadata: Metadata = pdfToolMetadata("organize-pdf");

export default function OrganizePdfPage() {
  return <PdfToolPage slug="organize-pdf" />;
}
