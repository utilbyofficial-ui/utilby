import { describe, expect, it } from "vitest";
import {
  buildTextDocument,
  cleanPdfBaseName,
  getOcrRenderScale,
  isPdfFile,
  mapWordBoundsToPdf,
  MAX_OCR_PIXELS,
  MAX_OCR_DIMENSION,
  type OcrPageResult,
} from "./engine";

describe("PDF OCR engine helpers", () => {
  it("accepts PDFs with a generic file type but rejects unrelated files", () => {
    expect(isPdfFile({ name: "scan.pdf", type: "application/octet-stream" })).toBe(true);
    expect(isPdfFile({ name: "scan.PDF", type: "" })).toBe(true);
    expect(isPdfFile({ name: "photo.jpg", type: "image/jpeg" })).toBe(false);
  });

  it("renders ordinary pages near the target OCR resolution", () => {
    expect(getOcrRenderScale(612, 792)).toBe(2.5);
  });

  it("reduces scale to respect both the pixel budget and maximum side length", () => {
    const scale = getOcrRenderScale(12_000, 20_000);
    expect(12_000 * scale).toBeLessThanOrEqual(MAX_OCR_DIMENSION);
    expect(20_000 * scale).toBeLessThanOrEqual(MAX_OCR_DIMENSION);
    expect(12_000 * 20_000 * scale * scale).toBeLessThanOrEqual(MAX_OCR_PIXELS);
  });

  it("rejects invalid page dimensions", () => {
    expect(() => getOcrRenderScale(0, 800)).toThrow(/invalid dimensions/i);
    expect(() => getOcrRenderScale(Number.NaN, 800)).toThrow(/invalid dimensions/i);
  });

  it("maps OCR word rectangles from canvas coordinates to PDF coordinates", () => {
    const words = mapWordBoundsToPdf([
      { text: "বাংলা", bbox: { x0: 10, y0: 20, x1: 50, y1: 40 } },
      { text: "", bbox: { x0: 10, y0: 20, x1: 50, y1: 40 } },
      { text: "bad", bbox: { x0: 10, y0: 20, x1: 10, y1: 40 } },
    ], { convertToPdfPoint: (x, y) => [x / 2, 500 - y / 2] });

    expect(words).toHaveLength(1);
    expect(words[0]).toEqual({ text: "বাংলা", x: 5, y: 480.8, width: 20, height: 10 });
  });

  it("keeps valid text characters while removing control codes", () => {
    const words = mapWordBoundsToPdf([
      { text: "Name\u0000Date", bbox: { x0: 0, y0: 0, x1: 30, y1: 10 } },
    ], { convertToPdfPoint: (x, y) => [x, 100 - y] });
    expect(words[0].text).toBe("Name Date");
  });

  it("adds page separators and sanitizes output filenames", () => {
    const pages: OcrPageResult[] = [
      { pageNumber: 1, text: "Hello", words: [], source: "existing-text" },
      { pageNumber: 2, text: "বাংলা", words: [], source: "ocr" },
    ];
    expect(buildTextDocument(pages)).toBe("--- Page 1 ---\nHello\n\n--- Page 2 ---\nবাংলা");
    expect(cleanPdfBaseName("আমার ফাইল.pdf")).toBe("আমার-ফাইল");
    expect(cleanPdfBaseName("My scan?.pdf")).toBe("My-scan");
    expect(cleanPdfBaseName(".pdf")).toBe("ocr-document");
  });
});
