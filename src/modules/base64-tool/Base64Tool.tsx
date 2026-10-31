"use client";

import * as React from "react";
import { ArrowLeftRight, CheckCircle2, Download, FileUp, ShieldCheck, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { CopyButton } from "@/components/shared/CopyButton";
import {
  cleanDecodedFilename,
  decodeBase64Bytes,
  decodeUtf8Bytes,
  encodeBase64Bytes,
  getBase64DataUrlMimeType,
  getFilenameForMimeType,
  MAX_BASE64_BINARY_BYTES,
  MAX_BASE64_TEXT_BYTES,
} from "./engine";

type Direction = "encode" | "decode";
type ConversionResult =
  | { kind: "encoded"; text: string; byteLength: number }
  | { kind: "decoded"; bytes: Uint8Array; text: string | null; mimeType: string; byteLength: number };

const SAMPLE_TEXT = "Utilby — ফাইলগুলো আপনার ডিভাইসেই থাকে 🙂";
const SAMPLE_BASE64 = "VXRpbGJ5IOKAlCDgpqvgpr7gpofgprLgppfgp4HgprLgp4sg4KaG4Kaq4Kao4Ka+4KawIOCmoeCmv+CmreCmvuCmh+CmuOCnh+CmhyDgpqXgpr7gppXgp4cg8J+Zgg==";

function isValidMimeType(value: string): boolean {
  return /^[\w!#$&^_.+-]+\/[\w!#$&^_.+-]+(?:;[\w!#$&^_.+-]+=[\w!#$&^_.+-]+)*$/i.test(value.trim());
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  return bytes < 1024 ? `${bytes} B` : bytes < 1024 * 1024 ? `${(bytes / 1024).toFixed(1)} KB` : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function downloadText(text: string, filename: string) {
  const url = URL.createObjectURL(new Blob([text], { type: "text/plain;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 3000);
}

function downloadBytes(bytes: Uint8Array, filename: string, mimeType: string) {
  const buffer = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(buffer).set(bytes);
  const url = URL.createObjectURL(new Blob([buffer], { type: mimeType || "application/octet-stream" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 3000);
}

export function Base64Tool() {
  const [direction, setDirection] = React.useState<Direction>("encode");
  const [inputText, setInputText] = React.useState("");
  const [result, setResult] = React.useState<ConversionResult | null>(null);
  const [urlSafe, setUrlSafe] = React.useState(false);
  const [omitPadding, setOmitPadding] = React.useState(false);
  const [includeDataUrl, setIncludeDataUrl] = React.useState(false);
  const [sourceFile, setSourceFile] = React.useState<{ name: string; type: string; bytes: Uint8Array } | null>(null);
  const [filename, setFilename] = React.useState("decoded-file.bin");
  const [mimeType, setMimeType] = React.useState("text/plain;charset=utf-8");
  const [errorMessage, setErrorMessage] = React.useState("");
  const [notice, setNotice] = React.useState("");
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const fileReadGeneration = React.useRef(0);

  const isEncoding = direction === "encode";
  const clearResult = () => {
    setResult(null);
    setErrorMessage("");
    setNotice("");
  };

  const convert = () => {
    clearResult();
    if (isEncoding) {
      if (sourceFile && inputText.length === 0) {
        if (sourceFile.bytes.byteLength > MAX_BASE64_BINARY_BYTES) {
          setErrorMessage("Choose a file smaller than 5 MB for smooth in-browser conversion.");
          return;
        }
        const encoded = encodeBase64Bytes(sourceFile.bytes, { urlSafe: urlSafe && !includeDataUrl, omitPadding: omitPadding && !includeDataUrl });
        const text = includeDataUrl
          ? `data:${sourceFile.type || "application/octet-stream"};base64,${encodeBase64Bytes(sourceFile.bytes)}`
          : encoded;
        setResult({ kind: "encoded", text, byteLength: sourceFile.bytes.byteLength });
        setNotice(`${sourceFile.name} converted to Base64. The original file is unchanged.`);
        return;
      }
      if (!inputText) {
        setErrorMessage("Type some text or choose a file to get started.");
        return;
      }
      const textBytes = new TextEncoder().encode(inputText);
      if (textBytes.byteLength > MAX_BASE64_BINARY_BYTES) {
        setErrorMessage("Keep the text under 5 MB so conversion stays responsive in your browser.");
        return;
      }
      if (includeDataUrl && !isValidMimeType(mimeType)) {
        setErrorMessage("Enter a valid MIME type, such as text/plain;charset=utf-8.");
        return;
      }
      const encoded = encodeBase64Bytes(textBytes, { urlSafe: urlSafe && !includeDataUrl, omitPadding: omitPadding && !includeDataUrl });
      const text = includeDataUrl ? `data:${mimeType || "text/plain;charset=utf-8"};base64,${encoded}` : encoded;
      setResult({ kind: "encoded", text, byteLength: textBytes.byteLength });
      return;
    }

    if (!inputText.trim()) {
      setErrorMessage("Paste Base64 text or a data URL to get started.");
      return;
    }
    if (inputText.length > MAX_BASE64_TEXT_BYTES || new TextEncoder().encode(inputText).byteLength > MAX_BASE64_TEXT_BYTES) {
      setErrorMessage("Keep Base64 input under 7 MB so conversion stays responsive in your browser.");
      return;
    }
    try {
      const bytes = decodeBase64Bytes(inputText);
      if (bytes.byteLength > MAX_BASE64_BINARY_BYTES) {
        setErrorMessage("The decoded file is larger than the 5 MB limit. Use a smaller Base64 value and try again.");
        return;
      }
      const detectedMime = getBase64DataUrlMimeType(inputText);
      const effectiveMime = detectedMime || mimeType || "application/octet-stream";
      let text: string | null = null;
      try {
        text = decodeUtf8Bytes(bytes);
      } catch {
        setNotice("This is binary data, so it cannot be shown as readable text. Save the decoded file to use it.");
      }
      setResult({ kind: "decoded", bytes, text, mimeType: effectiveMime, byteLength: bytes.byteLength });
      if (detectedMime) {
        setMimeType(detectedMime);
        setFilename(getFilenameForMimeType(detectedMime));
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Could not decode this value. Check the Base64 text and try again.");
    }
  };

  const handleFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    const generation = ++fileReadGeneration.current;
    setErrorMessage("");
    setNotice("");
    setResult(null);
    setSourceFile(null);
    if (file.size > MAX_BASE64_BINARY_BYTES) {
      setErrorMessage("Choose a file smaller than 5 MB for smooth in-browser conversion.");
      return;
    }
    try {
      const bytes = new Uint8Array(await file.arrayBuffer());
      if (generation !== fileReadGeneration.current) return;
      setSourceFile({ name: file.name, type: file.type, bytes });
      setInputText("");
      setNotice(`${file.name} is ready to encode. Select Convert to continue.`);
      if (file.type) setMimeType(file.type);
    } catch {
      if (generation === fileReadGeneration.current) setErrorMessage("This file could not be read. Try choosing it again.");
    }
  };

  const changeDirection = (next: Direction) => {
    if (next === direction) return;
    fileReadGeneration.current += 1;
    setDirection(next);
    setInputText("");
    setSourceFile(null);
    setFilename("decoded-file.bin");
    setMimeType(next === "encode" ? "text/plain;charset=utf-8" : "application/octet-stream");
    setUrlSafe(false);
    setOmitPadding(false);
    setIncludeDataUrl(false);
    clearResult();
  };

  const loadSample = () => {
    fileReadGeneration.current += 1;
    setSourceFile(null);
    setInputText(isEncoding ? SAMPLE_TEXT : SAMPLE_BASE64);
    clearResult();
  };

  const clearAll = () => {
    fileReadGeneration.current += 1;
    setInputText("");
    setSourceFile(null);
    setFilename("decoded-file.bin");
    setMimeType(isEncoding ? "text/plain;charset=utf-8" : "application/octet-stream");
    setNotice("");
    setUrlSafe(false);
    setOmitPadding(false);
    setIncludeDataUrl(false);
    clearResult();
  };

  const saveResult = () => {
    if (!result) return;
    if (result.kind === "encoded") {
      const base = sourceFile ? cleanDecodedFilename(sourceFile.name) : "encoded-text";
      downloadText(result.text, `${base}.base64.txt`);
      return;
    }
    downloadBytes(result.bytes, cleanDecodedFilename(filename), mimeType || result.mimeType);
  };

  const resultText = result?.kind === "encoded" ? result.text : result?.kind === "decoded" ? result.text ?? "" : "";
  const resultLabel = result?.kind === "encoded" ? "Base64 output" : "Decoded text";
  const canCopy = Boolean(result && resultText);

  return (
    <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm" aria-label="Base64 encoder and decoder">
      <div className="border-b border-slate-100 bg-gradient-to-r from-indigo-50 via-white to-cyan-50 p-4 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-indigo-700">Developer utility</p>
            <h2 className="mt-1 font-display text-xl font-extrabold text-ink sm:text-2xl">Encode and decode Base64</h2>
            <p className="mt-1 text-sm text-slate-600">Convert Unicode text or files, with optional URL-safe output.</p>
          </div>
          <div className="inline-flex w-full rounded-2xl border border-slate-200 bg-white p-1 shadow-sm sm:w-auto" role="group" aria-label="Conversion direction">
            <button type="button" aria-pressed={isEncoding} onClick={() => changeDirection("encode")} className={`flex-1 rounded-xl px-4 py-2.5 text-xs font-bold transition sm:flex-none ${isEncoding ? "bg-ink text-white shadow-sm" : "text-slate-600 hover:bg-slate-50"}`}>Encode</button>
            <button type="button" aria-pressed={!isEncoding} onClick={() => changeDirection("decode")} className={`flex-1 rounded-xl px-4 py-2.5 text-xs font-bold transition sm:flex-none ${!isEncoding ? "bg-ink text-white shadow-sm" : "text-slate-600 hover:bg-slate-50"}`}>Decode</button>
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-6">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          {isEncoding && (
            <>
              <input ref={fileInputRef} type="file" className="hidden" onChange={(event) => void handleFile(event)} aria-label="Choose a file to encode" />
              <Button type="button" size="sm" variant="outline" onClick={() => fileInputRef.current?.click()}><FileUp className="h-3.5 w-3.5" /> Choose file</Button>
            </>
          )}
          <Button type="button" size="sm" variant="outline" onClick={loadSample}><Sparkles className="h-3.5 w-3.5" /> Try example</Button>
          <Button type="button" size="sm" variant="ghost" onClick={clearAll} disabled={!inputText && !sourceFile && !result}><ArrowLeftRight className="h-3.5 w-3.5" /> Clear</Button>
          <span className="ml-auto inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700"><ShieldCheck className="h-4 w-4" /> Stays on your device</span>
        </div>

        {isEncoding ? (
          <div className="mb-4 flex flex-wrap items-center gap-x-5 gap-y-3 rounded-2xl bg-slate-50 p-3.5">
            <label className="flex cursor-pointer items-center gap-2 text-xs font-semibold text-slate-700">
              <input type="checkbox" checked={urlSafe} disabled={includeDataUrl} onChange={(event) => { setUrlSafe(event.target.checked); clearResult(); }} className="h-4 w-4 rounded border-slate-300 accent-indigo-600" />
              URL-safe (- and _)
            </label>
            <label className="flex cursor-pointer items-center gap-2 text-xs font-semibold text-slate-700">
              <input type="checkbox" checked={omitPadding} disabled={includeDataUrl} onChange={(event) => { setOmitPadding(event.target.checked); clearResult(); }} className="h-4 w-4 rounded border-slate-300 accent-indigo-600" />
              Omit trailing = padding
            </label>
            <label className="flex cursor-pointer items-center gap-2 text-xs font-semibold text-slate-700">
              <input type="checkbox" checked={includeDataUrl} onChange={(event) => { setIncludeDataUrl(event.target.checked); clearResult(); }} className="h-4 w-4 rounded border-slate-300 accent-indigo-600" />
              Include data URL prefix
            </label>
            {includeDataUrl && !sourceFile && (
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                MIME type
                <input value={mimeType} onChange={(event) => { setMimeType(event.target.value); clearResult(); }} className="h-9 w-52 rounded-xl border border-slate-200 bg-white px-2.5 text-xs font-medium text-ink focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100" aria-label="Data URL MIME type" />
              </label>
            )}
            {includeDataUrl && <span className="text-[11px] text-slate-500">Data URLs use standard Base64 with padding.</span>}
          </div>
        ) : (
          <div className="mb-4 grid gap-3 rounded-2xl bg-slate-50 p-3.5 sm:grid-cols-2">
            <label className="block text-xs font-semibold text-slate-700">Save decoded file as
              <input value={filename} onChange={(event) => setFilename(event.target.value)} maxLength={140} className="mt-1.5 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-ink focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100" />
            </label>
            <label className="block text-xs font-semibold text-slate-700">File type (MIME)
              <input value={mimeType} onChange={(event) => setMimeType(event.target.value)} maxLength={120} className="mt-1.5 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-ink focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100" />
            </label>
            <p className="text-[11px] leading-5 text-slate-500 sm:col-span-2">When the input is a data URL, its MIME type is detected automatically. For raw Base64, set a suitable file type before saving.</p>
          </div>
        )}

        {sourceFile && isEncoding && (
          <div className="mb-3 flex flex-wrap items-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 px-3.5 py-2.5 text-xs text-indigo-900">
            <FileUp className="h-4 w-4 shrink-0" />
            <span className="min-w-0 flex-1 truncate font-semibold">{sourceFile.name}</span>
            <span className="text-indigo-700">{formatBytes(sourceFile.bytes.byteLength)}{sourceFile.type ? ` · ${sourceFile.type}` : ""}</span>
          </div>
        )}

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="min-w-0">
            <div className="mb-2 flex items-center justify-between gap-2">
              <label htmlFor="base64-input" className="text-sm font-bold text-ink">{isEncoding ? "Text input" : "Base64 input"}</label>
              <span className="text-[11px] text-slate-500">{inputText.length.toLocaleString()} characters · max {isEncoding ? "5 MB" : "7 MB"}</span>
            </div>
            <textarea
              id="base64-input"
              value={inputText}
              onChange={(event) => { fileReadGeneration.current += 1; setInputText(event.target.value); setSourceFile(null); clearResult(); }}
              spellCheck={false}
              autoCapitalize="off"
              autoCorrect="off"
              placeholder={isEncoding ? "Type or paste text here…" : "Paste Base64 text or a data URL here…"}
              className="min-h-[280px] w-full resize-y rounded-2xl border border-slate-200 bg-slate-950 p-4 font-mono text-xs leading-6 text-slate-100 placeholder:text-slate-500 focus:border-indigo-400 focus:outline-none focus:ring-4 focus:ring-indigo-100 sm:min-h-[350px]"
            />
          </div>
          <div className="min-w-0">
            <div className="mb-2 flex min-h-5 items-center justify-between gap-2">
              <span className="text-sm font-bold text-ink">{result ? resultLabel : isEncoding ? "Base64 result" : "Decoded result"}</span>
              {result && <span className="text-[11px] text-slate-500">{formatBytes(result.byteLength)} original bytes</span>}
            </div>
            {result ? result.kind === "decoded" && result.text === null ? (
              <div className="flex min-h-[280px] flex-col items-center justify-center rounded-2xl border border-dashed border-amber-300 bg-amber-50 px-6 text-center sm:min-h-[350px]">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-amber-700 shadow-sm"><FileUp className="h-5 w-5" /></span>
                <p className="mt-3 text-sm font-bold text-amber-950">Binary file decoded</p>
                <p className="mt-1 max-w-xs text-xs leading-5 text-amber-900/80">These bytes are not readable UTF-8 text. Save them as a file to open or use the original content.</p>
                <p className="mt-2 text-[11px] text-amber-900/70">{result.mimeType} · {formatBytes(result.byteLength)}</p>
              </div>
            ) : (
              <textarea readOnly aria-label={resultLabel} value={resultText} className="min-h-[280px] w-full resize-y rounded-2xl border border-slate-200 bg-slate-50 p-4 font-mono text-xs leading-6 text-slate-800 focus:outline-none sm:min-h-[350px]" />
            ) : (
              <div className="flex min-h-[280px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 text-center sm:min-h-[350px]">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-indigo-600 shadow-sm"><ArrowLeftRight className="h-5 w-5" /></span>
                <p className="mt-3 text-sm font-bold text-slate-700">Your result will appear here</p>
                <p className="mt-1 max-w-xs text-xs leading-5 text-slate-500">Choose a file or enter data, then select Convert to preview the result.</p>
              </div>
            )}
          </div>
        </div>

        {errorMessage && <p role="alert" className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs font-medium text-rose-700">{errorMessage}</p>}
        {notice && <p role="status" className="mt-4 rounded-xl border border-sky-200 bg-sky-50 px-3.5 py-2.5 text-xs font-medium text-sky-800">{notice}</p>}

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
          <p className="flex items-center gap-1.5 text-[11px] text-slate-500"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> Converts UTF-8 text and binary files without uploading them.</p>
          <div className="flex flex-wrap items-center gap-2">
            {result && canCopy && <CopyButton textToCopy={resultText} label="Copy result" />}
            {result && <Button type="button" size="sm" variant="outline" onClick={saveResult}><Download className="h-3.5 w-3.5" /> {result.kind === "encoded" ? "Save .txt" : "Save decoded file"}</Button>}
            <Button type="button" size="md" onClick={convert} disabled={isEncoding ? (!inputText && !sourceFile) : !inputText.trim()}><ArrowLeftRight className="h-4 w-4" /> Convert</Button>
          </div>
        </div>
      </div>
    </section>
  );
}
