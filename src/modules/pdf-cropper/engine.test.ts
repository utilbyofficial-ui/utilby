import { describe, expect, it } from "vitest";
import {
  cleanCropFilename,
  getCropBoxForMargins,
  getCropPreviewRect,
  isCropPdfFile,
  PDF_POINTS_PER_MM,
} from "./engine";

describe("PDF cropper geometry", () => {
  it("accepts PDFs using the file extension when MIME type is missing", () => {
    expect(isCropPdfFile({ name: "scan.pdf", type: "application/octet-stream" })).toBe(true);
    expect(isCropPdfFile({ name: "scan.PDF", type: "" })).toBe(true);
    expect(isCropPdfFile({ name: "photo.jpg", type: "image/jpeg" })).toBe(false);
  });

  it("keeps the full page when all margins are zero", () => {
    expect(getCropPreviewRect(600, 800, 1, { top: 0, right: 0, bottom: 0, left: 0 }))
      .toEqual({ x: 0, y: 0, width: 600, height: 800 });
  });

  it("converts millimeter margins to an on-screen crop rectangle", () => {
    const rect = getCropPreviewRect(600, 800, 1, { top: 10, right: 20, bottom: 30, left: 40 });
    expect(rect?.x).toBeCloseTo(40 * PDF_POINTS_PER_MM);
    expect(rect?.y).toBeCloseTo(10 * PDF_POINTS_PER_MM);
    expect(rect?.width).toBeCloseTo(600 - 60 * PDF_POINTS_PER_MM);
    expect(rect?.height).toBeCloseTo(800 - 40 * PDF_POINTS_PER_MM);
  });

  it("converts the visible crop to PDF coordinates on an unrotated page", () => {
    const box = getCropBoxForMargins({
      width: 600,
      height: 800,
      convertToPdfPoint: (x, y) => [x, 800 - y],
    }, 1, { top: 10, right: 20, bottom: 30, left: 40 });

    expect(box.x).toBeCloseTo(40 * PDF_POINTS_PER_MM);
    expect(box.y).toBeCloseTo(30 * PDF_POINTS_PER_MM);
    expect(box.width).toBeCloseTo(600 - 60 * PDF_POINTS_PER_MM);
    expect(box.height).toBeCloseTo(800 - 40 * PDF_POINTS_PER_MM);
  });

  it("maps visual margins correctly when the page is rotated", () => {
    const box = getCropBoxForMargins({
      width: 600,
      height: 800,
      convertToPdfPoint: (x, y) => [y, 600 - x],
    }, 1, { top: 30, right: 20, bottom: 40, left: 10 });

    expect(box.x).toBeCloseTo(30 * PDF_POINTS_PER_MM);
    expect(box.y).toBeCloseTo(20 * PDF_POINTS_PER_MM);
    expect(box.width).toBeCloseTo(800 - 70 * PDF_POINTS_PER_MM);
    expect(box.height).toBeCloseTo(600 - 30 * PDF_POINTS_PER_MM);
  });

  it("rejects negative, non-finite, or excessive margins", () => {
    expect(getCropPreviewRect(600, 800, 1, { top: -1, right: 0, bottom: 0, left: 0 })).toBeNull();
    expect(getCropPreviewRect(600, 800, 1, { top: Number.NaN, right: 0, bottom: 0, left: 0 })).toBeNull();
    expect(getCropPreviewRect(600, 800, 1, { top: 200, right: 0, bottom: 200, left: 0 })).toBeNull();
    expect(() => getCropBoxForMargins({ width: 600, height: 800, convertToPdfPoint: (x, y) => [x, y] }, 1,
      { top: 200, right: 0, bottom: 200, left: 0 })).toThrow(/too little page area/i);
  });
});

describe("PDF cropper filenames", () => {
  it("keeps Bengali marks and removes unsafe filename characters", () => {
    expect(cleanCropFilename("আমার ফাইল.pdf")).toBe("আমার-ফাইল");
    expect(cleanCropFilename("My scan?.PDF")).toBe("My-scan");
    expect(cleanCropFilename(".pdf")).toBe("cropped-document");
  });
});
