import { describe, expect, it } from "vitest";
import { PDFDocument, PDFName, PDFRef } from "pdf-lib";
import { compressPdf, COMPRESSION_PRESETS, deduplicatePdfStreams } from "./engine";

describe("PDF Compressor Engine", () => {
  it("round-trips vector PDFs and never returns a larger file", async () => {
    const document = await PDFDocument.create();
    const page = document.addPage();
    page.drawText("Vector text remains editable and sharp");
    const source = await document.save();

    const result = await compressPdf(source);
    const reloaded = await PDFDocument.load(result.bytes);

    expect(reloaded.getPageCount()).toBe(1);
    expect(result.compressedBytes).toBeLessThanOrEqual(result.originalBytes);
    expect(result.wasReduced).toBe(result.compressedBytes < result.originalBytes);
  });

  it("deduplicates matching PDF streams and updates references", async () => {
    const document = await PDFDocument.create();
    const page = document.addPage();
    const streamOptions = {
      Type: "XObject",
      Subtype: "Image",
      Width: 1,
      Height: 1,
      BitsPerComponent: 8,
      ColorSpace: "DeviceRGB",
      Filter: "DCTDecode",
    };
    const content = new Uint8Array([1, 2, 3, 4, 5, 6]);
    const first = document.context.register(document.context.stream(content, streamOptions));
    const second = document.context.register(document.context.stream(content.slice(), streamOptions));
    page.node.set(PDFName.of("TestImageA"), first);
    page.node.set(PDFName.of("TestImageB"), second);

    expect(deduplicatePdfStreams(document, await import("pdf-lib"))).toBe(1);
    expect((page.node.get(PDFName.of("TestImageA")) as PDFRef).toString())
      .toBe((page.node.get(PDFName.of("TestImageB")) as PDFRef).toString());
  });

  it("uses the requested image quality preset and accepts an image reencoder", async () => {
    expect(COMPRESSION_PRESETS.balanced.quality).toBeGreaterThan(COMPRESSION_PRESETS.strong.quality);
    expect(COMPRESSION_PRESETS.strong.quality).toBeGreaterThan(COMPRESSION_PRESETS.maximum.quality);

    const document = await PDFDocument.create();
    document.addPage();
    const result = await compressPdf(await document.save(), { preset: "strong" }, async () => null);

    expect(result.modifiedImages).toBe(0);
    expect(result.downsampledImages).toBe(0);
  });

  it("rejects files that are not readable PDFs", async () => {
    await expect(compressPdf(new Uint8Array([1, 2, 3]))).rejects.toThrow("could not be opened as a PDF");
  });
});
