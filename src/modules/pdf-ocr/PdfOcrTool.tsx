"use client";

import * as React from "react";
import {
  AlertCircle,
  Check,
  CheckCircle2,
  Clipboard,
  Download,
  FileSearch,
  FileText,
  Loader2,
  RotateCcw,
  ShieldCheck,
  UploadCloud,
  X,
} from "lucide-react";
import type { PDFDocumentProxy } from "pdfjs-dist";
import { Button } from "@/components/ui/Button";
import { getPdfjs } from "@/modules/pdf/render";
import {
  buildTextDocument,
  cleanPdfBaseName,
  createSearchablePdf,
  getOcrRenderScale,
  isPdfFile,
  mapWordBoundsToPdf,
  MAX_PDF_BYTES,
  MAX_PDF_PAGES,
  type OcrPageResult,
  type WordBounds,
} from "./engine";

type OcrLanguage = "ben+eng" | "ben" | "eng";
type WorkerStatus = { status: string; progress: number };
type TesseractWord = WordBounds & { confidence?: number };
type TesseractWorker = {
  setParameters: (parameters: Record<string, string>) => Promise<unknown>;
  recognize: (
    image: HTMLCanvasElement,
    options?: Record<string, unknown>,
    output?: { blocks?: boolean; text?: boolean }
  ) => Promise<{ data: { text: string; blocks?: Array<{ paragraphs?: Array<{ lines?: Array<{ words?: TesseractWord[] }> }> }> | null } }>;
  terminate: () => Promise<unknown>;
};
type TesseractApi = {
  createWorker: (
    langs: string,
    oem: number,
    options: {
      workerPath: string;
      corePath: string;
      langPath: string;
      gzip: boolean;
      workerBlobURL: boolean;
      cacheMethod: string;
      logger: (message: WorkerStatus) => void;
    }
  ) => Promise<TesseractWorker>;
  OEM: { LSTM_ONLY: number };
};

const LANGUAGE_OPTIONS: { value: OcrLanguage; label: string; description: string }[] = [
  { value: "ben+eng", label: "বাংলা + English", description: "বাংলা ও ইংরেজি মেশানো নথির জন্য" },
  { value: "ben", label: "বাংলা", description: "শুধু বাংলার লেখা" },
  { value: "eng", label: "English", description: "শুধু ইংরেজি লেখা" },
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

function getWords(blocks: Array<{ paragraphs?: Array<{ lines?: Array<{ words?: TesseractWord[] }> }> }> | null | undefined): TesseractWord[] {
  const words: TesseractWord[] = [];
  for (const block of blocks ?? []) {
    for (const paragraph of block.paragraphs ?? []) {
      for (const line of paragraph.lines ?? []) words.push(...(line.words ?? []));
    }
  }
  return words;
}

export function PdfOcrTool() {
  const [file, setFile] = React.useState<File | null>(null);
  const [pageCount, setPageCount] = React.useState(0);
  const [language, setLanguage] = React.useState<OcrLanguage>("ben+eng");
  const [isLoading, setIsLoading] = React.useState(false);
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [isBuildingPdf, setIsBuildingPdf] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  const [progressLabel, setProgressLabel] = React.useState("");
  const [results, setResults] = React.useState<OcrPageResult[]>([]);
  const [errorMessage, setErrorMessage] = React.useState("");
  const [notice, setNotice] = React.useState("");
  const [copied, setCopied] = React.useState(false);
  const [isDragging, setIsDragging] = React.useState(false);

  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const pdfRef = React.useRef<PDFDocumentProxy | null>(null);
  const workerRef = React.useRef<TesseractWorker | null>(null);
  const loadGeneration = React.useRef(0);
  const mounted = React.useRef(true);
  const cancelRequested = React.useRef(false);

  React.useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      loadGeneration.current += 1;
      cancelRequested.current = true;
      void workerRef.current?.terminate().catch(() => undefined);
      workerRef.current = null;
      void pdfRef.current?.destroy().catch(() => undefined);
      pdfRef.current = null;
    };
  }, []);

  const clearDocument = React.useCallback(() => {
    loadGeneration.current += 1;
    cancelRequested.current = true;
    void workerRef.current?.terminate().catch(() => undefined);
    workerRef.current = null;
    void pdfRef.current?.destroy().catch(() => undefined);
    pdfRef.current = null;
    setFile(null);
    setPageCount(0);
    setResults([]);
    setProgress(0);
    setProgressLabel("");
    setErrorMessage("");
    setNotice("");
    setIsLoading(false);
    setIsProcessing(false);
    setIsBuildingPdf(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  const loadPdf = React.useCallback(async (selectedFile: File) => {
    setErrorMessage("");
    setNotice("");
    if (!isPdfFile(selectedFile)) {
      setErrorMessage("Choose a PDF file to continue.");
      return;
    }
    if (selectedFile.size > MAX_PDF_BYTES) {
      setErrorMessage("This PDF is larger than the 100 MB limit. Split or compress it, then try again.");
      return;
    }

    const generation = ++loadGeneration.current;
    void pdfRef.current?.destroy().catch(() => undefined);
    pdfRef.current = null;
    setFile(null);
    setPageCount(0);
    setResults([]);
    setIsLoading(true);
    try {
      const bytes = new Uint8Array(await selectedFile.arrayBuffer());
      if (generation !== loadGeneration.current) return;
      const pdfjs = await getPdfjs();
      const document = await pdfjs.getDocument({ data: bytes, isEvalSupported: false }).promise;
      if (generation !== loadGeneration.current) {
        await document.destroy();
        return;
      }
      if (document.numPages > MAX_PDF_PAGES) {
        await document.destroy();
        throw new Error(`This tool supports up to ${MAX_PDF_PAGES} pages at a time. Split the PDF and process each part.`);
      }
      pdfRef.current = document;
      setFile(selectedFile);
      setPageCount(document.numPages);
      setNotice(`${document.numPages} page${document.numPages === 1 ? "" : "s"} ready. Your PDF stays on this device.`);
    } catch (error) {
      if (generation === loadGeneration.current) {
        setErrorMessage(error instanceof Error && error.message.startsWith("This tool supports")
          ? error.message
          : "Could not open this PDF. It may be damaged, encrypted, or unsupported.");
      }
    } finally {
      if (generation === loadGeneration.current) setIsLoading(false);
    }
  }, []);

  const startOcr = async () => {
    if (!file || !pdfRef.current || isProcessing) return;
    const pdf = pdfRef.current;
    const totalPages = pdf.numPages;
    let worker: TesseractWorker | null = null;
    let completed: OcrPageResult[] = [];
    cancelRequested.current = false;
    setIsProcessing(true);
    setProgress(0);
    setProgressLabel("Starting the OCR engine…");
    setErrorMessage("");
    setNotice("");
    setResults([]);

    try {
      const tesseractModule = await import("tesseract.js");
      const tesseract = ((tesseractModule as unknown as { default?: TesseractApi }).default ?? tesseractModule) as unknown as TesseractApi;
      worker = await tesseract.createWorker(language, tesseract.OEM.LSTM_ONLY, {
        workerPath: "/vendor/tesseract/worker.min.js",
        corePath: "/vendor/tesseract/core",
        langPath: "/vendor/tesseract/lang",
        gzip: true,
        workerBlobURL: false,
        cacheMethod: "write",
        logger: ({ status, progress: workerProgress }) => {
          if (!mounted.current || cancelRequested.current) return;
          if (status.includes("language") || status.includes("core") || status.includes("initializing")) {
            setProgressLabel("Preparing language data for this device…");
            setProgress(Math.min(8, Math.round(workerProgress * 8)));
          } else if (status.includes("recognizing")) {
            const activePage = Math.min(totalPages, completed.length + 1);
            setProgressLabel(`Reading page ${activePage} of ${totalPages}…`);
            setProgress(Math.min(99, Math.round(8 + ((completed.length + workerProgress) / totalPages) * 92)));
          }
        },
      });
      workerRef.current = worker;
      await worker.setParameters({ preserve_interword_spaces: "1", user_defined_dpi: "180" });

      for (let pageNumber = 1; pageNumber <= totalPages; pageNumber += 1) {
        if (cancelRequested.current) break;
        setProgressLabel(`Reading page ${pageNumber} of ${totalPages}…`);
        setProgress(Math.round(8 + ((pageNumber - 1) / totalPages) * 92));
        const page = await pdf.getPage(pageNumber);
        let canvas: HTMLCanvasElement | null = null;
        try {
          const textContent = await page.getTextContent();
          const existingText = textContent.items
            .map((item) => {
              if (!("str" in item)) return "";
              return `${item.str}${item.hasEOL ? "\n" : " "}`;
            })
            .join("")
            .replace(/[ \t]+\n/g, "\n")
            .replace(/\n{3,}/g, "\n\n")
            .trim();

          // Keep native text intact on already searchable pages to avoid duplicate OCR text.
          if (existingText.length >= 40) {
            completed.push({ pageNumber, text: existingText, words: [], source: "existing-text" });
            setResults([...completed]);
            setProgress(Math.round(8 + (pageNumber / totalPages) * 92));
            continue;
          }

          const base = page.getViewport({ scale: 1 });
          const scale = getOcrRenderScale(base.width, base.height);
          const viewport = page.getViewport({ scale });
          const width = Math.ceil(viewport.width);
          const height = Math.ceil(viewport.height);
          if (width * height > 14_000_000) throw new Error(`Page ${pageNumber} is too large to process safely.`);
          canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const context = canvas.getContext("2d", { willReadFrequently: true });
          if (!context) throw new Error("Canvas is not supported in this browser.");
          context.fillStyle = "#fff";
          context.fillRect(0, 0, width, height);
          await page.render({ canvasContext: context, viewport }).promise;
          if (cancelRequested.current) break;

          const { data } = await worker.recognize(canvas, {}, { blocks: true, text: true });
          const words = getWords(data.blocks).map(({ text, bbox }) => ({ text, bbox }));
          const mappedWords = mapWordBoundsToPdf(words, viewport);
          completed.push({ pageNumber, text: data.text.trim(), words: mappedWords, source: "ocr" });
          setResults([...completed]);
        } finally {
          page.cleanup();
          if (canvas) {
            canvas.width = 0;
            canvas.height = 0;
          }
        }
        setProgress(Math.round(8 + (pageNumber / totalPages) * 92));
      }

      if (cancelRequested.current) {
        completed = [];
        setResults([]);
        setNotice("OCR stopped. No output files were created.");
        return;
      }

      setResults(completed);
      const emptyPages = completed.filter((page) => page.text.length === 0).length;
      setProgress(100);
      setProgressLabel("OCR complete");
      setNotice(emptyPages > 0
        ? `Finished ${totalPages} pages. ${emptyPages} page${emptyPages === 1 ? " had" : "s had"} no text the OCR engine could read.`
        : `Finished all ${totalPages} pages. Copy the text or download a searchable PDF.`);
      if (completed.every((page) => page.text.length === 0)) {
        setErrorMessage("No readable text was found. Try a sharper scan or a different language setting.");
      }
    } catch (error) {
      if (!cancelRequested.current) {
        setResults([]);
        setErrorMessage(error instanceof Error
          ? `OCR could not finish: ${error.message}`
          : "OCR could not finish. Please try again with a clearer or smaller PDF.");
      }
    } finally {
      if (worker) await worker.terminate().catch(() => undefined);
      if (workerRef.current === worker) workerRef.current = null;
      if (mounted.current) setIsProcessing(false);
    }
  };

  const stopOcr = () => {
    cancelRequested.current = true;
    setProgressLabel("Stopping after the current page…");
  };

  const downloadText = () => {
    if (results.length === 0) return;
    const text = buildTextDocument(results);
    triggerDownload(new Blob([text], { type: "text/plain;charset=utf-8" }), `${cleanPdfBaseName(file?.name ?? "document")}-text.txt`);
  };

  const copyText = async () => {
    if (results.length === 0) return;
    try {
      await navigator.clipboard.writeText(buildTextDocument(results));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setErrorMessage("Could not copy to clipboard. Download the text file instead.");
    }
  };

  const downloadSearchablePdf = async () => {
    if (!file || results.length === 0 || isBuildingPdf) return;
    setIsBuildingPdf(true);
    setErrorMessage("");
    try {
      const bytes = new Uint8Array(await file.arrayBuffer());
      const searchable = await createSearchablePdf(bytes, results);
      const pdfBuffer = new ArrayBuffer(searchable.byteLength);
      new Uint8Array(pdfBuffer).set(searchable);
      triggerDownload(new Blob([pdfBuffer], { type: "application/pdf" }), `${cleanPdfBaseName(file.name)}-searchable.pdf`);
      setNotice("Searchable PDF downloaded. The original page artwork has been retained.");
    } catch (error) {
      setErrorMessage(error instanceof Error
        ? `Could not create the searchable PDF: ${error.message}`
        : "Could not create the searchable PDF. You can still download the extracted text.");
    } finally {
      setIsBuildingPdf(false);
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    const droppedFile = event.dataTransfer.files?.[0];
    if (droppedFile) void loadPdf(droppedFile);
  };

  const textContent = React.useMemo(() => buildTextDocument(results), [results]);
  const wordCount = React.useMemo(() => textContent.split(/\s+/).filter(Boolean).length, [textContent]);

  return (
    <section className="space-y-5" aria-label="PDF OCR tool">
      {!file ? (
        <div
          onDrop={handleDrop}
          onDragOver={(event) => { event.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          className={`rounded-[28px] border-2 border-dashed p-7 text-center transition-colors sm:p-12 ${isDragging ? "border-indigo-500 bg-indigo-50" : "border-slate-300 bg-white hover:border-slate-400"}`}
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
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
            {isLoading ? <Loader2 className="h-7 w-7 animate-spin" /> : <FileSearch className="h-7 w-7" />}
          </div>
          <h2 className="mt-4 text-xl font-bold text-ink">{isLoading ? "Opening your PDF…" : "Make a scanned PDF searchable"}</h2>
          <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-600">
            Extract Bengali or English text, copy it, save it as a text file, or add a searchable text layer to a PDF copy.
          </p>
          <Button className="mt-5" size="lg" disabled={isLoading} onClick={() => fileInputRef.current?.click()}>
            <UploadCloud className="h-4 w-4" /> Choose PDF
          </Button>
          <p className="mt-3 text-xs text-slate-500">Drop a PDF here · Up to 100 MB and 100 pages</p>
        </div>
      ) : (
        <div className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-soft sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
                <FileText className="h-6 w-6" />
              </div>
              <div className="min-w-0">
                <p className="truncate font-semibold text-ink">{file.name}</p>
                <p className="mt-0.5 text-xs text-slate-500">{pageCount} page{pageCount === 1 ? "" : "s"} · {(file.size / (1024 * 1024)).toFixed(1)} MB · stays on this device</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" disabled={isProcessing || isBuildingPdf} onClick={clearDocument}>
              <X className="h-4 w-4" /> Remove PDF
            </Button>
          </div>

          <div className="mt-5 grid gap-4 rounded-2xl bg-slate-50 p-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
            <label className="block">
              <span className="text-sm font-semibold text-ink">Text language</span>
              <select
                value={language}
                disabled={isProcessing || results.length > 0}
                onChange={(event) => setLanguage(event.target.value as OcrLanguage)}
                className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-ink outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 disabled:bg-slate-100 sm:max-w-sm"
              >
                {LANGUAGE_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
              <span className="mt-1 block text-xs text-slate-500">{LANGUAGE_OPTIONS.find((option) => option.value === language)?.description}</span>
            </label>
            {isProcessing ? (
              <Button variant="secondary" onClick={stopOcr}>
                <X className="h-4 w-4" /> Stop OCR
              </Button>
            ) : results.length > 0 ? (
              <Button variant="outline" onClick={() => { setResults([]); setNotice(""); setErrorMessage(""); setProgress(0); setProgressLabel(""); }}>
                <RotateCcw className="h-4 w-4" /> Start over
              </Button>
            ) : (
              <Button onClick={() => void startOcr()} disabled={isLoading}>
                <FileSearch className="h-4 w-4" /> Extract text
              </Button>
            )}
          </div>

          {(isProcessing || progressLabel) && (
            <div className="mt-4 rounded-2xl border border-indigo-100 bg-indigo-50/70 p-4" aria-live="polite">
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="flex items-center gap-2 font-semibold text-indigo-950">
                  {isProcessing && <Loader2 className="h-4 w-4 animate-spin" />}
                  {progressLabel}
                </span>
                <span className="tabular-nums text-indigo-800">{progress}%</span>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-indigo-100">
                <div className="h-full rounded-full bg-indigo-600 transition-[width] duration-300" style={{ width: `${progress}%` }} />
              </div>
              {isProcessing && <p className="mt-2 text-xs text-indigo-800">Pages are read one at a time to keep memory use under control.</p>}
            </div>
          )}
        </div>
      )}

      {errorMessage && (
        <div role="alert" className="flex items-start gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> <span>{errorMessage}</span>
        </div>
      )}
      {notice && !errorMessage && (
        <div role="status" className="flex items-start gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" /> <span>{notice}</span>
        </div>
      )}

      {results.length > 0 && !isProcessing && (
        <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-soft">
          <div className="flex flex-col gap-4 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
            <div>
              <h2 className="text-lg font-bold text-ink">Recognized text</h2>
              <p className="mt-1 text-sm text-slate-500">{results.length} pages · {wordCount.toLocaleString()} words</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" onClick={() => void copyText()}>
                {copied ? <Check className="h-4 w-4" /> : <Clipboard className="h-4 w-4" />}{copied ? "Copied" : "Copy text"}
              </Button>
              <Button size="sm" variant="outline" onClick={downloadText}>
                <Download className="h-4 w-4" /> .txt
              </Button>
              <Button size="sm" onClick={() => void downloadSearchablePdf()} disabled={isBuildingPdf}>
                {isBuildingPdf ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileSearch className="h-4 w-4" />}
                {isBuildingPdf ? "Building PDF…" : "Searchable PDF"}
              </Button>
            </div>
          </div>
          {isBuildingPdf && <div className="h-1 bg-indigo-100"><div className="h-full w-1/2 animate-pulse bg-indigo-600" /></div>}
          <div className="max-h-[560px] divide-y divide-slate-100 overflow-y-auto">
            {results.map((result) => (
              <details key={result.pageNumber} className="group p-4 sm:p-5" open={results.length <= 2}>
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 font-semibold text-ink [&::-webkit-details-marker]:hidden">
                  <span>Page {result.pageNumber} {result.source === "existing-text" && <span className="ml-2 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-700">Existing text</span>}</span>
                  <span className="text-xs font-medium text-slate-500">{result.text ? `${result.text.split(/\s+/).filter(Boolean).length} words` : "No text found"}</span>
                </summary>
                {result.text ? (
                  <pre className="mt-3 whitespace-pre-wrap break-words rounded-xl bg-slate-50 p-3 font-sans text-sm leading-6 text-slate-700">{result.text}</pre>
                ) : (
                  <p className="mt-3 rounded-xl bg-slate-50 p-3 text-sm text-slate-500">No readable text was found on this page.</p>
                )}
              </details>
            ))}
          </div>
          <div className="flex items-start gap-2 border-t border-slate-100 bg-slate-50 px-4 py-3 text-xs leading-5 text-slate-600 sm:px-5">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" /> OCR runs locally. Results depend on scan clarity, page angle, and language; please review important text.
          </div>
        </div>
      )}

      {!file && !isLoading && (
        <p className="flex items-center justify-center gap-2 px-3 text-center text-xs leading-5 text-slate-500">
          <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-600" /> The PDF stays on your device. The OCR engine and language data are bundled with this tool.
        </p>
      )}
    </section>
  );
}
