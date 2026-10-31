import { describe, expect, it } from "vitest";
import {
  WATERMARK_MAX_FILE_BYTES,
  cloneSelectionRegion,
  decodeImage,
  getSelectionBounds,
  inpaintRegion,
  isWatermarkImageType,
  outputFilename,
  previewSize,
} from "./engine";

function makeGradient(width: number, height: number): Uint8ClampedArray {
  const pixels = new Uint8ClampedArray(width * height * 4);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const offset = (y * width + x) * 4;
      pixels[offset] = 20 + x * 11 + y * 3;
      pixels[offset + 1] = 35 + x * 2 + y * 9;
      pixels[offset + 2] = 70 + x * 4 + y * 5;
      pixels[offset + 3] = 255;
    }
  }
  return pixels;
}

describe("watermark remover image handling", () => {
  it("recognizes supported formats and rejects animated or unsupported types", () => {
    expect(isWatermarkImageType("image/jpeg")).toBe(true);
    expect(isWatermarkImageType("IMAGE/PNG")).toBe(true);
    expect(isWatermarkImageType("image/webp")).toBe(true);
    expect(isWatermarkImageType("image/bmp")).toBe(true);
    expect(isWatermarkImageType("image/gif")).toBe(false);
    expect(isWatermarkImageType("image/heic")).toBe(false);
    expect(isWatermarkImageType("")).toBe(false);
  });

  it("rejects unsupported and oversized files before browser-only image decoding", async () => {
    const gif = { type: "image/gif", size: 100 } as File;
    const oversizedJpg = { type: "image/jpeg", size: WATERMARK_MAX_FILE_BYTES + 1 } as File;
    await expect(decodeImage(gif)).rejects.toThrow(/JPG, PNG, WebP, or BMP/i);
    await expect(decodeImage(oversizedJpg)).rejects.toThrow(/50 MB/i);
  });

  it("fits large previews within bounds without enlarging small images", () => {
    expect(previewSize(4_000, 6_000)).toEqual({ width: 800, height: 1_200 });
    expect(previewSize(1_200, 800)).toEqual({ width: 1_200, height: 800 });
  });

  it("builds a PNG filename from the original name", () => {
    expect(outputFilename("family.photo.JPG")).toBe("family.photo-watermark-removed.png");
    expect(outputFilename(".hidden")).toBe(".hidden-watermark-removed.png");
    expect(outputFilename("")).toBe("image-watermark-removed.png");
  });
});

describe("watermark selection geometry", () => {
  it("returns null for an empty selection and includes the brush margin", () => {
    expect(getSelectionBounds([], 1_000, 500)).toBeNull();
    expect(getSelectionBounds([
      { points: [{ x: 0.5, y: 0.5 }], width: 0.04 },
    ], 1_000, 500)).toEqual({ left: 420, top: 170, right: 580, bottom: 330 });
  });

  it("clips brush bounds to the image edges", () => {
    expect(getSelectionBounds([
      { points: [{ x: 0, y: 0 }], width: 0.2 },
    ], 100, 80)).toEqual({ left: 0, top: 0, right: 40, bottom: 40 });
  });
});

describe("watermark smart fill", () => {
  it("reconstructs a selected pixel from its neighbors and preserves unselected pixels", async () => {
    const width = 5;
    const height = 5;
    const data = makeGradient(width, height);
    const original = new Uint8ClampedArray(data);
    const center = (2 * width + 2) * 4;
    data.set([250, 0, 250, 255], center);
    original.set([250, 0, 250, 255], center);
    const mask = new Uint8ClampedArray(width * height);
    mask[2 * width + 2] = 255;

    await inpaintRegion(data, original, mask, width, height);

    expect(Array.from(data.slice(center, center + 4))).not.toEqual([250, 0, 250, 255]);
    expect(data[center + 3]).toBe(255);
    for (let pixel = 0; pixel < width * height; pixel++) {
      if (pixel === 2 * width + 2) continue;
      expect(Array.from(data.slice(pixel * 4, pixel * 4 + 4))).toEqual(Array.from(original.slice(pixel * 4, pixel * 4 + 4)));
    }
  });

  it("fills a connected multi-pixel selection without changing outside pixels", async () => {
    const width = 6;
    const height = 5;
    const data = makeGradient(width, height);
    const original = new Uint8ClampedArray(data);
    const mask = new Uint8ClampedArray(width * height);
    const selected = [2 * width + 2, 2 * width + 3, 3 * width + 2, 3 * width + 3];
    for (const pixel of selected) {
      data.set([255, 0, 255, 255], pixel * 4);
      original.set([255, 0, 255, 255], pixel * 4);
      mask[pixel] = 255;
    }

    await inpaintRegion(data, original, mask, width, height);

    for (const pixel of selected) {
      expect(Array.from(data.slice(pixel * 4, pixel * 4 + 3))).not.toEqual([255, 0, 255]);
    }
    for (let pixel = 0; pixel < width * height; pixel++) {
      if (selected.includes(pixel)) continue;
      expect(Array.from(data.slice(pixel * 4, pixel * 4 + 4))).toEqual(Array.from(original.slice(pixel * 4, pixel * 4 + 4)));
    }
  });

  it("keeps a fully selected region unchanged when it has no unmarked boundary pixels", async () => {
    const width = 3;
    const height = 3;
    const data = makeGradient(width, height);
    const original = new Uint8ClampedArray(data);
    const mask = new Uint8ClampedArray(width * height).fill(255);

    await inpaintRegion(data, original, mask, width, height);

    expect(data).toEqual(original);
  });
});

describe("watermark clone fill", () => {
  it("copies selected pixels from the offset source and blends soft mask edges", async () => {
    const original = new Uint8ClampedArray([
      255, 0, 255, 255, 255, 0, 255, 255,
      255, 0, 255, 255, 255, 0, 255, 255,
    ]);
    const data = new Uint8ClampedArray(original);
    const maskAlpha = new Uint8ClampedArray([255, 0, 128, 255]);
    const source = new Uint8ClampedArray([
      11, 21, 31, 255, 12, 22, 32, 255,
      13, 23, 33, 255, 14, 24, 34, 255,
    ]);

    await cloneSelectionRegion({
      data,
      original,
      maskAlpha,
      width: 2,
      height: 2,
      fullWidth: 6,
      fullHeight: 4,
      left: 2,
      top: 1,
      offsetX: 2,
      offsetY: 0,
      source: { data: source, width: 2, height: 2, left: 0, top: 1 },
    });

    expect(Array.from(data.slice(0, 4))).toEqual([11, 21, 31, 255]);
    expect(Array.from(data.slice(4, 8))).toEqual([255, 0, 255, 255]);
    expect(data[8]).toBeGreaterThan(128);
    expect(data[8]).toBeLessThan(140);
    expect(data[9]).toBeGreaterThan(8);
    expect(data[9]).toBeLessThan(16);
    expect(Array.from(data.slice(12, 16))).toEqual([14, 24, 34, 255]);
  });

  it("leaves pixels unchanged when their offset source falls outside the image", async () => {
    const original = new Uint8ClampedArray([100, 120, 140, 255]);
    const data = new Uint8ClampedArray(original);

    await cloneSelectionRegion({
      data,
      original,
      maskAlpha: new Uint8ClampedArray([255]),
      width: 1,
      height: 1,
      fullWidth: 2,
      fullHeight: 2,
      left: 0,
      top: 0,
      offsetX: 1,
      offsetY: 0,
      source: { data: new Uint8ClampedArray([1, 2, 3, 255]), width: 1, height: 1, left: 0, top: 0 },
    });

    expect(data).toEqual(original);
  });
});
