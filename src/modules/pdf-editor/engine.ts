import { getPdfLib } from "@/modules/pdf/build";
import { PageGeometry, displaySize, normalizeRotation, toPdfPoint, toPdfRect, uprightAnchor } from "./geometry";
import { removeTextInRects, bytesToLatin1, latin1ToBytes } from "./contentStream";

export type ToolMode =
  | "select"
  | "editText"
  | "moveElement"
  | "text"
  | "draw"
  | "highlight"
  | "whiteout"
  | "rect"
  | "circle"
  | "signature"
  | "image";

export interface ExistingTextItem {
  id: string;
  pageIndex: number;
  originalText: string;
  currentText: string;
  normX: number;
  normY: number;
  normW: number;
  normH: number;
  fontSize: number;
  color: string;
  bgColor?: string;
  /** Locally reconstructed page pixels used to blend edits into the original background. */
  bgPatchDataUrl?: string;
  fontFamily: "Helvetica" | "Times" | "Courier";
  isBold?: boolean;
  isEdited: boolean;
  isDeleted?: boolean;
  /** Font size / family / weight / color changed by the user */
  styleChanged?: boolean;
  origNormX: number;
  origNormY: number;
  origNormW: number;
  origNormH: number;
}

export type AnnotationType =
  | "text"
  | "draw"
  | "highlight"
  | "whiteout"
  | "rect"
  | "circle"
  | "image"
  | "signature";

export interface BaseAnnotation {
  id: string;
  pageIndex: number; // 0-based
  type: AnnotationType;
}

export interface TextAnnotation extends BaseAnnotation {
  type: "text";
  normX: number; // 0 to 1 (relative to page width)
  normY: number; // 0 to 1 (relative to page height from top)
  text: string;
  fontSize: number; // point size in PDF (typically 12 to 36)
  color: string; // hex
  fontFamily: "Helvetica" | "Times" | "Courier";
  isBold?: boolean;
}

export interface DrawAnnotation extends BaseAnnotation {
  type: "draw";
  points: { normX: number; normY: number }[];
  color: string;
  strokeWidth: number;
}

export interface HighlightAnnotation extends BaseAnnotation {
  type: "highlight";
  normX: number;
  normY: number;
  normW: number;
  normH: number;
  color: string;
  opacity: number;
}

export interface WhiteoutAnnotation extends BaseAnnotation {
  type: "whiteout";
  normX: number;
  normY: number;
  normW: number;
  normH: number;
  color?: string; // hex color of the redaction/background patch, default #FFFFFF
  /** Optional repaired page pixels for non-uniform backgrounds. */
  dataUrl?: string;
}

export interface ShapeAnnotation extends BaseAnnotation {
  type: "rect" | "circle";
  normX: number;
  normY: number;
  normW: number;
  normH: number;
  strokeColor: string;
  fillColor?: string;
  strokeWidth: number;
}

export interface ImageAnnotation extends BaseAnnotation {
  type: "image" | "signature";
  normX: number;
  normY: number;
  normW: number;
  normH: number;
  dataUrl: string;
}

export type Annotation =
  | TextAnnotation
  | DrawAnnotation
  | HighlightAnnotation
  | WhiteoutAnnotation
  | ShapeAnnotation
  | ImageAnnotation;

let idCounter = 0;
export const newAnnotationId = (prefix = "ann") => `${prefix}-${Date.now().toString(36)}-${idCounter++}`;

export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  let clean = hex.replace("#", "").trim();
  if (clean.length === 3) {
    clean = clean.split("").map((c) => c + c).join("");
  }
  const num = parseInt(clean, 16);
  if (isNaN(num)) return { r: 0, g: 0, b: 0 };
  return {
    r: ((num >> 16) & 255) / 255,
    g: ((num >> 8) & 255) / 255,
    b: (num & 255) / 255,
  };
}

export function denormalizeToPdf(
  normX: number,
  normY: number,
  normW: number,
  normH: number,
  pdfW: number,
  pdfH: number
): { x: number; y: number; width: number; height: number } {
  const width = Math.max(1, normW * pdfW);
  const height = Math.max(1, normH * pdfH);
  const x = normX * pdfW;
  // Convert from top-left (DOM) to bottom-left (PDF)
  const y = pdfH - normY * pdfH - height;
  return { x, y, width, height };
}

export function createDefaultTextAnnotation(
  pageIndex: number,
  normX: number,
  normY: number,
  text = "Type text here"
): TextAnnotation {
  return {
    id: newAnnotationId("txt"),
    pageIndex,
    type: "text",
    normX: Math.max(0, Math.min(0.9, normX)),
    normY: Math.max(0, Math.min(0.95, normY)),
    text,
    fontSize: 14,
    color: "#16141F",
    fontFamily: "Helvetica",
  };
}

export function createDefaultWhiteout(
  pageIndex: number,
  normX: number,
  normY: number,
  normW = 0.2,
  normH = 0.04
): WhiteoutAnnotation {
  return {
    id: newAnnotationId("wo"),
    pageIndex,
    type: "whiteout",
    normX,
    normY,
    normW,
    normH,
  };
}

export function createDefaultHighlight(
  pageIndex: number,
  normX: number,
  normY: number,
  normW = 0.25,
  normH = 0.03,
  color = "#FFC53D"
): HighlightAnnotation {
  return {
    id: newAnnotationId("hl"),
    pageIndex,
    type: "highlight",
    normX,
    normY,
    normW,
    normH,
    color,
    opacity: 0.35,
  };
}

export function createDefaultShape(
  pageIndex: number,
  type: "rect" | "circle",
  normX: number,
  normY: number,
  normW = 0.2,
  normH = 0.12
): ShapeAnnotation {
  return {
    id: newAnnotationId("shp"),
    pageIndex,
    type,
    normX,
    normY,
    normW,
    normH,
    strokeColor: "#E11D48",
    strokeWidth: 2,
  };
}

/** Converts base64 data URL to Uint8Array */
export function dataUrlToBytes(dataUrl: string): Uint8Array {
  const parts = dataUrl.split(",");
  const base64 = parts[1] || "";
  if (typeof window !== "undefined" && window.atob) {
    const binary = window.atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  }
  // Node.js fallback
  return new Uint8Array(Buffer.from(base64, "base64"));
}

/** Detects PNG / JPEG from the first bytes (data URL mime types can lie, e.g. WebP saved as .png). */
export function detectImageFormat(bytes: Uint8Array): "png" | "jpg" | null {
  if (bytes.length > 8 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return "png";
  if (bytes.length > 3 && bytes[0] === 0xff && bytes[1] === 0xd8) return "jpg";
  return null;
}

/** Renders text the standard PDF fonts can't encode (Bengali, emoji, CJK…) to an image. Browser-only. */
export type TextRasterizer = (input: {
  text: string;
  fontSize: number;
  color: string;
  fontFamily: "Helvetica" | "Times" | "Courier";
  isBold?: boolean;
}) => { dataUrl: string; width: number; height: number } | null;

export interface ExportOptions {
  /** Fallback for characters outside the standard PDF fonts (WinAnsi). */
  rasterizeText?: TextRasterizer;
  /** Remove the original text under whiteouts from the content stream (default true). */
  removeHiddenText?: boolean;
}

const LINE_HEIGHT = 1.2;

/**
 * Master PDF burning engine: loads original PDF bytes and applies all annotations,
 * burning them into the PDF. Handles rotated pages and offset CropBoxes, removes text that is
 * covered by whiteouts (so it can't be searched/copied anymore) and never fails on
 * characters the standard fonts can't encode.
 */
export async function exportPdfWithAnnotations(
  pdfBytes: Uint8Array,
  annotations: Annotation[],
  options: ExportOptions = {}
): Promise<Uint8Array> {
  const pdfLib = await getPdfLib();
  const { PDFDocument, rgb, StandardFonts, degrees, PDFName, PDFArray, PDFRawStream, decodePDFRawStream } = pdfLib;
  const doc = await PDFDocument.load(pdfBytes, { updateMetadata: false });
  const removeHidden = options.removeHiddenText !== false;

  const fontCache = new Map<string, Awaited<ReturnType<typeof doc.embedFont>>>();
  const getFont = async (family: string, isBold?: boolean) => {
    const key =
      family === "Times"
        ? isBold
          ? StandardFonts.TimesRomanBold
          : StandardFonts.TimesRoman
        : family === "Courier"
        ? isBold
          ? StandardFonts.CourierBold
          : StandardFonts.Courier
        : isBold
        ? StandardFonts.HelveticaBold
        : StandardFonts.Helvetica;
    let f = fontCache.get(key);
    if (!f) {
      f = await doc.embedFont(key);
      fontCache.set(key, f);
    }
    return f;
  };

  const imageCache = new Map<string, Awaited<ReturnType<typeof doc.embedPng>> | null>();
  const embedImage = async (dataUrl: string) => {
    if (imageCache.has(dataUrl)) return imageCache.get(dataUrl)!;
    let img: Awaited<ReturnType<typeof doc.embedPng>> | null = null;
    try {
      const bytes = dataUrlToBytes(dataUrl);
      const fmt = detectImageFormat(bytes);
      if (fmt === "png") img = await doc.embedPng(bytes);
      else if (fmt === "jpg") img = await doc.embedJpg(bytes);
    } catch (err) {
      console.warn("Could not embed image annotation:", err);
    }
    imageCache.set(dataUrl, img);
    return img;
  };

  const pages = doc.getPages();
  const byPage = new Map<number, Annotation[]>();
  for (const ann of annotations) {
    if (ann.pageIndex < 0 || ann.pageIndex >= pages.length) continue;
    const list = byPage.get(ann.pageIndex) ?? [];
    list.push(ann);
    byPage.set(ann.pageIndex, list);
  }

  for (const [pageIndex, pageAnns] of byPage) {
    const page = pages[pageIndex]!;
    const crop = page.getCropBox();
    const geom: PageGeometry = {
      rotation: page.getRotation().angle,
      x0: crop.x,
      y0: crop.y,
      width: crop.width,
      height: crop.height,
    };
    const disp = displaySize(geom);
    const rotate = degrees(normalizeRotation(geom.rotation));

    // 1. Truly remove original text that sits under whiteouts (edited / deleted / redacted text).
    if (removeHidden) {
      const rects = pageAnns
        .filter((a): a is WhiteoutAnnotation => a.type === "whiteout")
        .map((a) => toPdfRect(geom, a.normX, a.normY, a.normW, a.normH));
      if (rects.length) {
        try {
          const contentsRef = page.node.get(PDFName.of("Contents"));
          const contents = contentsRef ? doc.context.lookup(contentsRef) : undefined;
          const streams: unknown[] = [];
          if (contents instanceof PDFArray) {
            for (let i = 0; i < contents.size(); i++) streams.push(doc.context.lookup(contents.get(i)));
          } else if (contents) {
            streams.push(contents);
          }
          if (streams.length && streams.every((st) => st instanceof PDFRawStream)) {
            const decoded = streams.map((st) => bytesToLatin1(decodePDFRawStream(st as import("pdf-lib").PDFRawStream).decode()));
            const joined = decoded.join("\n");
            const result = removeTextInRects(joined, rects);
            if (result.removed > 0) {
              const newStream = doc.context.flateStream(latin1ToBytes(result.content));
              page.node.set(PDFName.of("Contents"), doc.context.register(newStream));
            }
          }
        } catch (err) {
          console.warn("Could not remove hidden text (whiteout still applied):", err);
        }
      }
    }

    // 2. Draw annotations in order.
    for (const ann of pageAnns) {
      switch (ann.type) {
        case "whiteout": {
          if (ann.dataUrl) {
            const embedded = await embedImage(ann.dataUrl);
            if (embedded) {
              const anchor = uprightAnchor(geom, ann.normX, ann.normY + ann.normH);
              page.drawImage(embedded, {
                x: anchor.x,
                y: anchor.y,
                width: Math.max(1, ann.normW * disp.width),
                height: Math.max(1, ann.normH * disp.height),
                rotate,
              });
              break;
            }
          }
          const r = toPdfRect(geom, ann.normX, ann.normY, ann.normW, ann.normH);
          const { r: cr, g, b } = hexToRgb(ann.color || "#FFFFFF");
          page.drawRectangle({ ...r, color: rgb(cr, g, b), opacity: 1 });
          break;
        }

        case "highlight": {
          const r = toPdfRect(geom, ann.normX, ann.normY, ann.normW, ann.normH);
          const { r: cr, g, b } = hexToRgb(ann.color);
          page.drawRectangle({
            ...r,
            color: rgb(cr, g, b),
            opacity: ann.opacity ?? 0.35,
          });
          break;
        }

        case "rect":
        case "circle": {
          const r = toPdfRect(geom, ann.normX, ann.normY, ann.normW, ann.normH);
          const stroke = hexToRgb(ann.strokeColor);
          const fill = ann.fillColor ? hexToRgb(ann.fillColor) : undefined;
          const common = {
            borderColor: rgb(stroke.r, stroke.g, stroke.b),
            borderWidth: ann.strokeWidth || 2,
            color: fill ? rgb(fill.r, fill.g, fill.b) : undefined,
          };
          if (ann.type === "rect") page.drawRectangle({ ...r, ...common });
          else
            page.drawEllipse({
              x: r.x + r.width / 2,
              y: r.y + r.height / 2,
              xScale: r.width / 2,
              yScale: r.height / 2,
              ...common,
            });
          break;
        }

        case "draw": {
          if (ann.points.length < 2) break;
          const { r, g, b } = hexToRgb(ann.color);
          for (let i = 0; i < ann.points.length - 1; i++) {
            const p1 = ann.points[i]!;
            const p2 = ann.points[i + 1]!;
            page.drawLine({
              start: toPdfPoint(geom, p1.normX, p1.normY),
              end: toPdfPoint(geom, p2.normX, p2.normY),
              thickness: ann.strokeWidth || 2,
              color: rgb(r, g, b),
              lineCap: 1,
            });
          }
          break;
        }

        case "signature":
        case "image": {
          if (!ann.dataUrl) break;
          const embedded = await embedImage(ann.dataUrl);
          if (!embedded) break;
          const anchor = uprightAnchor(geom, ann.normX, ann.normY + ann.normH);
          page.drawImage(embedded, {
            x: anchor.x,
            y: anchor.y,
            width: Math.max(1, ann.normW * disp.width),
            height: Math.max(1, ann.normH * disp.height),
            rotate,
          });
          break;
        }

        case "text": {
          if (!ann.text.trim()) break;
          const fontSize = ann.fontSize || 14;
          const { r, g, b } = hexToRgb(ann.color);
          const font = await getFont(ann.fontFamily, ann.isBold);
          const lines = ann.text.split(/\r?\n/);

          let encodable = true;
          try {
            for (const line of lines) font.encodeText(line);
          } catch {
            encodable = false;
          }

          if (!encodable && options.rasterizeText) {
            const raster = options.rasterizeText({
              text: ann.text,
              fontSize,
              color: ann.color,
              fontFamily: ann.fontFamily,
              isBold: ann.isBold,
            });
            const embedded = raster ? await embedImage(raster.dataUrl) : null;
            if (embedded && raster) {
              const anchor = uprightAnchor(geom, ann.normX, ann.normY + raster.height / disp.height);
              page.drawImage(embedded, { x: anchor.x, y: anchor.y, width: raster.width, height: raster.height, rotate });
              break;
            }
          }

          lines.forEach((rawLine, i) => {
            const line = encodable ? rawLine : stripUnencodable(rawLine, font);
            if (!line.trim()) return;
            // Baseline sits one font-size below the box top (matches how existing text is detected).
            const baselineV = ann.normY + (fontSize + i * fontSize * LINE_HEIGHT) / disp.height;
            const anchor = uprightAnchor(geom, ann.normX, baselineV);
            page.drawText(line, { x: anchor.x, y: anchor.y, size: fontSize, font, color: rgb(r, g, b), rotate });
          });
          break;
        }
      }
    }
  }

  return doc.save();
}

/** Drops characters a standard font can't encode (last-resort fallback when no rasterizer exists). */
function stripUnencodable(text: string, font: { encodeText: (t: string) => unknown }): string {
  let out = "";
  for (const ch of text) {
    try {
      font.encodeText(ch);
      out += ch;
    } catch {
      // skip
    }
  }
  return out;
}

/**
 * Extracts and groups raw text items from PDF.js getTextContent into editable text lines
 */
export function groupPdfTextItems(
  rawItems: Array<{
    str?: string;
    transform?: number[];
    width?: number;
    height?: number;
    fontName?: string;
  }>,
  vpWidth: number,
  vpHeight: number,
  pageIndex: number
): ExistingTextItem[] {
  const items: Array<{
    str: string;
    tx: number;
    ty: number;
    w: number;
    h: number;
    fontSize: number;
    fontFamily: "Helvetica" | "Times" | "Courier";
    isBold?: boolean;
  }> = [];

  for (const it of rawItems) {
    if (!it.str || !it.str.trim() || !it.transform || it.transform.length < 6) continue;
    const tx = it.transform[4]!;
    const ty = it.transform[5]!;
    const fontSize = Math.abs(it.transform[0] || it.transform[3] || 12);
    const w = it.width || (fontSize * it.str.length * 0.5);
    const h = it.height || fontSize;
    const fn = (it.fontName || "").toLowerCase();
    const isTimes = fn.includes("times") || fn.includes("serif") || fn.includes("roman");
    const isCourier = fn.includes("courier") || fn.includes("mono");
    const isBold = fn.includes("bold") || fn.includes("black") || fn.includes("heavy");
    const fontFamily: "Helvetica" | "Times" | "Courier" = isTimes ? "Times" : isCourier ? "Courier" : "Helvetica";

    items.push({
      str: it.str,
      tx,
      ty,
      w,
      h,
      fontSize,
      fontFamily,
      isBold,
    });
  }

  // Sort top-to-bottom (PDF ty is higher near top), then left-to-right (tx)
  items.sort((a, b) => {
    if (Math.abs(a.ty - b.ty) > 4) {
      return b.ty - a.ty;
    }
    return a.tx - b.tx;
  });

  const lines: typeof items = [];
  let current: (typeof items)[0] | null = null;

  for (const it of items) {
    if (!current) {
      current = { ...it };
      continue;
    }

    const sameBaseline = Math.abs(current.ty - it.ty) <= (it.fontSize * 0.55);
    const adjacent = (it.tx - (current.tx + current.w)) <= (it.fontSize * 2.5);

    if (sameBaseline && adjacent && it.tx >= current.tx) {
      const space = (it.tx > current.tx + current.w + (it.fontSize * 0.15)) ? " " : "";
      current.str += space + it.str;
      current.w = (it.tx + it.w) - current.tx;
      current.h = Math.max(current.h, it.h);
    } else {
      lines.push(current);
      current = { ...it };
    }
  }
  if (current) lines.push(current);

  return lines.map((l, idx) => {
    const normX = Math.max(0, Math.min(1, l.tx / vpWidth));
    // In DOM, origin is top-left:
    const normY = Math.max(0, Math.min(1, (vpHeight - l.ty - l.h) / vpHeight));
    const normW = Math.max(0.01, Math.min(1, l.w / vpWidth));
    const normH = Math.max(0.01, Math.min(1, l.h / vpHeight));

    return {
      id: `orig-txt-${pageIndex}-${idx}-${Date.now().toString(36)}`,
      pageIndex,
      originalText: l.str,
      currentText: l.str,
      normX,
      normY,
      normW,
      normH,
      fontSize: Math.round(l.fontSize) || 14,
      color: "#16141F",
      fontFamily: l.fontFamily,
      isBold: l.isBold,
      isEdited: false,
      isDeleted: false,
      origNormX: normX,
      origNormY: normY,
      origNormW: normW,
      origNormH: normH,
    };
  });
}

/**
 * Merges edited/deleted existing PDF text into annotations for final export:
 * - Adds whiteout over the original location to erase the old text from the PDF.
 * - Adds a new TextAnnotation with updated text at the target coordinates.
 */
export function buildCombinedAnnotations(
  userAnnotations: Annotation[],
  existingTexts: ExistingTextItem[]
): Annotation[] {
  // Order matters: erase patches first (so they never cover images/shapes the user placed on top),
  // then the user's own annotations, then the replacement text on top of everything.
  const erase: Annotation[] = [];
  const replacements: Annotation[] = [];

  for (const item of existingTexts) {
    if (!item.isEdited && !item.isDeleted) continue;
    const unchanged =
      !item.isDeleted &&
      item.currentText === item.originalText &&
      item.normX === item.origNormX &&
      item.normY === item.origNormY &&
      !item.styleChanged;
    if (unchanged) continue; // opened for editing but nothing changed: keep the original vector text

    const padX = 0.003;
    const padY = 0.003;
    const eraseX = Math.max(0, item.origNormX - padX);
    const eraseY = Math.max(0, item.origNormY - padY);
    const eraseRight = Math.min(1, item.origNormX + item.origNormW + padX);
    const eraseBottom = Math.min(1, item.origNormY + item.origNormH + padY);
    erase.push({
      id: `whiteout-for-${item.id}`,
      pageIndex: item.pageIndex,
      type: "whiteout",
      normX: eraseX,
      normY: eraseY,
      normW: Math.max(0, eraseRight - eraseX),
      normH: Math.max(0, eraseBottom - eraseY),
      color: item.bgColor || "#FFFFFF",
      dataUrl: item.bgPatchDataUrl,
    });

    if (!item.isDeleted && item.currentText.trim()) {
      replacements.push({
        id: `text-for-${item.id}`,
        pageIndex: item.pageIndex,
        type: "text",
        normX: item.normX,
        normY: item.normY,
        text: item.currentText,
        fontSize: item.fontSize,
        color: item.color,
        fontFamily: item.fontFamily,
        isBold: item.isBold,
      });
    }
  }

  return [...erase, ...userAnnotations, ...replacements];
}

/**
 * Converts PDF.js text items to the display coordinate space (page rotation and CropBox applied),
 * keeping only horizontal text, in the y-up shape `groupPdfTextItems` expects.
 * `viewportTransform` is `page.getViewport({ scale: 1 }).transform`.
 */
export function toDisplayTextItems(
  rawItems: Array<{ str?: string; transform?: number[]; width?: number; height?: number; fontName?: string }>,
  viewportTransform: number[],
  vpHeight: number
): Array<{ str: string; transform: number[]; width: number; height: number; fontName?: string }> {
  const [va, vb, vc, vd, ve, vf] = viewportTransform as [number, number, number, number, number, number];
  const out: Array<{ str: string; transform: number[]; width: number; height: number; fontName?: string }> = [];
  for (const it of rawItems) {
    if (!it.str || !it.transform || it.transform.length < 6) continue;
    const [a, b, c, d, e, f] = it.transform as [number, number, number, number, number, number];
    // m = itemTransform × viewportTransform
    const ma = a * va + b * vc;
    const mb = a * vb + b * vd;
    const mc = c * va + d * vc;
    const md = c * vb + d * vd;
    const me = e * va + f * vc + ve;
    const mf = e * vb + f * vd + vf;
    // In viewport space y points down; horizontal text has (ma > 0, mb ≈ 0).
    if (ma <= 0 || Math.abs(mb) > Math.abs(ma) * 0.05) continue;
    const fontSize = Math.hypot(mc, md) || Math.abs(ma);
    const scaleX = Math.hypot(ma, mb) / (Math.hypot(a, b) || 1);
    out.push({
      str: it.str,
      transform: [fontSize, 0, 0, fontSize, me, vpHeight - mf],
      width: (it.width ?? 0) * scaleX,
      height: fontSize,
      fontName: it.fontName,
    });
  }
  return out;
}

/**
 * Picks the text (ink) color inside a box: the pixels that differ most from the background.
 * Browser-only (reads the rendered page canvas).
 */
export function sampleTextColor(
  sourceCanvas: HTMLCanvasElement,
  normX: number,
  normY: number,
  normW: number,
  normH: number,
  bgHex: string
): string {
  try {
    const ctx = sourceCanvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return "#16141F";
    const x = Math.max(0, Math.floor(normX * sourceCanvas.width));
    const y = Math.max(0, Math.floor(normY * sourceCanvas.height));
    const w = Math.max(1, Math.min(sourceCanvas.width - x, Math.ceil(normW * sourceCanvas.width)));
    const h = Math.max(1, Math.min(sourceCanvas.height - y, Math.ceil(normH * sourceCanvas.height)));
    const data = ctx.getImageData(x, y, w, h).data;
    const bg = hexToRgb(bgHex);
    const br = bg.r * 255;
    const bgG = bg.g * 255;
    const bb = bg.b * 255;
    const px: { r: number; g: number; b: number; d: number }[] = [];
    const step = Math.max(1, Math.floor((w * h) / 4000));
    for (let i = 0; i < data.length; i += 4 * step) {
      const r = data[i]!;
      const g = data[i + 1]!;
      const b = data[i + 2]!;
      const dist = Math.abs(r - br) + Math.abs(g - bgG) + Math.abs(b - bb);
      if (dist > 60) px.push({ r, g, b, d: dist });
    }
    if (!px.length) return "#16141F";
    px.sort((p, q) => q.d - p.d);
    const top = px.slice(0, Math.max(1, Math.floor(px.length * 0.3)));
    const avg = (k: "r" | "g" | "b") => Math.round(top.reduce((s2, p) => s2 + p[k], 0) / top.length);
    const toHex = (n: number) => Math.max(0, Math.min(255, n)).toString(16).padStart(2, "0");
    return `#${toHex(avg("r"))}${toHex(avg("g"))}${toHex(avg("b"))}`.toUpperCase();
  } catch {
    return "#16141F";
  }
}

/**
 * Captures a normalized rectangular sub-region of an HTML5 Canvas as a PNG data URL.
 * Used for cutting/moving existing graphics, images, logos, or tables.
 */
export function captureCanvasRegion(
  sourceCanvas: HTMLCanvasElement,
  normX: number,
  normY: number,
  normW: number,
  normH: number
): string | null {
  try {
    const sx = Math.max(0, Math.floor(normX * sourceCanvas.width));
    const sy = Math.max(0, Math.floor(normY * sourceCanvas.height));
    const sw = Math.min(sourceCanvas.width - sx, Math.ceil(normW * sourceCanvas.width));
    const sh = Math.min(sourceCanvas.height - sy, Math.ceil(normH * sourceCanvas.height));

    if (sw <= 0 || sh <= 0) return null;

    // Keep large lifted areas sharp while avoiding enormous temporary canvases/data URLs.
    const scale = Math.min(1, Math.sqrt(8_000_000 / (sw * sh)));
    const cropCanvas = document.createElement("canvas");
    try {
      cropCanvas.width = Math.max(1, Math.round(sw * scale));
      cropCanvas.height = Math.max(1, Math.round(sh * scale));
      const ctx = cropCanvas.getContext("2d");
      if (!ctx) return null;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(sourceCanvas, sx, sy, sw, sh, 0, 0, cropCanvas.width, cropCanvas.height);
      return cropCanvas.toDataURL("image/png");
    } finally {
      cropCanvas.width = 0;
      cropCanvas.height = 0;
    }
  } catch (err) {
    console.error("captureCanvasRegion error:", err);
    return null;
  }
}

/**
 * Samples perimeter pixels around a normalized bounding box to determine the dominant
 * background color. This ensures moved elements leave an exact matching background
 * fill instead of an ugly stark white box.
 */
export function sampleCanvasBorderColor(
  sourceCanvas: HTMLCanvasElement,
  normX: number,
  normY: number,
  normW: number,
  normH: number
): string {
  try {
    const ctx = sourceCanvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return "#FFFFFF";

    const x = Math.floor(normX * sourceCanvas.width);
    const y = Math.floor(normY * sourceCanvas.height);
    const w = Math.ceil(normW * sourceCanvas.width);
    const h = Math.ceil(normH * sourceCanvas.height);

    const samples: { r: number; g: number; b: number }[] = [];
    const getPixel = (px: number, py: number) => {
      const clampedX = Math.max(0, Math.min(sourceCanvas.width - 1, px));
      const clampedY = Math.max(0, Math.min(sourceCanvas.height - 1, py));
      const p = ctx.getImageData(clampedX, clampedY, 1, 1).data;
      return { r: p[0]!, g: p[1]!, b: p[2]! };
    };

    const margin = Math.max(3, Math.min(16, Math.round(Math.min(w, h) * 0.18)));
    const steps = 8;
    for (let i = 0; i <= steps; i++) {
      const px = Math.round(x + (w * i) / steps);
      samples.push(getPixel(px, y - margin));
      samples.push(getPixel(px, y + h + margin));
    }
    for (let j = 0; j <= steps; j++) {
      const py = Math.round(y + (h * j) / steps);
      samples.push(getPixel(x - margin, py));
      samples.push(getPixel(x + w + margin, py));
    }

    if (samples.length === 0) return "#FFFFFF";

    const avgR = Math.round(samples.reduce((s, c) => s + c.r, 0) / samples.length);
    const avgG = Math.round(samples.reduce((s, c) => s + c.g, 0) / samples.length);
    const avgB = Math.round(samples.reduce((s, c) => s + c.b, 0) / samples.length);

    const toHex = (n: number) => Math.max(0, Math.min(255, n)).toString(16).padStart(2, "0");
    return `#${toHex(avgR)}${toHex(avgG)}${toHex(avgB)}`.toUpperCase();
  } catch (err) {
    console.warn("sampleCanvasBorderColor error:", err);
    return "#FFFFFF";
  }
}

/**
 * Builds a page-background patch for an edited or lifted area. It searches nearby page pixels
 * for a patch whose edges resemble the selected area's surroundings, then feathers the seam.
 * If no suitable patch exists, it interpolates the sampled edge colours for a clean gradient
 * fill. This is a local browser-only repair, so the source PDF never leaves the device.
 */
export function createBackgroundRepairPatch(
  sourceCanvas: HTMLCanvasElement,
  normX: number,
  normY: number,
  normW: number,
  normH: number
): string | null {
  let repairCanvas: HTMLCanvasElement | null = null;
  let searchCanvas: HTMLCanvasElement | null = null;
  try {
    const sx = Math.max(0, Math.floor(normX * sourceCanvas.width));
    const sy = Math.max(0, Math.floor(normY * sourceCanvas.height));
    const sw = Math.min(sourceCanvas.width - sx, Math.ceil(normW * sourceCanvas.width));
    const sh = Math.min(sourceCanvas.height - sy, Math.ceil(normH * sourceCanvas.height));
    if (sw <= 0 || sh <= 0) return null;

    const outputScale = Math.min(1, Math.sqrt(8_000_000 / (sw * sh)));
    const outW = Math.max(1, Math.round(sw * outputScale));
    const outH = Math.max(1, Math.round(sh * outputScale));
    const sourceContext = sourceCanvas.getContext("2d", { willReadFrequently: true });
    if (!sourceContext) return null;

    // A tiny proxy keeps content-aware candidate search cheap even for high-resolution pages.
    const searchScale = Math.min(1, 512 / Math.max(sourceCanvas.width, sourceCanvas.height));
    searchCanvas = document.createElement("canvas");
    searchCanvas.width = Math.max(1, Math.round(sourceCanvas.width * searchScale));
    searchCanvas.height = Math.max(1, Math.round(sourceCanvas.height * searchScale));
    const searchContext = searchCanvas.getContext("2d", { willReadFrequently: true });
    if (!searchContext) return null;
    searchContext.drawImage(sourceCanvas, 0, 0, searchCanvas.width, searchCanvas.height);
    const proxy = searchContext.getImageData(0, 0, searchCanvas.width, searchCanvas.height);
    const pw = Math.max(1, Math.min(searchCanvas.width, Math.round(sw * searchScale)));
    const ph = Math.max(1, Math.min(searchCanvas.height, Math.round(sh * searchScale)));
    const px = Math.max(0, Math.min(searchCanvas.width - pw, Math.round(sx * searchScale)));
    const py = Math.max(0, Math.min(searchCanvas.height - ph, Math.round(sy * searchScale)));
    const pixel = (x: number, y: number) => {
      const ix = Math.max(0, Math.min(searchCanvas!.width - 1, x));
      const iy = Math.max(0, Math.min(searchCanvas!.height - 1, y));
      const i = (iy * searchCanvas!.width + ix) * 4;
      return [proxy.data[i]!, proxy.data[i + 1]!, proxy.data[i + 2]!] as const;
    };

    let best: { x: number; y: number; score: number } | null = null;
    const rangeX = Math.max(8, Math.round(pw * 2));
    const rangeY = Math.max(8, Math.round(ph * 2));
    const stepX = Math.max(2, Math.floor(pw / 2));
    const stepY = Math.max(2, Math.floor(ph / 2));
    const minX = Math.max(0, px - rangeX);
    const maxX = Math.min(searchCanvas.width - pw, px + rangeX);
    const minY = Math.max(0, py - rangeY);
    const maxY = Math.min(searchCanvas.height - ph, py + rangeY);
    const samples = 8;

    for (let cy = minY; cy <= maxY; cy += stepY) {
      for (let cx = minX; cx <= maxX; cx += stepX) {
        const overlaps = cx < px + pw + 2 && cx + pw + 2 > px && cy < py + ph + 2 && cy + ph + 2 > py;
        if (overlaps) continue;
        let error = 0;
        let count = 0;
        for (let i = 0; i < samples; i++) {
          const ratio = (i + 0.5) / samples;
          const dx = Math.min(pw - 1, Math.floor(ratio * pw));
          const dy = Math.min(ph - 1, Math.floor(ratio * ph));
          const pairs: Array<readonly [readonly number[], readonly number[]]> = [
            [pixel(cx + dx, cy), pixel(px + dx, py - 1)],
            [pixel(cx + dx, cy + ph - 1), pixel(px + dx, py + ph)],
            [pixel(cx, cy + dy), pixel(px - 1, py + dy)],
            [pixel(cx + pw - 1, cy + dy), pixel(px + pw, py + dy)],
          ];
          for (const [a, b] of pairs) {
            error += Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) + Math.abs(a[2] - b[2]);
            count += 3;
          }
        }
        // Avoid lifting a neighbouring word/line as the background patch. A patch should be
        // locally quiet; detailed photo backgrounds fall back to edge-colour interpolation.
        let luminanceSum = 0;
        let luminanceSquared = 0;
        let interiorSamples = 0;
        for (let iy = 1; iy <= 4; iy++) {
          for (let ix = 1; ix <= 4; ix++) {
            const [r, g, b] = pixel(cx + Math.floor((ix * pw) / 5), cy + Math.floor((iy * ph) / 5));
            const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
            luminanceSum += luminance;
            luminanceSquared += luminance * luminance;
            interiorSamples++;
          }
        }
        const variance = luminanceSquared / interiorSamples - (luminanceSum / interiorSamples) ** 2;
        const score = error / Math.max(1, count) + Math.max(0, variance - 180) * 0.08;
        if (!best || score < best.score) best = { x: cx, y: cy, score };
      }
    }

    repairCanvas = document.createElement("canvas");
    repairCanvas.width = outW;
    repairCanvas.height = outH;
    const repairContext = repairCanvas.getContext("2d", { willReadFrequently: true });
    if (!repairContext) return null;
    repairContext.imageSmoothingQuality = "high";

    const patchIsSimilar = best !== null && best.score < 90;
    if (patchIsSimilar && best) {
      const sourceScaleX = sourceCanvas.width / searchCanvas.width;
      const sourceScaleY = sourceCanvas.height / searchCanvas.height;
      const cloneX = Math.max(0, Math.min(sourceCanvas.width - sw, Math.round(best.x * sourceScaleX)));
      const cloneY = Math.max(0, Math.min(sourceCanvas.height - sh, Math.round(best.y * sourceScaleY)));
      repairContext.drawImage(sourceCanvas, cloneX, cloneY, sw, sh, 0, 0, outW, outH);

      // Feather only a narrow edge band so the patch meets the surrounding page without a seam.
      const patch = repairContext.getImageData(0, 0, outW, outH);
      const feather = Math.min(6, Math.max(1, Math.floor(Math.min(outW, outH) / 4)));
      const edgeTop = sourceContext.getImageData(sx, Math.max(0, sy - 1), sw, 1).data;
      const edgeBottom = sourceContext.getImageData(sx, Math.min(sourceCanvas.height - 1, sy + sh), sw, 1).data;
      const edgeLeft = sourceContext.getImageData(Math.max(0, sx - 1), sy, 1, sh).data;
      const edgeRight = sourceContext.getImageData(Math.min(sourceCanvas.width - 1, sx + sw), sy, 1, sh).data;
      for (let y = 0; y < outH; y++) {
        for (let x = 0; x < outW; x++) {
          const edgeDistance = Math.min(x, y, outW - 1 - x, outH - 1 - y);
          if (edgeDistance >= feather) continue;
          const alpha = Math.max(0, edgeDistance / feather);
          const at = (y * outW + x) * 4;
          const top = y < feather;
          const bottom = outH - 1 - y < feather;
          const left = x < feather;
          const right = outW - 1 - x < feather;
          const positions = [
            top ? Math.min(sw - 1, Math.floor((x / outW) * sw)) : -1,
            bottom ? Math.min(sw - 1, Math.floor((x / outW) * sw)) : -1,
            left ? Math.min(sh - 1, Math.floor((y / outH) * sh)) : -1,
            right ? Math.min(sh - 1, Math.floor((y / outH) * sh)) : -1,
          ];
          const indexes = [positions[0]! * 4, positions[1]! * 4, positions[2]! * 4, positions[3]! * 4];
          const channels = [0, 1, 2];
          for (const channel of channels) {
            let background = 0;
            let n = 0;
            if (top && positions[0]! >= 0) { background += edgeTop[indexes[0]! + channel]!; n++; }
            if (bottom && positions[1]! >= 0) { background += edgeBottom[indexes[1]! + channel]!; n++; }
            if (left && positions[2]! >= 0) { background += edgeLeft[indexes[2]! + channel]!; n++; }
            if (right && positions[3]! >= 0) { background += edgeRight[indexes[3]! + channel]!; n++; }
            const original = background / Math.max(1, n);
            patch.data[at + channel] = Math.round(original * (1 - alpha) + patch.data[at + channel]! * alpha);
          }
        }
      }
      repairContext.putImageData(patch, 0, 0);
    } else {
      // Smooth fallback for gradients and paper backgrounds when no neighbouring patch matches.
      const corners = [
        pixel(px, py - 1),
        pixel(px + pw - 1, py - 1),
        pixel(px, py + ph),
        pixel(px + pw - 1, py + ph),
      ];
      const gradient = repairContext.createImageData(outW, outH);
      for (let y = 0; y < outH; y++) {
        const v = outH > 1 ? y / (outH - 1) : 0;
        for (let x = 0; x < outW; x++) {
          const u = outW > 1 ? x / (outW - 1) : 0;
          const at = (y * outW + x) * 4;
          for (let c = 0; c < 3; c++) {
            const top = corners[0]![c]! * (1 - u) + corners[1]![c]! * u;
            const bottom = corners[2]![c]! * (1 - u) + corners[3]![c]! * u;
            gradient.data[at + c] = Math.round(top * (1 - v) + bottom * v);
          }
          gradient.data[at + 3] = 255;
        }
      }
      repairContext.putImageData(gradient, 0, 0);
    }

    return repairCanvas.toDataURL("image/png");
  } catch (err) {
    console.warn("Could not reconstruct the page background:", err);
    return null;
  } finally {
    if (repairCanvas) { repairCanvas.width = 0; repairCanvas.height = 0; }
    if (searchCanvas) { searchCanvas.width = 0; searchCanvas.height = 0; }
  }
}
