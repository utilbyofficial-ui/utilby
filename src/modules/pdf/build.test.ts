import { describe, it, expect } from "vitest";
import { PDFDocument, StandardFonts } from "pdf-lib";
import { buildPdf, buildPdfGroups, loadPdf, imagePageDimensions, SourceData } from "./build";
import { PageItem } from "./pages";

async function makePdf(n: number, label: string): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  for (let i = 0; i < n; i++) {
    const p = doc.addPage([400, 600]);
    p.drawText(`${label}${i + 1}`, { x: 50, y: 500, size: 24, font });
  }
  return doc.save();
}

// 1x1 transparent PNG
const PNG = Uint8Array.from(
  atob("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="),
  (c) => c.charCodeAt(0)
);

const page = (id: string, sourceId: string | null, sourceIndex: number, extra: Partial<PageItem> = {}): PageItem => ({
  id,
  kind: "pdf",
  sourceId,
  sourceIndex,
  rotation: 0,
  width: 400,
  height: 600,
  ...extra,
});

describe("PDF builder", () => {
  it("merges, reorders, rotates and adds blank + image pages", async () => {
    const a = await loadPdf(await makePdf(3, "A"));
    const b = await loadPdf(await makePdf(2, "B"));
    const sources = new Map<string, SourceData>([
      ["a", { kind: "pdf", doc: a }],
      ["b", { kind: "pdf", doc: b }],
      ["img", { kind: "image", bytes: PNG, format: "png", width: 1, height: 1 }],
    ]);
    const pages: PageItem[] = [
      page("1", "b", 1),
      page("2", "a", 0, { rotation: 90 }),
      page("3", null, 0, { kind: "blank", width: 595.28, height: 841.89 }),
      page("4", "img", 0, { kind: "image" }),
      page("5", "a", 2),
    ];
    const bytes = await buildPdf(pages, sources);
    const out = await PDFDocument.load(bytes, { updateMetadata: false });
    expect(out.getPageCount()).toBe(5);
    expect(out.getPage(1).getRotation().angle).toBe(90);
    expect(Math.round(out.getPage(2).getWidth())).toBe(595);
    expect(out.getProducer()).toContain("Utilby");
  });

  it("splits into groups", async () => {
    const a = await loadPdf(await makePdf(4, "A"));
    const sources = new Map<string, SourceData>([["a", { kind: "pdf", doc: a }]]);
    const pages = [0, 1, 2, 3].map((i) => page(`p${i}`, "a", i));
    const files = await buildPdfGroups(pages, [[0, 1], [3]], sources);
    expect(files.length).toBe(2);
    expect((await PDFDocument.load(files[0])).getPageCount()).toBe(2);
    expect((await PDFDocument.load(files[1])).getPageCount()).toBe(1);
  });

  it("orients A4 image pages to match the image", () => {
    expect(imagePageDimensions(2000, 1000, "a4").width).toBeGreaterThan(800);
    expect(imagePageDimensions(1000, 2000, "a4").width).toBeLessThan(600);
    expect(imagePageDimensions(800, 600, "fit")).toEqual({ width: 600, height: 450 });
  });
});
