import QRCode from "qrcode";

export type QrContentType = "url" | "text" | "wifi" | "email" | "phone" | "sms" | "vcard";
export type ErrorCorrectionLevel = "L" | "M" | "Q" | "H";
export type WifiEncryption = "WPA" | "WEP" | "nopass";

export interface WifiData {
  ssid: string;
  password: string;
  encryption: WifiEncryption;
  hidden: boolean;
}

export interface EmailData {
  to: string;
  subject: string;
  body: string;
}

export interface SmsData {
  phone: string;
  message: string;
}

export interface VCardData {
  firstName: string;
  lastName: string;
  organization: string;
  title: string;
  phone: string;
  email: string;
  website: string;
  address: string;
}

export interface QrStyleOptions {
  size: number;
  margin: number;
  foreground: string;
  background: string;
  errorCorrection: ErrorCorrectionLevel;
}

export const DEFAULT_STYLE: QrStyleOptions = {
  size: 512,
  margin: 2,
  foreground: "#0f172a",
  background: "#ffffff",
  errorCorrection: "M",
};

/** Escapes special characters for the Wi-Fi QR (MECARD-like) format: \ ; , : " */
export function escapeWifiValue(value: string): string {
  return value.replace(/([\\;,:"])/g, "\\$1");
}

/** Escapes special characters for vCard 3.0 text values. */
export function escapeVCardValue(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}

/** Adds https:// when the user types a bare domain like "utilby.com". */
export function normalizeUrl(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return "";
  if (/^[a-z][a-z0-9+.-]*:/i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

export function buildWifiPayload(data: WifiData): string {
  if (!data.ssid.trim()) return "";
  const parts = [`T:${data.encryption}`, `S:${escapeWifiValue(data.ssid)}`];
  if (data.encryption !== "nopass" && data.password) {
    parts.push(`P:${escapeWifiValue(data.password)}`);
  }
  if (data.hidden) parts.push("H:true");
  return `WIFI:${parts.join(";")};;`;
}

export function buildEmailPayload(data: EmailData): string {
  const to = data.to.trim();
  if (!to) return "";
  const params: string[] = [];
  if (data.subject) params.push(`subject=${encodeURIComponent(data.subject)}`);
  if (data.body) params.push(`body=${encodeURIComponent(data.body)}`);
  return `mailto:${to}${params.length ? `?${params.join("&")}` : ""}`;
}

export function cleanPhone(phone: string): string {
  return phone.trim().replace(/[^\d+]/g, "");
}

export function buildPhonePayload(phone: string): string {
  const cleaned = cleanPhone(phone);
  return cleaned ? `tel:${cleaned}` : "";
}

export function buildSmsPayload(data: SmsData): string {
  const cleaned = cleanPhone(data.phone);
  if (!cleaned) return "";
  return data.message ? `SMSTO:${cleaned}:${data.message}` : `SMSTO:${cleaned}`;
}

export function buildVCardPayload(data: VCardData): string {
  const first = data.firstName.trim();
  const last = data.lastName.trim();
  if (!first && !last && !data.organization.trim()) return "";
  const fullName = [first, last].filter(Boolean).join(" ") || data.organization.trim();
  const lines = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `N:${escapeVCardValue(last)};${escapeVCardValue(first)};;;`,
    `FN:${escapeVCardValue(fullName)}`,
  ];
  if (data.organization.trim()) lines.push(`ORG:${escapeVCardValue(data.organization.trim())}`);
  if (data.title.trim()) lines.push(`TITLE:${escapeVCardValue(data.title.trim())}`);
  if (cleanPhone(data.phone)) lines.push(`TEL;TYPE=CELL:${cleanPhone(data.phone)}`);
  if (data.email.trim()) lines.push(`EMAIL:${data.email.trim()}`);
  if (data.website.trim()) lines.push(`URL:${normalizeUrl(data.website)}`);
  if (data.address.trim()) lines.push(`ADR;TYPE=HOME:;;${escapeVCardValue(data.address.trim())};;;;`);
  lines.push("END:VCARD");
  return lines.join("\n");
}

export function isValidHexColor(color: string): boolean {
  return /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(color);
}

/** Relative luminance (WCAG) used to warn about low-contrast colors that scanners can't read. */
export function getLuminance(hex: string): number {
  let h = hex.replace("#", "");
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  const rgb = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
  const [r, g, b] = rgb.map((c) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function getContrastRatio(a: string, b: string): number {
  if (!isValidHexColor(a) || !isValidHexColor(b)) return 1;
  const la = getLuminance(a);
  const lb = getLuminance(b);
  const [light, dark] = la > lb ? [la, lb] : [lb, la];
  return Math.round(((light + 0.05) / (dark + 0.05)) * 100) / 100;
}

export interface ColorCheck {
  ok: boolean;
  ratio: number;
  inverted: boolean;
}

/** QR scanners need strong contrast and work most reliably with dark modules on a light background. */
export function checkColorContrast(foreground: string, background: string): ColorCheck {
  const ratio = getContrastRatio(foreground, background);
  const inverted =
    isValidHexColor(foreground) && isValidHexColor(background) && getLuminance(foreground) > getLuminance(background);
  return { ok: ratio >= 3, ratio, inverted };
}

function toQrOptions(style: QrStyleOptions) {
  return {
    errorCorrectionLevel: style.errorCorrection,
    margin: style.margin,
    width: style.size,
    color: { dark: style.foreground, light: style.background },
  };
}

export async function generateQrSvg(payload: string, style: QrStyleOptions): Promise<string> {
  return QRCode.toString(payload, { ...toQrOptions(style), type: "svg" });
}

export async function generateQrPngDataUrl(payload: string, style: QrStyleOptions): Promise<string> {
  return QRCode.toDataURL(payload, { ...toQrOptions(style), type: "image/png" });
}

/** Approximate max payload (bytes, byte mode) at QR version 40 per error correction level. */
export const MAX_PAYLOAD_BYTES: Record<ErrorCorrectionLevel, number> = {
  L: 2953,
  M: 2331,
  Q: 1663,
  H: 1273,
};

export function getPayloadByteLength(payload: string): number {
  return new TextEncoder().encode(payload).length;
}
