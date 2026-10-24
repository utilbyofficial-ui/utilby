import { describe, it, expect } from "vitest";
import {
  formatBytes,
  computeSavings,
  computeTargetDimensions,
  resolveOutputMime,
  buildOutputFilename,
  dedupeFilenames,
  clampQuality,
  isSupportedImage,
  getImageDimensionsFromBytes,
} from "./engine";

describe("Image Compressor Engine", () => {
  it("formats byte sizes for humans", () => {
    expect(formatBytes(0)).toBe("0 B");
    expect(formatBytes(512)).toBe("512 B");
    expect(formatBytes(1536)).toBe("1.50 KB");
    expect(formatBytes(5 * 1024 * 1024)).toBe("5.00 MB");
    expect(formatBytes(250 * 1024)).toBe("250 KB");
  });

  it("computes percentage saved", () => {
    expect(computeSavings(1000, 250)).toBe(75);
    expect(computeSavings(1000, 1200)).toBe(-20);
    expect(computeSavings(0, 100)).toBe(0);
  });

  it("scales down to fit the max box and never upscales", () => {
    expect(computeTargetDimensions(4000, 3000, 1920, 0)).toEqual({ width: 1920, height: 1440 });
    expect(computeTargetDimensions(3000, 4000, 1920, 1080)).toEqual({ width: 810, height: 1080 });
    expect(computeTargetDimensions(800, 600, 1920, 1080)).toEqual({ width: 800, height: 600 });
    expect(computeTargetDimensions(800, 600, 0, 0)).toEqual({ width: 800, height: 600 });
  });

  it("resolves output formats", () => {
    expect(resolveOutputMime("image/jpeg", "original")).toBe("image/jpeg");
    expect(resolveOutputMime("image/gif", "original")).toBe("image/png");
    expect(resolveOutputMime("image/png", "image/webp")).toBe("image/webp");
  });

  it("builds output filenames with the right extension", () => {
    expect(buildOutputFilename("holiday.photo.PNG", "image/webp")).toBe("holiday.photo-compressed.webp");
    expect(buildOutputFilename("scan", "image/jpeg")).toBe("scan-compressed.jpg");
  });

  it("dedupes filenames for ZIP export", () => {
    expect(dedupeFilenames(["a.jpg", "a.jpg", "b.jpg", "a.jpg"])).toEqual(["a.jpg", "a (2).jpg", "b.jpg", "a (3).jpg"]);
  });

  it("clamps quality and validates input types", () => {
    expect(clampQuality(0)).toBe(1);
    expect(clampQuality(150)).toBe(100);
    expect(clampQuality(NaN)).toBe(75);
    expect(isSupportedImage("image/JPEG")).toBe(true);
    expect(isSupportedImage("application/pdf")).toBe(false);
  });

  it("reads PNG and JPEG dimensions from headers without decoding", () => {
    const png = new Uint8Array(24);
    png.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    new DataView(png.buffer).setUint32(16, 640);
    new DataView(png.buffer).setUint32(20, 480);
    expect(getImageDimensionsFromBytes(png)).toEqual({ width: 640, height: 480 });

    const jpeg = Uint8Array.from([0xff, 0xd8, 0xff, 0xc0, 0x00, 0x11, 0x08, 0x00, 0x02, 0x00, 0x03, 0x01, 0x01, 0x11, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]);
    expect(getImageDimensionsFromBytes(jpeg)).toEqual({ width: 3, height: 2 });
  });
});
