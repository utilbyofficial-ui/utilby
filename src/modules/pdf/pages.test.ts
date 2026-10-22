import { describe, it, expect } from "vitest";
import {
  PageItem,
  normalizeRotation,
  rotatePages,
  deletePages,
  movePage,
  moveSelection,
  duplicatePages,
  insertBlankAfter,
  parseRanges,
  chunkIndexes,
  formatIndexes,
  baseName,
  safeFilename,
  rotatedSize,
  fitImageOnPage,
} from "./pages";

const mk = (id: string): PageItem => ({
  id,
  kind: "pdf",
  sourceId: "s1",
  sourceIndex: 0,
  rotation: 0,
  width: 595,
  height: 842,
});
const ids = (ps: PageItem[]) => ps.map((p) => p.id).join("");

describe("PDF page model", () => {
  it("normalizes rotations", () => {
    expect(normalizeRotation(-90)).toBe(270);
    expect(normalizeRotation(450)).toBe(90);
    expect(normalizeRotation(360)).toBe(0);
  });

  it("rotates and deletes selected pages", () => {
    const pages = ["a", "b", "c"].map(mk);
    const r = rotatePages(pages, new Set(["b"]), -90);
    expect(r[1].rotation).toBe(270);
    expect(r[0].rotation).toBe(0);
    expect(ids(deletePages(pages, new Set(["a", "c"])))).toBe("b");
  });

  it("moves single pages and selection blocks", () => {
    expect(movePage(["a", "b", "c", "d"], 0, 2).join("")).toBe("bcad");
    expect(movePage(["a", "b", "c", "d"], 3, 0).join("")).toBe("dabc");
    const pages = ["a", "b", "c", "d", "e"].map(mk);
    expect(ids(moveSelection(pages, new Set(["a", "b"]), 4))).toBe("cdabe");
    expect(ids(moveSelection(pages, new Set(["d", "e"]), 0))).toBe("deabc");
  });

  it("duplicates and inserts blank pages", () => {
    let n = 0;
    const make = () => `x${n++}`;
    const pages = ["a", "b"].map(mk);
    expect(ids(duplicatePages(pages, new Set(["a"]), make))).toBe("ax0b");
    const withBlank = insertBlankAfter(pages, 0, make);
    expect(withBlank[1].kind).toBe("blank");
    expect(withBlank.length).toBe(3);
  });

  it("parses page ranges into groups", () => {
    expect(parseRanges("1-3, 5", 10).groups).toEqual([[0, 1, 2], [4]]);
    expect(parseRanges("8-", 10).groups).toEqual([[7, 8, 9]]);
    expect(parseRanges("-2", 10).groups).toEqual([[0, 1]]);
    expect(parseRanges("3-1", 10).groups).toEqual([[2, 1, 0]]);
    expect(parseRanges("12", 10).error).toContain("doesn't exist");
    expect(parseRanges("abc", 10).error).toBeTruthy();
    expect(parseRanges("", 10).error).toBeTruthy();
  });

  it("chunks and formats page indexes", () => {
    expect(chunkIndexes(5, 2)).toEqual([[0, 1], [2, 3], [4]]);
    expect(formatIndexes([4, 0, 1, 2, 7])).toBe("1-3, 5, 8");
  });

  it("builds safe filenames", () => {
    expect(baseName("Report.final.PDF")).toBe("Report.final");
    expect(safeFilename('a/b:c*?"d')).toBe("a-b-c-d");
  });

  it("computes rotated sizes and image fitting", () => {
    expect(rotatedSize(600, 800, 90)).toEqual({ width: 800, height: 600 });
    const f = fitImageOnPage(2000, 1000, 600, 800, 50);
    expect(f.width).toBeCloseTo(500);
    expect(f.height).toBeCloseTo(250);
    expect(f.x).toBeCloseTo(50);
    expect(f.y).toBeCloseTo(275);
  });
});
