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
        case "whiteout":
        case "highlight": {
          const r = toPdfRect(geom, ann.normX, ann.normY, ann.normW, ann.normH);
          const { r: cr, g, b } = hexToRgb(ann.type === "whiteout" ? ann.color || "#FFFFFF" : ann.color);
          page.drawRectangle({
            ...r,
            color: rgb(cr, g, b),
            opacity: ann.type === "highlight" ? ann.opacity ?? 0.35 : 1,
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
    erase.push({
      id: `whiteout-for-${item.id}`,
      pageIndex: item.pageIndex,
      type: "whiteout",
      normX: Math.max(0, item.origNormX - padX),
      normY: Math.max(0, item.origNormY - padY),
      normW: Math.min(1, item.origNormW + padX * 2),
      normH: Math.min(1, item.origNormH + padY * 2),
      color: item.bgColor || "#FFFFFF",
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
    const sx = Math.floor(normX * sourceCanvas.width);
    const sy = Math.floor(normY * sourceCanvas.height);
    const sw = Math.ceil(normW * sourceCanvas.width);
    const sh = Math.ceil(normH * sourceCanvas.height);

    if (sw <= 0 || sh <= 0) return null;

    const cropCanvas = document.createElement("canvas");
    cropCanvas.width = sw;
    cropCanvas.height = sh;
    const ctx = cropCanvas.getContext("2d");
    if (!ctx) return null;

    ctx.drawImage(sourceCanvas, sx, sy, sw, sh, 0, 0, sw, sh);
    return cropCanvas.toDataURL("image/png");
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

    const steps = 8;
    for (let i = 0; i <= steps; i++) {
      const px = Math.round(x + (w * i) / steps);
      samples.push(getPixel(px, y - 2));
      samples.push(getPixel(px, y + h + 2));
    }
    for (let j = 0; j <= steps; j++) {
      const py = Math.round(y + (h * j) / steps);
      samples.push(getPixel(x - 2, py));
      samples.push(getPixel(x + w + 2, py));
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
