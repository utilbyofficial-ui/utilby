"use client";

import * as React from "react";
import { zipSync } from "fflate";
import {
  CompressOptions,
  DEFAULT_COMPRESS_OPTIONS,
  OutputFormat,
  compressImage,
  computeSavings,
  formatBytes,
  buildOutputFilename,
  dedupeFilenames,
  isSupportedImage,
  MAX_FILE_BYTES,
} from "./engine";
import { Button } from "@/components/ui/Button";
import {
  UploadCloud,
  Download,
  Trash2,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  Archive,
  ImageIcon,
  RotateCcw,
  X,
} from "lucide-react";

type ItemStatus = "pending" | "processing" | "done" | "error";

interface Item {
  id: string;
  file: File;
  originalUrl: string;
  status: ItemStatus;
  resultBlob?: Blob;
  resultUrl?: string;
  outputName?: string;
  width?: number;
  height?: number;
  originalWidth?: number;
  originalHeight?: number;
  keptOriginal?: boolean;
  error?: string;
}

const FORMATS: { id: OutputFormat; label: string }[] = [
  { id: "original", label: "Same as input" },
  { id: "image/webp", label: "WebP (smallest)" },
  { id: "image/jpeg", label: "JPG" },
  { id: "image/png", label: "PNG (lossless)" },
];

const RESIZE_PRESETS = [
  { label: "Original size", value: 0 },
  { label: "Max 3840 px (4K)", value: 3840 },
  { label: "Max 2560 px", value: 2560 },
  { label: "Max 1920 px (Full HD)", value: 1920 },
  { label: "Max 1280 px", value: 1280 },
  { label: "Max 800 px", value: 800 },
];

const selectClass =
  "h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-ink/20 focus:border-ink";

let idCounter = 0;
const newId = () => `img-${Date.now()}-${idCounter++}`;

function triggerDownload(href: string, filename: string) {
  const a = document.createElement("a");
  a.href = href;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

function CompareSlider({ before, after, onClose }: { before: string; after: string; onClose: () => void }) {
  const [pos, setPos] = React.useState(50);
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 sm:p-4 dark:border-slate-800 dark:bg-slate-950">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Before / After</span>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close comparison"
          className="rounded-md p-1 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="relative mx-auto w-full max-w-3xl select-none overflow-hidden rounded-xl bg-[repeating-conic-gradient(#e2e8f0_0%_25%,#fff_0%_50%)] bg-[length:16px_16px]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={after} alt="Compressed result" className="block w-full h-auto" draggable={false} />
        <div className="absolute inset-0 overflow-hidden" style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={before} alt="Original" className="block w-full h-full object-cover" draggable={false} />
        </div>
        <div className="pointer-events-none absolute inset-y-0 w-0.5 bg-white shadow" style={{ left: `${pos}%` }} />
        <span className="absolute left-2 top-2 rounded bg-slate-900/70 px-2 py-0.5 text-[10px] font-semibold text-white">
          Original
        </span>
        <span className="absolute right-2 top-2 rounded bg-ink px-2 py-0.5 text-[10px] font-semibold text-white">
          Compressed
        </span>
        <input
          type="range"
          min={0}
          max={100}
          value={pos}
          onChange={(e) => setPos(Number(e.target.value))}
          aria-label="Comparison slider"
          className="absolute inset-0 h-full w-full cursor-ew-resize opacity-0"
        />
      </div>
      <p className="mt-2 text-center text-[11px] text-slate-500">Drag across the image to compare quality.</p>
    </div>
  );
}

export function ImageCompressorTool() {
  const [items, setItems] = React.useState<Item[]>([]);
  const [options, setOptions] = React.useState<CompressOptions>(DEFAULT_COMPRESS_OPTIONS);
  const [dragging, setDragging] = React.useState(false);
  const [notice, setNotice] = React.useState("");
  const [compareId, setCompareId] = React.useState<string | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  // itemsRef is the source of truth so the async queue never reads stale state.
  const itemsRef = React.useRef<Item[]>([]);
  const optionsRef = React.useRef(options);
  const generationRef = React.useRef(0);
  const workingRef = React.useRef(false);

  const commit = React.useCallback((next: Item[]) => {
    itemsRef.current = next;
    setItems(next);
  }, []);

  const patchItem = React.useCallback(
    (id: string, patch: Partial<Item>) => {
      commit(itemsRef.current.map((it) => (it.id === id ? { ...it, ...patch } : it)));
    },
    [commit]
  );

  // Revoke object URLs on unmount.
  React.useEffect(() => {
    return () => {
      itemsRef.current.forEach((it) => {
        URL.revokeObjectURL(it.originalUrl);
        if (it.resultUrl) URL.revokeObjectURL(it.resultUrl);
      });
    };
  }, []);

  /** Processes pending images one at a time. Safe to call repeatedly. */
  const pump = React.useCallback(async () => {
    if (workingRef.current) return;
    workingRef.current = true;
    try {
      for (;;) {
        const next = itemsRef.current.find((it) => it.status === "pending");
        if (!next) break;
        const generation = generationRef.current;
        patchItem(next.id, { status: "processing", error: undefined });
        try {
          const res = await compressImage(next.file, optionsRef.current);
          const current = itemsRef.current.find((it) => it.id === next.id);
          // Removed meanwhile, or settings changed (item was reset to pending): discard.
          if (!current || generation !== generationRef.current) continue;
          if (current.resultUrl) URL.revokeObjectURL(current.resultUrl);
          patchItem(next.id, {
            status: "done",
            resultBlob: res.blob,
            resultUrl: URL.createObjectURL(res.blob),
            outputName: res.keptOriginal ? next.file.name : buildOutputFilename(next.file.name, res.outputMime),
            width: res.width,
            height: res.height,
            originalWidth: res.originalWidth,
            originalHeight: res.originalHeight,
            keptOriginal: res.keptOriginal,
          });
        } catch {
          if (!itemsRef.current.some((it) => it.id === next.id) || generation !== generationRef.current) continue;
          patchItem(next.id, {
            status: "error",
            error: "This image could not be read. It may be corrupted or in an unsupported format.",
          });
        }
      }
    } finally {
      workingRef.current = false;
    }
  }, [patchItem]);

  // Re-compress everything when settings change (debounced so the slider stays smooth).
  const firstRun = React.useRef(true);
  React.useEffect(() => {
    optionsRef.current = options;
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }
    const t = setTimeout(() => {
      if (!itemsRef.current.length) return;
      generationRef.current++;
      commit(itemsRef.current.map((it) => ({ ...it, status: "pending" as ItemStatus })));
      void pump();
    }, 350);
    return () => clearTimeout(t);
  }, [options, commit, pump]);

  const addFiles = (fileList: FileList | File[]) => {
    const files = Array.from(fileList);
    const accepted: Item[] = [];
    let rejected = 0;
    let tooBig = 0;
    for (const file of files) {
      if (!isSupportedImage(file.type)) {
        rejected++;
        continue;
      }
      if (file.size > MAX_FILE_BYTES) {
        tooBig++;
        continue;
      }
      accepted.push({ id: newId(), file, originalUrl: URL.createObjectURL(file), status: "pending" });
    }
    const msgs: string[] = [];
    if (rejected) msgs.push(`${rejected} file(s) skipped — only JPG, PNG, WebP, GIF and BMP are supported.`);
    if (tooBig) msgs.push(`${tooBig} file(s) skipped — larger than ${formatBytes(MAX_FILE_BYTES)}.`);
    setNotice(msgs.join(" "));
    if (!accepted.length) return;
    commit([...itemsRef.current, ...accepted]);
    void pump();
  };

  const removeItem = (id: string) => {
    const target = itemsRef.current.find((it) => it.id === id);
    if (target) {
      URL.revokeObjectURL(target.originalUrl);
      if (target.resultUrl) URL.revokeObjectURL(target.resultUrl);
    }
    commit(itemsRef.current.filter((it) => it.id !== id));
    if (compareId === id) setCompareId(null);
  };

  const clearAll = () => {
    itemsRef.current.forEach((it) => {
      URL.revokeObjectURL(it.originalUrl);
      if (it.resultUrl) URL.revokeObjectURL(it.resultUrl);
    });
    commit([]);
    setCompareId(null);
    setNotice("");
  };

  const doneItems = items.filter((it) => it.status === "done" && it.resultBlob);
  const totalOriginal = doneItems.reduce((sum, it) => sum + it.file.size, 0);
  const totalCompressed = doneItems.reduce((sum, it) => sum + (it.resultBlob?.size ?? 0), 0);
  const busy = items.some((it) => it.status === "processing" || it.status === "pending");

  const downloadZip = async () => {
    if (!doneItems.length) return;
    const names = dedupeFilenames(doneItems.map((it) => it.outputName ?? it.file.name));
    const entries: Record<string, Uint8Array> = {};
    for (let i = 0; i < doneItems.length; i++) {
      const buf = await doneItems[i].resultBlob!.arrayBuffer();
      entries[names[i]] = new Uint8Array(buf);
    }
    // Images are already compressed, so store without extra deflate (level 0) for speed.
    const zipped = zipSync(entries, { level: 0 });
    const blob = new Blob([zipped as BlobPart], { type: "application/zip" });
    const url = URL.createObjectURL(blob);
    triggerDownload(url, "utilby-compressed-images.zip");
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  };

  const isPngOutput =
    options.format === "image/png" ||
    (options.format === "original" && items.length > 0 && items.every((it) => it.file.type === "image/png"));

  const compareItem = items.find((it) => it.id === compareId && it.resultUrl);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      {/* Dropzone */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          if (e.dataTransfer.files?.length) addFiles(e.dataTransfer.files);
        }}
        className={`flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 text-center transition-colors ${
          items.length ? "py-6" : "py-12"
        } ${
          dragging
            ? "border-ink bg-slate-100"
            : "border-slate-300 bg-slate-50/60 hover:border-slate-400 hover:bg-slate-100/60"
        }`}
      >
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
          <UploadCloud className="h-6 w-6 text-ink" />
        </div>
        <p className="text-sm font-semibold text-slate-900">
          {items.length ? "Add more images" : "Drop images here or click to browse"}
        </p>
        <p className="mt-1 text-xs text-slate-500">JPG, PNG, WebP, GIF, BMP • Up to 50 MB each • Multiple files supported</p>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif,image/bmp"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.length) addFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      {notice && (
        <div className="mt-4 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{notice}</span>
        </div>
      )}

      {/* Settings */}
      <div className="mt-6 rounded-xl border border-slate-100 bg-slate-50 p-4 sm:p-5">
        <div className="mb-4 flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Compression Settings</span>
          <button
            type="button"
            onClick={() => setOptions(DEFAULT_COMPRESS_OPTIONS)}
            className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-ink"
          >
            <RotateCcw className="h-3.5 w-3.5" /> Reset
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className={isPngOutput ? "opacity-50" : ""}>
            <div className="mb-2 flex items-center justify-between">
              <label htmlFor="quality" className="text-xs font-medium text-slate-700">
                Quality
              </label>
              <span className="rounded-md bg-slate-200/80 px-2 py-0.5 font-mono text-xs font-bold text-ink">
                {options.quality}%
              </span>
            </div>
            <input
              id="quality"
              type="range"
              min={10}
              max={100}
              value={options.quality}
              disabled={isPngOutput}
              onChange={(e) => setOptions((o) => ({ ...o, quality: Number(e.target.value) }))}
              className="w-full accent-ink cursor-pointer"
            />
            <div className="mt-1 flex justify-between text-[10px] text-slate-400">
              <span>Smaller file</span>
              <span>Recommended 70–80</span>
              <span>Best quality</span>
            </div>
          </div>
          <div className="space-y-1.5">
            <label htmlFor="format" className="text-xs font-medium text-slate-700 dark:text-slate-300">
              Output Format
            </label>
            <select
              id="format"
              className={selectClass}
              value={options.format}
              onChange={(e) => setOptions((o) => ({ ...o, format: e.target.value as OutputFormat }))}
            >
              {FORMATS.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label htmlFor="resize" className="text-xs font-medium text-slate-700 dark:text-slate-300">
              Resize (longest side)
            </label>
            <select
              id="resize"
              className={selectClass}
              value={options.maxWidth}
              onChange={(e) => {
                const v = Number(e.target.value);
                setOptions((o) => ({ ...o, maxWidth: v, maxHeight: v }));
              }}
            >
              {RESIZE_PRESETS.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        {isPngOutput && (
          <p className="mt-4 text-xs text-slate-500">
            PNG is lossless, so the quality slider doesn&apos;t apply. For much smaller files, choose <strong>WebP</strong>{" "}
            (keeps transparency) or <strong>JPG</strong>.
          </p>
        )}
      </div>

      {/* Summary + bulk actions */}
      {items.length > 0 && (
        <div className="mt-6 flex flex-col gap-3 rounded-xl border border-emerald-100 bg-emerald-50/60 p-4 sm:flex-row sm:items-center sm:justify-between dark:border-emerald-900/50 dark:bg-emerald-950/20">
          <div className="text-sm text-slate-700 dark:text-slate-300">
            {doneItems.length > 0 ? (
              <>
                <span className="font-bold text-emerald-700 dark:text-emerald-400">
                  {computeSavings(totalOriginal, totalCompressed) > 0
                    ? `${computeSavings(totalOriginal, totalCompressed)}% smaller`
                    : "No reduction"}
                </span>{" "}
                <span className="text-slate-500">
                  • {formatBytes(totalOriginal)} → {formatBytes(totalCompressed)} • {doneItems.length} of {items.length} image
                  {items.length > 1 ? "s" : ""}
                </span>
              </>
            ) : (
              <span className="text-slate-500">Compressing…</span>
            )}
          </div>
          <div className="flex gap-2">
            <Button type="button" size="sm" onClick={downloadZip} disabled={!doneItems.length || busy}>
              <Archive className="h-4 w-4" /> Download all (ZIP)
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={clearAll}>
              <Trash2 className="h-4 w-4" /> Clear
            </Button>
          </div>
        </div>
      )}

      {compareItem && (
        <div className="mt-6">
          <CompareSlider before={compareItem.originalUrl} after={compareItem.resultUrl!} onClose={() => setCompareId(null)} />
        </div>
      )}

      {/* File list */}
      {items.length > 0 && (
        <ul className="mt-6 divide-y divide-slate-100 rounded-xl border border-slate-200 dark:divide-slate-800 dark:border-slate-800">
          {items.map((it) => {
            const saved = it.resultBlob ? computeSavings(it.file.size, it.resultBlob.size) : 0;
            return (
              <li key={it.id} className="flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:gap-4">
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-slate-100 ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-700">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={it.originalUrl} alt="" className="h-full w-full object-cover" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-900 dark:text-white" title={it.file.name}>
                      {it.file.name}
                    </p>
                    <p className="text-xs text-slate-500">
                      {formatBytes(it.file.size)}
                      {it.status === "done" && it.resultBlob && (
                        <>
                          {" → "}
                          <span className="font-semibold text-slate-800 dark:text-slate-200">{formatBytes(it.resultBlob.size)}</span>
                          {it.width && it.originalWidth && it.width !== it.originalWidth && (
                            <span className="text-slate-400">
                              {" "}
                              • {it.originalWidth}×{it.originalHeight} → {it.width}×{it.height}
                            </span>
                          )}
                        </>
                      )}
                    </p>
                    {it.status === "error" && <p className="text-xs text-rose-600">{it.error}</p>}
                    {it.keptOriginal && (
                      <p className="text-[11px] text-slate-400">Already optimized — original kept (re-encoding made it larger).</p>
                    )}
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-2 sm:justify-end">
                  {it.status === "processing" || it.status === "pending" ? (
                    <span className="inline-flex items-center gap-1.5 text-xs text-slate-500">
                      <Loader2 className="h-4 w-4 animate-spin" /> Compressing
                    </span>
                  ) : it.status === "done" ? (
                    <span
                      className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-bold ${
                        saved > 0
                          ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
                          : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                      }`}
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      {saved > 0 ? `-${saved}%` : "0%"}
                    </span>
                  ) : null}

                  {it.status === "done" && it.resultUrl && (
                    <>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => setCompareId(compareId === it.id ? null : it.id)}
                        title="Compare before and after"
                      >
                        <ImageIcon className="h-4 w-4" />
                        <span className="hidden sm:inline">Compare</span>
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => triggerDownload(it.resultUrl!, it.outputName ?? it.file.name)}
                      >
                        <Download className="h-4 w-4" /> Download
                      </Button>
                    </>
                  )}
                  <button
                    type="button"
                    onClick={() => removeItem(it.id)}
                    aria-label={`Remove ${it.file.name}`}
                    className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-rose-600 dark:hover:bg-slate-800"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
