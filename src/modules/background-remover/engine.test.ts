import { describe, expect, it } from "vitest";
import {
  MAX_BACKGROUND_REMOVER_FILE_BYTES,
  MAX_PREVIEW_ZOOM,
  MIN_PREVIEW_ZOOM,
  buildBackgroundOutputName,
  clampBrushSize,
  clampEdgeSoftness,
  clampPreviewZoom,
  extractAlphaChannel,
  fitWithin,
  formatImageDimensions,
  getPreviewDisplaySize,
  getBackgroundInputMime,
  getMaskDimensions,
  getModelInputDimensions,
  hasUsableAlphaMask,
  mapPointerToMask,
  validateBackgroundInput,
  validateImageDimensions,
  zoomPreviewByWheel,
} from "./engine";

describe("background remover input guards", () => {
  it("accepts supported image MIME types and safe extension fallbacks", () => {
    expect(getBackgroundInputMime({ name: "portrait.jpg", type: "image/jpeg" })).toBe("image/jpeg");
    expect(getBackgroundInputMime({ name: "portrait.PNG", type: "" })).toBe("image/png");
    expect(getBackgroundInputMime({ name: "portrait.heic", type: "image/heic" })).toBeNull();
    expect(validateBackgroundInput({ name: "portrait.webp", type: "", size: 10 })).toBeNull();
  });

  it("rejects empty, unsupported and oversized files with readable messages", () => {
    expect(validateBackgroundInput({ name: "empty.png", type: "image/png", size: 0 })).toMatch(/empty/i);
    expect(validateBackgroundInput({ name: "animation.gif", type: "image/gif", size: 10 })).toMatch(/JPG, PNG, WebP, or BMP/);
    expect(validateBackgroundInput({ name: "large.jpg", type: "image/jpeg", size: MAX_BACKGROUND_REMOVER_FILE_BYTES + 1 })).toMatch(/30 MB/);
  });

  it("guards invalid and excessively large image dimensions", () => {
    expect(validateImageDimensions(0, 100)).toMatch(/dimensions/i);
    expect(validateImageDimensions(16_001, 100)).toMatch(/16,000/);
    expect(validateImageDimensions(6_000, 5_000)).toMatch(/too many pixels/i);
    expect(validateImageDimensions(6_000, 4_000)).toBeNull();
  });
});

describe("background remover geometry and mask helpers", () => {
  it("fits working images within a maximum edge without upscaling", () => {
    expect(fitWithin(4_000, 2_000, 1_500)).toEqual({ width: 1_500, height: 750 });
    expect(fitWithin(640, 480, 1_500)).toEqual({ width: 640, height: 480 });
    expect(() => fitWithin(100, 50, 0)).toThrow(/at least one/i);
  });

  it("fits the preview to its viewport and applies bounded zoom levels", () => {
    expect(getPreviewDisplaySize(1_500, 1_000, 750, 600, 100)).toEqual({ width: 750, height: 500 });
    expect(getPreviewDisplaySize(1_500, 1_000, 750, 600, 200)).toEqual({ width: 1_500, height: 1_000 });
    expect(getPreviewDisplaySize(1_500, 1_000, 750, 600, 350)).toEqual({ width: 2_250, height: 1_500 });
    expect(clampPreviewZoom(62)).toBe(50);
    expect(clampPreviewZoom(88)).toBe(100);
    expect(clampPreviewZoom(Number.NaN)).toBe(100);
    expect(clampPreviewZoom(0)).toBe(MIN_PREVIEW_ZOOM);
    expect(clampPreviewZoom(500)).toBe(MAX_PREVIEW_ZOOM);
    expect(getPreviewDisplaySize(1_500, 1_000, 0, 600)).toEqual({ width: 0, height: 0 });
    expect(zoomPreviewByWheel(100, -1)).toBe(125);
    expect(zoomPreviewByWheel(100, 1)).toBe(75);
    expect(zoomPreviewByWheel(MAX_PREVIEW_ZOOM, -1)).toBe(MAX_PREVIEW_ZOOM);
    expect(zoomPreviewByWheel(MIN_PREVIEW_ZOOM, 1)).toBe(MIN_PREVIEW_ZOOM);
    expect(zoomPreviewByWheel(100, 0)).toBe(100);
  });

  it("limits model and editing masks to predictable sizes", () => {
    expect(getModelInputDimensions(4_032, 3_024)).toEqual({ width: 1_536, height: 1_152 });
    expect(getMaskDimensions(4_032, 3_024)).toEqual({ width: 2_048, height: 1_536 });
  });

  it("copies alpha bytes from RGBA and grayscale-alpha data", () => {
    expect(Array.from(extractAlphaChannel(new Uint8Array([10, 20, 30, 40, 50, 60, 70, 80]), 2, 1, 4))).toEqual([40, 80]);
    expect(Array.from(extractAlphaChannel(new Uint8Array([2, 200, 4, 100]), 2, 1, 2))).toEqual([200, 100]);
    expect(() => extractAlphaChannel(new Uint8Array(3), 1, 1, 4)).toThrow(/incomplete/i);
    expect(() => extractAlphaChannel(new Uint8Array(4), 1, 1, 3)).toThrow(/alpha mask/i);
  });

  it("rejects blank or nearly transparent model masks instead of reporting success", () => {
    expect(hasUsableAlphaMask(new Uint8Array([0, 3, 34]))).toBe(false);
    expect(hasUsableAlphaMask(new Uint8Array([0, 64]))).toBe(true);
    expect(hasUsableAlphaMask(new Uint8Array())).toBe(false);
  });

  it("maps pointer coordinates proportionally and safely clamps image edges", () => {
    const rect = { left: 20, top: 10, width: 100, height: 50 };
    expect(mapPointerToMask(20, 10, rect, 1_000, 500)).toEqual({ x: 0, y: 0 });
    expect(mapPointerToMask(120, 60, rect, 1_000, 500)).toEqual({ x: 999, y: 499 });
    expect(mapPointerToMask(70, 35, rect, 1_000, 500)).toEqual({ x: 500, y: 250 });
    expect(mapPointerToMask(19, 35, rect, 1_000, 500)).toBeNull();
    expect(mapPointerToMask(20, 10, { ...rect, width: 0 }, 1_000, 500)).toBeNull();
  });

  it("clamps editor settings and creates output names safely", () => {
    expect(clampBrushSize(1)).toBe(4);
    expect(clampBrushSize(200)).toBe(120);
    expect(clampBrushSize(Number.NaN)).toBe(36);
    expect(clampEdgeSoftness(-10)).toBe(0);
    expect(clampEdgeSoftness(300)).toBe(100);
    expect(buildBackgroundOutputName("Family photo.jpeg", "image/png")).toBe("Family photo-background-removed.png");
    expect(buildBackgroundOutputName(".png", "image/webp")).toBe("image-background-removed.webp");
    expect(formatImageDimensions(1920, 1080)).toBe("1,920 × 1,080 px");
  });
});
