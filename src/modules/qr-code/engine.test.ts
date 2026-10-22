import { describe, it, expect } from "vitest";
import {
  buildWifiPayload,
  buildEmailPayload,
  buildPhonePayload,
  buildSmsPayload,
  buildVCardPayload,
  normalizeUrl,
  escapeWifiValue,
  checkColorContrast,
  generateQrSvg,
  getPayloadByteLength,
  DEFAULT_STYLE,
} from "./engine";

describe("QR Code Engine", () => {
  it("normalizes bare domains to https URLs", () => {
    expect(normalizeUrl("utilby.com")).toBe("https://utilby.com");
    expect(normalizeUrl("http://example.com")).toBe("http://example.com");
    expect(normalizeUrl("   ")).toBe("");
  });

  it("builds a WPA Wi-Fi payload and escapes special characters", () => {
    expect(escapeWifiValue('a;b,c:d"e\\')).toBe('a\\;b\\,c\\:d\\"e\\\\');
    expect(
      buildWifiPayload({ ssid: "Home;Net", password: "p@ss:1", encryption: "WPA", hidden: false })
    ).toBe("WIFI:T:WPA;S:Home\\;Net;P:p@ss\\:1;;");
  });

  it("omits password for open Wi-Fi and flags hidden networks", () => {
    expect(buildWifiPayload({ ssid: "Cafe", password: "ignored", encryption: "nopass", hidden: true })).toBe(
      "WIFI:T:nopass;S:Cafe;H:true;;"
    );
    expect(buildWifiPayload({ ssid: " ", password: "", encryption: "WPA", hidden: false })).toBe("");
  });

  it("builds encoded mailto payloads", () => {
    expect(buildEmailPayload({ to: "hi@utilby.com", subject: "Hello there", body: "A&B" })).toBe(
      "mailto:hi@utilby.com?subject=Hello%20there&body=A%26B"
    );
    expect(buildEmailPayload({ to: "hi@utilby.com", subject: "", body: "" })).toBe("mailto:hi@utilby.com");
  });

  it("cleans phone numbers for tel and SMS payloads", () => {
    expect(buildPhonePayload("+880 1712-345 678")).toBe("tel:+8801712345678");
    expect(buildSmsPayload({ phone: "01712 345678", message: "Hi" })).toBe("SMSTO:01712345678:Hi");
    expect(buildPhonePayload("abc")).toBe("");
  });

  it("builds a valid vCard 3.0", () => {
    const card = buildVCardPayload({
      firstName: "Md.",
      lastName: "Faisal",
      organization: "Utilby",
      title: "",
      phone: "+880 1700 000000",
      email: "hello@utilby.com",
      website: "utilby.com",
      address: "",
    });
    expect(card.startsWith("BEGIN:VCARD\nVERSION:3.0")).toBe(true);
    expect(card).toContain("FN:Md. Faisal");
    expect(card).toContain("TEL;TYPE=CELL:+8801700000000");
    expect(card).toContain("URL:https://utilby.com");
    expect(card.endsWith("END:VCARD")).toBe(true);
  });

  it("flags low-contrast and inverted colors", () => {
    expect(checkColorContrast("#000000", "#ffffff").ok).toBe(true);
    expect(checkColorContrast("#dddddd", "#ffffff").ok).toBe(false);
    expect(checkColorContrast("#ffffff", "#000000").inverted).toBe(true);
  });

  it("generates an SVG with the chosen colors", async () => {
    const svg = await generateQrSvg("https://utilby.com", DEFAULT_STYLE);
    expect(svg).toContain("<svg");
    expect(svg.toLowerCase()).toContain("#0f172a");
  });

  it("measures payload size in UTF-8 bytes", () => {
    expect(getPayloadByteLength("abc")).toBe(3);
    expect(getPayloadByteLength("বাংলা")).toBeGreaterThan(5);
  });
});
