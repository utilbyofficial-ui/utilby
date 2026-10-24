export type DpiOption = "72" | "150" | "300";
export type ImageFormat = "jpg" | "png";

export interface PdfConversionOptions {
  format: ImageFormat;
  dpi: DpiOption;
  quality: number; // 0.1 to 1.0 (for JPEG)
}

export const DEFAULT_PDF_CONVERT_OPTIONS: PdfConversionOptions = {
  format: "jpg",
  dpi: "150",
  quality: 0.9,
};

export function getDpiScale(dpi: DpiOption): number {
  switch (dpi) {
    case "72":
      return 1.0;
    case "150":
      return 2.083; // 150 / 72
    case "300":
      return 4.167; // 300 / 72
    default:
      return 1.5;
  }
}

export function cleanBaseName(filename: string): string {
  const withoutExt = filename.replace(/\.pdf$/i, "").trim();
  const safe = withoutExt.replace(/[^\w\s\-_.]/g, "").replace(/\s+/g, "-");
  return safe || "converted-document";
}

export function formatPageNumber(page: number, totalPages: number): string {
  const padLength = totalPages >= 100 ? 3 : totalPages >= 10 ? 2 : 1;
  return page.toString().padStart(padLength, "0");
}

export function buildPageFilename(
  baseName: string,
  pageIndex1Based: number,
  totalPages: number,
  format: ImageFormat
): string {
  const clean = cleanBaseName(baseName);
  const formattedNum = formatPageNumber(pageIndex1Based, totalPages);
  const ext = format === "jpg" ? "jpg" : "png";
  return `${clean}-page-${formattedNum}.${ext}`;
}

export function buildZipFilename(baseName: string): string {
  const clean = cleanBaseName(baseName);
  return `${clean}-images.zip`;
}

/**
 * Parses a user page range string like "1-3, 5, 8-10" into a sorted array of 1-based page numbers.
 * Ignores invalid tokens and bounds pages within 1..totalPages.
 */
export function parsePageRanges(rangeStr: string, totalPages: number): number[] {
  if (!Number.isSafeInteger(totalPages) || totalPages <= 0) return [];
  if (!rangeStr.trim()) return Array.from({ length: totalPages }, (_, i) => i + 1);

  const pages = new Set<number>();
  const tokens = rangeStr.split(/[,\s]+/).map((token) => token.trim()).filter(Boolean);
  for (const token of tokens) {
    if (!/^\d+(?:-\d+)?$/.test(token)) return [];
    if (token.includes("-")) {
      const [startText, endText] = token.split("-");
      const start = Number(startText);
      const end = Number(endText);
      if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start < 1 || end < 1) return [];
      const from = Math.max(1, Math.min(start, end));
      const to = Math.min(totalPages, Math.max(start, end));
      for (let page = from; page <= to; page++) pages.add(page);
    } else {
      const page = Number(token);
      if (!Number.isSafeInteger(page) || page < 1) return [];
      if (page <= totalPages) pages.add(page);
    }
  }
  return Array.from(pages).sort((a, b) => a - b);
}
