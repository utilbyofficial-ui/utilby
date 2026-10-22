import { PDFDocument, degrees } from "pdf-lib";
import { PageItem, A4, LETTER, fitImageOnPage, normalizeRotation } from "./pages";

export interface PdfSourceData {
  kind: "pdf";
  doc: PDFDocument;
}

export interface ImageSourceData {
  kind: "image";
  bytes: Uint8Array;
  format: "png" | "jpg";
  /** Pixel size of the image */
  width: number;
  height: number;
}

export type SourceData = PdfSourceData | ImageSourceData;

export type ImagePageSize = "fit" | "a4" | "letter";

export interface BuildOptions {
  imagePageSize: ImagePageSize;
  /** Margin in points around images on A4/Letter pages */
  imageMargin: number;
  title?: string;
}

export const DEFAULT_BUILD_OPTIONS: BuildOptions = { imagePageSize: "a4", imageMargin: 24 };

export class EncryptedPdfError extends Error {
  constructor() {
    super("This PDF is password-protected");
    this.name = "EncryptedPdfError";
  }
}

export async function loadPdf(bytes: Uint8Array | ArrayBuffer): Promise<PDFDocument> {
  try {
    return await PDFDocument.load(bytes, { updateMetadata: false });
  } catch (e) {
    if (e instanceof Error && /encrypt/i.test(e.message)) throw new EncryptedPdfError();
    throw e;
  }
}

/** Page size (points) for an image page. Pixels are mapped at 72 dpi-ish (1px = 0.75pt) for "fit". */
export function imagePageDimensions(
  imgW: number,
  imgH: number,
  size: ImagePageSize
): { width: number; height: number } {
  if (size === "fit") {
    // Cap very large images so the page stays a sensible physical size (max ~ A2-ish).
    const scale = Math.min(0.75, 1684 / Math.max(imgW * 0.75, imgH * 0.75) * 0.75);
    return { width: Math.max(1, imgW * scale), height: Math.max(1, imgH * scale) };
  }
  const base = size === "letter" ? LETTER : A4;
  const landscape = imgW > imgH;
  return landscape ? { width: base.height, height: base.width } : { width: base.width, height: base.height };
}

/** Assembles the final PDF from the ordered page list. Works in the browser and in Node (tests). */
export async function buildPdf(
  pages: PageItem[],
  sources: Map<string, SourceData>,
  options: BuildOptions = DEFAULT_BUILD_OPTIONS
): Promise<Uint8Array> {
  const out = await PDFDocument.create({ updateMetadata: false });
  const embeddedImages = new Map<string, Awaited<ReturnType<PDFDocument["embedPng"]>>>();

  for (const item of pages) {
    if (item.kind === "blank") {
      const page = out.addPage([item.width, item.height]);
      if (item.rotation) page.setRotation(degrees(item.rotation));
      continue;
    }
    const src = item.sourceId ? sources.get(item.sourceId) : undefined;
    if (!src) throw new Error("A page's source file is missing");

    if (src.kind === "pdf") {
      const [copied] = await out.copyPages(src.doc, [item.sourceIndex]);
      const existing = copied.getRotation().angle;
      copied.setRotation(degrees(normalizeRotation(existing + item.rotation)));
      out.addPage(copied);
      continue;
    }

    // Image page
    let image = embeddedImages.get(item.sourceId!);
    if (!image) {
      image = src.format === "jpg" ? await out.embedJpg(src.bytes) : await out.embedPng(src.bytes);
      embeddedImages.set(item.sourceId!, image);
    }
    const dims = imagePageDimensions(src.width, src.height, options.imagePageSize);
    const page = out.addPage([dims.width, dims.height]);
    const margin = options.imagePageSize === "fit" ? 0 : options.imageMargin;
    const box = fitImageOnPage(image.width, image.height, dims.width, dims.height, margin);
    page.drawImage(image, box);
    if (item.rotation) page.setRotation(degrees(item.rotation));
  }

  if (options.title) out.setTitle(options.title);
  out.setProducer("Utilby PDF Tools (utilby.com)");
  out.setCreator("Utilby");
  const now = new Date();
  out.setCreationDate(now);
  out.setModificationDate(now);
  return out.save({ useObjectStreams: true });
}

/** Builds several PDFs (for split / extract). Each group is a list of indexes into `pages`. */
export async function buildPdfGroups(
  pages: PageItem[],
  groups: number[][],
  sources: Map<string, SourceData>,
  options: BuildOptions = DEFAULT_BUILD_OPTIONS
): Promise<Uint8Array[]> {
  const results: Uint8Array[] = [];
  for (const group of groups) {
    results.push(await buildPdf(group.map((i) => pages[i]), sources, options));
  }
  return results;
}
