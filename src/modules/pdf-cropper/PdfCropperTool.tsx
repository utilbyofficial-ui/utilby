"use client";

import * as React from "react";
import type { PDFDocumentProxy, PDFPageProxy } from "pdfjs-dist";
import {
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Crop,
  Download,
  FileText,
  Loader2,
  RotateCcw,
  ShieldCheck,
  UploadCloud,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { getPdfjs, renderPageToUrl } from "@/modules/pdf/render";
import {
  cleanCropFilename,
  getCropBoxForMargins,
  getCropPreviewRect,
  isCropPdfFile,
  MAX_CROP_PDF_BYTES,
  MAX_CROP_PDF_PAGES,
  type CropMarginsMm,
} from "./engine";

type CropScope = "all" | "current";
interface PreviewMetrics { width: number; height: number; unitsPerPdfPoint: number }

const EMPTY_MARGINS: CropMarginsMm = { top: 0, right: 0, bottom: 0, left: 0 };
const MARGIN_FIELDS: { key: keyof CropMarginsMm; label: string }[] = [
  { key: "top", label: "Top" },
  { key: "right", label: "Right" },
  { key: "bottom", label: "Bottom" },
  { key: "left", label: "Left" },
];

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 5000);
}

function formatBytes(bytes: number): string {
  return bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function PdfCropperTool() {
  const [file, setFile] = React.useState<File | null>(null);
  const [pdf, setPdf] = React.useState<PDFDocumentProxy | null>(null);
  const [pageCount, setPageCount] = React.useState(0);
  const [pageNumber, setPageNumber] = React.useState(1);
  const [scope, setScope] = React.useState<CropScope>("all");
  const [margins, setMargins] = React.useState<CropMarginsMm>(EMPTY_MARGINS);
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);
  const [metrics, setMetrics] = React.useState<PreviewMetrics | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [isDragging, setIsDragging] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState("");
  const [doneMessage, setDoneMessage] = React.useState("");
  const [progress, setProgress] = React.useState(0);

  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const pdfRef = React.useRef<PDFDocumentProxy | null>(null);
  const loadGeneration = React.useRef(0);
  const previewGeneration = React.useRef(0);
  const mounted = React.useRef(true);

  React.useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      loadGeneration.current += 1;
      previewGeneration.current += 1;
      void pdfRef.current?.destroy().catch(() => undefined);
      pdfRef.current = null;
    };
  }, []);

  React.useEffect(() => {
    const url = previewUrl;
    return () => { if (url) URL.revokeObjectURL(url); };
  }, [previewUrl]);

  const loadPdf = React.useCallback(async (selectedFile: File) => {
    setErrorMessage("");
    setDoneMessage("");
    if (!isCropPdfFile(selectedFile)) {
      setErrorMessage("Choose a PDF file to continue.");
      return;
    }
    if (selectedFile.size > MAX_CROP_PDF_BYTES) {
      setErrorMessage("This PDF is larger than the 100 MB limit. Reduce its size or split it, then try again.");
      return;
    }

    const generation = ++loadGeneration.current;
    previewGeneration.current += 1;
    void pdfRef.current?.destroy().catch(() => undefined);
    pdfRef.current = null;
    setPdf(null);
    setFile(null);
    setPageCount(0);
    setPageNumber(1);
    setPreviewUrl(null);
    setMetrics(null);
    setMargins(EMPTY_MARGINS);
    setIsLoading(true);

    try {
      const bytes = new Uint8Array(await selectedFile.arrayBuffer());
      if (generation !== loadGeneration.current) return;
      const pdfjs = await getPdfjs();
      const loaded = await pdfjs.getDocument({ data: bytes, isEvalSupported: false }).promise;
      if (generation !== loadGeneration.current) {
        await loaded.destroy();
        return;
      }
      if (loaded.numPages > MAX_CROP_PDF_PAGES) {
        await loaded.destroy();
        throw new Error(`This tool supports up to ${MAX_CROP_PDF_PAGES} pages per PDF. Split the document and try again.`);
      }
      if (loaded.numPages < 1) {
        await loaded.destroy();
        throw new Error("This PDF does not contain any pages.");
      }
      pdfRef.current = loaded;
      setPdf(loaded);
      setFile(selectedFile);
      setPageCount(loaded.numPages);
      setDoneMessage(`${loaded.numPages} page${loaded.numPages === 1 ? "" : "s"} ready to preview.`);
    } catch (error) {
      if (generation === loadGeneration.current) {
        setErrorMessage(error instanceof Error && error.message.startsWith("This tool supports")
          ? error.message
          : error instanceof Error && error.message.includes("does not contain")
            ? error.message
            : "Could not open this PDF. It may be damaged, encrypted, or unsupported.");
      }
    } finally {
      if (generation === loadGeneration.current) setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    if (!pdf) return;
    let pageProxy: PDFPageProxy | null = null;
    const generation = ++previewGeneration.current;
    setPreviewUrl(null);
    setMetrics(null);
    void (async () => {
      try {
        pageProxy = await pdf.getPage(pageNumber);
        if (generation !== previewGeneration.current) return;
        const viewport = pageProxy.getViewport({ scale: 1 });
        const [x0, y0, x1, y1] = pageProxy.view;
        const displayedWidth = pageProxy.rotate % 180 === 0 ? x1 - x0 : y1 - y0;
        const unitsPerPdfPoint = viewport.width / displayedWidth;
        if (![viewport.width, viewport.height, unitsPerPdfPoint].every(Number.isFinite) || unitsPerPdfPoint <= 0) {
          throw new Error("This page has invalid dimensions and cannot be previewed.");
        }
        setMetrics({ width: viewport.width, height: viewport.height, unitsPerPdfPoint });
        pageProxy.cleanup();
        pageProxy = null;
        const url = await renderPageToUrl(pdf, pageNumber - 1, 760);
        if (generation !== previewGeneration.current || !mounted.current) {
          URL.revokeObjectURL(url);
          return;
        }
        setPreviewUrl(url);
      } catch (error) {
        if (generation === previewGeneration.current && mounted.current) {
          setErrorMessage(error instanceof Error ? error.message : "This page could not be previewed.");
        }
      } finally {
        pageProxy?.cleanup();
      }
    })();
    return () => {
      previewGeneration.current += 1;
      pageProxy?.cleanup();
    };
  }, [pdf, pageNumber]);

  const clearPdf = () => {
    loadGeneration.current += 1;
    previewGeneration.current += 1;
    void pdfRef.current?.destroy().catch(() => undefined);
    pdfRef.current = null;
    setPdf(null);
    setFile(null);
    setPageCount(0);
    setPageNumber(1);
    setMargins(EMPTY_MARGINS);
    setPreviewUrl(null);
    setMetrics(null);
    setErrorMessage("");
    setDoneMessage("");
    setProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const previewRect = metrics
    ? getCropPreviewRect(metrics.width, metrics.height, metrics.unitsPerPdfPoint, margins)
    : null;
  const cropValid = !metrics || Boolean(previewRect);

  const updateMargin = (key: keyof CropMarginsMm, value: string) => {
    const parsed = Number(value);
    setMargins((current) => ({ ...current, [key]: Number.isFinite(parsed) ? Math.max(0, parsed) : 0 }));
    setDoneMessage("");
  };

  const setPreset = (value: number) => {
    setMargins({ top: value, right: value, bottom: value, left: value });
    setDoneMessage("");
  };

  const cropPdf = async () => {
    if (!file || !pdf || isProcessing || !cropValid) return;
    setIsProcessing(true);
    setProgress(0);
    setErrorMessage("");
    setDoneMessage("");
    try {
      const { PDFDocument } = await import("pdf-lib");
      const bytes = new Uint8Array(await file.arrayBuffer());
      const output = await PDFDocument.load(bytes, { updateMetadata: false });
      const outputPages = output.getPages();
      const firstPage = scope === "current" ? pageNumber : 1;
      const lastPage = scope === "current" ? pageNumber : pageCount;

      for (let pageNum = firstPage; pageNum <= lastPage; pageNum += 1) {
        setProgress(Math.round(((pageNum - firstPage) / (lastPage - firstPage + 1)) * 100));
        const outputPage = outputPages[pageNum - 1];
        const renderPage = await pdf.getPage(pageNum);
        try {
          const viewport = renderPage.getViewport({ scale: 1 });
          const [x0, y0, x1, y1] = renderPage.view;
          const displayedWidth = renderPage.rotate % 180 === 0 ? x1 - x0 : y1 - y0;
          const unitsPerPdfPoint = viewport.width / displayedWidth;
          const cropBox = getCropBoxForMargins(viewport, unitsPerPdfPoint, margins);
          outputPage.setCropBox(cropBox.x, cropBox.y, cropBox.width, cropBox.height);
        } catch (error) {
          throw new Error(`Page ${pageNum}: ${error instanceof Error ? error.message : "These margins are too large."}`);
        } finally {
          renderPage.cleanup();
        }
        setProgress(Math.round(((pageNum - firstPage + 1) / (lastPage - firstPage + 1)) * 100));
      }

      const result = await output.save({ useObjectStreams: true });
      const buffer = new ArrayBuffer(result.byteLength);
      new Uint8Array(buffer).set(result);
      triggerDownload(new Blob([buffer], { type: "application/pdf" }), `${cleanCropFilename(file.name)}-cropped.pdf`);
      setDoneMessage(scope === "all"
        ? `Cropped all ${pageCount} pages. Your original PDF is unchanged.`
        : `Cropped page ${pageNumber}. Your original PDF is unchanged.`);
      setProgress(100);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Could not crop this PDF. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    const dropped = event.dataTransfer.files?.[0];
    if (dropped) void loadPdf(dropped);
  };

  const cropLeft = metrics && previewRect ? (previewRect.x / metrics.width) * 100 : 0;
  const cropTop = metrics && previewRect ? (previewRect.y / metrics.height) * 100 : 0;
  const cropWidth = metrics && previewRect ? (previewRect.width / metrics.width) * 100 : 100;
  const cropHeight = metrics && previewRect ? (previewRect.height / metrics.height) * 100 : 100;

  return (
    <section className="space-y-5" aria-label="PDF cropper">
      {!file ? (
        <div
          onDrop={handleDrop}
          onDragOver={(event) => { event.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          className={`rounded-[28px] border-2 border-dashed p-7 text-center transition-colors sm:p-12 ${isDragging ? "border-pdf bg-pdf-soft" : "border-slate-300 bg-white hover:border-slate-400"}`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf,.pdf"
            className="sr-only"
            onChange={(event) => {
              const selected = event.target.files?.[0];
              if (selected) void loadPdf(selected);
            }}
          />
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-pdf-soft text-pdf">
            {isLoading ? <Loader2 className="h-7 w-7 animate-spin" /> : <Crop className="h-7 w-7" />}
          </div>
          <h2 className="mt-4 text-xl font-bold text-ink">{isLoading ? "Opening your PDF…" : "Trim extra page margins"}</h2>
          <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-600">
            Preview the crop before saving. Adjust each edge in millimeters and crop one page or every page at once.
          </p>
          <Button className="mt-5" size="lg" disabled={isLoading} onClick={() => fileInputRef.current?.click()}>
            <UploadCloud className="h-4 w-4" /> Choose PDF
          </Button>
          <p className="mt-3 text-xs text-slate-500">Drop a PDF here · Up to 100 MB and 300 pages</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-soft">
          <div className="flex flex-col gap-4 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:p-5">
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-pdf-soft text-pdf"><FileText className="h-6 w-6" /></div>
              <div className="min-w-0">
                <p className="truncate font-semibold text-ink">{file.name}</p>
                <p className="mt-0.5 text-xs text-slate-500">{pageCount} pages · {formatBytes(file.size)} · stays on this device</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" disabled={isProcessing} onClick={clearPdf}><X className="h-4 w-4" /> Remove PDF</Button>
          </div>

          <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_340px]">
            <div className="min-w-0 bg-slate-100 p-4 sm:p-6">
              <div className="mb-3 flex items-center justify-between gap-3">
                <span className="text-sm font-semibold text-ink">Page preview</span>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg" disabled={pageNumber <= 1 || isProcessing} aria-label="Previous page" onClick={() => setPageNumber((current) => Math.max(1, current - 1))}><ChevronLeft className="h-4 w-4" /></Button>
                  <label className="flex items-center gap-1.5 text-xs font-medium text-slate-600">
                    <input aria-label="Current page number" type="number" min={1} max={pageCount} value={pageNumber} disabled={isProcessing} onChange={(event) => {
                      const next = Number(event.target.value);
                      if (Number.isInteger(next) && next >= 1 && next <= pageCount) setPageNumber(next);
                    }} className="h-8 w-14 rounded-lg border border-slate-300 bg-white px-2 text-center text-sm text-ink" />
                    / {pageCount}
                  </label>
                  <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg" disabled={pageNumber >= pageCount || isProcessing} aria-label="Next page" onClick={() => setPageNumber((current) => Math.min(pageCount, current + 1))}><ChevronRight className="h-4 w-4" /></Button>
                </div>
              </div>

              <div className="flex min-h-[320px] items-center justify-center overflow-auto rounded-2xl border border-slate-200 bg-slate-200/60 p-3 sm:min-h-[480px] sm:p-5">
                {previewUrl && metrics ? (
                  <div className="relative w-full max-w-[760px] bg-white shadow-md" style={{ aspectRatio: `${metrics.width} / ${metrics.height}` }}>
                    <img src={previewUrl} alt={`Preview of PDF page ${pageNumber}`} className="absolute inset-0 h-full w-full select-none object-fill" draggable={false} />
                    {previewRect && (
                      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
                        <div className="absolute bg-slate-950/55" style={{ top: 0, left: 0, width: "100%", height: `${cropTop}%` }} />
                        <div className="absolute bg-slate-950/55" style={{ top: `${cropTop + cropHeight}%`, left: 0, width: "100%", bottom: 0 }} />
                        <div className="absolute bg-slate-950/55" style={{ top: `${cropTop}%`, left: 0, width: `${cropLeft}%`, height: `${cropHeight}%` }} />
                        <div className="absolute bg-slate-950/55" style={{ top: `${cropTop}%`, left: `${cropLeft + cropWidth}%`, right: 0, height: `${cropHeight}%` }} />
                        <div className="absolute border-2 border-lime-400 shadow-[0_0_0_1px_rgba(15,23,42,0.12)]" style={{ top: `${cropTop}%`, left: `${cropLeft}%`, width: `${cropWidth}%`, height: `${cropHeight}%` }} />
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-3 text-sm text-slate-500">
                    <Loader2 className="h-6 w-6 animate-spin text-pdf" /> Preparing page preview…
                  </div>
                )}
              </div>
              <p className="mt-3 text-center text-xs text-slate-500">Darkened areas will be outside the visible page after cropping.</p>
            </div>

            <div className="space-y-5 p-4 sm:p-5">
              <div>
                <h2 className="font-display text-lg font-bold text-ink">Crop margins</h2>
                <p className="mt-1 text-xs leading-5 text-slate-500">Set how much to trim from each edge. The preview updates as you type.</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {[5, 10, 15].map((value) => <Button key={value} size="sm" variant="outline" className="h-8 rounded-lg px-3" disabled={isProcessing} onClick={() => setPreset(value)}>{value} mm each</Button>)}
                  <Button size="sm" variant="ghost" className="h-8 rounded-lg px-2.5" disabled={isProcessing} onClick={() => setPreset(0)}><RotateCcw className="h-3.5 w-3.5" /> Reset</Button>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  {MARGIN_FIELDS.map(({ key, label }) => (
                    <label key={key} className="block">
                      <span className="text-xs font-semibold text-slate-700">{label}</span>
                      <span className="relative mt-1 block">
                        <input type="number" min="0" max="1000" step="0.5" inputMode="decimal" value={margins[key]} disabled={isProcessing} onChange={(event) => updateMargin(key, event.target.value)} className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-3 pr-10 text-sm text-ink outline-none focus:border-pdf focus:ring-2 focus:ring-orange-100 disabled:bg-slate-100" />
                        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">mm</span>
                      </span>
                    </label>
                  ))}
                </div>
                {!cropValid && <p role="alert" className="mt-3 text-xs leading-5 text-rose-700">Those margins leave too little page area. Reduce the values to continue.</p>}
              </div>

              <div className="border-t border-slate-100 pt-4">
                <h3 className="text-sm font-bold text-ink">Apply crop to</h3>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {(["all", "current"] as const).map((value) => (
                    <button key={value} type="button" disabled={isProcessing} onClick={() => setScope(value)} aria-pressed={scope === value} className={`rounded-xl border px-3 py-2.5 text-left text-xs font-semibold transition ${scope === value ? "border-orange-300 bg-pdf-soft text-ink" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`}>
                      {value === "all" ? `All ${pageCount} pages` : `Page ${pageNumber} only`}
                    </button>
                  ))}
                </div>
              </div>

              {isProcessing && (
                <div className="rounded-xl bg-orange-50 p-3" aria-live="polite">
                  <div className="flex items-center justify-between text-xs font-semibold text-orange-950"><span>Saving cropped PDF…</span><span>{progress}%</span></div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-orange-100"><div className="h-full rounded-full bg-pdf transition-[width]" style={{ width: `${progress}%` }} /></div>
                </div>
              )}

              <Button className="w-full" size="lg" disabled={isProcessing || isLoading || !previewUrl || !cropValid} onClick={() => void cropPdf()}>
                {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                {isProcessing ? "Saving PDF…" : "Crop & Download PDF"}
              </Button>
              <p className="flex items-start gap-2 text-[11px] leading-5 text-slate-500"><ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" /> Text and images stay sharp. The original file is never changed.</p>
            </div>
          </div>
        </div>
      )}

      {errorMessage && <div role="alert" className="flex items-start gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /><span>{errorMessage}</span></div>}
      {doneMessage && !errorMessage && <div role="status" className="flex items-start gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" /><span>{doneMessage}</span></div>}

      {!file && !isLoading && <p className="flex items-center justify-center gap-2 px-3 text-center text-xs leading-5 text-slate-500"><ShieldCheck className="h-4 w-4 shrink-0 text-emerald-600" /> Your PDF is processed in this browser and is never uploaded.</p>}
    </section>
  );
}
