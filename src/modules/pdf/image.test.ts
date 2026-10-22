import { describe, it, expect } from "vitest";
import { readJpegOrientation } from "./image";

function jpegWithOrientation(value: number, little = false): Uint8Array {
  const u16 = (n: number) => (little ? [n & 0xff, n >> 8] : [n >> 8, n & 0xff]);
  const u32 = (n: number) => (little ? [n & 0xff, (n >> 8) & 0xff, (n >> 16) & 0xff, n >>> 24] : [n >>> 24, (n >> 16) & 0xff, (n >> 8) & 0xff, n & 0xff]);
  const tiff = [...(little ? [0x49, 0x49] : [0x4d, 0x4d]), ...u16(42), ...u32(8), ...u16(1), ...u16(0x0112), ...u16(3), ...u32(1), ...u16(value), 0, 0, ...u32(0)];
  const app1 = [0x45, 0x78, 0x69, 0x66, 0, 0, ...tiff];
  const len = app1.length + 2;
  return Uint8Array.from([0xff, 0xd8, 0xff, 0xe1, len >> 8, len & 0xff, ...app1, 0xff, 0xda, 0, 2]);
}

describe("JPEG EXIF orientation", () => {
  it("reads big- and little-endian orientation", () => {
    expect(readJpegOrientation(jpegWithOrientation(6))).toBe(6);
    expect(readJpegOrientation(jpegWithOrientation(3, true))).toBe(3);
  });
  it("defaults to 1 for non-JPEG or missing EXIF", () => {
    expect(readJpegOrientation(Uint8Array.from([0x89, 0x50, 0x4e, 0x47]))).toBe(1);
    expect(readJpegOrientation(Uint8Array.from([0xff, 0xd8, 0xff, 0xda, 0, 2]))).toBe(1);
  });
});
