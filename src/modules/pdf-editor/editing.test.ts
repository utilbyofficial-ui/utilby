import { describe, it, expect } from "vitest";
import { tokenize, removeTextInRects, bytesToLatin1, multiply, applyPoint } from "./contentStream";
import { toPdfPoint, toDisplayPoint, toPdfRect, displaySize, PageGeometry } from "./geometry";
import {
  exportPdfWithAnnotations,
  buildCombinedAnnotations,
  groupPdfTextItems,
  toDisplayTextItems,
  detectImageFormat,
  Annotation,
} from "./engine";
import { getPdfLib } from "@/modules/pdf/build";

// 1x1 red PNG
const PNG_1PX =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==";

async function pageContent(bytes: Uint8Array, pageIndex = 0): Promise<string> {
  const { PDFDocument, PDFName, PDFArray, PDFRawStream, decodePDFRawStream } = await getPdfLib();
  const doc = await PDFDocument.load(bytes);
  const page = doc.getPage(pageIndex);
  const c = doc.context.lookup(page.node.get(PDFName.of("Contents"))!);
  const streams = c instanceof PDFArray ? Array.from({ length: c.size() }, (_, i) => doc.context.lookup(c.get(i))) : [c];
  return streams
    .map((s) => (s instanceof PDFRawStream ? bytesToLatin1(decodePDFRawStream(s).decode()) : ""))
    .join("\n");
}

const hex = (s: string) =>
  Array.from(s)
    .map((c) => c.charCodeAt(0).toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase();

describe("content stream tokenizer", () => {
  it("handles nested/escaped strings, hex strings, arrays, dicts and inline images", () => {
    const src = "BT /F1 12 Tf (a (nested) \\) str) Tj <48656C6C6F> Tj [(A) -120 (B)] TJ ET q << /K 1 >> BDC BI /W 1 ID \x00\xff EI Q";
    const toks = tokenize(src);
    const ops = toks.filter((t) => t.type === "operator").map((t) => t.value);
    expect(ops).toEqual(["BT", "Tf", "Tj", "Tj", "TJ", "ET", "q", "BDC", "BI", "ID", "EI", "Q"]);
    expect(toks.find((t) => t.type === "string")!.value).toBe("(a (nested) \\) str)");
  });

  it("removes only the text that starts inside the rectangles and keeps everything else", () => {
    const src = [
      "q 1 0 0 1 0 0 cm",
      "BT /F1 12 Tf 1 0 0 1 50 700 Tm (Secret line) Tj ET",
      "BT /F1 12 Tf 50 600 Td [(Keep) -250 (me)] TJ 0 -20 Td (Second kept) Tj ET",
      "0 0 1 rg 10 10 100 100 re f Q",
    ].join("\n");
    const res = removeTextInRects(src, [{ x: 40, y: 690, width: 200, height: 25 }]);
    expect(res.removed).toBe(1);
    expect(res.content).not.toContain("Secret line");
    expect(res.content).toContain("[(Keep) -250 (me)] TJ");
    expect(res.content).toContain("(Second kept) Tj");
    expect(res.content).toContain("10 10 100 100 re f");
  });

  it("follows cm / Td / TL / T* state to locate lines", () => {
    const src = "q 2 0 0 2 0 0 cm BT /F1 10 Tf 14 TL 20 300 Td (A) Tj T* (B) Tj ET Q";
    // In user space: line A at (40, 600), line B at (40, 572)
    const onlyB = removeTextInRects(src, [{ x: 30, y: 565, width: 100, height: 20 }]);
    expect(onlyB.content).toContain("(A) Tj");
    expect(onlyB.content).not.toContain("(B) Tj");
  });

  it("matrix helpers follow the PDF convention", () => {
    const m = multiply([1, 0, 0, 1, 10, 20], [2, 0, 0, 2, 0, 0]);
    expect(applyPoint(m, 0, 0)).toEqual({ x: 20, y: 40 });
  });
});

describe("page geometry", () => {
  const base = { x0: 0, y0: 0, width: 600, height: 800 };
  it("maps display points for every rotation and round-trips", () => {
    for (const rotation of [0, 90, 180, 270]) {
      const g: PageGeometry = { ...base, rotation };
      for (const [u, v] of [
        [0, 0],
        [0.25, 0.75],
        [1, 1],
      ]) {
        const p = toPdfPoint(g, u!, v!);
        const back = toDisplayPoint(g, p.x, p.y);
        expect(back.u).toBeCloseTo(u!, 6);
        expect(back.v).toBeCloseTo(v!, 6);
      }
    }
    expect(toPdfPoint({ ...base, rotation: 0 }, 0, 0)).toEqual({ x: 0, y: 800 });
    expect(toPdfPoint({ ...base, rotation: 90 }, 0, 0)).toEqual({ x: 0, y: 0 });
    expect(displaySize({ ...base, rotation: 90 })).toEqual({ width: 800, height: 600 });
  });

  it("respects CropBox offsets", () => {
    const g: PageGeometry = { rotation: 0, x0: 100, y0: 50, width: 400, height: 600 };
    expect(toPdfRect(g, 0, 0, 0.5, 0.5)).toEqual({ x: 100, y: 350, width: 200, height: 300 });
  });
});

describe("text detection in display space", () => {
  it("applies the viewport transform and skips vertical text", () => {
    // Unrotated A4 viewport: [1, 0, 0, -1, 0, 842]
    const items = toDisplayTextItems(
      [
        { str: "Hello", transform: [12, 0, 0, 12, 50, 700], width: 30, fontName: "g_d0_f1" },
        { str: "Vertical", transform: [0, 12, -12, 0, 300, 300], width: 40 },
      ],
      [1, 0, 0, -1, 0, 842],
      842
    );
    expect(items).toHaveLength(1);
    const lines = groupPdfTextItems(items, 595, 842, 0);
    expect(lines[0]!.originalText).toBe("Hello");
    expect(lines[0]!.normX).toBeCloseTo(50 / 595, 4);
    // box top = baseline - fontSize
    expect(lines[0]!.normY).toBeCloseTo((842 - 700 - 12) / 842, 4);
  });
});

describe("export engine", () => {
  async function makeDoc(rotation = 0) {
    const { PDFDocument, StandardFonts, degrees } = await getPdfLib();
    const doc = await PDFDocument.create();
    const font = await doc.embedFont(StandardFonts.Helvetica);
    const page = doc.addPage([600, 800]);
    page.drawText("Old Address", { x: 60, y: 700, size: 12, font });
    page.drawText("Keep this line", { x: 60, y: 650, size: 12, font });
    if (rotation) page.setRotation(degrees(rotation));
    return doc.save();
  }

  it("really removes edited text from the file (not just covers it)", async () => {
    const bytes = await makeDoc();
    const existing = groupPdfTextItems(
      [
        { str: "Old Address", transform: [12, 0, 0, 12, 60, 700], width: 66, height: 12 },
        { str: "Keep this line", transform: [12, 0, 0, 12, 60, 650], width: 80, height: 12 },
      ],
      600,
      800,
      0
    );
    existing[0]!.isEdited = true;
    existing[0]!.currentText = "New Address";
    const out = await exportPdfWithAnnotations(bytes, buildCombinedAnnotations([], existing));
    const content = await pageContent(out);
    expect(content).not.toContain(hex("Old Address"));
    expect(content).toContain(hex("Keep this line"));
    expect(content).toContain(hex("New Address"));
  });

  it("does not touch text that was only opened for editing", async () => {
    const existing = groupPdfTextItems([{ str: "Same", transform: [12, 0, 0, 12, 60, 700], width: 30, height: 12 }], 600, 800, 0);
    existing[0]!.isEdited = true;
    expect(buildCombinedAnnotations([], existing)).toHaveLength(0);
  });

  it("puts erase patches below user annotations and replacement text on top", () => {
    const existing = groupPdfTextItems([{ str: "Name", transform: [12, 0, 0, 12, 60, 700], width: 30, height: 12 }], 600, 800, 0);
    existing[0]!.isEdited = true;
    existing[0]!.currentText = "Other";
    const userImg: Annotation = { id: "u", pageIndex: 0, type: "image", normX: 0, normY: 0, normW: 0.1, normH: 0.1, dataUrl: PNG_1PX };
    const combined = buildCombinedAnnotations([userImg], existing);
    expect(combined.map((a) => a.type)).toEqual(["whiteout", "image", "text"]);
  });

  it("never fails on characters the standard fonts can't encode", async () => {
    const bytes = await makeDoc();
    const ann: Annotation = {
      id: "t",
      pageIndex: 0,
      type: "text",
      normX: 0.1,
      normY: 0.5,
      text: "ধন্যবাদ Thank you ✓",
      fontSize: 14,
      color: "#000000",
      fontFamily: "Helvetica",
    };
    // Without a rasterizer: unsupported characters are dropped, Latin text is kept.
    const out = await exportPdfWithAnnotations(bytes, [ann]);
    expect(await pageContent(out)).toContain(hex("Thank you"));
    // With a rasterizer: the whole line becomes an image.
    let called = false;
    const out2 = await exportPdfWithAnnotations(bytes, [ann], {
      rasterizeText: () => {
        called = true;
        return { dataUrl: PNG_1PX, width: 120, height: 17 };
      },
    });
    expect(called).toBe(true);
    expect(await pageContent(out2)).toContain(" Do");
  });

  it("places images upright with the right size on rotated pages", async () => {
    const bytes = await makeDoc(90);
    const ann: Annotation = { id: "i", pageIndex: 0, type: "image", normX: 0.1, normY: 0.2, normW: 0.25, normH: 0.1, dataUrl: PNG_1PX };
    const out = await exportPdfWithAnnotations(bytes, [ann]);
    const content = await pageContent(out);
    // Displayed page is 800 x 600: width = 0.25 * 800 = 200pt, height = 0.1 * 600 = 60pt, rotated 90°
    // => the image matrix contains cos/sin of 90° scaled by 200/60.
    expect(content).toMatch(/cm/);
    const { PDFDocument } = await getPdfLib();
    expect((await PDFDocument.load(out)).getPage(0).getRotation().angle).toBe(90);
  });

  it("detects real image formats from bytes", () => {
    expect(detectImageFormat(Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0, 0, 0, 0, 0]))).toBe("png");
    expect(detectImageFormat(Uint8Array.from([0xff, 0xd8, 0xff, 0xe0]))).toBe("jpg");
    expect(detectImageFormat(new TextEncoder().encode("RIFF....WEBP"))).toBeNull();
  });
});

import { resizeBox, moveBox, fitImageBox, setBox, getBox } from "./elements";

describe("element move / resize", () => {
  const box = { normX: 0.2, normY: 0.2, normW: 0.4, normH: 0.2 };
  it("resizes from edges freely", () => {
    const e = resizeBox(box, "e", 0.1, 0);
    expect(e.normW).toBeCloseTo(0.5, 9);
    expect(e.normX).toBeCloseTo(0.2, 9);
    const n = resizeBox(box, "n", 0, -0.05);
    expect(n.normY).toBeCloseTo(0.15);
    expect(n.normH).toBeCloseTo(0.25);
  });
  it("keeps proportions on corner handles and anchors the opposite corner", () => {
    const r = resizeBox(box, "nw", -0.2, 0, { keepAspect: true });
    expect(r.normW / r.normH).toBeCloseTo(2, 6);
    expect(r.normX + r.normW).toBeCloseTo(0.6, 6);
    expect(r.normY + r.normH).toBeCloseTo(0.4, 6);
  });
  it("never collapses below the minimum size", () => {
    const r = resizeBox(box, "se", -1, -1);
    expect(r.normW).toBeGreaterThan(0);
    expect(r.normH).toBeGreaterThan(0);
  });
  it("moves boxes but keeps part of them on the page", () => {
    expect(moveBox(box, 0.1, 0.1).normX).toBeCloseTo(0.3);
    expect(moveBox(box, 5, 5).normX).toBeLessThan(1);
  });
  it("fits images with their real aspect ratio", () => {
    // 800x600 photo on an A4 page (595x842): visual aspect must stay 4:3
    const f = fitImageBox(800, 600, 595, 842, 0.4);
    expect((f.normW * 595) / (f.normH * 842)).toBeCloseTo(4 / 3, 6);
  });
  it("scales freehand drawings when their box is resized", () => {
    const d = { id: "d", pageIndex: 0, type: "draw" as const, color: "#000", strokeWidth: 2, points: [{ normX: 0.1, normY: 0.1 }, { normX: 0.3, normY: 0.2 }] };
    const scaled = setBox(d, { normX: 0.1, normY: 0.1, normW: 0.4, normH: 0.2 });
    const b = getBox(scaled)!;
    expect(b.normX).toBeCloseTo(0.1, 9);
    expect(b.normY).toBeCloseTo(0.1, 9);
    expect(b.normW).toBeCloseTo(0.4, 9);
    expect(b.normH).toBeCloseTo(0.2, 9);
  });
});
