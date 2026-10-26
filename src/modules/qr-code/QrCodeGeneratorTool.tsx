"use client";

import * as React from "react";
import {
  QrContentType,
  ErrorCorrectionLevel,
  WifiData,
  EmailData,
  SmsData,
  VCardData,
  QrStyleOptions,
  DEFAULT_STYLE,
  normalizeUrl,
  buildWifiPayload,
  buildEmailPayload,
  buildPhonePayload,
  buildSmsPayload,
  buildVCardPayload,
  checkColorContrast,
  isValidHexColor,
  generateQrSvg,
  generateQrPngDataUrl,
  getPayloadByteLength,
  MAX_PAYLOAD_BYTES,
} from "./engine";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import {
  Link2,
  Type,
  Wifi,
  Mail,
  Phone,
  MessageSquare,
  Contact,
  Download,
  RotateCcw,
  AlertTriangle,
  QrCode,
  ArrowLeftRight,
  Copy,
  Check,
  ImagePlus,
  X,
} from "lucide-react";

const CONTENT_TYPES: { id: QrContentType; label: string; icon: React.ElementType }[] = [
  { id: "url", label: "URL", icon: Link2 },
  { id: "text", label: "Text", icon: Type },
  { id: "wifi", label: "Wi-Fi", icon: Wifi },
  { id: "email", label: "Email", icon: Mail },
  { id: "phone", label: "Phone", icon: Phone },
  { id: "sms", label: "SMS", icon: MessageSquare },
  { id: "vcard", label: "Contact", icon: Contact },
];

const EC_LEVELS: { id: ErrorCorrectionLevel; label: string; hint: string }[] = [
  { id: "L", label: "Low", hint: "7%" },
  { id: "M", label: "Medium", hint: "15%" },
  { id: "Q", label: "Quartile", hint: "25%" },
  { id: "H", label: "High", hint: "30%" },
];

const SIZES = [256, 512, 1024, 2048];

const EMPTY_VCARD: VCardData = {
  firstName: "",
  lastName: "",
  organization: "",
  title: "",
  phone: "",
  email: "",
  website: "",
  address: "",
};

const selectClass =
  "h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-ink/20 focus:border-ink";
const MAX_LOGO_FILE_BYTES = 5 * 1024 * 1024;
const MAX_LOGO_DIMENSION = 512;

function loadImage(source: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Could not read this image."));
    image.src = source;
  });
}

async function normalizeLogoFile(file: File): Promise<string> {
  const acceptedTypes = ["image/png", "image/jpeg", "image/webp"];
  if (!acceptedTypes.includes(file.type)) {
    throw new Error("Choose a PNG, JPG, or WebP image.");
  }
  if (file.size > MAX_LOGO_FILE_BYTES) {
    throw new Error("Choose an image smaller than 5 MB.");
  }

  const objectUrl = URL.createObjectURL(file);
  try {
    const image = await loadImage(objectUrl);
    if (image.naturalWidth * image.naturalHeight > 40_000_000) {
      throw new Error("This image is too large to process. Choose a smaller image.");
    }
    const scale = Math.min(1, MAX_LOGO_DIMENSION / Math.max(image.naturalWidth, image.naturalHeight));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Your browser could not prepare this image.");
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/png");
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

function addLogoToSvg(svg: string, logo: string, percent: number, background: string): string {
  if (!svg || !logo) return svg;
  const viewBox = svg.match(/viewBox=["']([^"']+)["']/i)?.[1];
  const dimensions = viewBox?.trim().split(/[\s,]+/).map(Number);
  const [minX = 0, minY = 0, width = 512, height = 512] = dimensions?.length === 4 ? dimensions : [0, 0, 512, 512];
  if (![minX, minY, width, height].every(Number.isFinite) || width <= 0 || height <= 0) return svg;

  const side = Math.min(width, height) * (percent / 100);
  const plateSide = side * 1.28;
  const x = minX + (width - side) / 2;
  const y = minY + (height - side) / 2;
  const plateX = minX + (width - plateSide) / 2;
  const plateY = minY + (height - plateSide) / 2;
  const radius = plateSide * 0.16;
  const overlay = `<rect x="${plateX}" y="${plateY}" width="${plateSide}" height="${plateSide}" rx="${radius}" fill="${background}"/><image href="${logo}" x="${x}" y="${y}" width="${side}" height="${side}" preserveAspectRatio="xMidYMid meet"/>`;
  return svg.replace(/<\/svg>\s*$/i, `${overlay}</svg>`);
}

async function addLogoToPng(dataUrl: string, logo: string, percent: number, background: string): Promise<string> {
  if (!logo) return dataUrl;
  const [qrImage, logoImage] = await Promise.all([loadImage(dataUrl), loadImage(logo)]);
  const canvas = document.createElement("canvas");
  canvas.width = qrImage.naturalWidth;
  canvas.height = qrImage.naturalHeight;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Your browser could not prepare the QR image.");
  context.drawImage(qrImage, 0, 0);

  const side = Math.min(canvas.width, canvas.height) * (percent / 100);
  const plateSide = side * 1.28;
  const x = (canvas.width - plateSide) / 2;
  const y = (canvas.height - plateSide) / 2;
  const radius = plateSide * 0.16;
  context.beginPath();
  context.moveTo(x + radius, y);
  context.arcTo(x + plateSide, y, x + plateSide, y + plateSide, radius);
  context.arcTo(x + plateSide, y + plateSide, x, y + plateSide, radius);
  context.arcTo(x, y + plateSide, x, y, radius);
  context.arcTo(x, y, x + plateSide, y, radius);
  context.closePath();
  context.fillStyle = background;
  context.fill();
  const imageScale = Math.min(side / logoImage.naturalWidth, side / logoImage.naturalHeight);
  const logoWidth = logoImage.naturalWidth * imageScale;
  const logoHeight = logoImage.naturalHeight * imageScale;
  context.drawImage(
    logoImage,
    (canvas.width - logoWidth) / 2,
    (canvas.height - logoHeight) / 2,
    logoWidth,
    logoHeight
  );
  return canvas.toDataURL("image/png");
}

function useDebounced<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = React.useState(value);
  React.useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const [draft, setDraft] = React.useState(value);
  React.useEffect(() => setDraft(value), [value]);
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-slate-700 dark:text-slate-300">{label}</label>
      <div className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-2 h-10 dark:border-slate-700 dark:bg-slate-900">
        <input
          type="color"
          aria-label={`${label} picker`}
          value={isValidHexColor(value) && value.length === 7 ? value : "#000000"}
          onChange={(e) => onChange(e.target.value)}
          className="h-7 w-8 cursor-pointer rounded border-0 bg-transparent p-0"
        />
        <input
          type="text"
          aria-label={`${label} hex value`}
          value={draft}
          maxLength={7}
          onChange={(e) => {
            const v = e.target.value.startsWith("#") ? e.target.value : `#${e.target.value}`;
            setDraft(v);
            if (isValidHexColor(v)) onChange(v);
          }}
          className="w-full bg-transparent font-mono text-sm uppercase text-slate-800 focus:outline-none dark:text-slate-200"
        />
      </div>
    </div>
  );
}

export function QrCodeGeneratorTool() {
  const [type, setType] = React.useState<QrContentType>("url");
  const [url, setUrl] = React.useState("https://utilby.com");
  const [text, setText] = React.useState("");
  const [wifi, setWifi] = React.useState<WifiData>({ ssid: "", password: "", encryption: "WPA", hidden: false });
  const [email, setEmail] = React.useState<EmailData>({ to: "", subject: "", body: "" });
  const [phone, setPhone] = React.useState("");
  const [sms, setSms] = React.useState<SmsData>({ phone: "", message: "" });
  const [vcard, setVcard] = React.useState<VCardData>(EMPTY_VCARD);
  const [style, setStyle] = React.useState<QrStyleOptions>(DEFAULT_STYLE);
  const [logo, setLogo] = React.useState("");
  const [logoName, setLogoName] = React.useState("");
  const [logoPercent, setLogoPercent] = React.useState(15);
  const [logoError, setLogoError] = React.useState("");
  const [svg, setSvg] = React.useState("");
  const [error, setError] = React.useState("");
  const [copied, setCopied] = React.useState(false);
  const logoInputRef = React.useRef<HTMLInputElement>(null);
  const logoSelectionRef = React.useRef(0);

  const payload = React.useMemo(() => {
    switch (type) {
      case "url":
        return normalizeUrl(url);
      case "text":
        return text;
      case "wifi":
        return buildWifiPayload(wifi);
      case "email":
        return buildEmailPayload(email);
      case "phone":
        return buildPhonePayload(phone);
      case "sms":
        return buildSmsPayload(sms);
      case "vcard":
        return buildVCardPayload(vcard);
    }
  }, [type, url, text, wifi, email, phone, sms, vcard]);

  const debouncedPayload = useDebounced(payload, 150);
  const debouncedStyle = useDebounced(style, 150);
  const contrast = checkColorContrast(style.foreground, style.background);
  const byteLength = getPayloadByteLength(payload);
  const maxBytes = MAX_PAYLOAD_BYTES[style.errorCorrection];
  const displaySvg = React.useMemo(
    () => addLogoToSvg(svg, logo, logoPercent, isValidHexColor(style.background) ? style.background : "#ffffff"),
    [svg, logo, logoPercent, style.background]
  );

  React.useEffect(() => {
    let cancelled = false;
    if (!debouncedPayload) {
      setSvg("");
      setError("");
      return;
    }
    generateQrSvg(debouncedPayload, debouncedStyle)
      .then((result) => {
        if (cancelled) return;
        setSvg(result);
        setError("");
      })
      .catch(() => {
        if (cancelled) return;
        setSvg("");
        setError(logo
          ? "This content is too long for a QR code with a logo at this correction level. Shorten it or remove the logo."
          : "This content is too long to fit in a QR code. Shorten it or lower the error correction level.");
      });
    return () => {
      cancelled = true;
    };
  }, [debouncedPayload, debouncedStyle, logo]);

  const fileBase = `utilby-qr-${type}`;

  const triggerDownload = (href: string, filename: string) => {
    const a = document.createElement("a");
    a.href = href;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const downloadPng = async () => {
    if (!payload) return;
    try {
      const baseDataUrl = await generateQrPngDataUrl(payload, style);
      const dataUrl = await addLogoToPng(baseDataUrl, logo, logoPercent, style.background);
      triggerDownload(dataUrl, `${fileBase}-${style.size}px.png`);
    } catch {
      setError("Could not create the PNG. Try shortening the content.");
    }
  };

  const downloadSvg = () => {
    if (!displaySvg) return;
    const blob = new Blob([displaySvg], { type: "image/svg+xml;charset=utf-8" });
    const href = URL.createObjectURL(blob);
    triggerDownload(href, `${fileBase}.svg`);
    setTimeout(() => URL.revokeObjectURL(href), 1000);
  };

  const copyImage = async () => {
    if (!payload) return;
    try {
      const baseDataUrl = await generateQrPngDataUrl(payload, style);
      const dataUrl = await addLogoToPng(baseDataUrl, logo, logoPercent, style.background);
      const blob = await (await fetch(dataUrl)).blob();
      await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Your browser does not allow copying images. Please use Download PNG instead.");
    }
  };

  const resetStyle = () => setStyle(DEFAULT_STYLE);

  const handleLogoFile = async (file?: File) => {
    if (!file) return;
    const selectionId = ++logoSelectionRef.current;
    setLogoError("");
    try {
      const normalizedLogo = await normalizeLogoFile(file);
      if (selectionId !== logoSelectionRef.current) return;
      setLogo(normalizedLogo);
      setLogoName(file.name);
      setStyle((current) => ({ ...current, errorCorrection: "H" }));
    } catch (reason) {
      if (selectionId !== logoSelectionRef.current) return;
      setLogoError(reason instanceof Error ? reason.message : "Could not use this image.");
    }
  };

  const removeLogo = () => {
    logoSelectionRef.current += 1;
    setLogo("");
    setLogoName("");
    setLogoError("");
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      {/* Content Type Tabs */}
      <div role="tablist" aria-label="QR content type" className="flex flex-wrap gap-2">
        {CONTENT_TYPES.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={type === id}
            onClick={() => setType(id)}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs sm:text-sm font-semibold transition-colors ${
              type === id
                ? "bg-ink text-white shadow-sm"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-[1fr_340px] lg:grid-rows-[auto_1fr] gap-6 lg:gap-x-8">
        {/* Inputs */}
        <div className="min-w-0 lg:col-start-1 lg:row-start-1">
          <div className="space-y-4">
            {type === "url" && (
              <Input
                label="Website URL"
                placeholder="https://example.com"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                inputMode="url"
                autoComplete="off"
              />
            )}

            {type === "text" && (
              <Textarea
                label="Plain Text"
                placeholder="Type any text, note, or code..."
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={5}
              />
            )}

            {type === "wifi" && (
              <>
                <Input
                  label="Network Name (SSID)"
                  placeholder="My Home Wi-Fi"
                  value={wifi.ssid}
                  onChange={(e) => setWifi({ ...wifi, ssid: e.target.value })}
                  autoComplete="off"
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Security</label>
                    <select
                      className={selectClass}
                      value={wifi.encryption}
                      onChange={(e) => setWifi({ ...wifi, encryption: e.target.value as WifiData["encryption"] })}
                    >
                      <option value="WPA">WPA / WPA2 / WPA3</option>
                      <option value="WEP">WEP</option>
                      <option value="nopass">No password (open)</option>
                    </select>
                  </div>
                  {wifi.encryption !== "nopass" && (
                    <Input
                      label="Password"
                      type="text"
                      placeholder="Wi-Fi password"
                      value={wifi.password}
                      onChange={(e) => setWifi({ ...wifi, password: e.target.value })}
                      autoComplete="off"
                    />
                  )}
                </div>
                <label className="flex items-center gap-3 text-sm text-slate-700 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={wifi.hidden}
                    onChange={(e) => setWifi({ ...wifi, hidden: e.target.checked })}
                    className="h-4 w-4 rounded accent-ink"
                  />
                  Hidden network
                </label>
              </>
            )}

            {type === "email" && (
              <>
                <Input
                  label="Recipient Email"
                  type="email"
                  placeholder="name@example.com"
                  value={email.to}
                  onChange={(e) => setEmail({ ...email, to: e.target.value })}
                />
                <Input
                  label="Subject (optional)"
                  value={email.subject}
                  onChange={(e) => setEmail({ ...email, subject: e.target.value })}
                />
                <Textarea
                  label="Message (optional)"
                  rows={3}
                  value={email.body}
                  onChange={(e) => setEmail({ ...email, body: e.target.value })}
                />
              </>
            )}

            {type === "phone" && (
              <Input
                label="Phone Number"
                type="tel"
                placeholder="+1 555 123 4567"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            )}

            {type === "sms" && (
              <>
                <Input
                  label="Phone Number"
                  type="tel"
                  placeholder="+1 555 123 4567"
                  value={sms.phone}
                  onChange={(e) => setSms({ ...sms, phone: e.target.value })}
                />
                <Textarea
                  label="Message (optional)"
                  rows={3}
                  value={sms.message}
                  onChange={(e) => setSms({ ...sms, message: e.target.value })}
                />
              </>
            )}

            {type === "vcard" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input label="First Name" value={vcard.firstName} onChange={(e) => setVcard({ ...vcard, firstName: e.target.value })} />
                <Input label="Last Name" value={vcard.lastName} onChange={(e) => setVcard({ ...vcard, lastName: e.target.value })} />
                <Input label="Company" value={vcard.organization} onChange={(e) => setVcard({ ...vcard, organization: e.target.value })} />
                <Input label="Job Title" value={vcard.title} onChange={(e) => setVcard({ ...vcard, title: e.target.value })} />
                <Input label="Phone" type="tel" value={vcard.phone} onChange={(e) => setVcard({ ...vcard, phone: e.target.value })} />
                <Input label="Email" type="email" value={vcard.email} onChange={(e) => setVcard({ ...vcard, email: e.target.value })} />
                <Input label="Website" value={vcard.website} onChange={(e) => setVcard({ ...vcard, website: e.target.value })} />
                <Input label="Address" value={vcard.address} onChange={(e) => setVcard({ ...vcard, address: e.target.value })} />
              </div>
            )}
          </div>
        </div>

        {/* Preview (shown right after inputs on mobile, sticky right column on desktop) */}
        <div className="lg:col-start-2 lg:row-start-1 lg:row-span-2 lg:sticky lg:top-24 self-start space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-950">
            <div
              className="mx-auto aspect-square w-full max-w-[300px] overflow-hidden rounded-xl bg-white shadow-sm flex items-center justify-center"
              style={{ backgroundColor: isValidHexColor(style.background) ? style.background : "#ffffff" }}
            >
              {displaySvg ? (
                <div
                  className="h-full w-full [&>svg]:h-full [&>svg]:w-full"
                  role="img"
                  aria-label="Generated QR code preview"
                  dangerouslySetInnerHTML={{ __html: displaySvg }}
                />
              ) : (
                <div className="flex flex-col items-center gap-2 p-6 text-center text-slate-400 bg-white h-full w-full justify-center">
                  <QrCode className="h-12 w-12" />
                  <span className="text-xs">Enter content to generate your QR code</span>
                </div>
              )}
            </div>

            <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500">
              <span>
                {byteLength} / {maxBytes} bytes
              </span>
              <span>Generated in your browser</span>
            </div>
          </div>

          {error && (
            <div className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2">
            <Button type="button" onClick={downloadPng} disabled={!displaySvg}>
              <Download className="h-4 w-4" /> PNG
            </Button>
            <Button type="button" variant="outline" onClick={downloadSvg} disabled={!displaySvg}>
              <Download className="h-4 w-4" /> SVG
            </Button>
          </div>
          <Button type="button" variant="secondary" className="w-full" onClick={copyImage} disabled={!displaySvg}>
            {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
            {copied ? "Copied to clipboard" : "Copy image"}
          </Button>
        </div>
        {/* Styling */}
        <div className="min-w-0 lg:col-start-1 lg:row-start-2">
          <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 sm:p-5 space-y-5 dark:border-slate-800 dark:bg-slate-800/50">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Design & Export</span>
              <button
                type="button"
                onClick={resetStyle}
                className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-ink"
              >
                <RotateCcw className="h-3.5 w-3.5" /> Reset
              </button>
            </div>

            <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-2 sm:gap-3">
              <ColorField label="QR Color" value={style.foreground} onChange={(v) => setStyle({ ...style, foreground: v })} />
              <button
                type="button"
                title="Swap colors"
                aria-label="Swap colors"
                onClick={() => setStyle({ ...style, foreground: style.background, background: style.foreground })}
                className="mx-auto h-10 w-10 inline-flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700"
              >
                <ArrowLeftRight className="h-4 w-4" />
              </button>
              <ColorField label="Background" value={style.background} onChange={(v) => setStyle({ ...style, background: v })} />
            </div>

            <div className="space-y-2.5 rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Add a logo</label>
                  <p className="mt-0.5 text-[11px] text-slate-500">PNG, JPG, or WebP · up to 5 MB · stays in your browser</p>
                </div>
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="sr-only"
                  aria-label="Choose a logo image"
                  onChange={(event) => {
                    void handleLogoFile(event.target.files?.[0]);
                    event.currentTarget.value = "";
                  }}
                />
                <Button type="button" variant="outline" onClick={() => logoInputRef.current?.click()}>
                  <ImagePlus className="h-4 w-4" /> {logo ? "Change logo" : "Choose logo"}
                </Button>
              </div>

              {logo && (
                <div className="flex items-center gap-3 rounded-lg bg-slate-50 p-2 dark:bg-slate-800">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-white p-1 dark:border-slate-700">
                    {/* The image is converted to a PNG data URL locally before display. */}
                    <img src={logo} alt="Selected logo preview" className="max-h-full max-w-full object-contain" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium text-slate-700 dark:text-slate-200">{logoName}</p>
                    <label className="mt-1 flex items-center gap-2 text-[11px] text-slate-500">
                      Logo size
                      <input
                        type="range"
                        min={10}
                        max={18}
                        value={logoPercent}
                        aria-label="Logo size"
                        onChange={(event) => setLogoPercent(Number(event.target.value))}
                        className="min-w-0 flex-1 accent-ink"
                      />
                      <span className="w-8 text-right font-mono">{logoPercent}%</span>
                    </label>
                  </div>
                  <button
                    type="button"
                    onClick={removeLogo}
                    aria-label="Remove logo"
                    title="Remove logo"
                    className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-slate-500 hover:bg-slate-200 hover:text-slate-800 dark:hover:bg-slate-700 dark:hover:text-white"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}

              {logoError && <p role="alert" className="text-xs text-rose-600">{logoError}</p>}
              {logo && (
                <p className={`text-[11px] ${style.errorCorrection === "H" ? "text-emerald-700 dark:text-emerald-400" : "text-amber-700 dark:text-amber-400"}`}>
                  {style.errorCorrection === "H"
                    ? "High error correction is on. Test the code with a phone before printing."
                    : "High error correction is recommended when a logo is used. Test the code before printing."}
                </p>
              )}
            </div>

            {(!contrast.ok || contrast.inverted) && (
              <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300">
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>
                  {!contrast.ok
                    ? `Low contrast (${contrast.ratio}:1). Many phones won't scan this — use a darker QR color or lighter background.`
                    : "Light QR on a dark background isn't supported by some older scanners. Dark on light is the safest choice."}
                </span>
              </div>
            )}

            <div>
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300 block mb-1.5">
                Error Correction
              </label>
              <div className="grid grid-cols-4 gap-2">
                {EC_LEVELS.map((lvl) => (
                  <button
                    key={lvl.id}
                    type="button"
                    onClick={() => setStyle({ ...style, errorCorrection: lvl.id })}
                    className={`rounded-lg px-2 py-1.5 text-xs font-semibold transition-colors ${
                      style.errorCorrection === lvl.id
                        ? "bg-ink text-white"
                        : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    {lvl.label}
                    <span className="block text-[10px] font-normal opacity-75">{lvl.hint}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 items-end gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-700 block">PNG Size</label>
                <select
                  className={selectClass}
                  value={style.size}
                  onChange={(e) => setStyle({ ...style, size: Number(e.target.value) })}
                >
                  {SIZES.map((s) => (
                    <option key={s} value={s}>
                      {s} × {s} px
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-slate-700">Quiet Zone</label>
                  <span className="font-mono text-xs text-slate-500">{style.margin}</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={8}
                  value={style.margin}
                  onChange={(e) => setStyle({ ...style, margin: Number(e.target.value) })}
                  className="w-full accent-ink cursor-pointer h-10"
                />
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
