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
export const MAX_IMAGE_PIXELS = 32_000_000;
export const MAX_BATCH_FILES = 20;
export const MAX_BATCH_BYTES = 100 * 1024 * 1024;

/** Reads dimensions from common raster headers without decoding pixel data. */
export function getImageDimensionsFromBytes(bytes: Uint8Array): { width: number; height: number } | null {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const ascii = (start: number, length: number) => String.fromCharCode(...bytes.subarray(start, start + length));
  let dimensions: { width: number; height: number } | null = null;

  if (bytes.length >= 24 && ascii(0, 8) === "\x89PNG\r\n\x1a\n") {
    dimensions = { width: view.getUint32(16), height: view.getUint32(20) };
  } else if (bytes.length >= 10 && (ascii(0, 6) === "GIF87a" || ascii(0, 6) === "GIF89a")) {
    dimensions = { width: view.getUint16(6, true), height: view.getUint16(8, true) };
  } else if (bytes.length >= 26 && ascii(0, 2) === "BM") {
    dimensions = { width: Math.abs(view.getInt32(18, true)), height: Math.abs(view.getInt32(22, true)) };
  } else if (bytes.length >= 30 && ascii(0, 4) === "RIFF" && ascii(8, 4) === "WEBP") {
    const chunk = ascii(12, 4);
    if (chunk === "VP8X") {
      dimensions = {
        width: 1 + bytes[24]! + (bytes[25]! << 8) + (bytes[26]! << 16),
        height: 1 + bytes[27]! + (bytes[28]! << 8) + (bytes[29]! << 16),
      };
    } else if (chunk === "VP8L" && bytes[20] === 0x2f) {
      dimensions = {
        width: 1 + bytes[21]! + ((bytes[22]! & 0x3f) << 8),
        height: 1 + (bytes[22]! >> 6) + (bytes[23]! << 2) + ((bytes[24]! & 0x0f) << 10),
      };
    } else if (chunk === "VP8 " && bytes.length >= 30 && bytes[23] === 0x9d && bytes[24] === 0x01 && bytes[25] === 0x2a) {
      dimensions = {
        width: view.getUint16(26, true) & 0x3fff,
        height: view.getUint16(28, true) & 0x3fff,
      };
    }
  } else if (bytes.length >= 4 && bytes[0] === 0xff && bytes[1] === 0xd8) {
    const frameMarkers = new Set([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf]);
    let offset = 2;
    while (offset + 4 <= bytes.length) {
      if (bytes[offset] !== 0xff) { offset++; continue; }
      while (bytes[offset] === 0xff) offset++;
      const marker = bytes[offset++];
      if (marker === undefined || marker === 0xda || marker === 0xd9) break;
      if (marker === 0xd8 || (marker >= 0xd0 && marker <= 0xd7) || marker === 0x01) continue;
      if (offset + 2 > bytes.length) break;
      const segmentLength = view.getUint16(offset);
      if (segmentLength < 2 || offset + segmentLength > bytes.length) break;
      if (frameMarkers.has(marker) && segmentLength >= 7) {
        dimensions = { height: view.getUint16(offset + 3), width: view.getUint16(offset + 5) };
        break;
      }
      offset += segmentLength;
    }
  }

  return dimensions && Number.isSafeInteger(dimensions.width) && Number.isSafeInteger(dimensions.height) && dimensions.width > 0 && dimensions.height > 0
    ? dimensions
    : null;
}

/** Reads at most 1 MB of a file header to preflight image dimensions before decoding. */
export async function readImageDimensions(file: Blob): Promise<{ width: number; height: number } | null> {
  const header = new Uint8Array(await file.slice(0, Math.min(file.size, 1024 * 1024)).arrayBuffer());
  return getImageDimensionsFromBytes(header);
}

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
  if (!isSupportedImage(file.type)) throw new Error("Unsupported image format.");
  if (file.size > MAX_FILE_BYTES) throw new Error("Image exceeds the 50 MB file limit.");
  const headerDimensions = await readImageDimensions(file);
  if (headerDimensions && headerDimensions.width * headerDimensions.height > MAX_IMAGE_PIXELS) {
    throw new Error(`Image is larger than the ${MAX_IMAGE_PIXELS.toLocaleString()} pixel processing limit.`);
  }
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" } as ImageBitmapOptions);
  let canvas: HTMLCanvasElement | null = null;
  try {
    const originalWidth = bitmap.width;
    const originalHeight = bitmap.height;
    if (originalWidth * originalHeight > MAX_IMAGE_PIXELS) {
      throw new Error(`Image is larger than the ${MAX_IMAGE_PIXELS.toLocaleString()} pixel processing limit.`);
    }
    const { width, height } = computeTargetDimensions(originalWidth, originalHeight, options.maxWidth, options.maxHeight);
    const outputMime = resolveOutputMime(file.type, options.format);

    canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas is not supported in this browser");
    if (outputMime === "image/jpeg") {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, width, height);
    }
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(bitmap, 0, 0, width, height);

    const quality = outputMime === "image/png" ? undefined : clampQuality(options.quality) / 100;
    let blob = await canvasToBlob(canvas, outputMime, quality);
    const actualMime = blob.type || outputMime;
    const resized = width !== originalWidth || height !== originalHeight;
    const sameFormat = actualMime === file.type;
    let keptOriginal = false;
    if (options.keepOriginalIfLarger && !resized && sameFormat && blob.size >= file.size) {
      blob = file;
      keptOriginal = true;
    }
    return { blob, width, height, originalWidth, originalHeight, outputMime: actualMime, keptOriginal };
  } finally {
    bitmap.close();
    if (canvas) { canvas.width = 0; canvas.height = 0; }
  }
}
