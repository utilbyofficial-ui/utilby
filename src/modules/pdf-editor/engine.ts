import { getPdfLib } from "@/modules/pdf/build";

export type ToolMode =
  | "select"
  | "text"
  | "draw"
  | "highlight"
  | "whiteout"
  | "rect"
  | "circle"
  | "signature"
  | "image";

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
        page.drawRectangle({
          x,
          y,
          width,
          height,
          color: rgb(1, 1, 1),
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
