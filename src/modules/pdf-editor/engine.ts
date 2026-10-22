import { getPdfLib } from "@/modules/pdf/build";

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

/**
 * Master PDF burning engine: loads original PDF bytes and applies all annotations,
 * burning them into the PDF vector layer.
 */
export async function exportPdfWithAnnotations(
  pdfBytes: Uint8Array,
  annotations: Annotation[]
): Promise<Uint8Array> {
  const pdfLib = await getPdfLib();
  const { PDFDocument, rgb, StandardFonts } = pdfLib;
  const doc = await PDFDocument.load(pdfBytes, { updateMetadata: false });

  // Pre-embed fonts
  const helvetica = await doc.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await doc.embedFont(StandardFonts.HelveticaBold);
  const times = await doc.embedFont(StandardFonts.TimesRoman);
  const courier = await doc.embedFont(StandardFonts.Courier);

  const getFont = (family: string, isBold?: boolean) => {
    if (family === "Times") return times;
    if (family === "Courier") return courier;
    return isBold ? helveticaBold : helvetica;
  };

  const pages = doc.getPages();

  for (const ann of annotations) {
    if (ann.pageIndex < 0 || ann.pageIndex >= pages.length) continue;
    const page = pages[ann.pageIndex]!;
    const pdfW = page.getWidth();
    const pdfH = page.getHeight();

    switch (ann.type) {
      case "whiteout": {
        const { x, y, width, height } = denormalizeToPdf(
          ann.normX,
          ann.normY,
          ann.normW,
          ann.normH,
          pdfW,
          pdfH
        );
        const { r, g, b } = hexToRgb(ann.color || "#FFFFFF");
        page.drawRectangle({
          x,
          y,
          width,
          height,
          color: rgb(r, g, b),
        });
        break;
      }

      case "highlight": {
        const { x, y, width, height } = denormalizeToPdf(
          ann.normX,
          ann.normY,
          ann.normW,
          ann.normH,
          pdfW,
          pdfH
        );
        const { r, g, b } = hexToRgb(ann.color);
        page.drawRectangle({
          x,
          y,
          width,
          height,
          color: rgb(r, g, b),
          opacity: ann.opacity ?? 0.35,
        });
        break;
      }

      case "text": {
        if (!ann.text.trim()) break;
        const font = getFont(ann.fontFamily, ann.isBold);
        const fontSize = ann.fontSize || 14;
        const { r, g, b } = hexToRgb(ann.color);
        const x = ann.normX * pdfW;
        // Text baseline adjustment
        const y = pdfH - ann.normY * pdfH - fontSize;
        page.drawText(ann.text, {
          x,
          y,
          size: fontSize,
          font,
          color: rgb(r, g, b),
        });
        break;
      }

      case "rect": {
        const { x, y, width, height } = denormalizeToPdf(
          ann.normX,
          ann.normY,
          ann.normW,
          ann.normH,
          pdfW,
          pdfH
        );
        const stroke = hexToRgb(ann.strokeColor);
        const fill = ann.fillColor ? hexToRgb(ann.fillColor) : undefined;
        page.drawRectangle({
          x,
          y,
          width,
          height,
          borderColor: rgb(stroke.r, stroke.g, stroke.b),
          borderWidth: ann.strokeWidth || 2,
          color: fill ? rgb(fill.r, fill.g, fill.b) : undefined,
        });
        break;
      }

      case "circle": {
        const { x, y, width, height } = denormalizeToPdf(
          ann.normX,
          ann.normY,
          ann.normW,
          ann.normH,
          pdfW,
          pdfH
        );
        const stroke = hexToRgb(ann.strokeColor);
        const fill = ann.fillColor ? hexToRgb(ann.fillColor) : undefined;
        page.drawEllipse({
          x: x + width / 2,
          y: y + height / 2,
          xScale: width / 2,
          yScale: height / 2,
          borderColor: rgb(stroke.r, stroke.g, stroke.b),
          borderWidth: ann.strokeWidth || 2,
          color: fill ? rgb(fill.r, fill.g, fill.b) : undefined,
        });
        break;
      }

      case "draw": {
        if (ann.points.length < 2) break;
        const { r, g, b } = hexToRgb(ann.color);
        const strokeWidth = ann.strokeWidth || 2;
        for (let i = 0; i < ann.points.length - 1; i++) {
          const p1 = ann.points[i]!;
          const p2 = ann.points[i + 1]!;
          page.drawLine({
            start: { x: p1.normX * pdfW, y: pdfH - p1.normY * pdfH },
            end: { x: p2.normX * pdfW, y: pdfH - p2.normY * pdfH },
            thickness: strokeWidth,
            color: rgb(r, g, b),
          });
        }
        break;
      }

      case "signature":
      case "image": {
        if (!ann.dataUrl) break;
        try {
          const imageBytes = dataUrlToBytes(ann.dataUrl);
          const isPng = ann.dataUrl.includes("image/png");
          const embedded = isPng ? await doc.embedPng(imageBytes) : await doc.embedJpg(imageBytes);
          const { x, y, width, height } = denormalizeToPdf(
            ann.normX,
            ann.normY,
            ann.normW,
            ann.normH,
            pdfW,
            pdfH
          );
          page.drawImage(embedded, {
            x,
            y,
            width,
            height,
          });
        } catch (imgErr) {
          console.warn("Could not embed image annotation:", imgErr);
        }
        break;
      }
    }
  }

  return doc.save();
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
  const result: Annotation[] = [...userAnnotations];

  for (const item of existingTexts) {
    if (!item.isEdited && !item.isDeleted) continue;

    // 1. Add whiteout over original location to erase the original text cleanly
    const padX = 0.003;
    const padY = 0.003;
    result.push({
      id: `whiteout-for-${item.id}`,
      pageIndex: item.pageIndex,
      type: "whiteout",
      normX: Math.max(0, item.origNormX - padX),
      normY: Math.max(0, item.origNormY - padY),
      normW: Math.min(1, item.origNormW + padX * 2),
      normH: Math.min(1, item.origNormH + padY * 2),
      color: item.bgColor || "#FFFFFF",
    });

    // 2. If not deleted, draw the new/edited text at its (possibly moved) location
    if (!item.isDeleted && item.currentText.trim()) {
      result.push({
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

  return result;
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
    const ctx = sourceCanvas.getContext("2d");
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
