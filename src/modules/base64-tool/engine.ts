export const MAX_BASE64_BINARY_BYTES = 5 * 1024 * 1024;
export const MAX_BASE64_TEXT_BYTES = 7 * 1024 * 1024;

export interface Base64Options {
  urlSafe?: boolean;
  omitPadding?: boolean;
}

function bytesToBinaryString(bytes: Uint8Array): string {
  const chunks: string[] = [];
  const chunkSize = 0x8000;
  for (let start = 0; start < bytes.length; start += chunkSize) {
    chunks.push(String.fromCharCode(...bytes.subarray(start, start + chunkSize)));
  }
  return chunks.join("");
}

function binaryStringToBytes(binary: string): Uint8Array {
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return bytes;
}

export function encodeBase64Bytes(bytes: Uint8Array, options: Base64Options = {}): string {
  let encoded = btoa(bytesToBinaryString(bytes));
  if (options.urlSafe) encoded = encoded.replace(/\+/g, "-").replace(/\//g, "_");
  if (options.omitPadding) encoded = encoded.replace(/=+$/, "");
  return encoded;
}

export function encodeBase64Text(text: string, options: Base64Options = {}): string {
  return encodeBase64Bytes(new TextEncoder().encode(text), options);
}

function getEncodedPayload(input: string): { payload: string; dataUriHeader?: string } {
  const trimmed = input.trim();
  if (!/^data:/i.test(trimmed)) return { payload: trimmed };
  const separator = trimmed.indexOf(",");
  const header = separator >= 0 ? trimmed.slice(0, separator) : "";
  if (separator < 0 || !/^data:[^,]*;base64$/i.test(header)) {
    throw new Error("This data URL must include a ;base64, section before the encoded content.");
  }
  return { payload: trimmed.slice(separator + 1), dataUriHeader: header };
}

export function getBase64DataUrlMimeType(input: string): string | undefined {
  const { dataUriHeader } = getEncodedPayload(input);
  if (!dataUriHeader) return undefined;
  const mimeType = dataUriHeader.slice(5).split(";")[0]?.trim();
  return mimeType || undefined;
}

export function decodeBase64Bytes(input: string): Uint8Array {
  const { payload } = getEncodedPayload(input);
  const compact = payload.replace(/[\t\n\r\f\v ]/g, "");
  if (!compact) return new Uint8Array();
  if (!/^[A-Za-z0-9+/_-]*={0,2}$/.test(compact)) {
    throw new Error("This is not valid Base64. Check for symbols outside the Base64 alphabet.");
  }

  const firstPadding = compact.indexOf("=");
  const body = firstPadding < 0 ? compact : compact.slice(0, firstPadding);
  const suppliedPadding = firstPadding < 0 ? 0 : compact.length - firstPadding;
  const remainder = body.length % 4;
  if (remainder === 1) throw new Error("This Base64 text has an invalid length.");
  const requiredPadding = remainder === 0 ? 0 : 4 - remainder;
  if (suppliedPadding > 0 && (suppliedPadding !== requiredPadding || compact.length % 4 !== 0)) {
    throw new Error("The Base64 padding is incorrect. Restore the full value and try again.");
  }

  const normalized = `${body.replace(/-/g, "+").replace(/_/g, "/")}${"=".repeat(requiredPadding)}`;
  try {
    return binaryStringToBytes(atob(normalized));
  } catch {
    throw new Error("This Base64 text could not be decoded. Check that it is complete and try again.");
  }
}

export function decodeBase64Text(input: string): string {
  return decodeUtf8Bytes(decodeBase64Bytes(input));
}

export function decodeUtf8Bytes(bytes: Uint8Array): string {
  try {
    return new TextDecoder("utf-8", { fatal: true, ignoreBOM: true }).decode(bytes);
  } catch {
    throw new Error("This Base64 contains binary data or text that is not valid UTF-8. Use Save decoded file to download the original bytes.");
  }
}

export function cleanDecodedFilename(filename: string): string {
  const base = filename.replace(/[\\/]/g, "-").replace(/[\u0000-\u001f\u007f]/g, "").trim();
  const safe = base.replace(/[^\p{L}\p{M}\p{N} _.-]/gu, "").replace(/\s+/g, "-").replace(/-+/g, "-").replace(/^-+|-+$/g, "");
  return safe || "decoded-file.bin";
}

export function getFilenameForMimeType(mimeType?: string): string {
  const normalized = mimeType?.split(";")[0]?.trim().toLowerCase();
  const knownExtensions: Record<string, string> = {
    "application/pdf": "pdf",
    "application/json": "json",
    "application/zip": "zip",
    "application/octet-stream": "bin",
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/gif": "gif",
    "image/webp": "webp",
    "image/svg+xml": "svg",
    "audio/mpeg": "mp3",
    "audio/wav": "wav",
    "video/mp4": "mp4",
    "text/plain": "txt",
    "text/html": "html",
    "text/css": "css",
  };
  const extension = normalized ? knownExtensions[normalized] : undefined;
  return `decoded-file.${extension ?? "bin"}`;
}
