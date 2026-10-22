"use client";

import * as React from "react";
import { zipSync } from "fflate";
import {
  ResizeSettings,
  ResizeMode,
  FitMode,
  DEFAULT_RESIZE_SETTINGS,
  RESIZE_PRESETS,
  planResize,
  heightForWidth,
  widthForHeight,
  buildResizedFilename,
  resizeImage,
  MAX_DIMENSION,
} from "./engine";
import { formatBytes, dedupeFilenames, isSupportedImage, MAX_FILE_BYTES, OutputFormat } from "@/modules/image-compressor/engine";
import { Button } from "@/components/ui/Button";
import {
  UploadCloud,
  Download,
  Trash2,
  Loader2,
  AlertTriangle,
  Archive,
  RotateCcw,
  X,
  Lock,
  Unlock,
  Ruler,
  Percent,
  LayoutTemplate,
} from "lucide-react";

type ItemStatus = "pending" | "processing" | "done" | "error";

interface Item {
  id: string;
  file: File;
  originalUrl: string;
  srcW?: number;
  srcH?: number;
  status: ItemStatus;
  resultBlob?: Blob;
  resultUrl?: string;
  outputName?: string;
  width?: number;
  height?: number;
  error?: string;
}

const MODES: { id: ResizeMode; label: string; short: string; icon: React.ElementType }[] = [
  { id: "pixels", label: "By Pixels", short: "Pixels", icon: Ruler },
  { id: "percent", label: "By Percentage", short: "Percent", icon: Percent },
  { id: "preset", label: "Social Presets", short: "Presets", icon: LayoutTemplate },
];

const FITS: { id: FitMode; label: string; hint: string }[] = [
  { id: "cover", label: "Crop to fill", hint: "No borders, edges trimmed" },
  { id: "contain", label: "Fit inside", hint: "Whole image, adds padding" },
  { id: "stretch", label: "Stretch", hint: "Exact size, may distort" },
];

const FORMATS: { id: OutputFormat; label: string }[] = [
  { id: "original", label: "Same as input" },
  { id: "image/jpeg", label: "JPG" },
  { id: "image/png", label: "PNG" },
  { id: "image/webp", label: "WebP" },
];

const PERCENTS = [25, 50, 75, 150, 200];

const selectClass =
  "h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-ink/20 focus:border-ink";
const numberClass =
  "h-10 w-full rounded-lg border border-slate-300 bg-white px-3 font-mono text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-ink/20 focus:border-ink";

let idCounter = 0;
const newId = () => `rs-${Date.now()}-${idCounter++}`;

function triggerDownload(href: string, filename: string) {
  const a = document.createElement("a");
  a.href = href;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

function parseDim(v: string): number {
  const n = parseInt(v.replace(/\D/g, ""), 10);
  return Number.isFinite(n) ? Math.min(MAX_DIMENSION, n) : 0;
}

export function ImageResizerTool() {
  const [items, setItems] = React.useState<Item[]>([]);
  const [settings, setSettings] = React.useState<ResizeSettings>(DEFAULT_RESIZE_SETTINGS);
  const [dragging, setDragging] = React.useState(false);
  const [notice, setNotice] = React.useState("");
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const itemsRef = React.useRef<Item[]>([]);
  const settingsRef = React.useRef(settings);
  const generationRef = React.useRef(0);
  const workingRef = React.useRef(false);

  const commit = React.useCallback((next: Item[]) => {
    itemsRef.current = next;
    setItems(next);
  }, []);
  const patchItem = React.useCallback(
    (id: string, patch: Partial<Item>) => commit(itemsRef.current.map((it) => (it.id === id ? { ...it, ...patch } : it))),
    [commit]
  );

  React.useEffect(() => {
    return () => {
      itemsRef.current.forEach((it) => {
        URL.revokeObjectURL(it.originalUrl);
        if (it.resultUrl) URL.revokeObjectURL(it.resultUrl);
      });
    };
  }, []);

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
          const res = await resizeImage(next.file, settingsRef.current);
          const current = itemsRef.current.find((it) => it.id === next.id);
          if (!current || generation !== generationRef.current) continue;
          if (current.resultUrl) URL.revokeObjectURL(current.resultUrl);
          patchItem(next.id, {
            status: "done",
            resultBlob: res.blob,
            resultUrl: URL.createObjectURL(res.blob),
            width: res.width,
            height: res.height,
            outputName: buildResizedFilename(next.file.name, res.width, res.height, res.outputMime),
          });
        } catch {
          if (!itemsRef.current.some((it) => it.id === next.id) || generation !== generationRef.current) continue;
          patchItem(next.id, { status: "error", error: "This image could not be read or is too large to resize." });
        }
      }
    } finally {
      workingRef.current = false;
    }
  }, [patchItem]);

  const firstRun = React.useRef(true);
  React.useEffect(() => {
    settingsRef.current = settings;
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }
    const t = setTimeout(() => {
      if (!itemsRef.current.length) return;
      generationRef.current++;
      commit(itemsRef.current.map((it) => ({ ...it, status: "pending" as ItemStatus })));
      void pump();
    }, 400);
    return () => clearTimeout(t);
  }, [settings, commit, pump]);

  const readDimensions = (item: Item) => {
    const img = new Image();
    img.onload = () => {
      // First image to load: seed pixel inputs with its real size so users start from something meaningful.
      const isFirstMeasured = !itemsRef.current.some((it) => it.srcW);
      patchItem(item.id, { srcW: img.naturalWidth, srcH: img.naturalHeight });
      if (isFirstMeasured) {
        setSettings((s) => (s.mode === "pixels" ? { ...s, width: img.naturalWidth, height: img.naturalHeight } : s));
      }
    };
    img.src = item.originalUrl;
  };

  const addFiles = (fileList: FileList | File[]) => {
    const accepted: Item[] = [];
    let rejected = 0;
    let tooBig = 0;
    for (const file of Array.from(fileList)) {
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
    accepted.forEach(readDimensions);
    if (!selectedId) setSelectedId(accepted[0].id);
    void pump();
  };

  const removeItem = (id: string) => {
    const target = itemsRef.current.find((it) => it.id === id);
    if (target) {
      URL.revokeObjectURL(target.originalUrl);
      if (target.resultUrl) URL.revokeObjectURL(target.resultUrl);
    }
    commit(itemsRef.current.filter((it) => it.id !== id));
    if (selectedId === id) setSelectedId(itemsRef.current[0]?.id ?? null);
  };

  const clearAll = () => {
    itemsRef.current.forEach((it) => {
      URL.revokeObjectURL(it.originalUrl);
      if (it.resultUrl) URL.revokeObjectURL(it.resultUrl);
    });
    commit([]);
    setSelectedId(null);
    setNotice("");
  };

  const ref = items.find((it) => it.srcW && it.srcH);
  const set = (patch: Partial<ResizeSettings>) => setSettings((s) => ({ ...s, ...patch }));

  const onWidth = (v: string) => {
    const w = parseDim(v);
    if (settings.lockAspect && ref?.srcW && ref.srcH && w) set({ width: w, height: heightForWidth(w, ref.srcW, ref.srcH) });
    else set({ width: w });
  };
  const onHeight = (v: string) => {
    const h = parseDim(v);
    if (settings.lockAspect && ref?.srcW && ref.srcH && h) set({ height: h, width: widthForHeight(h, ref.srcW, ref.srcH) });
    else set({ height: h });
  };

  const doneItems = items.filter((it) => it.status === "done" && it.resultBlob);
  const busy = items.some((it) => it.status === "pending" || it.status === "processing");
  const selected = items.find((it) => it.id === selectedId) ?? items[0];
  const previewPlan = selected?.srcW && selected.srcH ? planResize(selected.srcW, selected.srcH, settings) : null;
  const showFit = settings.mode === "preset" || (settings.mode === "pixels" && !settings.lockAspect);
  const isJpeg =
    settings.format === "image/jpeg" ||
    (settings.format === "original" && items.length > 0 && items.every((it) => it.file.type === "image/jpeg"));
  const showQuality = settings.format !== "image/png" && !(settings.format === "original" && items.every((it) => it.file.type === "image/png"));

  const downloadZip = async () => {
    if (!doneItems.length) return;
    const names = dedupeFilenames(doneItems.map((it) => it.outputName ?? it.file.name));
    const entries: Record<string, Uint8Array> = {};
    for (let i = 0; i < doneItems.length; i++) {
      entries[names[i]] = new Uint8Array(await doneItems[i].resultBlob!.arrayBuffer());
    }
    const blob = new Blob([zipSync(entries, { level: 0 }) as BlobPart], { type: "application/zip" });
    const url = URL.createObjectURL(blob);
    triggerDownload(url, "utilby-resized-images.zip");
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  };

  const presetGroups = Array.from(new Set(RESIZE_PRESETS.map((p) => p.group)));

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
        <p className="mt-1 text-xs text-slate-500">JPG, PNG, WebP, GIF, BMP • Up to 50 MB each • Batch resize supported</p>
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

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
        {/* Settings */}
        <div className="min-w-0 rounded-xl border border-slate-100 bg-slate-50 p-4 sm:p-5 space-y-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Resize Settings</span>
            <button
              type="button"
              onClick={() => setSettings(DEFAULT_RESIZE_SETTINGS)}
              className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-ink"
            >
              <RotateCcw className="h-3.5 w-3.5" /> Reset
            </button>
          </div>

          <div role="tablist" aria-label="Resize mode" className="grid grid-cols-3 gap-1 rounded-lg bg-slate-200/60 p-1">
            {MODES.map(({ id, label, short, icon: Icon }) => (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={settings.mode === id}
                onClick={() => set({ mode: id })}
                className={`inline-flex items-center justify-center gap-1.5 rounded-md px-2 py-2 text-xs font-semibold transition-colors ${
                  settings.mode === id
                    ? "bg-white text-ink shadow-sm"
                    : "text-slate-600 hover:text-ink"
                }`}
              >
                <Icon className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate sm:hidden">{short}</span>
                <span className="hidden truncate sm:inline">{label}</span>
              </button>
            ))}
          </div>

          {settings.mode === "pixels" && (
            <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-2">
              <div className="space-y-1.5">
                <label htmlFor="rs-width" className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  Width (px)
                </label>
                <input
                  id="rs-width"
                  inputMode="numeric"
                  className={numberClass}
                  value={settings.width || ""}
                  placeholder="Auto"
                  onChange={(e) => onWidth(e.target.value)}
                />
              </div>
              <button
                type="button"
                onClick={() => set({ lockAspect: !settings.lockAspect })}
                title={settings.lockAspect ? "Aspect ratio locked" : "Aspect ratio unlocked"}
                aria-label="Toggle aspect ratio lock"
                aria-pressed={settings.lockAspect}
                className={`h-10 w-10 inline-flex items-center justify-center rounded-lg border transition-colors ${
                  settings.lockAspect
                    ? "border-ink bg-slate-100 text-ink shadow-xs"
                    : "border-slate-300 bg-white text-slate-400"
                }`}
              >
                {settings.lockAspect ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
              </button>
              <div className="space-y-1.5">
                <label htmlFor="rs-height" className="text-xs font-medium text-slate-700">
                  Height (px)
                </label>
                <input
                  id="rs-height"
                  inputMode="numeric"
                  className={numberClass}
                  value={settings.height || ""}
                  placeholder="Auto"
                  onChange={(e) => onHeight(e.target.value)}
                />
              </div>
              <p className="col-span-3 text-[11px] text-slate-500">
                {settings.lockAspect
                  ? "Aspect ratio locked — each image fits inside this size without distortion."
                  : "Exact size for every image — choose how to handle a different shape below."}
              </p>
            </div>
          )}

          {settings.mode === "percent" && (
            <div>
              <div className="mb-2 flex items-center justify-between">
                <label htmlFor="rs-percent" className="text-xs font-medium text-slate-700">
                  Scale
                </label>
                <span className="rounded-md bg-slate-200/80 px-2 py-0.5 font-mono text-xs font-bold text-ink">
                  {settings.percent}%
                </span>
              </div>
              <input
                id="rs-percent"
                type="range"
                min={5}
                max={300}
                step={5}
                value={settings.percent}
                onChange={(e) => set({ percent: Number(e.target.value) })}
                className="w-full accent-ink cursor-pointer"
              />
              <div className="mt-2 flex flex-wrap gap-2">
                {PERCENTS.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => set({ percent: p })}
                    className={`rounded-md px-2.5 py-1 text-xs font-semibold ${
                      settings.percent === p
                        ? "bg-ink text-white"
                        : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    {p}%
                  </button>
                ))}
              </div>
            </div>
          )}

          {settings.mode === "preset" && (
            <div className="space-y-1.5">
              <label htmlFor="rs-preset" className="text-xs font-medium text-slate-700">
                Preset
              </label>
              <select
                id="rs-preset"
                className={selectClass}
                value={settings.presetId}
                onChange={(e) => set({ presetId: e.target.value })}
              >
                {presetGroups.map((g) => (
                  <optgroup key={g} label={g}>
                    {RESIZE_PRESETS.filter((p) => p.group === g).map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.label} — {p.width}×{p.height}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>
          )}

          {showFit && (
            <div>
              <span className="text-xs font-medium text-slate-700 block mb-1.5">
                If the shape is different
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {FITS.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => set({ fit: f.id })}
                    className={`rounded-lg px-3 py-2 text-left text-xs transition-colors ${
                      settings.fit === f.id
                        ? "bg-ink text-white"
                        : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    <span className="block font-semibold">{f.label}</span>
                    <span className="block text-[10px] opacity-75">{f.hint}</span>
                  </button>
                ))}
              </div>
              {settings.fit === "contain" && (
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <label className="text-xs font-medium text-slate-700">Padding color</label>
                  <input
                    type="color"
                    aria-label="Padding color"
                    value={settings.background === "transparent" ? "#ffffff" : settings.background}
                    disabled={settings.background === "transparent"}
                    onChange={(e) => set({ background: e.target.value })}
                    className="h-8 w-10 cursor-pointer rounded border border-slate-300 bg-white p-0.5 disabled:opacity-40"
                  />
                  {!isJpeg && (
                    <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={settings.background === "transparent"}
                        onChange={(e) => set({ background: e.target.checked ? "transparent" : "#ffffff" })}
                        className="h-4 w-4 rounded accent-ink"
                      />
                      Transparent (PNG / WebP)
                    </label>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-slate-200/70 pt-4 dark:border-slate-700/60">
            <div className="space-y-1.5">
              <label htmlFor="rs-format" className="text-xs font-medium text-slate-700 dark:text-slate-300">
                Output Format
              </label>
              <select
                id="rs-format"
                className={selectClass}
                value={settings.format}
                onChange={(e) => set({ format: e.target.value as OutputFormat })}
              >
                {FORMATS.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.label}
                  </option>
                ))}
              </select>
            </div>
            <div className={showQuality ? "" : "opacity-50"}>
              <div className="mb-2 flex items-center justify-between">
                <label htmlFor="rs-quality" className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  Quality
                </label>
                <span className="font-mono text-xs text-slate-500">{settings.quality}%</span>
              </div>
              <input
                id="rs-quality"
                type="range"
                min={40}
                max={100}
                value={settings.quality}
                disabled={!showQuality}
                onChange={(e) => set({ quality: Number(e.target.value) })}
                className="w-full accent-ink cursor-pointer"
              />
            </div>
          </div>

          {settings.mode !== "preset" && (
            <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={settings.noEnlarge}
                onChange={(e) => set({ noEnlarge: e.target.checked })}
                className="h-4 w-4 rounded accent-ink"
              />
              Don&apos;t enlarge images that are already smaller
            </label>
          )}
        </div>

        {/* Preview */}
        <div className="lg:sticky lg:top-24 self-start space-y-3">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex aspect-square w-full items-center justify-center overflow-hidden rounded-xl bg-[repeating-conic-gradient(#e2e8f0_0%_25%,#fff_0%_50%)] bg-[length:16px_16px]">
              {selected?.resultUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={selected.resultUrl} alt="Resized preview" className="max-h-full max-w-full object-contain shadow-sm" />
              ) : selected ? (
                <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
              ) : (
                <div className="flex flex-col items-center gap-2 p-6 text-center text-slate-400">
                  <Ruler className="h-10 w-10" />
                  <span className="text-xs">Add an image to see the resized preview</span>
                </div>
              )}
            </div>
            {selected && (
              <div className="mt-3 space-y-1 text-xs">
                <div className="flex justify-between text-slate-500">
                  <span>Original</span>
                  <span className="font-mono">
                    {selected.srcW && selected.srcH ? `${selected.srcW} × ${selected.srcH}` : "…"} • {formatBytes(selected.file.size)}
                  </span>
                </div>
                <div className="flex justify-between font-semibold text-slate-900">
                  <span>New size</span>
                  <span className="font-mono">
                    {previewPlan ? `${previewPlan.width} × ${previewPlan.height}` : "…"}
                    {selected.resultBlob ? ` • ${formatBytes(selected.resultBlob.size)}` : ""}
                  </span>
                </div>
              </div>
            )}
          </div>
          {selected?.status === "done" && selected.resultUrl && (
            <Button
              type="button"
              className="w-full"
              onClick={() => triggerDownload(selected.resultUrl!, selected.outputName ?? selected.file.name)}
            >
              <Download className="h-4 w-4" /> Download {previewPlan ? `${previewPlan.width}×${previewPlan.height}` : ""}
            </Button>
          )}
        </div>
      </div>

      {/* File list */}
      {items.length > 0 && (
        <div className="mt-6">
          <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-sm text-slate-600">
              {doneItems.length} of {items.length} image{items.length > 1 ? "s" : ""} ready
            </span>
            <div className="flex gap-2">
              <Button type="button" size="sm" onClick={downloadZip} disabled={!doneItems.length || busy}>
                <Archive className="h-4 w-4" /> Download all (ZIP)
              </Button>
              <Button type="button" size="sm" variant="outline" onClick={clearAll}>
                <Trash2 className="h-4 w-4" /> Clear
              </Button>
            </div>
          </div>
          <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200">
            {items.map((it) => (
              <li
                key={it.id}
                className={`flex items-center gap-3 p-3 transition-colors ${selected?.id === it.id ? "bg-slate-100/80" : ""}`}
              >
                <button
                  type="button"
                  onClick={() => setSelectedId(it.id)}
                  className="flex min-w-0 flex-1 items-center gap-3 text-left"
                  aria-label={`Preview ${it.file.name}`}
                >
                  <span className="h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-slate-100 ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-700">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={it.originalUrl} alt="" className="h-full w-full object-cover" />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium text-slate-900 dark:text-white" title={it.file.name}>
                      {it.file.name}
                    </span>
                    <span className="block text-xs text-slate-500 font-mono">
                      {it.srcW ? `${it.srcW}×${it.srcH}` : "…"}
                      {it.status === "done" && it.width ? ` → ${it.width}×${it.height}` : ""}
                      {it.resultBlob ? ` • ${formatBytes(it.resultBlob.size)}` : ""}
                    </span>
                    {it.status === "error" && <span className="block text-xs text-rose-600">{it.error}</span>}
                  </span>
                </button>
                <div className="flex shrink-0 items-center gap-1">
                  {it.status === "processing" || it.status === "pending" ? (
                    <Loader2 className="h-4 w-4 animate-spin text-slate-400" aria-label="Resizing" />
                  ) : it.status === "done" && it.resultUrl ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => triggerDownload(it.resultUrl!, it.outputName ?? it.file.name)}
                      aria-label={`Download ${it.file.name}`}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  ) : null}
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
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
