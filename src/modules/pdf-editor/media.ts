"use client";

import { MAX_IMAGE_PIXELS, readImageDimensions } from "@/modules/image-compressor/engine";

/** Browser-only helpers for images and text rasterization used by the PDF editor. */

export const FONT_CSS: Record<"Helvetica" | "Times" | "Courier", string> = {
  Helvetica: "Helvetica, Arial, 'Noto Sans', 'Noto Sans Bengali', 'Nirmala UI', Vrinda, sans-serif",
  Times: "'Times New Roman', Times, 'Noto Serif', 'Noto Serif Bengali', 'Nirmala UI', serif",
  Courier: "'Courier New', Courier, 'Noto Sans Mono', monospace",
};

const LINE_HEIGHT = 1.2;

/**
 * Renders text with the browser's own fonts (so Bengali, emoji, CJK etc. shape correctly) and
 * returns a transparent PNG sized in PDF points. Baseline of the first line = fontSize from top,
 * matching how vector text is placed.
 */
export function rasterizeText(input: {
  text: string;
  fontSize: number;
  color: string;
  fontFamily: "Helvetica" | "Times" | "Courier";
  isBold?: boolean;
}): { dataUrl: string; width: number; height: number } | null {
  try {
    const SCALE = 4;
    const lines = input.text.split(/\r?\n/);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    const font = `${input.isBold ? "bold " : ""}${input.fontSize * SCALE}px ${FONT_CSS[input.fontFamily]}`;
    ctx.font = font;
    const width = Math.max(...lines.map((l) => ctx.measureText(l).width), 1);
    const lh = input.fontSize * LINE_HEIGHT * SCALE;
    canvas.width = Math.ceil(width + input.fontSize * SCALE * 0.2);
    canvas.height = Math.ceil(input.fontSize * SCALE * 1.3 + lh * (lines.length - 1));
    ctx.font = font;
    ctx.fillStyle = input.color;
    ctx.textBaseline = "alphabetic";
    lines.forEach((l, i) => ctx.fillText(l, 0, input.fontSize * SCALE + i * lh));
    return { dataUrl: canvas.toDataURL("image/png"), width: canvas.width / SCALE, height: canvas.height / SCALE };
  } catch {
    return null;
  }
}

/** Crops fully transparent margins (used for drawn signatures). */
function trimTransparent(canvas: HTMLCanvasElement): HTMLCanvasElement {
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return canvas;
  const { width, height } = canvas;
  const data = ctx.getImageData(0, 0, width, height).data;
  let minX = width,
    minY = height,
    maxX = -1,
    maxY = -1;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (data[(y * width + x) * 4 + 3]! > 8) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (maxX < 0) return canvas;
  const pad = 6;
  minX = Math.max(0, minX - pad);
  minY = Math.max(0, minY - pad);
  maxX = Math.min(width - 1, maxX + pad);
  maxY = Math.min(height - 1, maxY + pad);
  const out = document.createElement("canvas");
  out.width = maxX - minX + 1;
  out.height = maxY - minY + 1;
  const outContext = out.getContext("2d");
  if (!outContext) return canvas;
  outContext.drawImage(canvas, minX, minY, out.width, out.height, 0, 0, out.width, out.height);
  canvas.width = 0;
  canvas.height = 0;
  return out;
}

export interface LoadedImage {
  dataUrl: string;
  width: number;
  height: number;
}

/**
 * Normalizes any image (JPG, PNG, WebP, GIF, BMP, or a data URL) into a PNG/JPEG data URL that the
 * PDF can embed, applies EXIF orientation, caps the size at 2400 px and optionally trims
 * transparent margins.
 */
export async function loadImageForPdf(source: Blob | string, opts: { trim?: boolean } = {}): Promise<LoadedImage> {
  const blob = typeof source === "string" ? await (await fetch(source)).blob() : source;
  if (blob.size > 50 * 1024 * 1024) throw new Error("Image exceeds the 50 MB processing limit.");
  const headerDimensions = await readImageDimensions(blob);
  if (headerDimensions && headerDimensions.width * headerDimensions.height > MAX_IMAGE_PIXELS) {
    throw new Error(`Image is larger than the ${MAX_IMAGE_PIXELS.toLocaleString()} pixel processing limit.`);
  }
  const bitmap = await createImageBitmap(blob, { imageOrientation: "from-image" } as ImageBitmapOptions);
  let canvas: HTMLCanvasElement | null = null;
  try {
    if (bitmap.width * bitmap.height > 32_000_000) throw new Error("Image exceeds the 32 megapixel processing limit.");
    const MAX = 2400;
    const s = Math.min(1, MAX / Math.max(bitmap.width, bitmap.height));
    canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(bitmap.width * s));
    canvas.height = Math.max(1, Math.round(bitmap.height * s));
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas is not supported in this browser.");
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    if (opts.trim) canvas = trimTransparent(canvas);
    const isJpeg = blob.type === "image/jpeg" || blob.type === "image/jpg";
    const dataUrl = isJpeg ? canvas.toDataURL("image/jpeg", 0.92) : canvas.toDataURL("image/png");
    return { dataUrl, width: canvas.width, height: canvas.height };
  } finally {
    bitmap.close();
    if (canvas) { canvas.width = 0; canvas.height = 0; }
  }
}
