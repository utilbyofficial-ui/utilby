import { degrees, PDFDocument, rgb, StandardFonts } from "pdf-lib";

export type VisiblePdfStamp = "" | "COPY" | "DRAFT" | "SAMPLE" | "CONFIDENTIAL";

export interface PdfPageMarkOptions {
  includePageNumbers: boolean;
  stamp: VisiblePdfStamp;
}

/** Adds fixed, visibly printed page numbers and an optional preset document label. */
export async function addPdfPageMarks(
  bytes: Uint8Array,
  options: PdfPageMarkOptions
): Promise<Uint8Array> {
  if (!options.includePageNumbers && !options.stamp) return bytes;

  const pdf = await PDFDocument.load(bytes, { updateMetadata: false });
  const pages = pdf.getPages();
  if (!pages.length) throw new Error("This PDF does not contain any pages.");

  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const stampAngle = 38;
  const radians = (stampAngle * Math.PI) / 180;
  const stampCos = Math.cos(radians);
  const stampSin = Math.sin(radians);

  pages.forEach((page, index) => {
    const { width, height } = page.getSize();

    if (options.includePageNumbers) {
      const label = `Page ${index + 1} of ${pages.length}`;
      const size = 9;
      const textWidth = font.widthOfTextAtSize(label, size);
      page.drawText(label, {
        x: Math.max(8, (width - textWidth) / 2),
        y: 16,
        size,
        font,
        color: rgb(0.28, 0.31, 0.36),
        opacity: 0.9,
      });
    }

    if (options.stamp) {
      const maxDimension = Math.min(width, height);
      const unscaledWidth = font.widthOfTextAtSize(options.stamp, 1);
      const size = Math.max(12, Math.min(42, maxDimension * 0.075, (maxDimension * 0.9) / unscaledWidth));
      const textWidth = font.widthOfTextAtSize(options.stamp, size);
      const centerX = width / 2;
      const centerY = height / 2;
      page.drawText(options.stamp, {
        x: centerX - (textWidth / 2) * stampCos,
        y: centerY - (textWidth / 2) * stampSin,
        size,
        font,
        color: rgb(0.7, 0.16, 0.14),
        opacity: 0.24,
        rotate: degrees(stampAngle),
      });
    }
  });

  return pdf.save({ useObjectStreams: true });
}
