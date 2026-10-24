import { isSupportedImage, MAX_FILE_BYTES, MAX_IMAGE_PIXELS, readImageDimensions } from "@/modules/image-compressor/engine";

/** Reads the EXIF orientation (1–8) from JPEG bytes. Returns 1 when absent or not a JPEG. */
export function readJpegOrientation(bytes: Uint8Array): number {
  if (bytes.length < 4 || bytes[0] !== 0xff || bytes[1] !== 0xd8) return 1;
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let offset = 2;
  while (offset + 4 <= bytes.length) {
    if (view.getUint8(offset) !== 0xff) return 1;
    const marker = view.getUint8(offset + 1);
    const size = view.getUint16(offset + 2);
    if (marker === 0xe1 && offset + 10 <= bytes.length) {
      // "Exif\0\0"
      if (view.getUint32(offset + 4) !== 0x45786966) return 1;
      const tiff = offset + 10;
      if (tiff + 8 > bytes.length) return 1;
      const little = view.getUint16(tiff) === 0x4949;
      const ifd = tiff + view.getUint32(tiff + 4, little);
      if (ifd + 2 > bytes.length) return 1;
      const entries = view.getUint16(ifd, little);
      for (let i = 0; i < entries; i++) {
        const entry = ifd + 2 + i * 12;
        if (entry + 12 > bytes.length) return 1;
        if (view.getUint16(entry, little) === 0x0112) {
          const value = view.getUint16(entry + 8, little);
          return value >= 1 && value <= 8 ? value : 1;
        }
      }
      return 1;
    }
    if (marker === 0xda || size < 2) return 1; // start of scan: no more metadata
    offset += 2 + size;
  }
  return 1;
}

export interface PreparedImage {
  bytes: Uint8Array;
  format: "png" | "jpg";
  width: number;
  height: number;
}

/**
 * Browser-only: makes an image ready for embedding in a PDF.
 * JPEG/PNG are embedded as-is (no quality loss) unless a JPEG needs rotating for its EXIF orientation.
 * Other formats (WebP, GIF, BMP) are converted to PNG.
 */
export async function prepareImage(file: File): Promise<PreparedImage> {
  if (file.size > MAX_FILE_BYTES) throw new Error("Image exceeds the 50 MB file limit.");
  const type = file.type.toLowerCase();
  if (!isSupportedImage(type)) throw new Error("Unsupported image format.");
  const headerDimensions = await readImageDimensions(file);
  if (headerDimensions && headerDimensions.width * headerDimensions.height > MAX_IMAGE_PIXELS) {
    throw new Error(`Image is larger than the ${MAX_IMAGE_PIXELS.toLocaleString()} pixel processing limit.`);
  }
  const bytes = new Uint8Array(await file.arrayBuffer());
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" } as ImageBitmapOptions);
  let canvas: HTMLCanvasElement | null = null;
  try {
    const width = bitmap.width;
    const height = bitmap.height;
    if (width * height > 32_000_000) throw new Error("Image exceeds the 32 megapixel processing limit.");
    const isJpeg = type === "image/jpeg" || type === "image/jpg";
    if (type === "image/png" || (isJpeg && readJpegOrientation(bytes) === 1)) {
      return { bytes, format: isJpeg ? "jpg" : "png", width, height };
    }

    canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas is not supported in this browser");
    if (isJpeg) {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, width, height);
    }
    ctx.drawImage(bitmap, 0, 0);
    const outType = isJpeg ? "image/jpeg" : "image/png";
    const blob: Blob = await new Promise((resolve, reject) =>
      canvas!.toBlob((b) => (b ? resolve(b) : reject(new Error("Image conversion failed"))), outType, 0.95)
    );
    return { bytes: new Uint8Array(await blob.arrayBuffer()), format: isJpeg ? "jpg" : "png", width, height };
  } finally {
    bitmap.close();
    if (canvas) { canvas.width = 0; canvas.height = 0; }
  }
}
