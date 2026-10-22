export type OutputFormat = "original" | "image/jpeg" | "image/webp" | "image/png";

export interface CompressOptions {
  /** 1–100. Ignored for PNG output (PNG is lossless). */
  quality: number;
  format: OutputFormat;
  /** 0 = no limit */
  maxWidth: number;
  /** 0 = no limit */
  maxHeight: number;
  /** If the compressed file ends up larger than the original, keep the original. */
  keepOriginalIfLarger: boolean;
}

export const DEFAULT_COMPRESS_OPTIONS: CompressOptions = {
  quality: 75,
  format: "original",
  maxWidth: 0,
  maxHeight: 0,
  keepOriginalIfLarger: true,
};

export const SUPPORTED_INPUT_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/bmp"];
export const MAX_FILE_BYTES = 50 * 1024 * 1024;

export function isSupportedImage(type: string): boolean {
  return SUPPORTED_INPUT_TYPES.includes(type.toLowerCase());
}

export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / Math.pow(1024, i);
  return `${i === 0 ? value : value.toFixed(value >= 100 ? 0 : value >= 10 ? 1 : 2)} ${units[i]}`;
}

/** Percentage saved (positive = smaller). Rounded to one decimal. */
export function computeSavings(originalBytes: number, newBytes: number): number {
  if (originalBytes <= 0) return 0;
  return Math.round(((originalBytes - newBytes) / originalBytes) * 1000) / 10;
}

/** Scales down to fit inside maxWidth × maxHeight, keeping aspect ratio. Never upscales. */
export function computeTargetDimensions(
  width: number,
  height: number,
  maxWidth: number,
  maxHeight: number
): { width: number; height: number } {
  let scale = 1;
  if (maxWidth > 0 && width > maxWidth) scale = Math.min(scale, maxWidth / width);
  if (maxHeight > 0 && height > maxHeight) scale = Math.min(scale, maxHeight / height);
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

/**
 * Picks the output MIME type. GIF and BMP can't be encoded by browsers in a useful way,
 * so "original" maps them to PNG (lossless, keeps transparency).
 */
export function resolveOutputMime(inputMime: string, format: OutputFormat): string {
  if (format !== "original") return format;
  const mime = inputMime.toLowerCase();
  if (mime === "image/jpeg" || mime === "image/webp" || mime === "image/png") return mime;
  return "image/png";
}

const EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/png": "png",
};

export function buildOutputFilename(originalName: string, outputMime: string): string {
  const ext = EXTENSIONS[outputMime] ?? "img";
  const dot = originalName.lastIndexOf(".");
  const base = (dot > 0 ? originalName.slice(0, dot) : originalName).trim() || "image";
  return `${base}-compressed.${ext}`;
}

/** Ensures unique names inside a ZIP: photo.jpg, photo (2).jpg, ... */
export function dedupeFilenames(names: string[]): string[] {
  const seen = new Map<string, number>();
  return names.map((name) => {
    const count = seen.get(name) ?? 0;
    seen.set(name, count + 1);
    if (count === 0) return name;
    const dot = name.lastIndexOf(".");
    return dot > 0 ? `${name.slice(0, dot)} (${count + 1})${name.slice(dot)}` : `${name} (${count + 1})`;
  });
}

export function clampQuality(quality: number): number {
  if (!Number.isFinite(quality)) return DEFAULT_COMPRESS_OPTIONS.quality;
  return Math.min(100, Math.max(1, Math.round(quality)));
}

export interface CompressResult {
  blob: Blob;
  width: number;
  height: number;
  originalWidth: number;
  originalHeight: number;
  outputMime: string;
  keptOriginal: boolean;
}

function canvasToBlob(canvas: HTMLCanvasElement, mime: string, quality?: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Encoding failed"))), mime, quality);
  });
}

/** Browser-only: decodes, optionally resizes, and re-encodes an image using a canvas. */
export async function compressImage(file: File, options: CompressOptions): Promise<CompressResult> {
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" } as ImageBitmapOptions);
  const originalWidth = bitmap.width;
  const originalHeight = bitmap.height;
  const { width, height } = computeTargetDimensions(originalWidth, originalHeight, options.maxWidth, options.maxHeight);
  const outputMime = resolveOutputMime(file.type, options.format);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas is not supported in this browser");

  // JPEG has no transparency: paint white so transparent areas don't turn black.
  if (outputMime === "image/jpeg") {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);
  }
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const quality = outputMime === "image/png" ? undefined : clampQuality(options.quality) / 100;
  let blob = await canvasToBlob(canvas, outputMime, quality);

  // Some browsers (e.g. older Safari) silently fall back to PNG for WebP.
  const actualMime = blob.type || outputMime;

  const resized = width !== originalWidth || height !== originalHeight;
  const sameFormat = actualMime === file.type;
  let keptOriginal = false;
  if (options.keepOriginalIfLarger && !resized && sameFormat && blob.size >= file.size) {
    blob = file;
    keptOriginal = true;
  }

  canvas.width = 0;
  canvas.height = 0;

  return { blob, width, height, originalWidth, originalHeight, outputMime: actualMime, keptOriginal };
}
