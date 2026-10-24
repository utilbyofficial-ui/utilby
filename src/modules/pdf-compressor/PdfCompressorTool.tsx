"use client";

import * as React from "react";
import {
  Archive,
  CheckCircle2,
  Download,
  FileText,
  Loader2,
  RotateCcw,
  ShieldCheck,
  UploadCloud,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import {
  COMPRESSION_PRESETS,
  CompressionPreset,
  CompressionProgress,
  compressPdf,
  PdfCompressionResult,
} from "./engine";

const MAX_FILE_BYTES = 200 * 1024 * 1024;
const selectClass = "h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 focus:border-ink focus:outline-none focus:ring-2 focus:ring-ink/15";

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB"];
  let value = bytes / 1024;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit++;
  }
  return `${value.toFixed(value >= 100 ? 0 : 1)} ${units[unit]}`;
}

function cleanOutputName(name: string): string {
  const base = name.replace(/\.pdf$/i, "").replace(/[\\/:*?"<>|]+/g, "-").trim();
  return `${base || "document"}-compressed.pdf`;
}

async function reencodeJpegImage({ bytes, width, height, maxDimension, quality }: {
  bytes: Uint8Array;
  width: number;
  height: number;
  maxDimension: number;
  quality: number;
}): Promise<{ bytes: Uint8Array; width: number; height: number } | null> {
  let bitmap: ImageBitmap | null = null;
  const canvas = document.createElement("canvas");
  try {
    const data = new Uint8Array(bytes);
    bitmap = await createImageBitmap(new Blob([data.buffer as ArrayBuffer], { type: "image/jpeg" }));
    const scale = Math.min(1, maxDimension / Math.max(width, height));
    const outputWidth = Math.max(1, Math.round(width * scale));
    const outputHeight = Math.max(1, Math.round(height * scale));
    canvas.width = outputWidth;
    canvas.height = outputHeight;
    const context = canvas.getContext("2d", { alpha: false });
    if (!context) return null;
    context.fillStyle = "#fff";
    context.fillRect(0, 0, outputWidth, outputHeight);
    context.drawImage(bitmap, 0, 0, outputWidth, outputHeight);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
    if (!blob || blob.size >= bytes.byteLength) return null;
    const output = new Uint8Array(await blob.arrayBuffer());
    return { bytes: output, width: outputWidth, height: outputHeight };
  } catch {
    // Unsupported JPEG variants (for example some CMYK profiles) remain unchanged.
    return null;
  } finally {
    bitmap?.close();
    canvas.width = 0;
    canvas.height = 0;
  }
}

function triggerDownload(bytes: Uint8Array, filename: string) {
  const blob = new Blob([bytes.slice().buffer as ArrayBuffer], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 4000);
}

function ResultCard({ result, onDownload }: {
  result: PdfCompressionResult;
  onDownload: () => void;
}) {
  return (
    <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
            <CheckCircle2 className="h-5 w-5" />
          </span>
          <div>
            <h3 className="font-bold text-ink">{result.wasReduced ? "Your compressed PDF is ready" : "This PDF is already optimized"}</h3>
            <p className="mt-1 text-sm text-slate-600">
              {result.wasReduced
                ? `Reduced by ${result.savingsPercent}% (${formatBytes(result.savedBytes)} saved).`
                : "The safe optimizations could not make this file smaller, so the original is ready to download."}
            </p>
          </div>
        </div>
        <Button onClick={onDownload} className="shrink-0">
          <Download className="mr-2 h-4 w-4" /> Download PDF
        </Button>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl bg-white/80 p-3">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Original</p>
          <p className="mt-1 text-sm font-bold text-ink">{formatBytes(result.originalBytes)}</p>
        </div>
        <div className="rounded-xl bg-white/80 p-3">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">New size</p>
          <p className="mt-1 text-sm font-bold text-ink">{formatBytes(result.compressedBytes)}</p>
        </div>
        <div className="rounded-xl bg-white/80 p-3">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Images optimized</p>
          <p className="mt-1 text-sm font-bold text-ink">{result.modifiedImages}</p>
        </div>
        <div className="rounded-xl bg-white/80 p-3">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Repeated streams</p>
          <p className="mt-1 text-sm font-bold text-ink">{result.deduplicatedStreams}</p>
        </div>
      </div>
    </div>
  );
}

export function PdfCompressorTool() {
  const [file, setFile] = React.useState<File | null>(null);
  const [preset, setPreset] = React.useState<CompressionPreset>("balanced");
  const [result, setResult] = React.useState<PdfCompressionResult | null>(null);
  const [progress, setProgress] = React.useState<CompressionProgress | null>(null);
  const [dragging, setDragging] = React.useState(false);
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [error, setError] = React.useState("");
  const [notice, setNotice] = React.useState("");
  const inputRef = React.useRef<HTMLInputElement>(null);

  const selectFile = (nextFile?: File) => {
    if (!nextFile) return;
    setError("");
    setNotice("");
    setResult(null);
    if (!nextFile.name.toLowerCase().endsWith(".pdf") && nextFile.type !== "application/pdf") {
      setFile(null);
      setError("Choose a PDF file to continue.");
      return;
    }
    if (nextFile.size > MAX_FILE_BYTES) {
      setFile(null);
      setError("This file is larger than 200 MB. Choose a smaller PDF to continue.");
      return;
    }
    setFile(nextFile);
  };

  const runCompression = async () => {
    if (!file || isProcessing) return;
    setIsProcessing(true);
    setError("");
    setNotice("");
    setResult(null);
    setProgress({ stage: "images", current: 0, total: 0 });
    try {
      const bytes = new Uint8Array(await file.arrayBuffer());
      const output = await compressPdf(bytes, { preset }, reencodeJpegImage, setProgress);
      setResult(output);
      if (!output.wasReduced) setNotice("This document may already use compressed images, or it may contain mostly vector text.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Compression failed. Please try another PDF.");
    } finally {
      setIsProcessing(false);
      setProgress(null);
    }
  };

  const clearFile = () => {
    setFile(null);
    setResult(null);
    setError("");
    setNotice("");
    if (inputRef.current) inputRef.current.value = "";
  };

  const onDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragging(false);
    selectFile(event.dataTransfer.files?.[0]);
  };

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-soft sm:p-7" aria-label="PDF compression workspace">
      {!file ? (
        <div
          onDragEnter={(event) => { event.preventDefault(); setDragging(true); }}
          onDragOver={(event) => event.preventDefault()}
          onDragLeave={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node)) setDragging(false); }}
          onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
          className={`group flex min-h-[260px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-5 py-9 text-center transition-colors ${dragging ? "border-ink bg-pdf-soft" : "border-slate-300 bg-slate-50/70 hover:border-ink hover:bg-slate-50"}`}
        >
          <input
            ref={inputRef}
            type="file"
            accept="application/pdf,.pdf"
            className="sr-only"
            onChange={(event) => { selectFile(event.target.files?.[0]); event.target.value = ""; }}
          />
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-pdf-soft text-pdf transition-transform group-hover:-translate-y-0.5">
            <UploadCloud className="h-7 w-7" />
          </span>
          <h2 className="mt-4 font-display text-xl font-bold text-ink">Drop a PDF here</h2>
          <p className="mt-1 text-sm text-slate-600">or click to browse from your device</p>
          <span className="mt-4 rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600 shadow-sm">PDF files up to 200 MB</span>
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-pdf-soft text-pdf"><FileText className="h-5 w-5" /></span>
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-ink">{file.name}</p>
                <p className="mt-0.5 text-xs text-slate-500">{formatBytes(file.size)} · PDF document</p>
              </div>
            </div>
            <button type="button" onClick={clearFile} disabled={isProcessing} className="inline-flex h-9 items-center justify-center gap-1.5 self-end rounded-lg px-3 text-sm font-semibold text-slate-600 hover:bg-white hover:text-ink disabled:opacity-50 sm:self-auto">
              <X className="h-4 w-4" /> Remove
            </button>
          </div>

          <div className="mt-6 grid gap-5 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
            <label className="block">
              <span className="text-sm font-bold text-ink">Compression level</span>
              <select value={preset} onChange={(event) => { setPreset(event.target.value as CompressionPreset); setResult(null); }} className={`${selectClass} mt-2`} disabled={isProcessing}>
                {Object.entries(COMPRESSION_PRESETS).map(([key, option]) => (
                  <option key={key} value={key}>{option.label} — {option.description}</option>
                ))}
              </select>
              <span className="mt-1.5 block text-xs text-slate-500">Text and vector graphics stay sharp. Image quality changes with the selected level.</span>
            </label>
            <Button onClick={runCompression} disabled={isProcessing} className="h-11 min-w-44">
              {isProcessing ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Compressing…</> : <><Archive className="mr-2 h-4 w-4" /> Compress PDF</>}
            </Button>
          </div>

          {isProcessing && (
            <div className="mt-5 rounded-xl bg-pdf-soft px-4 py-3 text-sm font-medium text-ink" role="status" aria-live="polite">
              {progress?.stage === "saving"
                ? "Writing the optimized PDF…"
                : progress?.total
                  ? `Optimizing supported images (${progress.current} of ${progress.total})…`
                  : "Checking the PDF and preparing its images…"}
            </div>
          )}
        </>
      )}

      {error && <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">{error}</p>}
      {notice && !error && <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">{notice}</p>}
      {result && file && (
        <ResultCard result={result} onDownload={() => triggerDownload(result.bytes, cleanOutputName(file.name))} />
      )}

      <div className="mt-6 flex flex-col gap-2 rounded-2xl bg-slate-50 p-4 text-xs leading-relaxed text-slate-600 sm:flex-row sm:items-start sm:gap-3">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
        <p><strong className="text-ink">Private by design.</strong> Your PDF is processed on this device and is never uploaded. This tool optimizes supported JPEG images and repeated PDF streams while keeping vector text as vector content.</p>
      </div>

      {file && !isProcessing && result && (
        <button type="button" onClick={clearFile} className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-ink">
          <RotateCcw className="h-4 w-4" /> Compress another PDF
        </button>
      )}
    </section>
  );
}
