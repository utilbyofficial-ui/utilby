import { heicTo } from "../vendor/heic-to-1.6.6.next.js";

const HEIF_BRANDS = new Set([
  "heic",
  "heix",
  "hevc",
  "hevx",
  "heim",
  "heis",
  "hevm",
  "hevs",
  "mif1",
  "mif2",
  "msf1",
  "miaf",
]);
const MAX_IMAGE_PIXELS = 32_000_000;
const MAX_PREFLIGHT_BYTES = 8 * 1024 * 1024;
const JPEG_START_OF_FRAME = new Set([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf]);

async function readOutputDimensions(blob, format) {
  const bytes = new Uint8Array(await blob.slice(0, Math.min(blob.size, 1024 * 1024)).arrayBuffer());
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);

  if (
    format === "image/png" &&
    bytes.length >= 24 &&
    bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47 &&
    bytes[12] === 0x49 && bytes[13] === 0x48 && bytes[14] === 0x44 && bytes[15] === 0x52
  ) {
    return { width: view.getUint32(16), height: view.getUint32(20) };
  }

  if (format === "image/jpeg" && bytes.length >= 4 && bytes[0] === 0xff && bytes[1] === 0xd8) {
    let offset = 2;
    while (offset + 3 < bytes.length) {
      if (bytes[offset] !== 0xff) {
        offset += 1;
        continue;
      }
      while (bytes[offset] === 0xff) offset += 1;
      const marker = bytes[offset++];
      if (marker === 0x00 || marker === 0xd9 || marker === 0xda) break;
      if (marker === 0xd8 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) continue;
      if (offset + 2 > bytes.length) break;

      const segmentLength = view.getUint16(offset);
      if (segmentLength < 2 || offset + segmentLength > bytes.length) break;
      if (JPEG_START_OF_FRAME.has(marker) && segmentLength >= 7) {
        const height = view.getUint16(offset + 3);
        const width = view.getUint16(offset + 5);
        if (width > 0 && height > 0) return { width, height };
      }
      offset += segmentLength;
    }
  }

  return null;
}

function readBoxes(view, start, end) {
  const boxes = [];
  let offset = start;
  while (offset + 8 <= end) {
    const size32 = view.getUint32(offset);
    const type = String.fromCharCode(
      view.getUint8(offset + 4),
      view.getUint8(offset + 5),
      view.getUint8(offset + 6),
      view.getUint8(offset + 7)
    );
    let headerSize = 8;
    let boxSize = size32;
    if (size32 === 1) {
      if (offset + 16 > end) return null;
      const largeSize = view.getBigUint64(offset + 8);
      if (largeSize > BigInt(Number.MAX_SAFE_INTEGER)) return null;
      boxSize = Number(largeSize);
      headerSize = 16;
    } else if (size32 === 0) {
      boxSize = end - offset;
    }
    if (boxSize < headerSize) return null;
    if (offset + boxSize > end) return type === "mdat" ? boxes : null;
    boxes.push({ type, start: offset, dataStart: offset + headerSize, end: offset + boxSize });
    offset += boxSize;
  }
  return boxes;
}

async function readSafeDimensions(file) {
  if (!file || file.size < 16) throw new Error("This file does not appear to be a supported HEIC or HEIF photo.");
  const bytes = new Uint8Array(await file.slice(0, Math.min(file.size, MAX_PREFLIGHT_BYTES)).arrayBuffer());
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const topBoxes = readBoxes(view, 0, bytes.length);
  if (!topBoxes) throw new Error("This HEIC file has an invalid header.");

  const fileType = topBoxes.find((box) => box.type === "ftyp");
  if (!fileType || fileType.dataStart + 8 > fileType.end) {
    throw new Error("This file does not appear to be a supported HEIC or HEIF photo.");
  }
  const majorBrand = String.fromCharCode(
    view.getUint8(fileType.dataStart),
    view.getUint8(fileType.dataStart + 1),
    view.getUint8(fileType.dataStart + 2),
    view.getUint8(fileType.dataStart + 3)
  );
  if (!HEIF_BRANDS.has(majorBrand)) {
    throw new Error("This file does not appear to be a supported HEIC or HEIF photo.");
  }

  const metadata = topBoxes.find((box) => box.type === "meta");
  if (!metadata || metadata.end > bytes.length || metadata.dataStart + 4 > metadata.end) {
    throw new Error("This HEIC photo has too much or damaged metadata to process safely.");
  }
  const metaChildren = readBoxes(view, metadata.dataStart + 4, metadata.end);
  if (!metaChildren) throw new Error("This HEIC photo has damaged metadata.");
  const imageProperties = metaChildren.find((box) => box.type === "iprp");
  const propertyChildren = imageProperties && readBoxes(view, imageProperties.dataStart, imageProperties.end);
  const imagePropertyContainer = propertyChildren?.find((box) => box.type === "ipco");
  const imagePropertiesList = imagePropertyContainer && readBoxes(view, imagePropertyContainer.dataStart, imagePropertyContainer.end);
  const dimensions = (imagePropertiesList ?? [])
    .filter((box) => box.type === "ispe" && box.dataStart + 12 <= box.end)
    .map((box) => ({ width: view.getUint32(box.dataStart + 4), height: view.getUint32(box.dataStart + 8) }))
    .filter((image) => image.width > 0 && image.height > 0);

  if (!dimensions.length) throw new Error("The photo dimensions could not be read safely. Try exporting it again from Photos.");
  if (dimensions.some((image) => image.width * image.height > MAX_IMAGE_PIXELS)) {
    throw new Error(`This photo is larger than the ${MAX_IMAGE_PIXELS.toLocaleString()}-pixel safety limit.`);
  }
  return dimensions[0];
}

self.addEventListener("message", async (event) => {
  const { id, file, format, quality } = event.data ?? {};

  try {
    const dimensions = await readSafeDimensions(file);
    if (format !== "image/jpeg" && format !== "image/png") {
      throw new Error("Choose JPG or PNG as the output format.");
    }

    const blob = await heicTo({ blob: file, type: format, quality });
    if (!(blob instanceof Blob) || blob.size === 0) {
      throw new Error("The converter returned an empty image.");
    }
    const outputDimensions = (await readOutputDimensions(blob, format)) ?? dimensions;
    self.postMessage({ id, blob, dimensions: outputDimensions });
  } catch (error) {
    self.postMessage({
      id,
      error: error instanceof Error ? error.message : "This HEIC photo could not be converted.",
    });
  }
});
