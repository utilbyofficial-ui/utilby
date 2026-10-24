import { describe, it, expect } from "vitest";
import {
  getDpiScale,
  cleanBaseName,
  formatPageNumber,
  buildPageFilename,
  buildZipFilename,
  parsePageRanges,
} from "./engine";

describe("PDF to JPG Engine", () => {
  it("computes DPI scales accurately", () => {
    expect(getDpiScale("72")).toBe(1.0);
    expect(getDpiScale("150")).toBeCloseTo(2.083, 2);
    expect(getDpiScale("300")).toBeCloseTo(4.167, 2);
  });

  it("cleans base filename and removes .pdf extension", () => {
    expect(cleanBaseName("My Annual Report 2026.pdf")).toBe("My-Annual-Report-2026");
    expect(cleanBaseName("document.PDF")).toBe("document");
    expect(cleanBaseName("")).toBe("converted-document");
  });

  it("formats page numbers with appropriate zero-padding", () => {
    expect(formatPageNumber(5, 8)).toBe("5");
    expect(formatPageNumber(5, 50)).toBe("05");
    expect(formatPageNumber(5, 250)).toBe("005");
  });

  it("builds consistent page filenames for JPG and PNG", () => {
    expect(buildPageFilename("contract.pdf", 3, 20, "jpg")).toBe("contract-page-03.jpg");
    expect(buildPageFilename("invoice.pdf", 1, 5, "png")).toBe("invoice-page-1.png");
  });

  it("builds clean zip filenames", () => {
    expect(buildZipFilename("Annual Report.pdf")).toBe("Annual-Report-images.zip");
  });

  it("parses custom page ranges correctly", () => {
    expect(parsePageRanges("1-3, 5, 8", 10)).toEqual([1, 2, 3, 5, 8]);
    expect(parsePageRanges("4, 2, 6-7", 10)).toEqual([2, 4, 6, 7]);
    // Out of bounds filtering
    expect(parsePageRanges("1-15", 5)).toEqual([1, 2, 3, 4, 5]);
    // Empty range defaults to all pages
    expect(parsePageRanges("", 3)).toEqual([1, 2, 3]);
    // Malformed ranges must not silently fall back to converting every page.
    expect(parsePageRanges("1-x", 3)).toEqual([]);
    expect(parsePageRanges("2, nope", 3)).toEqual([]);
  });
});
