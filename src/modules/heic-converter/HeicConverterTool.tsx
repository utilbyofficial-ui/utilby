"use client";

import * as React from "react";
import { zipSync } from "fflate";
import { Button } from "@/components/ui/Button";
import { computeSavings, dedupeFilenames, formatBytes, MAX_BATCH_BYTES, MAX_BATCH_FILES, MAX_FILE_BYTES } from "@/modules/image-compressor/engine";
import {
  AlertTriangle,
  Archive,
  CheckCircle2,
  Download,
  Eye,
  FileImage,
  ImageIcon,
  Loader2,
  RotateCcw,
  ShieldCheck,
  Trash2,
  UploadCloud,
  X,
} from "lucide-react";

type OutputFormat = "image/jpeg" | "image/png";
type ItemStatus = "queued" | "processing" | "done" | "error";

interface ConversionItem {
  id: string;
  file: File;
  status: ItemStatus;
  resultBlob?: Blob;
  resultUrl?: string;
  outputName?: string;
  width?: number;
  height?: number;
  error?: string;
}

interface WorkerReply {
  id: string;
  blob?: Blob;
  dimensions?: { width: number; height: number };
  error?: string;
}

interface ActiveJob {
  id: string;
  worker: Worker;
  cancel: () => void;
}

const MAX_ZIP_OUTPUT_BYTES = 120 * 1024 * 1024;
const MAX_RETAINED_OUTPUT_BYTES = MAX_ZIP_OUTPUT_BYTES;
const CONVERSION_TIMEOUT_MS = 120_000;
const ACCEPTED_EXTENSIONS = /\.(heic|heif|heics|heifs)$/i;
const ACCEPTED_MIME = /image\/(heic|heif|heic-sequence|heif-sequence)/i;
const INPUT_ACCEPT = ".heic,.heif,.heics,.heifs,image/heic,image/heif,image/heic-sequence,image/heif-sequence";

const selectClass =
  "h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 focus:border-ink focus:outline-none focus:ring-2 focus:ring-ink/20 disabled:cursor-not-allowed disabled:opacity-50";

let idCounter = 0;
const newId = () => `heic-${Date.now()}-${idCounter++}`;

function isHeicCandidate(file: File): boolean {
  return ACCEPTED_EXTENSIONS.test(file.name) || ACCEPTED_MIME.test(file.type);
}

function getOutputName(fileName: string, format: OutputFormat): string {
  const base = fileName.replace(/\.[^.]*$/, "") || "photo";
  return `${base}.${format === "image/jpeg" ? "jpg" : "png"}`;
}

function triggerDownload(href: string, filename: string) {
  const anchor = document.createElement("a");
  anchor.href = href;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
}

function friendlyError(message: string): string {
  const value = message.toLowerCase();
  if (value.includes("120000") || value.includes("timed out")) {
    return "This photo took too long to convert. Try one photo at a time or use a smaller image.";
  }
  if (value.includes("batch output limit")) return message;
  if (value.includes("pixel safety limit")) return message;
  if (value.includes("metadata") || value.includes("dimensions could not be read")) return message;
  if (value.includes("does not appear to be a supported")) return "This file is not a readable HEIC/HEIF photo. Check that it is not damaged.";
  return "This photo could not be converted. It may be damaged or use an unsupported HEIC variant. Try exporting it again from Photos.";
}

function runConversion(
  file: File,
  format: OutputFormat,
  quality: number,
  jobId: string,
  activeJobRef: React.MutableRefObject<ActiveJob | null>
): Promise<{ blob: Blob; dimensions: { width: number; height: number } }> {
  return new Promise((resolve, reject) => {
    let worker: Worker;
    try {
      worker = new Worker(new URL("/workers/heic-converter.worker.js", window.location.href), { type: "module" });
    } catch {
      reject(new Error("This browser could not start the local photo converter. Try the latest version of Chrome, Safari, Edge, or Firefox."));
      return;
    }

    let settled = false;
    const timeout = window.setTimeout(() => finish(new Error("Conversion timed out after 120000 ms.")), CONVERSION_TIMEOUT_MS);
    const finish = (error?: Error, result?: { blob: Blob; dimensions: { width: number; height: number } }) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timeout);
      worker.terminate();
      if (activeJobRef.current?.worker === worker) activeJobRef.current = null;
      if (error) reject(error);
      else if (result) resolve(result);
      else reject(new Error("The photo could not be converted."));
    };

    const activeJob: ActiveJob = {
      id: jobId,
      worker,
      cancel: () => finish(new Error("Conversion cancelled.")),
    };
    activeJobRef.current = activeJob;
    worker.onmessage = (event: MessageEvent<WorkerReply>) => {
      const reply = event.data;
      if (reply.id !== jobId) return;
      if (reply.error) {
        finish(new Error(reply.error));
      } else if (reply.blob && reply.dimensions) {
        finish(undefined, { blob: reply.blob, dimensions: reply.dimensions });
      } else {
        finish(new Error("The converter returned an incomplete result."));
      }
    };
    worker.onerror = (event) => {
      event.preventDefault();
      finish(new Error("The local photo decoder stopped unexpectedly."));
    };
    worker.onmessageerror = () => finish(new Error("The browser could not read the converter result."));

    try {
      worker.postMessage({ id: jobId, file, format, quality: quality / 100 });
    } catch {
      finish(new Error("The browser could not send this photo to the local converter."));
    }
  });
}

export function HeicConverterTool() {
  const [items, setItems] = React.useState<ConversionItem[]>([]);
  const [format, setFormat] = React.useState<OutputFormat>("image/jpeg");
  const [quality, setQuality] = React.useState(90);
  const [dragging, setDragging] = React.useState(false);
  const [notice, setNotice] = React.useState("");
  const [isConverting, setIsConverting] = React.useState(false);
  const [progress, setProgress] = React.useState<{ current: number; total: number; name: string } | null>(null);
  const [previewId, setPreviewId] = React.useState<string | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const itemsRef = React.useRef<ConversionItem[]>([]);
  const activeJobRef = React.useRef<ActiveJob | null>(null);
  const runIdRef = React.useRef(0);

  const commit = React.useCallback((next: ConversionItem[]) => {
    itemsRef.current = next;
    setItems(next);
  }, []);

  const patchItem = React.useCallback(
    (id: string, patch: Partial<ConversionItem>) => {
      commit(itemsRef.current.map((item) => (item.id === id ? { ...item, ...patch } : item)));
    },
    [commit]
  );

  const cancelActiveJob = React.useCallback(() => {
    activeJobRef.current?.cancel();
    activeJobRef.current = null;
  }, []);

  React.useEffect(() => {
    return () => {
      runIdRef.current += 1;
      activeJobRef.current?.cancel();
      itemsRef.current.forEach((item) => {
        if (item.resultUrl) URL.revokeObjectURL(item.resultUrl);
      });
    };
  }, []);

  const addFiles = (fileList: FileList | File[]) => {
    const accepted: ConversionItem[] = [];
    let unsupported = 0;
    let tooLarge = 0;
    let overCapacity = 0;
    let acceptedBytes = 0;
    const currentBytes = itemsRef.current.reduce((sum, item) => sum + item.file.size, 0);

    for (const file of Array.from(fileList)) {
      if (!isHeicCandidate(file)) {
        unsupported += 1;
      } else if (file.size === 0 || file.size > MAX_FILE_BYTES) {
        tooLarge += 1;
      } else if (
        itemsRef.current.length + accepted.length >= MAX_BATCH_FILES ||
        currentBytes + acceptedBytes + file.size > MAX_BATCH_BYTES
      ) {
        overCapacity += 1;
      } else {
        acceptedBytes += file.size;
        accepted.push({ id: newId(), file, status: "queued" });
      }
    }

    const messages: string[] = [];
    if (unsupported) messages.push(`${unsupported} file(s) skipped. Choose HEIC or HEIF photos.`);
    if (tooLarge) messages.push(`${tooLarge} file(s) skipped. Each photo must be smaller than ${formatBytes(MAX_FILE_BYTES)} and not empty.`);
    if (overCapacity) messages.push(`The batch can contain up to ${MAX_BATCH_FILES} photos and ${formatBytes(MAX_BATCH_BYTES)} in total.`);
    setNotice(messages.join(" "));
    if (accepted.length) commit([...itemsRef.current, ...accepted]);
  };

  const invalidateCompletedResults = () => {
    const current = itemsRef.current;
    let hadResults = false;
    const next = current.map((item) => {
      if (!item.resultUrl && !item.resultBlob) return item;
      hadResults = true;
      if (item.resultUrl) URL.revokeObjectURL(item.resultUrl);
      return {
        ...item,
        status: "queued" as const,
        resultBlob: undefined,
        resultUrl: undefined,
        outputName: undefined,
        width: undefined,
        height: undefined,
      };
    });
    if (hadResults) commit(next);
  };

  const changeFormat = (next: OutputFormat) => {
    if (next === format) return;
    invalidateCompletedResults();
    setFormat(next);
    setNotice("");
  };

  const changeQuality = (next: number) => {
    if (next === quality) return;
    invalidateCompletedResults();
    setQuality(next);
  };

  const removeItem = (id: string) => {
    if (activeJobRef.current?.id === id) cancelActiveJob();
    const item = itemsRef.current.find((entry) => entry.id === id);
    if (item?.resultUrl) URL.revokeObjectURL(item.resultUrl);
    commit(itemsRef.current.filter((entry) => entry.id !== id));
    if (previewId === id) setPreviewId(null);
  };

  const clearAll = () => {
    runIdRef.current += 1;
    cancelActiveJob();
    itemsRef.current.forEach((item) => {
      if (item.resultUrl) URL.revokeObjectURL(item.resultUrl);
    });
    commit([]);
    setIsConverting(false);
    setProgress(null);
    setPreviewId(null);
    setNotice("");
  };

  const convertPhotos = async () => {
    const queue = itemsRef.current.filter((item) => item.status === "queued" || item.status === "error");
    if (!queue.length || isConverting) return;
    const runId = ++runIdRef.current;
    const selectedFormat = format;
    const selectedQuality = quality;
    setNotice("");
    setIsConverting(true);

    for (let index = 0; index < queue.length; index += 1) {
      if (runIdRef.current !== runId) break;
      const item = queue[index];
      if (!itemsRef.current.some((entry) => entry.id === item.id)) continue;
      setProgress({ current: index + 1, total: queue.length, name: item.file.name });
      patchItem(item.id, { status: "processing", error: undefined });
      try {
        const result = await runConversion(item.file, selectedFormat, selectedQuality, item.id, activeJobRef);
        if (runIdRef.current !== runId) break;
        const current = itemsRef.current.find((entry) => entry.id === item.id);
        if (!current) continue;
        const retainedOutputBytes = itemsRef.current.reduce((sum, entry) => sum + (entry.resultBlob?.size ?? 0), 0);
        if (retainedOutputBytes + result.blob.size > MAX_RETAINED_OUTPUT_BYTES) {
          throw new Error(
            `The converted batch output limit is ${formatBytes(MAX_RETAINED_OUTPUT_BYTES)}. Download and remove completed photos before converting more.`
          );
        }
        if (current.resultUrl) URL.revokeObjectURL(current.resultUrl);
        patchItem(item.id, {
          status: "done",
          resultBlob: result.blob,
          resultUrl: URL.createObjectURL(result.blob),
          outputName: getOutputName(item.file.name, selectedFormat),
          width: result.dimensions.width,
          height: result.dimensions.height,
          error: undefined,
        });
      } catch (error) {
        if (runIdRef.current !== runId) break;
        if (!itemsRef.current.some((entry) => entry.id === item.id)) continue;
        const message = error instanceof Error ? error.message : "This photo could not be converted.";
        if (message === "Conversion cancelled.") continue;
        patchItem(item.id, { status: "error", error: friendlyError(message) });
      }
    }

    if (runIdRef.current === runId) {
      setProgress(null);
      setIsConverting(false);
    }
  };

  const removeAll = () => clearAll();
  const doneItems = items.filter((item) => item.status === "done" && item.resultBlob && item.resultUrl);
  const queuedCount = items.filter((item) => item.status === "queued" || item.status === "error").length;
  const totalOriginal = doneItems.reduce((sum, item) => sum + item.file.size, 0);
  const totalOutput = doneItems.reduce((sum, item) => sum + (item.resultBlob?.size ?? 0), 0);
  const previewItem = items.find((item) => item.id === previewId && item.resultUrl);

  const downloadAll = async () => {
    if (!doneItems.length) return;
    if (totalOutput > MAX_ZIP_OUTPUT_BYTES) {
      setNotice(`The ZIP is limited to ${formatBytes(MAX_ZIP_OUTPUT_BYTES)}. Download the converted photos one by one instead.`);
      return;
    }
    try {
      const names = dedupeFilenames(doneItems.map((item) => item.outputName ?? getOutputName(item.file.name, format)));
      const entries: Record<string, Uint8Array> = {};
      for (let index = 0; index < doneItems.length; index += 1) {
        entries[names[index]] = new Uint8Array(await doneItems[index].resultBlob!.arrayBuffer());
      }
      const zip = zipSync(entries, { level: 0 });
      const blob = new Blob([zip as BlobPart], { type: "application/zip" });
      const url = URL.createObjectURL(blob);
      triggerDownload(url, "utilby-heic-converted-photos.zip");
      window.setTimeout(() => URL.revokeObjectURL(url), 2_000);
    } catch {
      setNotice("The ZIP could not be created. Download the photos individually or try a smaller batch.");
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6">
      <input
        ref={inputRef}
        type="file"
        accept={INPUT_ACCEPT}
        multiple
        className="sr-only"
        aria-label="Choose HEIC or HEIF photos"
        onChange={(event) => {
          if (event.target.files?.length) addFiles(event.target.files);
          event.currentTarget.value = "";
        }}
      />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-xl font-bold tracking-tight text-ink">Convert your photos</h2>
          <p className="mt-1 text-sm text-slate-600">Choose HEIC or HEIF photos and save copies as JPG or PNG.</p>
        </div>
        <Button type="button" variant="outline" onClick={() => inputRef.current?.click()} disabled={isConverting}>
          <UploadCloud className="h-4 w-4" /> Choose photos
        </Button>
      </div>

      <div
        role="button"
        tabIndex={0}
        aria-label="Drop HEIC or HEIF photos here, or browse your device"
        onClick={() => !isConverting && inputRef.current?.click()}
        onKeyDown={(event) => {
          if (!isConverting && (event.key === "Enter" || event.key === " ")) {
            event.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragOver={(event) => {
          event.preventDefault();
          if (!isConverting) setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          if (!isConverting && event.dataTransfer.files?.length) addFiles(event.dataTransfer.files);
        }}
        className={`mt-5 flex min-h-40 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-5 py-8 text-center transition-colors focus:outline-none focus:ring-2 focus:ring-ink/30 ${
          isConverting ? "cursor-not-allowed border-slate-200 bg-slate-50 opacity-70" : dragging ? "border-ink bg-slate-100" : "border-slate-300 bg-slate-50/70 hover:border-slate-400 hover:bg-slate-100/70"
        }`}
      >
        <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
          <UploadCloud className="h-6 w-6 text-ink" />
        </span>
        <span className="text-sm font-semibold text-slate-900">{items.length ? "Drop more photos here" : "Drop HEIC/HEIF photos here"}</span>
        <span className="mt-1 text-xs text-slate-500">or click to browse · up to {formatBytes(MAX_FILE_BYTES)} each</span>
        <span className="mt-2 text-[11px] text-slate-400">Up to {MAX_BATCH_FILES} photos / {formatBytes(MAX_BATCH_BYTES)} input · {formatBytes(MAX_RETAINED_OUTPUT_BYTES)} converted results</span>
      </div>

      {notice && (
        <div role="status" className="mt-4 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-relaxed text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{notice}</span>
        </div>
      )}

      <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/40 sm:p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Output settings</span>
          <button
            type="button"
            disabled={isConverting || (format === "image/jpeg" && quality === 90)}
            onClick={() => {
              invalidateCompletedResults();
              setFormat("image/jpeg");
              setQuality(90);
            }}
            className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-ink disabled:cursor-not-allowed disabled:opacity-40"
          >
            <RotateCcw className="h-3.5 w-3.5" /> Reset
          </button>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <fieldset disabled={isConverting}>
            <legend className="mb-2 text-xs font-medium text-slate-700 dark:text-slate-300">Save as</legend>
            <div className="grid grid-cols-2 gap-2">
              {([
                { value: "image/jpeg", label: "JPG", hint: "Smaller photos" },
                { value: "image/png", label: "PNG", hint: "Lossless output" },
              ] as const).map((option) => (
                <button
                  key={option.value}
                  type="button"
                  aria-pressed={format === option.value}
                  onClick={() => changeFormat(option.value)}
                  className={`rounded-xl border px-3 py-2.5 text-left transition-colors ${
                    format === option.value ? "border-ink bg-white text-ink shadow-sm ring-1 ring-ink/10" : "border-slate-200 bg-white/70 text-slate-600 hover:border-slate-300"
                  }`}
                >
                  <span className="block text-sm font-bold">{option.label}</span>
                  <span className="mt-0.5 block text-[11px] text-slate-500">{option.hint}</span>
                </button>
              ))}
            </div>
          </fieldset>

          <div className={format === "image/png" ? "opacity-50" : ""}>
            <div className="mb-2 flex items-center justify-between">
              <label htmlFor="heic-quality" className="text-xs font-medium text-slate-700 dark:text-slate-300">JPG quality</label>
              <span className="rounded-md bg-white px-2 py-0.5 font-mono text-xs font-bold text-ink">{quality}%</span>
            </div>
            <input
              id="heic-quality"
              type="range"
              min={50}
              max={100}
              value={quality}
              disabled={isConverting || format === "image/png"}
              onChange={(event) => changeQuality(Number(event.target.value))}
              className="h-7 w-full cursor-pointer accent-ink disabled:cursor-not-allowed"
            />
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>Smaller file</span>
              <span>100% keeps more detail</span>
            </div>
          </div>
        </div>

        {format === "image/png" && (
          <p className="mt-3 text-xs text-slate-500">PNG keeps all decoded image detail. The JPG quality setting does not apply.</p>
        )}
      </div>

      {items.length > 0 && (
        <div className="mt-5 flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800 dark:bg-slate-900">
          <div className="min-w-0 text-sm text-slate-700 dark:text-slate-300">
            {doneItems.length > 0 ? (
              <>
                <span className="font-bold text-emerald-700 dark:text-emerald-400">
                  {doneItems.length} of {items.length} ready
                </span>
                <span className="ml-2 text-xs text-slate-500">
                  {formatBytes(totalOriginal)} → {formatBytes(totalOutput)}
                </span>
              </>
            ) : (
              <span className="font-medium">{items.length} photo{items.length === 1 ? "" : "s"} selected</span>
            )}
            {progress && (
              <span className="mt-1 block truncate text-xs text-slate-500" aria-live="polite">
                Converting {progress.current} of {progress.total}: {progress.name}
              </span>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {isConverting ? (
              <Button type="button" size="sm" variant="outline" onClick={clearAll}>
                <X className="h-4 w-4" /> Cancel
              </Button>
            ) : (
              <Button type="button" size="sm" onClick={convertPhotos} disabled={!queuedCount}>
                <ImageIcon className="h-4 w-4" /> {queuedCount ? `Convert ${queuedCount} photo${queuedCount === 1 ? "" : "s"}` : "All converted"}
              </Button>
            )}
            {doneItems.length > 0 && !isConverting && (
              <Button type="button" size="sm" variant="outline" onClick={downloadAll}>
                <Archive className="h-4 w-4" /> Download ZIP
              </Button>
            )}
            {!isConverting && (
              <Button type="button" size="sm" variant="ghost" onClick={removeAll}>
                <Trash2 className="h-4 w-4" /> Clear
              </Button>
            )}
          </div>
        </div>
      )}

      {isConverting && (
        <div className="mt-4 flex items-center gap-2 rounded-xl bg-indigo-50 px-4 py-3 text-xs text-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-300">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Converting on this device. Large photos can take a little while; keep this tab open.</span>
        </div>
      )}

      {items.length > 0 && (
        <ul className="mt-5 divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200 dark:divide-slate-800 dark:border-slate-800">
          {items.map((item) => {
            const saved = item.resultBlob ? computeSavings(item.file.size, item.resultBlob.size) : null;
            return (
              <li key={item.id} className="flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:gap-4 sm:p-4">
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <button
                    type="button"
                    disabled={!item.resultUrl}
                    onClick={() => setPreviewId(item.id)}
                    aria-label={item.resultUrl ? `Preview ${item.outputName}` : `${item.file.name} preview available after conversion`}
                    className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-slate-100 ring-1 ring-slate-200 disabled:cursor-default dark:bg-slate-800 dark:ring-slate-700"
                  >
                    {item.resultUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.resultUrl} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <FileImage className="h-6 w-6 text-slate-400" />
                    )}
                  </button>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-900 dark:text-white" title={item.file.name}>{item.file.name}</p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {formatBytes(item.file.size)}
                      {item.resultBlob && (
                        <>
                          {" → "}{formatBytes(item.resultBlob.size)}
                          {item.width && item.height && <span className="ml-1 text-slate-400">· {item.width} × {item.height}</span>}
                        </>
                      )}
                    </p>
                    {item.error && <p className="mt-1 text-xs leading-relaxed text-rose-600 dark:text-rose-400">{item.error}</p>}
                  </div>
                </div>

                <div className="flex shrink-0 flex-wrap items-center gap-2 sm:justify-end">
                  {item.status === "processing" ? (
                    <span className="inline-flex items-center gap-1.5 text-xs text-indigo-700 dark:text-indigo-300">
                      <Loader2 className="h-4 w-4 animate-spin" /> Working
                    </span>
                  ) : item.status === "queued" ? (
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">Ready to convert</span>
                  ) : item.status === "done" ? (
                    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold ${saved !== null && saved > 0 ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400" : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"}`}>
                      <CheckCircle2 className="h-3.5 w-3.5" /> {saved !== null && saved > 0 ? `${saved}% smaller` : saved !== null && saved < 0 ? `${Math.abs(saved)}% larger` : "Converted"}
                    </span>
                  ) : (
                    <span className="rounded-full bg-rose-50 px-2.5 py-1 text-[11px] font-semibold text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">Needs attention</span>
                  )}

                  {item.resultUrl && (
                    <>
                      <Button type="button" size="sm" variant="ghost" onClick={() => setPreviewId(item.id)}>
                        <Eye className="h-4 w-4" /><span className="hidden sm:inline">Preview</span>
                      </Button>
                      <Button type="button" size="sm" onClick={() => triggerDownload(item.resultUrl!, item.outputName ?? getOutputName(item.file.name, format))}>
                        <Download className="h-4 w-4" /> Download
                      </Button>
                    </>
                  )}
                  <button
                    type="button"
                    onClick={() => removeItem(item.id)}
                    aria-label={`Remove ${item.file.name}`}
                    className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-rose-600 dark:hover:bg-slate-800"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <div className="mt-5 grid gap-2 sm:grid-cols-3">
        {[
          { icon: ShieldCheck, text: "Your photos stay on your device" },
          { icon: ImageIcon, text: "JPG quality control or lossless PNG" },
          { icon: Archive, text: "Convert a batch and save it as ZIP" },
        ].map(({ icon: Icon, text }) => (
          <div key={text} className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2.5 text-xs text-slate-600 dark:bg-slate-800/50 dark:text-slate-300">
            <Icon className="h-4 w-4 shrink-0 text-ink" /> {text}
          </div>
        ))}
      </div>

      <p className="mt-4 text-center text-[11px] leading-relaxed text-slate-400">
        For stability, each photo is converted one at a time (up to 32 megapixels each). GPS and other camera details are removed from converted copies.
      </p>

      {previewItem?.resultUrl && (
        <div
          role="presentation"
          onClick={() => setPreviewId(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm"
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label={`Preview ${previewItem.outputName}`}
            onClick={(event) => event.stopPropagation()}
            className="relative flex max-h-[92vh] w-full max-w-4xl flex-col rounded-2xl bg-white p-3 shadow-2xl dark:bg-slate-900 sm:p-5"
          >
            <div className="mb-3 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-ink">{previewItem.outputName}</p>
                <p className="text-xs text-slate-500">{formatBytes(previewItem.resultBlob?.size ?? 0)}</p>
              </div>
              <button type="button" onClick={() => setPreviewId(null)} aria-label="Close preview" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex min-h-0 flex-1 items-center justify-center overflow-auto rounded-xl bg-[repeating-conic-gradient(#e2e8f0_0%_25%,#fff_0%_50%)] bg-[length:20px_20px] p-2 dark:bg-[repeating-conic-gradient(#334155_0%_25%,#0f172a_0%_50%)]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={previewItem.resultUrl} alt={`Converted preview of ${previewItem.file.name}`} className="max-h-[72vh] max-w-full object-contain" />
            </div>
            <div className="mt-3 flex justify-end">
              <Button type="button" onClick={() => triggerDownload(previewItem.resultUrl!, previewItem.outputName ?? "converted-photo.jpg")}>
                <Download className="h-4 w-4" /> Download photo
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
