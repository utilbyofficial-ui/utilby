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
  const [svg, setSvg] = React.useState("");
  const [error, setError] = React.useState("");
  const [copied, setCopied] = React.useState(false);

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
        setError("This content is too long to fit in a QR code. Shorten it or lower the error correction level.");
      });
    return () => {
      cancelled = true;
    };
  }, [debouncedPayload, debouncedStyle]);

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
      const dataUrl = await generateQrPngDataUrl(payload, style);
      triggerDownload(dataUrl, `${fileBase}-${style.size}px.png`);
    } catch {
      setError("Could not create the PNG. Try shortening the content.");
    }
  };

  const downloadSvg = () => {
    if (!svg) return;
    const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
    const href = URL.createObjectURL(blob);
    triggerDownload(href, `${fileBase}.svg`);
    setTimeout(() => URL.revokeObjectURL(href), 1000);
  };

  const copyImage = async () => {
    if (!payload) return;
    try {
      const dataUrl = await generateQrPngDataUrl(payload, style);
      const blob = await (await fetch(dataUrl)).blob();
      await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Your browser does not allow copying images. Please use Download PNG instead.");
    }
  };

  const resetStyle = () => setStyle(DEFAULT_STYLE);

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
              {svg ? (
                <div
                  className="h-full w-full [&>svg]:h-full [&>svg]:w-full"
                  role="img"
                  aria-label="Generated QR code preview"
                  dangerouslySetInnerHTML={{ __html: svg }}
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
            <Button type="button" onClick={downloadPng} disabled={!svg}>
              <Download className="h-4 w-4" /> PNG
            </Button>
            <Button type="button" variant="outline" onClick={downloadSvg} disabled={!svg}>
              <Download className="h-4 w-4" /> SVG
            </Button>
          </div>
          <Button type="button" variant="secondary" className="w-full" onClick={copyImage} disabled={!svg}>
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
