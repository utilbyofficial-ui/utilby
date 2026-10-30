import "regenerator-runtime/runtime";

export const MAX_PDF_BYTES = 100 * 1024 * 1024;
export const MAX_PDF_PAGES = 100;
export const MAX_OCR_PIXELS = 14_000_000;
export const MAX_OCR_DIMENSION = 8192;
export const TARGET_OCR_SCALE = 2.5;

export interface OcrWordBox {
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface OcrPageResult {
  pageNumber: number;
  text: string;
  words: OcrWordBox[];
  source: "ocr" | "existing-text";
}

export interface WordBounds {
  text: string;
  bbox: { x0: number; y0: number; x1: number; y1: number };
}

interface PdfViewportLike {
  convertToPdfPoint(x: number, y: number): number[];
}

export function isPdfFile(file: Pick<File, "name" | "type">): boolean {
  return file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
}

/** Render near 180 DPI, reducing scale for oversized page dimensions. */
export function getOcrRenderScale(width: number, height: number): number {
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
    throw new Error("This PDF page has invalid dimensions.");
  }
  const pixelScale = Math.sqrt(MAX_OCR_PIXELS / (width * height));
  const dimensionScale = Math.min(MAX_OCR_DIMENSION / width, MAX_OCR_DIMENSION / height);
  const scale = Math.min(TARGET_OCR_SCALE, pixelScale, dimensionScale);
  if (!Number.isFinite(scale) || scale <= 0) throw new Error("This PDF page is too large to process safely.");
  return scale;
}

export function mapWordBoundsToPdf(words: WordBounds[], viewport: PdfViewportLike): OcrWordBox[] {
  const mapped: OcrWordBox[] = [];
  for (const word of words) {
    const text = word.text.replace(/[\u0000-\u001f\u007f]/g, " ").trim();
    const { x0, y0, x1, y1 } = word.bbox;
    if (!text || ![x0, y0, x1, y1].every(Number.isFinite) || x1 <= x0 || y1 <= y0) continue;

    const topLeft = viewport.convertToPdfPoint(x0, y0);
    const bottomRight = viewport.convertToPdfPoint(x1, y1);
    const topRight = viewport.convertToPdfPoint(x1, y0);
    const bottomLeft = viewport.convertToPdfPoint(x0, y1);
    const left = Math.min(topLeft[0], bottomLeft[0], topRight[0], bottomRight[0]);
    const right = Math.max(topLeft[0], bottomLeft[0], topRight[0], bottomRight[0]);
    const bottom = Math.min(topLeft[1], bottomLeft[1], topRight[1], bottomRight[1]);
    const top = Math.max(topLeft[1], bottomLeft[1], topRight[1], bottomRight[1]);
    const width = right - left;
    const height = top - bottom;
    if (![left, bottom, width, height].every(Number.isFinite) || width <= 0 || height <= 0) continue;

    mapped.push({ text, x: left, y: bottom + height * 0.08, width, height });
  }
  return mapped;
}

export function buildTextDocument(pages: OcrPageResult[]): string {
  return pages
    .map(({ pageNumber, text }) => `--- Page ${pageNumber} ---\n${text.trim()}`)
    .join("\n\n")
    .trim();
}

export function cleanPdfBaseName(filename: string): string {
  const base = filename.replace(/\.pdf$/i, "").trim();
  const safe = base.replace(/[^\p{L}\p{M}\p{N} _.-]/gu, "").replace(/\s+/g, "-").replace(/-+/g, "-");
  return safe || "ocr-document";
}

function splitFontRuns(text: string): { text: string; bengali: boolean }[] {
  const runs: { text: string; bengali: boolean }[] = [];
  for (const char of text) {
    const bengali = /[\u0980-\u09ff]/u.test(char);
    const previous = runs[runs.length - 1];
    if (previous?.bengali === bengali) previous.text += char;
    else runs.push({ text: char, bengali });
  }
  return runs;
}

/** Adds invisible, Unicode-mapped text while leaving the original page artwork intact. */
export async function createSearchablePdf(originalBytes: Uint8Array, pages: OcrPageResult[]): Promise<Uint8Array> {
  const pagesWithText = pages.filter((page) => page.source === "ocr" && page.words.length > 0);
  if (pagesWithText.length === 0) return originalBytes.slice();

  const [{ PDFDocument, rgb }, fontkitModule, bengaliResponse, latinResponse] = await Promise.all([
    import("pdf-lib"),
    import("@pdf-lib/fontkit"),
    fetch("/vendor/fonts/noto-sans-bengali-bengali-400-normal.woff2"),
    fetch("/vendor/fonts/noto-sans-bengali-latin-400-normal.woff2"),
  ]);
  if (!bengaliResponse.ok || !latinResponse.ok) throw new Error("The Bengali OCR font could not be loaded.");

  const [bengaliFontBytes, latinFontBytes] = await Promise.all([
    bengaliResponse.arrayBuffer().then((buffer) => new Uint8Array(buffer)),
    latinResponse.arrayBuffer().then((buffer) => new Uint8Array(buffer)),
  ]);
  const pdf = await PDFDocument.load(originalBytes, { updateMetadata: false });
  const fontkit = (fontkitModule as unknown as { default?: typeof fontkitModule }).default ?? fontkitModule;
  pdf.registerFontkit(fontkit);
  const [bengaliFont, latinFont] = await Promise.all([
    pdf.embedFont(bengaliFontBytes, { subset: true }),
    pdf.embedFont(latinFontBytes, { subset: true }),
  ]);

  for (const result of pagesWithText) {
    const page = pdf.getPage(result.pageNumber - 1);
    for (const word of result.words) {
      const size = Math.max(2, Math.min(48, word.height * 0.82));
      let x = word.x;
      for (const run of splitFontRuns(word.text)) {
        const font = run.bengali ? bengaliFont : latinFont;
        page.drawText(run.text, { x, y: word.y, size, font, color: rgb(0, 0, 0), opacity: 0 });
        x += font.widthOfTextAtSize(run.text, size);
      }
    }
  }

  return pdf.save({ useObjectStreams: true });
}
