export const MAX_CROP_PDF_BYTES = 100 * 1024 * 1024;
export const MAX_CROP_PDF_PAGES = 300;
export const PDF_POINTS_PER_MM = 72 / 25.4;
export const MIN_CROPPED_EDGE_POINTS = 18;

export interface CropMarginsMm {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface PdfRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface CropViewport {
  width: number;
  height: number;
  convertToPdfPoint(x: number, y: number): number[];
}

export function isCropPdfFile(file: Pick<File, "name" | "type">): boolean {
  return file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
}

function getCropInsets(width: number, height: number, unitsPerPdfPoint: number, margins: CropMarginsMm) {
  if (![width, height, unitsPerPdfPoint, margins.top, margins.right, margins.bottom, margins.left].every(Number.isFinite)) return null;
  if (width <= 0 || height <= 0 || unitsPerPdfPoint <= 0 || Object.values(margins).some((value) => value < 0)) return null;

  const pointScale = PDF_POINTS_PER_MM * unitsPerPdfPoint;
  const insets = {
    left: margins.left * pointScale,
    top: margins.top * pointScale,
    right: margins.right * pointScale,
    bottom: margins.bottom * pointScale,
  };
  const minEdge = MIN_CROPPED_EDGE_POINTS * unitsPerPdfPoint;
  if (insets.left + insets.right > width - minEdge || insets.top + insets.bottom > height - minEdge) return null;
  return insets;
}

/** Returns the on-screen crop rectangle in the PDF.js viewport's coordinate space. */
export function getCropPreviewRect(
  width: number,
  height: number,
  unitsPerPdfPoint: number,
  margins: CropMarginsMm
): PdfRect | null {
  const insets = getCropInsets(width, height, unitsPerPdfPoint, margins);
  if (!insets) return null;
  return {
    x: insets.left,
    y: insets.top,
    width: width - insets.left - insets.right,
    height: height - insets.top - insets.bottom,
  };
}

/** Converts visible-page margins into the unrotated PDF user-space CropBox. */
export function getCropBoxForMargins(
  viewport: CropViewport,
  unitsPerPdfPoint: number,
  margins: CropMarginsMm
): PdfRect {
  const insets = getCropInsets(viewport.width, viewport.height, unitsPerPdfPoint, margins);
  if (!insets) throw new Error("These margins leave too little page area. Reduce one or more values and try again.");

  const x0 = insets.left;
  const y0 = insets.top;
  const x1 = viewport.width - insets.right;
  const y1 = viewport.height - insets.bottom;
  const points = [
    viewport.convertToPdfPoint(x0, y0),
    viewport.convertToPdfPoint(x1, y0),
    viewport.convertToPdfPoint(x1, y1),
    viewport.convertToPdfPoint(x0, y1),
  ];
  const xs = points.map(([x]) => x);
  const ys = points.map(([, y]) => y);
  const left = Math.min(...xs);
  const right = Math.max(...xs);
  const bottom = Math.min(...ys);
  const top = Math.max(...ys);
  const box = { x: left, y: bottom, width: right - left, height: top - bottom };
  if (!Object.values(box).every(Number.isFinite) || box.width < MIN_CROPPED_EDGE_POINTS || box.height < MIN_CROPPED_EDGE_POINTS) {
    throw new Error("This page cannot be cropped to those margins. Reduce one or more values and try again.");
  }
  return box;
}

export function cleanCropFilename(filename: string): string {
  const base = filename.replace(/\.pdf$/i, "").trim();
  const safe = base.replace(/[^\p{L}\p{M}\p{N} _.-]/gu, "").replace(/\s+/g, "-").replace(/-+/g, "-");
  return safe || "cropped-document";
}
