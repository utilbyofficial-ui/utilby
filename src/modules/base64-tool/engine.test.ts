import { describe, expect, it } from "vitest";
import {
  cleanDecodedFilename,
  decodeBase64Bytes,
  decodeBase64Text,
  encodeBase64Bytes,
  encodeBase64Text,
  getBase64DataUrlMimeType,
  getFilenameForMimeType,
} from "./engine";

describe("Base64 text conversion", () => {
  it("round-trips Bengali, emoji, and other Unicode text as UTF-8", () => {
    const text = "বাংলা text — 😀 café";
    expect(decodeBase64Text(encodeBase64Text(text))).toBe(text);
  });

  it("encodes an empty string and decodes empty input", () => {
    expect(encodeBase64Text("")).toBe("");
    expect(decodeBase64Text("")).toBe("");
  });

  it("preserves a leading Unicode BOM in decoded text", () => {
    expect(decodeBase64Text(encodeBase64Text("\uFEFFhello"))).toBe("\uFEFFhello");
  });

  it("creates URL-safe Base64 with optional omitted padding", () => {
    const encoded = encodeBase64Text("✓", { urlSafe: true, omitPadding: true });
    expect(encoded).toBe("4pyT");
    expect(decodeBase64Text(encoded)).toBe("✓");
    expect(encodeBase64Text("f", { urlSafe: true, omitPadding: true })).toBe("Zg");
  });

  it("accepts whitespace and missing padding when decoding", () => {
    expect(decodeBase64Text("SGVs\n bG8")).toBe("Hello");
    expect(decodeBase64Text("Zg")).toBe("f");
  });

  it("decodes the bilingual sample used by the tool", () => {
    expect(decodeBase64Text("VXRpbGJ5IOKAlCDgpqvgpr7gpofgprLgppfgp4HgprLgp4sg4KaG4Kaq4Kao4Ka+4KawIOCmoeCmv+CmreCmvuCmh+CmuOCnh+CmhyDgpqXgpr7gppXgp4cg8J+Zgg==")).toBe("Utilby — ফাইলগুলো আপনার ডিভাইসেই থাকে 🙂");
  });

  it("decodes standard and URL-safe Base64 alphabet characters", () => {
    expect(decodeBase64Bytes("+/8=")).toEqual(new Uint8Array([251, 255]));
    expect(decodeBase64Bytes("-_8=")).toEqual(new Uint8Array([251, 255]));
  });

  it("reads a Base64 data URL and detects its MIME type", () => {
    const dataUrl = "data:image/png;base64,aGVsbG8=";
    expect(decodeBase64Text(dataUrl)).toBe("hello");
    expect(getBase64DataUrlMimeType(dataUrl)).toBe("image/png");
  });

  it("rejects invalid alphabets, lengths, padding, and malformed data URLs", () => {
    expect(() => decodeBase64Bytes("SGVsbG8*=")).toThrow("not valid Base64");
    expect(() => decodeBase64Bytes("A")).toThrow("invalid length");
    expect(() => decodeBase64Bytes("Zg=")).toThrow("padding is incorrect");
    expect(() => decodeBase64Bytes("data:text/plain,hello")).toThrow(";base64,");
  });

  it("shows a useful message when decoded bytes are not valid UTF-8 text", () => {
    expect(() => decodeBase64Text("/w==")).toThrow("binary data");
  });
});

describe("Base64 binary conversion", () => {
  it("round-trips every byte value, including null bytes and high-bit bytes", () => {
    const input = new Uint8Array([0, 1, 127, 128, 200, 255]);
    const encoded = encodeBase64Bytes(input);
    expect(decodeBase64Bytes(encoded)).toEqual(input);
  });

  it("handles binary URL-safe output without padding", () => {
    const input = new Uint8Array([251, 255]);
    const encoded = encodeBase64Bytes(input, { urlSafe: true, omitPadding: true });
    expect(encoded).toBe("-_8");
    expect(decodeBase64Bytes(encoded)).toEqual(input);
  });
});

describe("decoded filenames", () => {
  it("removes path separators and control characters from names", () => {
    expect(cleanDecodedFilename("../family photo.png\n")).toBe("..-family-photo.png");
    expect(cleanDecodedFilename("/ ")).toBe("decoded-file.bin");
  });

  it("suggests familiar extensions from MIME types", () => {
    expect(getFilenameForMimeType("image/jpeg")).toBe("decoded-file.jpg");
    expect(getFilenameForMimeType("application/pdf")).toBe("decoded-file.pdf");
    expect(getFilenameForMimeType("application/x-custom")).toBe("decoded-file.bin");
  });
});
