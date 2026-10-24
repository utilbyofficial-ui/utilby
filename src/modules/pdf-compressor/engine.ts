import type { PDFDocument } from "pdf-lib";

type PdfLibRuntime = typeof import("pdf-lib");
type PdfRef = ReturnType<PDFDocument["context"]["enumerateIndirectObjects"]>[number][0];
type PdfRawStream = ReturnType<PDFDocument["context"]["stream"]>;

export type CompressionPreset = "balanced" | "strong" | "maximum";

export interface PdfCompressionOptions {
  preset: CompressionPreset;
}

export interface ImageCompressionRequest {
  bytes: Uint8Array;
  width: number;
  height: number;
  maxDimension: number;
  quality: number;
}

export interface CompressedImage {
  bytes: Uint8Array;
  width: number;
  height: number;
}

export type ImageReencoder = (request: ImageCompressionRequest) => Promise<CompressedImage | null>;

export type CompressionProgress = {
  stage: "images" | "saving";
  current: number;
  total: number;
};

export interface PdfCompressionResult {
  bytes: Uint8Array;
  originalBytes: number;
  compressedBytes: number;
  savedBytes: number;
  savingsPercent: number;
  modifiedImages: number;
  downsampledImages: number;
  deduplicatedStreams: number;
  wasReduced: boolean;
}

export const DEFAULT_COMPRESSION_OPTIONS: PdfCompressionOptions = { preset: "balanced" };
export const MAX_PDF_BYTES = 100 * 1024 * 1024;
export const MAX_COMPRESSIBLE_IMAGES = 1500;

export const COMPRESSION_PRESETS: Record<CompressionPreset, { label: string; maxDimension: number; quality: number; description: string }> = {
  balanced: { label: "Recommended", maxDimension: 1800, quality: 0.78, description: "Good quality with a smaller file" },
  strong: { label: "Strong", maxDimension: 1400, quality: 0.64, description: "Smaller file for sharing" },
  maximum: { label: "Maximum", maxDimension: 1000, quality: 0.5, description: "Smallest file, with more visible image loss" },
};

function bytesEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
  return true;
}

function hashBytes(bytes: Uint8Array): string {
  let first = 2166136261;
  let second = 5381;
  for (let i = 0; i < bytes.length; i++) {
    first = Math.imul(first ^ bytes[i]!, 16777619) >>> 0;
    second = (Math.imul(second, 33) ^ bytes[i]!) >>> 0;
  }
  return `${bytes.length}:${first}:${second}`;
}

/** Repoints identical indirect streams to one shared object. */
export function deduplicatePdfStreams(document: PDFDocument, pdfLib: PdfLibRuntime): number {
  const context = document.context;
  const indirectObjects = context.enumerateIndirectObjects();
  const canonical = new Map<string, { ref: PdfRef; bytes: Uint8Array }>();
  const replacements = new Map<string, PdfRef>();
  const duplicateRefs: PdfRef[] = [];

  for (const [ref, object] of indirectObjects) {
    if (!(object instanceof pdfLib.PDFRawStream)) continue;
    const bytes = object.contents;
    const dictionary = object.dict.entries()
      .filter(([key]) => key.asString() !== "/Length")
      .map(([key, value]) => `${key.toString()}=${value.toString()}`)
      .sort()
      .join(";");
    const key = `${dictionary}|${hashBytes(bytes)}`;
    const existing = canonical.get(key);
    if (existing && bytesEqual(existing.bytes, bytes)) {
      replacements.set(ref.toString(), existing.ref);
      duplicateRefs.push(ref);
    } else if (!existing) {
      canonical.set(key, { ref, bytes });
    }
  }

  if (replacements.size === 0) return 0;

  const visited = new Set<object>();
  const stack: object[] = indirectObjects.map(([, object]) => object);
  while (stack.length) {
    const object = stack.pop()!;
    if (visited.has(object)) continue;
    visited.add(object);
    if (object instanceof pdfLib.PDFDict) {
      for (const [key, value] of object.entries()) {
        if (value instanceof pdfLib.PDFRef) {
          const replacement = replacements.get(value.toString());
          if (replacement) object.set(key, replacement);
        } else if (value instanceof pdfLib.PDFDict || value instanceof pdfLib.PDFArray) {
          stack.push(value);
        } else if (value instanceof pdfLib.PDFStream) {
          stack.push(value.dict);
        }
      }
    } else if (object instanceof pdfLib.PDFArray) {
      for (let i = 0; i < object.size(); i++) {
        const value = object.get(i);
        if (value instanceof pdfLib.PDFRef) {
          const replacement = replacements.get(value.toString());
          if (replacement) object.set(i, replacement);
        } else if (value instanceof pdfLib.PDFDict || value instanceof pdfLib.PDFArray) {
          stack.push(value);
        } else if (value instanceof pdfLib.PDFStream) {
          stack.push(value.dict);
        }
      }
    } else if (object instanceof pdfLib.PDFStream) {
      stack.push(object.dict);
    }
  }
  for (const key of Object.keys(context.trailerInfo) as (keyof typeof context.trailerInfo)[]) {
    const value = context.trailerInfo[key];
    if (value instanceof pdfLib.PDFRef) {
      const replacement = replacements.get(value.toString());
      if (replacement) context.trailerInfo[key] = replacement;
    }
  }
  for (const duplicate of duplicateRefs) context.delete(duplicate);
  return replacements.size;
}

function getImageDimensions(stream: PdfRawStream, pdfLib: PdfLibRuntime) {
  const dictionary = stream.dict;
  const subtype = dictionary.lookupMaybe(pdfLib.PDFName.of("Subtype"), pdfLib.PDFName);
  const filter = dictionary.lookupMaybe(pdfLib.PDFName.of("Filter"), pdfLib.PDFName);
  const colorSpace = dictionary.lookupMaybe(pdfLib.PDFName.of("ColorSpace"), pdfLib.PDFName);
  const width = dictionary.lookupMaybe(pdfLib.PDFName.of("Width"), pdfLib.PDFNumber)?.asNumber();
  const height = dictionary.lookupMaybe(pdfLib.PDFName.of("Height"), pdfLib.PDFNumber)?.asNumber();
  const bits = dictionary.lookupMaybe(pdfLib.PDFName.of("BitsPerComponent"), pdfLib.PDFNumber)?.asNumber();
  const isSupportedFilter = filter?.asString() === "/DCTDecode" || filter?.asString() === "/DCT";
  const isSupportedColor = colorSpace?.asString() === "/DeviceRGB" || colorSpace?.asString() === "/DeviceGray";

  if (
    subtype?.asString() !== "/Image" || !isSupportedFilter || !isSupportedColor ||
    !width || !height || bits !== 8 || dictionary.has(pdfLib.PDFName.of("Decode")) ||
    dictionary.has(pdfLib.PDFName.of("DecodeParms")) || dictionary.has(pdfLib.PDFName.of("Mask")) ||
    dictionary.has(pdfLib.PDFName.of("SMask")) || dictionary.has(pdfLib.PDFName.of("ImageMask"))
  ) return null;

  return { width, height };
}

export async function compressPdf(
  input: Uint8Array | ArrayBuffer,
  options: PdfCompressionOptions = DEFAULT_COMPRESSION_OPTIONS,
  reencodeImage?: ImageReencoder,
  onProgress?: (progress: CompressionProgress) => void,
): Promise<PdfCompressionResult> {
  if (input.byteLength > MAX_PDF_BYTES) throw new Error("PDF exceeds the 100 MB processing limit.");
  const pdfLib = await import("pdf-lib");
  const source = input instanceof Uint8Array ? input.slice() : new Uint8Array(input.slice(0));
  const originalBytes = source.byteLength;
  let document: PDFDocument;

  try {
    document = await pdfLib.PDFDocument.load(source, { updateMetadata: false });
  } catch (error) {
    if (error instanceof Error && /encrypt/i.test(error.message)) {
      throw new Error("This PDF is password-protected. Unlock it before compressing.");
    }
    throw new Error("This file could not be opened as a PDF. It may be damaged or unsupported.");
  }

  const preset = COMPRESSION_PRESETS[options.preset] ?? COMPRESSION_PRESETS.balanced;
  const imageRefs = document.context.enumerateIndirectObjects().filter(([, object]) =>
    object instanceof pdfLib.PDFRawStream && getImageDimensions(object, pdfLib) !== null
  );
  if (imageRefs.length > MAX_COMPRESSIBLE_IMAGES) {
    throw new Error(`This PDF contains more than ${MAX_COMPRESSIBLE_IMAGES} supported images. Use a smaller document or split it first.`);
  }
  let modifiedImages = 0;
  let downsampledImages = 0;

  if (reencodeImage && imageRefs.length) {
    for (let index = 0; index < imageRefs.length; index++) {
      const [ref, object] = imageRefs[index]!;
      if (!(object instanceof pdfLib.PDFRawStream)) continue;
      const dimensions = getImageDimensions(object, pdfLib);
      if (!dimensions) continue;
      onProgress?.({ stage: "images", current: index + 1, total: imageRefs.length });
      const result = await reencodeImage({
        bytes: object.contents.slice(),
        ...dimensions,
        maxDimension: preset.maxDimension,
        quality: preset.quality,
      });
      if (!result || result.bytes.byteLength === 0 || result.bytes.byteLength >= object.contents.byteLength) continue;
      if (result.width <= 0 || result.height <= 0 || result.width > dimensions.width || result.height > dimensions.height) continue;

      const dictionary = object.dict.clone(document.context);
      dictionary.set(pdfLib.PDFName.of("Width"), pdfLib.PDFNumber.of(result.width));
      dictionary.set(pdfLib.PDFName.of("Height"), pdfLib.PDFNumber.of(result.height));
      dictionary.set(pdfLib.PDFName.of("BitsPerComponent"), pdfLib.PDFNumber.of(8));
      dictionary.set(pdfLib.PDFName.of("ColorSpace"), pdfLib.PDFName.of("DeviceRGB"));
      dictionary.set(pdfLib.PDFName.of("Filter"), pdfLib.PDFName.of("DCTDecode"));
      document.context.assign(ref, pdfLib.PDFRawStream.of(dictionary, result.bytes));
      modifiedImages++;
      if (result.width < dimensions.width || result.height < dimensions.height) downsampledImages++;
    }
  }

  const deduplicatedStreams = deduplicatePdfStreams(document, pdfLib);
  onProgress?.({ stage: "saving", current: 1, total: 1 });
  const optimized = await document.save({ useObjectStreams: true, objectsPerTick: 50 });
  const wasReduced = optimized.byteLength < originalBytes;
  const bytes = wasReduced ? optimized : source;
  const compressedBytes = bytes.byteLength;
  const savedBytes = originalBytes - compressedBytes;

  return {
    bytes,
    originalBytes,
    compressedBytes,
    savedBytes,
    savingsPercent: originalBytes ? Math.round((savedBytes / originalBytes) * 1000) / 10 : 0,
    modifiedImages: wasReduced ? modifiedImages : 0,
    downsampledImages: wasReduced ? downsampledImages : 0,
    deduplicatedStreams: wasReduced ? deduplicatedStreams : 0,
    wasReduced,
  };
}
