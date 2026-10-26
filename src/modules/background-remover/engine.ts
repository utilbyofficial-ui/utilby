export const MAX_BACKGROUND_REMOVER_FILE_BYTES = 30 * 1024 * 1024;
export const MAX_BACKGROUND_REMOVER_PIXELS = 24_000_000;
export const MAX_BACKGROUND_REMOVER_DIMENSION = 16_000;
export const MAX_MASK_EDGE = 2_048;
export const MAX_MODEL_INPUT_EDGE = 1_536;

export const BACKGROUND_REMOVER_INPUT_TYPES = ["image/jpeg", "image/png", "image/webp", "image/bmp"] as const;
export type BackgroundRemoverInputType = (typeof BACKGROUND_REMOVER_INPUT_TYPES)[number];
export type BackgroundMode = "transparent" | "color" | "blur" | "image";
export type ExportFormat = "image/png" | "image/jpeg" | "image/webp";
export type BrushMode = "erase" | "restore";

const MIME_BY_EXTENSION: Record<string, BackgroundRemoverInputType> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  bmp: "image/bmp",
};

const OUTPUT_EXTENSION: Record<ExportFormat, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
};

export function getBackgroundInputMime(file: Pick<File, "name" | "type">): BackgroundRemoverInputType | null {
  const type = file.type.toLowerCase();
  if (BACKGROUND_REMOVER_INPUT_TYPES.includes(type as BackgroundRemoverInputType)) {
    return type as BackgroundRemoverInputType;
  }
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  return MIME_BY_EXTENSION[ext] ?? null;
}

export function validateBackgroundInput(file: Pick<File, "name" | "type" | "size">): string | null {
  if (!getBackgroundInputMime(file)) return "Choose a JPG, PNG, WebP, or BMP image.";
  if (file.size <= 0) return "This image file is empty.";
  if (file.size > MAX_BACKGROUND_REMOVER_FILE_BYTES) return "Choose an image smaller than 30 MB for reliable browser processing.";
  return null;
}

export function validateImageDimensions(width: number, height: number): string | null {
  if (!Number.isSafeInteger(width) || !Number.isSafeInteger(height) || width <= 0 || height <= 0) {
    return "The image dimensions could not be read. Try another image.";
  }
  if (width > MAX_BACKGROUND_REMOVER_DIMENSION || height > MAX_BACKGROUND_REMOVER_DIMENSION) {
    return "This image is too large to edit safely in a browser. Choose an image with sides under 16,000 pixels.";
  }
  if (width * height > MAX_BACKGROUND_REMOVER_PIXELS) {
    return "This image has too many pixels for reliable editing in a browser. Resize it first, then try again.";
  }
  return null;
}

export function fitWithin(width: number, height: number, maxEdge: number): { width: number; height: number } {
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
    throw new RangeError("Image dimensions must be positive numbers.");
  }
  if (!Number.isFinite(maxEdge) || maxEdge < 1) throw new RangeError("Maximum edge must be at least one pixel.");
  const scale = Math.min(1, maxEdge / Math.max(width, height));
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

export function getMaskDimensions(width: number, height: number): { width: number; height: number } {
  return fitWithin(width, height, MAX_MASK_EDGE);
}

export function getModelInputDimensions(width: number, height: number): { width: number; height: number } {
  return fitWithin(width, height, MAX_MODEL_INPUT_EDGE);
}

export function extractAlphaChannel(
  pixels: ArrayLike<number>,
  width: number,
  height: number,
  channels: number
): Uint8Array {
  if (!Number.isSafeInteger(width) || !Number.isSafeInteger(height) || width < 1 || height < 1) {
    throw new RangeError("Mask dimensions are invalid.");
  }
  if (![2, 4].includes(channels)) throw new RangeError("The background model did not return an alpha mask.");
  const count = width * height;
  if (!Number.isSafeInteger(count) || pixels.length < count * channels) {
    throw new RangeError("The background model returned incomplete image data.");
  }
  const alpha = new Uint8Array(count);
  for (let pixel = 0; pixel < count; pixel++) alpha[pixel] = pixels[pixel * channels + channels - 1] ?? 0;
  return alpha;
}

export function hasUsableAlphaMask(alpha: ArrayLike<number>, minimumAlpha = 64): boolean {
  if (!Number.isFinite(minimumAlpha) || minimumAlpha < 0 || alpha.length === 0) return false;
  let max = 0;
  for (let i = 0; i < alpha.length; i++) {
    const value = alpha[i] ?? 0;
    if (Number.isFinite(value)) max = Math.max(max, value);
  }
  return max >= minimumAlpha;
}

export function mapPointerToMask(
  clientX: number,
  clientY: number,
  rect: Pick<DOMRect, "left" | "top" | "width" | "height">,
  maskWidth: number,
  maskHeight: number
): { x: number; y: number } | null {
  if (rect.width <= 0 || rect.height <= 0 || maskWidth <= 0 || maskHeight <= 0) return null;
  const rx = (clientX - rect.left) / rect.width;
  const ry = (clientY - rect.top) / rect.height;
  if (rx < 0 || rx > 1 || ry < 0 || ry > 1) return null;
  return {
    x: Math.min(maskWidth - 1, Math.max(0, Math.round(rx * (maskWidth - 1)))),
    y: Math.min(maskHeight - 1, Math.max(0, Math.round(ry * (maskHeight - 1)))),
  };
}

export function clampBrushSize(value: number): number {
  if (!Number.isFinite(value)) return 36;
  return Math.min(120, Math.max(4, Math.round(value)));
}

export function clampEdgeSoftness(value: number): number {
  if (!Number.isFinite(value)) return 20;
  return Math.min(100, Math.max(0, Math.round(value)));
}

export function buildBackgroundOutputName(originalName: string, format: ExportFormat): string {
  const dot = originalName.lastIndexOf(".");
  const candidate = (dot > 0 ? originalName.slice(0, dot) : originalName).trim();
  const base = candidate.startsWith(".") ? "image" : candidate || "image";
  return `${base}-background-removed.${OUTPUT_EXTENSION[format]}`;
}

export function formatImageDimensions(width: number, height: number): string {
  return `${width.toLocaleString()} × ${height.toLocaleString()} px`;
}
