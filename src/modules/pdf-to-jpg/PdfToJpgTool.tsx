"use client";

import * as React from "react";
import { zipSync } from "fflate";
import type { PDFDocumentProxy } from "pdfjs-dist";
import { getPdfjs } from "@/modules/pdf/render";
import {
  DpiOption,
  ImageFormat,
  getDpiScale,
  cleanBaseName,
  buildPageFilename,
  buildZipFilename,
} from "./engine";
import { formatBytes } from "@/modules/image-compressor/engine";
import { Button } from "@/components/ui/Button";
import {
  UploadCloud,
  Download,
  Image as ImageIcon,
  CheckCircle2,
  Loader2,
  FileText,
  RotateCcw,
  Sparkles,
  Sliders,
  CheckSquare,
  Square,
  ShieldCheck,
  Zap,
  AlertTriangle,
} from "lucide-react";

const MAX_PDF_BYTES = 100 * 1024 * 1024;
const MAX_PDF_PAGES = 250;
const MAX_RENDER_PIXELS = 32_000_000;
const MAX_ZIP_BYTES = 100 * 1024 * 1024;

const DPI_OPTIONS: { id: DpiOption; label: string; desc: string }[] = [
  { id: "72", label: "Standard", desc: "72 DPI • Fast & small" },
  { id: "150", label: "High Quality", desc: "150 DPI • Crisp reading" },
  { id: "300", label: "Ultra HD", desc: "300 DPI • Print quality" },
];

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

export function PdfToJpgTool() {
  const [file, setFile] = React.useState<File | null>(null);
  const [doc, setDoc] = React.useState<PDFDocumentProxy | null>(null);
  const [totalPages, setTotalPages] = React.useState<number>(0);
  const [pageThumbs, setPageThumbs] = React.useState<Record<number, string>>({});
  const [selectedPages, setSelectedPages] = React.useState<Set<number>>(new Set());
  const [format, setFormat] = React.useState<ImageFormat>("jpg");
  const [dpi, setDpi] = React.useState<DpiOption>("150");
  const [quality, setQuality] = React.useState<number>(90);
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [currentProgress, setCurrentProgress] = React.useState({ current: 0, total: 0 });
  const [doneMessage, setDoneMessage] = React.useState<string>("");
  const [errorMessage, setErrorMessage] = React.useState<string>("");
  const [loadingPdf, setLoadingPdf] = React.useState(false);

  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const isMounted = React.useRef(true);
  const loadGeneration = React.useRef(0);
  const docRef = React.useRef<PDFDocumentProxy | null>(null);
  const thumbUrls = React.useRef<Record<number, string>>({});

  React.useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      loadGeneration.current++;
      Object.values(thumbUrls.current).forEach((u) => URL.revokeObjectURL(u));
      thumbUrls.current = {};
      void docRef.current?.destroy().catch(() => undefined);
      docRef.current = null;
    };
  }, []);

  const loadPdfFile = async (selectedFile: File) => {
    if (!selectedFile.type.includes("pdf") && !selectedFile.name.toLowerCase().endsWith(".pdf")) {
      setErrorMessage("Please upload a valid PDF document.");
      return;
    }
    if (selectedFile.size > MAX_PDF_BYTES) {
      setErrorMessage(`This PDF is larger than the ${formatBytes(MAX_PDF_BYTES)} processing limit.`);
      return;
    }

    const generation = ++loadGeneration.current;
    Object.values(thumbUrls.current).forEach((u) => URL.revokeObjectURL(u));
    thumbUrls.current = {};
    void docRef.current?.destroy().catch(() => undefined);
    docRef.current = null;
    setLoadingPdf(true);
    setFile(selectedFile);
    setDoc(null);
    setTotalPages(0);
    setSelectedPages(new Set());
    setPageThumbs({});
    setDoneMessage("");
    setErrorMessage("");

    try {
      const buffer = await selectedFile.arrayBuffer();
      if (generation !== loadGeneration.current) return;
      const pdfjs = await getPdfjs();
      const loadedDoc = await pdfjs.getDocument({
        data: new Uint8Array(buffer),
        isEvalSupported: false,
      }).promise;
      if (generation !== loadGeneration.current) {
        await loadedDoc.destroy();
        return;
      }

      if (loadedDoc.numPages > MAX_PDF_PAGES) {
        await loadedDoc.destroy();
        throw new Error(`This tool supports up to ${MAX_PDF_PAGES} pages per PDF. Split the document first.`);
      }
      docRef.current = loadedDoc;
      setDoc(loadedDoc);
      const count = loadedDoc.numPages;
      setTotalPages(count);
      setSelectedPages(new Set(Array.from({ length: count }, (_, i) => i + 1)));

      // Render thumbnail previews for all pages
      const thumbs: Record<number, string> = {};
      for (let p = 1; p <= count; p++) {
        const page = await loadedDoc.getPage(p);
        const base = page.getViewport({ scale: 1 });
        const thumbScale = Math.min(0.35, Math.sqrt(2_000_000) / Math.sqrt(base.width) / Math.sqrt(base.height), 4096 / base.width, 4096 / base.height);
        if (!Number.isFinite(thumbScale) || thumbScale <= 0) throw new Error("A page is too large to preview safely.");
        const viewport = page.getViewport({ scale: thumbScale });
        if (generation !== loadGeneration.current) break;
        const canvas = document.createElement("canvas");
        try {
          canvas.width = Math.ceil(viewport.width);
          canvas.height = Math.ceil(viewport.height);
          const ctx = canvas.getContext("2d");
          if (!ctx) throw new Error("Canvas is not supported in this browser.");
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          await page.render({ canvasContext: ctx, viewport }).promise;
          if (generation !== loadGeneration.current) break;
          const blob: Blob = await new Promise((resolve, reject) => canvas.toBlob((b) => b ? resolve(b) : reject(new Error("Thumbnail encoding failed.")), "image/jpeg", 0.75));
          const url = URL.createObjectURL(blob);
          thumbs[p] = url;
          thumbUrls.current[p] = url;
          if (generation === loadGeneration.current && isMounted.current) setPageThumbs({ ...thumbs });
        } finally {
          page.cleanup();
          canvas.width = 0;
          canvas.height = 0;
        }
      }
    } catch (err) {
      console.error("Error reading PDF:", err);
      if (generation === loadGeneration.current) {
        setErrorMessage(err instanceof Error && err.message.startsWith("This tool supports") ? err.message : "Could not load this PDF. It may be password protected, damaged, or unsupported.");
        setFile(null);
        setDoc(null);
        if (docRef.current) void docRef.current.destroy().catch(() => undefined);
        docRef.current = null;
      }
    } finally {
      if (generation === loadGeneration.current) setLoadingPdf(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files?.[0]) {
      loadPdfFile(e.dataTransfer.files[0]);
    }
  };

  const togglePage = (pageNum: number) => {
    setSelectedPages((prev) => {
      const next = new Set(prev);
      if (next.has(pageNum)) {
        next.delete(pageNum);
      } else {
        next.add(pageNum);
      }
      return next;
    });
  };

  const selectAll = () => {
    setSelectedPages(new Set(Array.from({ length: totalPages }, (_, i) => i + 1)));
  };

  const deselectAll = () => {
    setSelectedPages(new Set());
  };

  /** Converts a single page to Blob at current DPI and format */
  const renderPageToBlob = async (pageNum: number): Promise<Blob> => {
    if (!doc) throw new Error("No PDF loaded");
    const page = await doc.getPage(pageNum);
    const scale = getDpiScale(dpi);
    const viewport = page.getViewport({ scale });
    if (!Number.isFinite(viewport.width) || !Number.isFinite(viewport.height) || viewport.width <= 0 || viewport.height <= 0) {
      page.cleanup();
      throw new Error("This PDF page has unsupported dimensions.");
    }
    const width = Math.ceil(viewport.width);
    const height = Math.ceil(viewport.height);
    if (width * height > MAX_RENDER_PIXELS) {
      page.cleanup();
      throw new Error(`This page exceeds the ${formatBytes(MAX_RENDER_PIXELS * 4)} render memory budget at the selected DPI. Choose a lower DPI.`);
    }
    const canvas = document.createElement("canvas");
    try {
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas is not supported in this browser.");
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      await page.render({ canvasContext: ctx, viewport }).promise;
      const mime = format === "jpg" ? "image/jpeg" : "image/png";
      const q = format === "jpg" ? quality / 100 : undefined;
      return await new Promise((resolve, reject) => {
        canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Page image encoding failed."))), mime, q);
      });
    } finally {
      page.cleanup();
      canvas.width = 0;
      canvas.height = 0;
    }
  };

  /** Single page direct download */
  const downloadSinglePage = async (pageNum: number) => {
    if (!file || !doc) return;
    try {
      const blob = await renderPageToBlob(pageNum);
      const filename = buildPageFilename(file.name, pageNum, totalPages, format);
      triggerDownload(blob, filename);
    } catch (err) {
      console.error("Single page render error:", err);
      setErrorMessage(err instanceof Error ? err.message : "This page could not be converted. Choose a lower DPI and try again.");
    }
  };

  /** Convert all selected pages and bundle into a ZIP */
  const convertAndDownloadZip = async () => {
    if (!file || !doc || selectedPages.size === 0) return;

    setIsProcessing(true);
    setDoneMessage("");
    const pagesToConvert = Array.from(selectedPages).sort((a, b) => a - b);
    setCurrentProgress({ current: 0, total: pagesToConvert.length });

    try {
      // If only 1 page is selected, download directly as single image without ZIP
      if (pagesToConvert.length === 1) {
        const pageNum = pagesToConvert[0]!;
        const blob = await renderPageToBlob(pageNum);
        const filename = buildPageFilename(file.name, pageNum, totalPages, format);
        triggerDownload(blob, filename);
        setDoneMessage(`Successfully converted Page ${pageNum} to ${format.toUpperCase()}!`);
        setIsProcessing(false);
        return;
      }

      const zipEntries: Record<string, Uint8Array> = {};
      let totalOutputBytes = 0;

      for (let i = 0; i < pagesToConvert.length; i++) {
        const pageNum = pagesToConvert[i]!;
        setCurrentProgress({ current: i + 1, total: pagesToConvert.length });
        const blob = await renderPageToBlob(pageNum);
        totalOutputBytes += blob.size;
        if (totalOutputBytes > MAX_ZIP_BYTES) throw new Error(`ZIP output exceeded the ${formatBytes(MAX_ZIP_BYTES)} memory-safe batch limit. Select fewer pages.`);
        const buffer = await blob.arrayBuffer();
        const filename = buildPageFilename(file.name, pageNum, totalPages, format);
        zipEntries[filename] = new Uint8Array(buffer);
      }

      // Fast synchronous zip generation
      const zipped = zipSync(zipEntries, { level: 0 });
      const zipBlob = new Blob([zipped as Uint8Array<ArrayBuffer>], { type: "application/zip" });
      const zipName = buildZipFilename(file.name);
      triggerDownload(zipBlob, zipName);

      setDoneMessage(
        `Successfully converted ${pagesToConvert.length} pages to ${format.toUpperCase()} and downloaded ZIP!`
      );
    } catch (err) {
      console.error("Batch conversion error:", err);
      setErrorMessage(err instanceof Error ? err.message : "An error occurred during conversion. Please try a smaller selection.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      {errorMessage && (
        <div role="alert" className="mb-4 flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800 dark:border-rose-800 dark:bg-rose-950/30 dark:text-rose-200">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}
      {/* Upload Dropzone */}
      {!file ? (
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className="group relative flex min-h-[280px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50/75 p-6 text-center transition-all hover:border-ink hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950/50 dark:hover:border-slate-500"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf,.pdf"
            className="hidden"
            onChange={(e) => {
              if (e.target.files?.[0]) void loadPdfFile(e.target.files[0]);
              e.target.value = "";
            }}
          />
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-soft transition-transform group-hover:scale-105 dark:bg-slate-800">
            {loadingPdf ? (
              <Loader2 className="h-8 w-8 animate-spin text-ink dark:text-white" />
            ) : (
              <UploadCloud className="h-8 w-8 text-ink dark:text-white" />
            )}
          </div>
          <h3 className="mt-4 text-base sm:text-lg font-bold text-slate-900 dark:text-white">
            {loadingPdf ? "Opening PDF..." : "Drop your PDF here, or browse"}
          </h3>
          <p className="mt-1.5 text-xs sm:text-sm text-slate-500 max-w-sm">
            Convert all pages or selected pages to high-resolution JPG or PNG images. PDFs up to 100 MB and 250 pages.
          </p>
          <div className="mt-4 flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>100% Private • Processed entirely in your browser</span>
          </div>
        </div>
      ) : (
        /* Workspace when PDF is loaded */
        <div className="space-y-6">
          {/* Document Header & Reset */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-ink/5 dark:bg-white/10 text-ink dark:text-white">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate max-w-[280px] sm:max-w-md">
                  {file.name}
                </h3>
                <p className="text-xs text-slate-500">
                  {totalPages} {totalPages === 1 ? "page" : "pages"} • {formatBytes(file.size)}
                </p>
              </div>
            </div>

            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => {
                setFile(null);
                setDoc(null);
                setPageThumbs({});
              }}
              title="Open a different document"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Change PDF</span>
            </Button>
          </div>

          {/* Configuration Controls Bar */}
          <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* 1. Format Choice */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1.5">
                  Image Format
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setFormat("jpg")}
                    className={`rounded-lg py-2 text-xs font-bold transition-colors ${
                      format === "jpg"
                        ? "bg-ink text-white shadow-sm dark:bg-white dark:text-ink"
                        : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-100 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200"
                    }`}
                  >
                    JPG (Smaller)
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormat("png")}
                    className={`rounded-lg py-2 text-xs font-bold transition-colors ${
                      format === "png"
                        ? "bg-ink text-white shadow-sm dark:bg-white dark:text-ink"
                        : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-100 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200"
                    }`}
                  >
                    PNG (Lossless)
                  </button>
                </div>
              </div>

              {/* 2. Resolution / DPI */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1.5">
                  Resolution / Quality
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {DPI_OPTIONS.map((d) => (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => setDpi(d.id)}
                      className={`rounded-lg py-2 text-xs font-bold transition-colors ${
                        dpi === d.id
                          ? "bg-ink text-white shadow-sm dark:bg-white dark:text-ink"
                          : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-100 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200"
                      }`}
                      title={d.desc}
                    >
                      {d.id} DPI
                    </button>
                  ))}
                </div>
              </div>

              {/* 3. JPG Quality Slider (if JPG) */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    {format === "jpg" ? `JPG Quality: ${quality}%` : "PNG Quality: Lossless"}
                  </label>
                </div>
                {format === "jpg" ? (
                  <input
                    type="range"
                    min="60"
                    max="100"
                    value={quality}
                    onChange={(e) => setQuality(Number(e.target.value))}
                    className="w-full accent-ink cursor-pointer h-2 bg-slate-200 rounded-lg dark:bg-slate-700 mt-2"
                  />
                ) : (
                  <div className="rounded-lg bg-white px-3 py-1.5 text-xs font-medium text-slate-500 border border-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300">
                    Maximum sharpness guaranteed
                  </div>
                )}
              </div>
            </div>

            {/* Selection Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-200/60 dark:border-slate-700/60 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  Selected: {selectedPages.size} of {totalPages} pages
                </span>
                <span className="text-slate-300 dark:text-slate-700">•</span>
                <button
                  type="button"
                  onClick={selectAll}
                  className="font-semibold text-ink hover:underline dark:text-white"
                >
                  Select All
                </button>
                <span className="text-slate-300 dark:text-slate-700">•</span>
                <button
                  type="button"
                  onClick={deselectAll}
                  className="font-semibold text-slate-500 hover:underline"
                >
                  Deselect All
                </button>
              </div>

              <div className="text-slate-400">
                Tip: Click any page thumbnail to include or exclude it.
              </div>
            </div>
          </div>

          {/* Action Button & Conversion Progress */}
          <div className="space-y-3">
            <Button
              type="button"
              size="lg"
              variant="primary"
              onClick={convertAndDownloadZip}
              disabled={isProcessing || selectedPages.size === 0}
              className="w-full h-13 text-base font-bold shadow-lift"
            >
              {isProcessing ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>
                    Converting Page {currentProgress.current} of {currentProgress.total}...
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Download className="h-5 w-5" />
                  <span>
                    {selectedPages.size === 1
                      ? `Convert & Download Page as ${format.toUpperCase()}`
                      : `Convert & Download ${selectedPages.size} Pages (ZIP)`}
                  </span>
                </div>
              )}
            </Button>

            {/* Success Feedback */}
            {doneMessage && (
              <div className="flex items-center gap-2 rounded-xl bg-emerald-50 p-3 text-xs font-semibold text-emerald-800 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                <span>{doneMessage}</span>
              </div>
            )}
          </div>

          {/* Page Thumbnails Grid */}
          <div>
            <div className="mb-3 flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Page Previews ({totalPages})
              </h4>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => {
                const isSelected = selectedPages.has(pageNum);
                const thumbUrl = pageThumbs[pageNum];

                return (
                  <div
                    key={pageNum}
                    onClick={() => togglePage(pageNum)}
                    className={`group relative flex flex-col items-center justify-between rounded-xl border-2 p-2 transition-all cursor-pointer select-none ${
                      isSelected
                        ? "border-ink bg-slate-50/80 shadow-sm dark:border-white dark:bg-slate-800"
                        : "border-slate-200 bg-white opacity-60 hover:opacity-100 dark:border-slate-800 dark:bg-slate-900"
                    }`}
                  >
                    {/* Checkbox badge */}
                    <div className="absolute top-2 left-2 z-10">
                      {isSelected ? (
                        <div className="flex h-5 w-5 items-center justify-center rounded-md bg-ink text-white dark:bg-white dark:text-ink">
                          <CheckSquare className="h-3.5 w-3.5" />
                        </div>
                      ) : (
                        <div className="flex h-5 w-5 items-center justify-center rounded-md bg-white/90 text-slate-400 border border-slate-300 dark:bg-slate-800 dark:border-slate-600">
                          <Square className="h-3.5 w-3.5" />
                        </div>
                      )}
                    </div>

                    {/* Thumbnail Image */}
                    <div className="flex h-36 w-full items-center justify-center overflow-hidden rounded-lg bg-slate-100 dark:bg-slate-800">
                      {thumbUrl ? (
                        <img
                          src={thumbUrl}
                          alt={`Page ${pageNum}`}
                          className="h-full w-full object-contain"
                        />
                      ) : (
                        <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
                      )}
                    </div>

                    {/* Bottom Page Label & Quick Download */}
                    <div className="mt-2 flex w-full items-center justify-between text-[11px] font-semibold text-slate-600 dark:text-slate-300 px-1">
                      <span>Page {pageNum}</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          downloadSinglePage(pageNum);
                        }}
                        className="rounded p-1 text-slate-400 hover:bg-slate-200 hover:text-ink dark:hover:bg-slate-700 dark:hover:text-white"
                        title={`Download Page ${pageNum} as ${format.toUpperCase()}`}
                      >
                        <Download className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
