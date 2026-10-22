import { describe, it, expect } from "vitest";
import {
  hexToRgb,
  denormalizeToPdf,
  createDefaultTextAnnotation,
  createDefaultWhiteout,
  createDefaultHighlight,
  createDefaultShape,
  dataUrlToBytes,
  exportPdfWithAnnotations,
  groupPdfTextItems,
  buildCombinedAnnotations,
  Annotation,
} from "./engine";
import { getPdfLib } from "@/modules/pdf/build";

describe("PDF Editor Engine", () => {
  it("converts hex colors to normalized RGB values", () => {
    const white = hexToRgb("#ffffff");
    expect(white.r).toBeCloseTo(1, 4);
    expect(white.g).toBeCloseTo(1, 4);
    expect(white.b).toBeCloseTo(1, 4);

    const black = hexToRgb("#000000");
    expect(black).toEqual({ r: 0, g: 0, b: 0 });

    const shortHex = hexToRgb("#f00");
    expect(shortHex.r).toBeCloseTo(1, 4);
    expect(shortHex.g).toBe(0);
    expect(shortHex.b).toBe(0);

    const invalid = hexToRgb("invalid");
    expect(invalid).toEqual({ r: 0, g: 0, b: 0 });
  });

  it("denormalizes DOM coordinates into PDF coordinate space (bottom-left origin)", () => {
    // 600 width, 800 height
    const res = denormalizeToPdf(0.1, 0.2, 0.5, 0.1, 600, 800);
    expect(res.x).toBe(60);
    expect(res.width).toBe(300);
    expect(res.height).toBe(80);
    // y = 800 - (0.2 * 800) - 80 = 800 - 160 - 80 = 560
    expect(res.y).toBe(560);
  });

  it("creates factory annotations with expected defaults", () => {
    const textAnn = createDefaultTextAnnotation(0, 0.1, 0.15, "Important Note");
    expect(textAnn.type).toBe("text");
    expect(textAnn.text).toBe("Important Note");
    expect(textAnn.pageIndex).toBe(0);
    expect(textAnn.normX).toBe(0.1);
    expect(textAnn.normY).toBe(0.15);

    const whiteout = createDefaultWhiteout(1, 0.2, 0.3);
    expect(whiteout.type).toBe("whiteout");
    expect(whiteout.pageIndex).toBe(1);
    expect(whiteout.normW).toBe(0.2);

    const highlight = createDefaultHighlight(0, 0.05, 0.08);
    expect(highlight.type).toBe("highlight");
    expect(highlight.opacity).toBe(0.35);

    const rect = createDefaultShape(0, "rect", 0.1, 0.1);
    expect(rect.type).toBe("rect");
    expect(rect.strokeColor).toBe("#E11D48");
  });

  it("converts data URLs to byte arrays", () => {
    const sample = "data:image/png;base64,aGVsbG8="; // "hello" in base64
    const bytes = dataUrlToBytes(sample);
    const text = new TextDecoder().decode(bytes);
    expect(text).toBe("hello");
  });

  it("burns text, shapes, whiteout, and drawings into a PDF document", async () => {
    const pdfLib = await getPdfLib();
    const doc = await pdfLib.PDFDocument.create();
    doc.addPage([595, 842]); // A4
    const originalBytes = await doc.save();

    const annotations: Annotation[] = [
      createDefaultTextAnnotation(0, 0.1, 0.1, "Official Signature Required"),
      createDefaultWhiteout(0, 0.2, 0.2, 0.3, 0.05),
      createDefaultHighlight(0, 0.1, 0.15, 0.4, 0.03, "#FFC53D"),
      createDefaultShape(0, "rect", 0.05, 0.05, 0.5, 0.2),
      createDefaultShape(0, "circle", 0.6, 0.6, 0.2, 0.2),
      {
        id: "draw-1",
        pageIndex: 0,
        type: "draw",
        color: "#16141F",
        strokeWidth: 3,
        points: [
          { normX: 0.1, normY: 0.8 },
          { normX: 0.2, normY: 0.82 },
          { normX: 0.3, normY: 0.79 },
        ],
      },
    ];

    const editedBytes = await exportPdfWithAnnotations(originalBytes, annotations);

    expect(editedBytes).toBeInstanceOf(Uint8Array);
    expect(editedBytes.length).toBeGreaterThan(originalBytes.length);

    // Verify it re-loads cleanly as a valid PDF
    const reloaded = await pdfLib.PDFDocument.load(editedBytes);
    expect(reloaded.getPageCount()).toBe(1);
  });

  it("extracts and groups existing PDF text items into cohesive lines", () => {
    const mockRaw = [
      { str: "Invoice", transform: [16, 0, 0, 16, 50, 700], width: 50, height: 16 },
      { str: "Number:", transform: [16, 0, 0, 16, 110, 700], width: 60, height: 16 },
      { str: "#1001", transform: [16, 0, 0, 16, 180, 700], width: 45, height: 16 },
      { str: "Total Due: $250.00", transform: [14, 0, 0, 14, 50, 650], width: 140, height: 14 },
    ];

    const grouped = groupPdfTextItems(mockRaw, 600, 800, 0);
    expect(grouped.length).toBe(2);
    expect(grouped[0]!.originalText).toBe("Invoice Number: #1001");
    expect(grouped[0]!.currentText).toBe("Invoice Number: #1001");
    expect(grouped[0]!.fontSize).toBe(16);
    expect(grouped[0]!.normX).toBeCloseTo(50 / 600, 3);

    expect(grouped[1]!.originalText).toBe("Total Due: $250.00");
    expect(grouped[1]!.fontSize).toBe(14);
  });

  it("builds combined annotations by whiting out modified text and generating replacement text", () => {
    const existing = groupPdfTextItems(
      [
        { str: "John Doe", transform: [16, 0, 0, 16, 100, 700], width: 80, height: 16 },
        { str: "Unmodified Line", transform: [14, 0, 0, 14, 100, 600], width: 100, height: 14 },
      ],
      600,
      800,
      0
    );

    // Edit the first item
    existing[0]!.isEdited = true;
    existing[0]!.currentText = "Md Faisal";

    const combined = buildCombinedAnnotations([], existing);

    // Should generate 1 whiteout for the original position + 1 new text annotation for "Md Faisal"
    expect(combined.length).toBe(2);
    expect(combined[0]!.type).toBe("whiteout");
    expect(combined[1]!.type).toBe("text");
    if (combined[1]!.type === "text") {
      expect(combined[1]!.text).toBe("Md Faisal");
    }
  });

  it("handles deleted existing text items by solely whiting them out", () => {
    const existing = groupPdfTextItems(
      [{ str: "Confidential Section", transform: [16, 0, 0, 16, 50, 700], width: 150, height: 16 }],
      600,
      800,
      0
    );

    existing[0]!.isDeleted = true;

    const combined = buildCombinedAnnotations([], existing);
    expect(combined.length).toBe(1);
    expect(combined[0]!.type).toBe("whiteout");
  });
});
