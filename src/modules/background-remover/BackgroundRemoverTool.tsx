"use client";

import * as React from "react";
import {
  AlertCircle,
  ArrowDownToLine,
  Brush,
  Check,
  Eraser,
  ImagePlus,
  Loader2,
  Palette,
  Redo2,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Undo2,
  UploadCloud,
  X,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import {
  MAX_BACKGROUND_REMOVER_FILE_BYTES,
  MAX_PREVIEW_ZOOM,
  MIN_PREVIEW_ZOOM,
  PREVIEW_ZOOM_STEP,
  buildBackgroundOutputName,
  clampBrushSize,
  clampEdgeSoftness,
  clampPreviewZoom,
  fitWithin,
  formatImageDimensions,
  getPreviewDisplaySize,
  mapPointerToMask,
  validateBackgroundInput,
  validateImageDimensions,
  zoomPreviewByWheel,
  type BackgroundMode,
  type BrushMode,
  type ExportFormat,
} from "./engine";
import {
  canvasToBlob,
  captureMaskAlpha,
  drawBrushStroke,
  makeAlphaMaskCanvas,
  paintBackgroundRemoval,
  restoreMaskAlpha,
} from "./canvas";

type JobStatus = "empty" | "loading" | "processing" | "done" | "error";
type WorkerReply = {
  type: "progress" | "complete" | "error" | "cancelled";
  jobId?: number;
  stage?: "model" | "fallback" | "image" | "processing";
  percent?: number;
  message?: string;
  backend?: "primary" | "fallback";
  width?: number;
  height?: number;
  alpha?: ArrayBuffer;
};

const MAX_PREVIEW_EDGE = 1_536;
const MAX_HISTORY_STEPS = 8;
const ACCEPT = ".jpg,.jpeg,.png,.webp,.bmp,image/jpeg,image/png,image/webp,image/bmp";
const EXPORT_FORMATS: { value: ExportFormat; label: string }[] = [
  { value: "image/png", label: "PNG · transparency" },
  { value: "image/webp", label: "WebP · smaller file" },
  { value: "image/jpeg", label: "JPG · white background" },
];
const BACKGROUND_COLORS = ["#ffffff", "#f1f5f9", "#0f172a", "#dbeafe", "#dcfce7", "#fce7f3", "#fef3c7", "#111827"];
const CONTROL_CLASS = "h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 focus:border-ink focus:outline-none focus:ring-2 focus:ring-ink/15";
const RANGE_CLASS = "w-full accent-ink";

function triggerBlobDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 30_000);
}

function checkerboardStyle(): React.CSSProperties {
  return {
    backgroundImage: "conic-gradient(#dbe2ea 25%, transparent 0 50%, #dbe2ea 0 75%, transparent 0)",
    backgroundSize: "20px 20px",
    backgroundPosition: "0 0, 10px 10px",
    backgroundColor: "#fff",
  };
}

export function BackgroundRemoverTool() {
  const [file, setFile] = React.useState<File | null>(null);
  const [originalUrl, setOriginalUrl] = React.useState("");
  const [dimensions, setDimensions] = React.useState<{ width: number; height: number } | null>(null);
  const [status, setStatus] = React.useState<JobStatus>("empty");
  const [progress, setProgress] = React.useState(0);
  const [progressText, setProgressText] = React.useState("");
  const [error, setError] = React.useState("");
  const [notice, setNotice] = React.useState("");
  const [backend, setBackend] = React.useState<"primary" | "fallback" | null>(null);
  const [hasResult, setHasResult] = React.useState(false);
  const [backgroundMode, setBackgroundMode] = React.useState<BackgroundMode>("transparent");
  const [backgroundColor, setBackgroundColor] = React.useState("#ffffff");
  const [backgroundBlur, setBackgroundBlur] = React.useState(24);
  const [backgroundName, setBackgroundName] = React.useState("");
  const [exportFormat, setExportFormat] = React.useState<ExportFormat>("image/png");
  const [quality, setQuality] = React.useState(92);
  const [brushMode, setBrushMode] = React.useState<BrushMode>("erase");
  const [brushSize, setBrushSize] = React.useState(36);
  const [manualControl, setManualControl] = React.useState(false);
  const [zoomPercent, setZoomPercent] = React.useState(100);
  const [previewBaseSize, setPreviewBaseSize] = React.useState<{ width: number; height: number } | null>(null);
  const [showBrushCursor, setShowBrushCursor] = React.useState(false);
  const [edgeSoftness, setEdgeSoftness] = React.useState(20);
  const [maskRevision, setMaskRevision] = React.useState(0);
  const [compare, setCompare] = React.useState(false);
  const [comparePosition, setComparePosition] = React.useState(50);
  const [isDragging, setIsDragging] = React.useState(false);
  const [isExporting, setIsExporting] = React.useState(false);
  const [canUndo, setCanUndo] = React.useState(false);
  const [canRedo, setCanRedo] = React.useState(false);

  const inputRef = React.useRef<HTMLInputElement>(null);
  const backgroundInputRef = React.useRef<HTMLInputElement>(null);
  const originalUrlRef = React.useRef("");
  const workerRef = React.useRef<Worker | null>(null);
  const sourceBitmapRef = React.useRef<ImageBitmap | null>(null);
  const backgroundBitmapRef = React.useRef<ImageBitmap | null>(null);
  const maskCanvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const initialMaskAlphaRef = React.useRef<Uint8Array | null>(null);
  const undoStackRef = React.useRef<Uint8Array[]>([]);
  const redoStackRef = React.useRef<Uint8Array[]>([]);
  const previewCanvasRef = React.useRef<HTMLCanvasElement>(null);
  const previewViewportRef = React.useRef<HTMLDivElement>(null);
  const brushCursorRef = React.useRef<HTMLDivElement>(null);
  const jobIdRef = React.useRef(0);
  const brushPointerRef = React.useRef<{ id: number; point: { x: number; y: number }; rect: DOMRect } | null>(null);
  const renderFrameRef = React.useRef<number | null>(null);
  const previewPainterRef = React.useRef<() => void>(() => undefined);

  React.useEffect(() => {
    const viewport = previewViewportRef.current;
    if (!hasResult || !dimensions || !viewport) return;

    const measure = () => {
      const style = window.getComputedStyle(viewport);
      const horizontalPadding = Number.parseFloat(style.paddingLeft) + Number.parseFloat(style.paddingRight);
      const verticalPadding = Number.parseFloat(style.paddingTop) + Number.parseFloat(style.paddingBottom);
      const availableWidth = Math.max(1, viewport.clientWidth - horizontalPadding);
      const availableHeight = Math.max(1, viewport.clientHeight - verticalPadding);
      const workingSize = fitWithin(dimensions.width, dimensions.height, MAX_PREVIEW_EDGE);
      setPreviewBaseSize(getPreviewDisplaySize(workingSize.width, workingSize.height, availableWidth, availableHeight));
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(viewport);
    return () => observer.disconnect();
  }, [dimensions, hasResult]);

  React.useEffect(() => {
    if (compare) setShowBrushCursor(false);
  }, [compare]);
  React.useEffect(() => {
    if (!manualControl) setShowBrushCursor(false);
  }, [manualControl]);
  const revokeCurrentResources = React.useCallback(() => {
    jobIdRef.current++;
    workerRef.current?.terminate();
    workerRef.current = null;
    sourceBitmapRef.current?.close();
    sourceBitmapRef.current = null;
    backgroundBitmapRef.current?.close();
    backgroundBitmapRef.current = null;
    if (originalUrlRef.current) URL.revokeObjectURL(originalUrlRef.current);
    originalUrlRef.current = "";
    maskCanvasRef.current = null;
    initialMaskAlphaRef.current = null;
    undoStackRef.current = [];
    redoStackRef.current = [];
    if (renderFrameRef.current !== null) cancelAnimationFrame(renderFrameRef.current);
    renderFrameRef.current = null;
  }, []);

  React.useEffect(() => () => {
    workerRef.current?.terminate();
    sourceBitmapRef.current?.close();
    backgroundBitmapRef.current?.close();
    if (originalUrlRef.current) URL.revokeObjectURL(originalUrlRef.current);
    if (renderFrameRef.current !== null) cancelAnimationFrame(renderFrameRef.current);
  }, []);

  const clearImage = React.useCallback(() => {
    revokeCurrentResources();
    setFile(null);
    setOriginalUrl("");
    setDimensions(null);
    setStatus("empty");
    setProgress(0);
    setProgressText("");
    setError("");
    setNotice("");
    setBackend(null);
    setHasResult(false);
    setBackgroundMode("transparent");
    setBackgroundName("");
    setMaskRevision(0);
    setCompare(false);
    setManualControl(false);
    setZoomPercent(100);
    setPreviewBaseSize(null);
    setShowBrushCursor(false);
    setCanUndo(false);
    setCanRedo(false);
  }, [revokeCurrentResources]);

  const drawPreview = React.useCallback(() => {
    const canvas = previewCanvasRef.current;
    const source = sourceBitmapRef.current;
    const mask = maskCanvasRef.current;
    const imageDimensions = dimensions;
    if (!canvas || !source || !mask || !imageDimensions || !hasResult) return;
    const fit = fitWithin(imageDimensions.width, imageDimensions.height, MAX_PREVIEW_EDGE);
    if (canvas.width !== fit.width || canvas.height !== fit.height) {
      canvas.width = fit.width;
      canvas.height = fit.height;
    }
    const activeMode = exportFormat === "image/jpeg" && backgroundMode === "transparent" ? "color" : backgroundMode;
    const activeColor = exportFormat === "image/jpeg" && backgroundMode === "transparent" ? "#ffffff" : backgroundColor;
    paintBackgroundRemoval(
      canvas,
      source,
      mask,
      { mode: activeMode, color: activeColor, blur: backgroundBlur, edgeSoftness, format: exportFormat, quality },
      backgroundBitmapRef.current
    );
  }, [dimensions, hasResult, backgroundMode, backgroundColor, backgroundBlur, edgeSoftness, exportFormat, quality]);
  previewPainterRef.current = drawPreview;

  React.useEffect(() => {
    drawPreview();
  }, [drawPreview, maskRevision]);

  const updateHistoryButtons = React.useCallback(() => {
    setCanUndo(undoStackRef.current.length > 0);
    setCanRedo(redoStackRef.current.length > 0);
  }, []);

  const startProcessing = React.useCallback((imageFile: File, jobId: number) => {
    const worker = new Worker(new URL("./worker.ts", import.meta.url), { type: "module" });
    workerRef.current = worker;
    worker.onmessage = (event: MessageEvent<WorkerReply>) => {
      const message = event.data;
      if (message.jobId !== jobId || jobId !== jobIdRef.current) return;
      if (message.type === "progress") {
        if (message.stage === "fallback") setNotice(message.message ?? "Using a lighter model for this device.");
        if (message.stage === "processing") setStatus("processing");
        if (message.message) setProgressText(message.message);
        if (typeof message.percent === "number") setProgress(message.stage === "processing" ? Math.min(95, 65 + Math.round(message.percent * 0.3)) : Math.min(60, Math.round(message.percent * 0.6)));
        return;
      }
      if (message.type === "complete" && message.alpha && message.width && message.height) {
        try {
          const alpha = new Uint8Array(message.alpha);
          const mask = makeAlphaMaskCanvas(alpha, message.width, message.height);
          maskCanvasRef.current = mask;
          initialMaskAlphaRef.current = captureMaskAlpha(mask);
          undoStackRef.current = [];
          redoStackRef.current = [];
          setCanUndo(false);
          setCanRedo(false);
          setMaskRevision((revision) => revision + 1);
          setBackend(message.backend ?? "fallback");
          setHasResult(true);
          setStatus("done");
          setProgress(100);
          setProgressText("Background removed. Touch up any edges, then choose a background and download.");
          setError("");
          setNotice(message.backend === "fallback" ? "This photo needed the portrait-focused model. You can refine the result with the erase and restore brushes." : "");
          worker.terminate();
          if (workerRef.current === worker) workerRef.current = null;
        } catch (reason) {
          setStatus("error");
          setError(reason instanceof Error ? reason.message : "The AI result could not be prepared. Please try again.");
          worker.terminate();
        }
        return;
      }
      if (message.type === "error") {
        setStatus("error");
        setError(message.message ?? "This image could not be processed. Please try again.");
        worker.terminate();
        if (workerRef.current === worker) workerRef.current = null;
      }
    };
    worker.onerror = () => {
      if (jobId !== jobIdRef.current) return;
      setStatus("error");
      setError("The background-removal engine stopped unexpectedly. Try again, or use a smaller JPG or PNG image.");
      worker.terminate();
      if (workerRef.current === worker) workerRef.current = null;
    };
    worker.postMessage({ type: "remove-background", jobId, file: imageFile });
  }, []);

  const addImage = React.useCallback(async (imageFile: File) => {
    const validation = validateBackgroundInput(imageFile);
    if (validation) {
      setError(validation);
      if (!file) setStatus("empty");
      return;
    }

    const jobId = ++jobIdRef.current;
    workerRef.current?.terminate();
    workerRef.current = null;
    sourceBitmapRef.current?.close();
    sourceBitmapRef.current = null;
    backgroundBitmapRef.current?.close();
    backgroundBitmapRef.current = null;
    if (originalUrlRef.current) URL.revokeObjectURL(originalUrlRef.current);
    originalUrlRef.current = "";
    maskCanvasRef.current = null;
    initialMaskAlphaRef.current = null;
    undoStackRef.current = [];
    redoStackRef.current = [];
    setFile(null);
    setOriginalUrl("");
    setDimensions(null);
    setHasResult(false);
    setManualControl(false);
    setPreviewBaseSize(null);
    setShowBrushCursor(false);
    setZoomPercent(100);
    setBackend(null);
    setBackgroundName("");
    setBackgroundMode("transparent");
    setError("");
    setNotice("");
    setCanUndo(false);
    setCanRedo(false);
    setProgress(0);
    setProgressText("Opening your image…");
    setStatus("loading");

    try {
      const bitmap = await createImageBitmap(imageFile, { imageOrientation: "from-image" });
      if (jobId !== jobIdRef.current) {
        bitmap.close();
        return;
      }
      const dimensionError = validateImageDimensions(bitmap.width, bitmap.height);
      if (dimensionError) {
        bitmap.close();
        setStatus("empty");
        setError(dimensionError);
        return;
      }
      const url = URL.createObjectURL(imageFile);
      sourceBitmapRef.current = bitmap;
      originalUrlRef.current = url;
      setFile(imageFile);
      setOriginalUrl(url);
      setDimensions({ width: bitmap.width, height: bitmap.height });
      setStatus("loading");
      setProgressText("Loading the AI model on your device…");
      startProcessing(imageFile, jobId);
    } catch {
      if (jobId !== jobIdRef.current) return;
      setStatus("empty");
      setError("This image could not be opened. Try a regular JPG, PNG, WebP, or BMP file.");
    }
  }, [file, startProcessing]);

  const handleFileSelection = (event: React.ChangeEvent<HTMLInputElement>) => {
    const next = event.target.files?.[0];
    event.target.value = "";
    if (next) void addImage(next);
  };

  const handleBackgroundSelection = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const next = event.target.files?.[0];
    event.target.value = "";
    if (!next) {
      if (!backgroundBitmapRef.current) setBackgroundMode("transparent");
      return;
    }
    const validation = validateBackgroundInput(next);
    if (validation) {
      setNotice(`Background image: ${validation}`);
      return;
    }
    try {
      const bitmap = await createImageBitmap(next, { imageOrientation: "from-image" });
      const dimensionError = validateImageDimensions(bitmap.width, bitmap.height);
      if (dimensionError) {
        bitmap.close();
        setNotice(`Background image: ${dimensionError}`);
        return;
      }
      backgroundBitmapRef.current?.close();
      backgroundBitmapRef.current = bitmap;
      setBackgroundName(next.name);
      setBackgroundMode("image");
      setNotice("");
    } catch {
      setNotice("This background image could not be opened. Try a JPG, PNG, or WebP file.");
    }
  };

  const queuePreviewPaint = () => {
    if (renderFrameRef.current !== null) return;
    renderFrameRef.current = requestAnimationFrame(() => {
      renderFrameRef.current = null;
      previewPainterRef.current();
    });
  };

  const handleBrushDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!hasResult || !manualControl || compare || !maskCanvasRef.current) return;
    const canvas = event.currentTarget;
    const rect = canvas.getBoundingClientRect();
    updateBrushCursorPosition(event, rect);
    const point = mapPointerToMask(event.clientX, event.clientY, rect, maskCanvasRef.current.width, maskCanvasRef.current.height);
    if (!point) return;
    try {
      const snapshot = captureMaskAlpha(maskCanvasRef.current);
      undoStackRef.current.push(snapshot);
      if (undoStackRef.current.length > MAX_HISTORY_STEPS) undoStackRef.current.shift();
      redoStackRef.current = [];
      updateHistoryButtons();
      const context = maskCanvasRef.current.getContext("2d");
      if (!context) return;
      const size = clampBrushSize(brushSize) * (maskCanvasRef.current.width / Math.max(1, rect.width));
      context.save();
      context.globalCompositeOperation = brushMode === "erase" ? "destination-out" : "source-over";
      context.fillStyle = brushMode === "erase" ? "rgba(0,0,0,1)" : "rgba(255,255,255,0.92)";
      context.beginPath();
      context.arc(point.x, point.y, size / 2, 0, Math.PI * 2);
      context.fill();
      context.restore();
      brushPointerRef.current = { id: event.pointerId, point, rect };
      canvas.setPointerCapture(event.pointerId);
      event.preventDefault();
      queuePreviewPaint();
    } catch (reason) {
      setNotice(reason instanceof Error ? reason.message : "The brush could not update this mask.");
    }
  };

  const handleBrushMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (manualControl && !compare && maskCanvasRef.current) updateBrushCursorPosition(event, event.currentTarget.getBoundingClientRect());
    const active = brushPointerRef.current;
    const mask = maskCanvasRef.current;
    if (!manualControl || !active || !mask || active.id !== event.pointerId) return;
    const point = mapPointerToMask(event.clientX, event.clientY, active.rect, mask.width, mask.height);
    if (!point) return;
    const context = mask.getContext("2d");
    if (!context) return;
    const size = clampBrushSize(brushSize) * (mask.width / Math.max(1, active.rect.width));
    drawBrushStroke(context, active.point, point, size, brushMode);
    active.point = point;
    event.preventDefault();
    queuePreviewPaint();
  };

  const handlePreviewWheel = (event: React.WheelEvent<HTMLCanvasElement>) => {
    if (!hasResult || event.deltaY === 0) return;
    event.preventDefault();
    const deltaY = event.deltaY;
    setZoomPercent((current) => zoomPreviewByWheel(current, deltaY));
    setShowBrushCursor(false);
  };

  const updateBrushCursorPosition = (event: React.PointerEvent<HTMLCanvasElement>, rect: DOMRect) => {
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    if (x < 0 || y < 0 || x > rect.width || y > rect.height) return;
    const cursor = brushCursorRef.current;
    if (cursor) {
      cursor.style.left = `${x}px`;
      cursor.style.top = `${y}px`;
    }
    setShowBrushCursor(true);
  };

  const finishBrushStroke = (event?: React.PointerEvent<HTMLCanvasElement>) => {
    if (event && brushPointerRef.current?.id !== event.pointerId) return;
    if (!brushPointerRef.current) return;
    brushPointerRef.current = null;
    setMaskRevision((revision) => revision + 1);
    updateHistoryButtons();
    if (renderFrameRef.current !== null) {
      cancelAnimationFrame(renderFrameRef.current);
      renderFrameRef.current = null;
    }
    drawPreview();
  };

  const undo = () => {
    const mask = maskCanvasRef.current;
    const previous = undoStackRef.current.pop();
    if (!mask || !previous) return;
    redoStackRef.current.push(captureMaskAlpha(mask));
    restoreMaskAlpha(mask, previous);
    setMaskRevision((revision) => revision + 1);
    updateHistoryButtons();
  };

  const redo = () => {
    const mask = maskCanvasRef.current;
    const next = redoStackRef.current.pop();
    if (!mask || !next) return;
    undoStackRef.current.push(captureMaskAlpha(mask));
    if (undoStackRef.current.length > MAX_HISTORY_STEPS) undoStackRef.current.shift();
    restoreMaskAlpha(mask, next);
    setMaskRevision((revision) => revision + 1);
    updateHistoryButtons();
  };

  const resetMask = () => {
    const mask = maskCanvasRef.current;
    const initial = initialMaskAlphaRef.current;
    if (!mask || !initial) return;
    undoStackRef.current.push(captureMaskAlpha(mask));
    if (undoStackRef.current.length > MAX_HISTORY_STEPS) undoStackRef.current.shift();
    redoStackRef.current = [];
    restoreMaskAlpha(mask, initial);
    setMaskRevision((revision) => revision + 1);
    updateHistoryButtons();
  };

  const removeAgain = () => {
    const currentFile = file;
    if (!currentFile) return;
    const jobId = ++jobIdRef.current;
    workerRef.current?.terminate();
    workerRef.current = null;
    maskCanvasRef.current = null;
    initialMaskAlphaRef.current = null;
    undoStackRef.current = [];
    redoStackRef.current = [];
    setHasResult(false);
    setCanUndo(false);
    setCanRedo(false);
    setBackend(null);
    setStatus("loading");
    setProgress(0);
    setProgressText("Loading the AI model on your device…");
    setError("");
    setNotice("");
    startProcessing(currentFile, jobId);
  };

  const downloadResult = async () => {
    const source = sourceBitmapRef.current;
    const mask = maskCanvasRef.current;
    if (!source || !mask || !dimensions || !hasResult) return;
    setIsExporting(true);
    setError("");
    try {
      const canvas = document.createElement("canvas");
      canvas.width = dimensions.width;
      canvas.height = dimensions.height;
      const activeMode = exportFormat === "image/jpeg" && backgroundMode === "transparent" ? "color" : backgroundMode;
      const activeColor = exportFormat === "image/jpeg" && backgroundMode === "transparent" ? "#ffffff" : backgroundColor;
      paintBackgroundRemoval(
        canvas,
        source,
        mask,
        { mode: activeMode, color: activeColor, blur: backgroundBlur, edgeSoftness, format: exportFormat, quality },
        backgroundBitmapRef.current
      );
      const blob = await canvasToBlob(canvas, exportFormat, quality);
      if (blob.size === 0) throw new Error("The downloaded image was empty. Try another format or a smaller image.");
      triggerBlobDownload(blob, buildBackgroundOutputName(file?.name ?? "image", exportFormat));
      setNotice(`Finished — ${formatImageDimensions(dimensions.width, dimensions.height)} saved as ${exportFormat.replace("image/", "").toUpperCase()}.`);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "The edited image could not be saved. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  const chooseMode = (mode: BackgroundMode) => {
    setBackgroundMode(mode);
    if (mode === "image" && !backgroundBitmapRef.current) backgroundInputRef.current?.click();
  };

  const changeZoom = (amount: number) => {
    setZoomPercent((current) => clampPreviewZoom(current + amount));
    setShowBrushCursor(false);
  };
  const toggleManualControl = () => {
    setManualControl((enabled) => !enabled);
    setShowBrushCursor(false);
  };
  const previewDisplaySize = previewBaseSize
    ? { width: Math.round(previewBaseSize.width * zoomPercent / 100), height: Math.round(previewBaseSize.height * zoomPercent / 100) }
    : null;
  const busy = status === "loading" || status === "processing";

  return (
    <div className="space-y-5">
      <input ref={inputRef} type="file" accept={ACCEPT} className="hidden" onChange={handleFileSelection} aria-label="Choose an image" />
      <input ref={backgroundInputRef} type="file" accept={ACCEPT} className="hidden" onChange={handleBackgroundSelection} aria-label="Choose a replacement background" />

      {status === "empty" && (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragEnter={(event) => { event.preventDefault(); setIsDragging(true); }}
          onDragOver={(event) => event.preventDefault()}
          onDragLeave={(event) => { if (event.currentTarget === event.target) setIsDragging(false); }}
          onDrop={(event) => {
            event.preventDefault();
            setIsDragging(false);
            const next = event.dataTransfer.files[0];
            if (next) void addImage(next);
          }}
          className={`group flex min-h-[300px] w-full flex-col items-center justify-center rounded-3xl border-2 border-dashed p-8 text-center transition sm:min-h-[360px] ${isDragging ? "border-ink bg-img-soft" : "border-slate-300 bg-white hover:border-ink/50 hover:bg-slate-50"}`}
        >
          <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-img-soft text-ink transition group-hover:scale-105">
            <UploadCloud className="h-8 w-8" />
          </span>
          <span className="mt-5 font-display text-2xl font-bold tracking-tight text-ink">Choose a photo to remove its background</span>
          <span className="mt-2 max-w-xl text-sm leading-relaxed text-slate-600">Drop a JPG, PNG, WebP, or BMP here, or browse your device. Processing stays in this browser.</span>
          <span className="mt-5"><span className="inline-flex h-11 items-center gap-2 rounded-xl bg-ink px-5 text-sm font-semibold text-white shadow-soft"><ImagePlus className="h-4 w-4" /> Choose image</span></span>
          <span className="mt-4 text-xs text-slate-500">Up to 30 MB · 24 megapixels · first AI model download may take a little while</span>
        </button>
      )}

      {file && dimensions && (
        <div className="grid grid-cols-1 items-start gap-5 xl:grid-cols-[minmax(0,1.65fr)_minmax(320px,0.85fr)]">
          <section className="min-w-0 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-soft" aria-label="Image preview">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-3 sm:px-5">
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-ink" title={file.name}>{file.name}</p>
                <p className="mt-0.5 text-xs text-slate-500">{formatImageDimensions(dimensions.width, dimensions.height)} · {(file.size / (1024 * 1024)).toFixed(file.size < 10 * 1024 * 1024 ? 1 : 0)} MB</p>
              </div>
              <div className="flex flex-wrap items-center justify-end gap-2">
                {hasResult && (
                  <>
                    <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1" aria-label="Image zoom controls">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => changeZoom(-PREVIEW_ZOOM_STEP)} disabled={zoomPercent <= MIN_PREVIEW_ZOOM} aria-label="Zoom out" title="Zoom out"><ZoomOut className="h-4 w-4" /></Button>
                      <span className="min-w-[3.25rem] text-center text-xs font-semibold tabular-nums text-slate-700" aria-live="polite">{zoomPercent}%</span>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => changeZoom(PREVIEW_ZOOM_STEP)} disabled={zoomPercent >= MAX_PREVIEW_ZOOM} aria-label="Zoom in" title="Zoom in"><ZoomIn className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="sm" className="h-8 px-2 text-xs" onClick={() => { setZoomPercent(100); setShowBrushCursor(false); }} disabled={zoomPercent === 100}>Fit</Button>
                    </div>
                    <Button variant={compare ? "primary" : "outline"} size="sm" onClick={() => setCompare((value) => !value)} aria-pressed={compare}>
                      {compare ? "Editing" : "Compare"}
                    </Button>
                  </>
                )}
                <Button variant="ghost" size="icon" className="h-9 w-9" onClick={clearImage} aria-label="Remove current image" title="Remove image"><X className="h-4 w-4" /></Button>
              </div>
            </div>

            <div className="bg-slate-50 p-3 sm:p-5">
              <div ref={previewViewportRef} className={`flex h-[68vh] min-h-[280px] max-h-[640px] overflow-auto rounded-2xl border border-slate-200 bg-white p-2 sm:p-4 ${zoomPercent > 100 ? "items-start justify-start" : "items-center justify-center"}`} style={checkerboardStyle()}>
                {hasResult ? (
                  <div className="relative inline-block shrink-0 overflow-hidden rounded-xl shadow-soft" style={{ width: previewDisplaySize?.width ?? 0, height: previewDisplaySize?.height ?? 0 }}>
                    <canvas
                      ref={previewCanvasRef}
                      aria-label={compare ? "Edited image preview" : brushMode === "erase" ? "Edited image; erase background with the brush" : "Edited image; restore subject with the brush"}
                      className={`block touch-none select-none ${compare ? "cursor-default" : manualControl ? "cursor-crosshair" : "cursor-zoom-in"}`}
                      style={{ width: previewDisplaySize?.width ?? 0, height: previewDisplaySize?.height ?? 0 }}
                      onPointerDown={handleBrushDown}
                      onPointerMove={handleBrushMove}
                      onPointerUp={finishBrushStroke}
                      onPointerCancel={finishBrushStroke}
                      onLostPointerCapture={finishBrushStroke}
                      onWheel={handlePreviewWheel}
                    />
                    {compare && originalUrl && (
                      <div className="pointer-events-none absolute inset-0 overflow-hidden" style={{ clipPath: `inset(0 ${100 - comparePosition}% 0 0)` }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={originalUrl} alt="Original image" className="block h-full w-full select-none object-contain" draggable={false} />
                        <span className="absolute left-2 top-2 rounded-lg bg-slate-950/75 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-white">Original</span>
                      </div>
                    )}
                    {compare && <span className="pointer-events-none absolute right-2 top-2 rounded-lg bg-ink/90 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-white">Edited</span>}
                    {!compare && <div ref={brushCursorRef} aria-hidden="true" className={`pointer-events-none absolute z-10 rounded-full border-2 border-white shadow-[0_0_0_1px_rgba(15,23,42,0.85)] ${brushMode === "erase" ? "bg-rose-400/15" : "bg-sky-400/20"}`} style={{ width: brushSize, height: brushSize, transform: "translate(-50%, -50%)", opacity: showBrushCursor ? 1 : 0 }} />}
                  </div>
                ) : (
                  <div className="relative flex max-h-[68vh] max-w-full items-center justify-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={originalUrl} alt="Selected image" className="block max-h-[68vh] max-w-full rounded-xl object-contain shadow-soft" />
                    {busy && <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-slate-950/60 p-6 text-center text-white backdrop-blur-[1px]"><div><Loader2 className="mx-auto h-9 w-9 animate-spin" /><p className="mt-3 text-sm font-semibold">{progressText || "Preparing your image…"}</p></div></div>}
                  </div>
                )}
              </div>
              {compare && hasResult ? (
                <div className="mx-auto mt-3 flex max-w-lg items-center gap-3 text-xs text-slate-600">
                  <span>Original</span>
                  <input type="range" min={0} max={100} value={comparePosition} onChange={(event) => setComparePosition(Number(event.target.value))} className={RANGE_CLASS} aria-label="Move before and after comparison" />
                  <span>Edited</span>
                </div>
              ) : hasResult ? (
                <p className="mt-3 text-center text-xs text-slate-500">Scroll over the image to zoom in or out. {manualControl ? `${brushMode === "erase" ? "Paint over leftover background to erase it." : "Paint over missing areas to restore the subject."} Brush size: ${brushSize}px.` : "Turn on Manual Control to use the erase and restore brushes."}</p>
              ) : null}
            </div>

            {(busy || status === "error") && (
              <div className="border-t border-slate-100 px-4 py-4 sm:px-5">
                {busy && (
                  <div aria-live="polite">
                    <div className="mb-2 flex items-center justify-between gap-3 text-xs font-semibold text-slate-700"><span className="inline-flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin text-ink" />{progressText || "Working on your image…"}</span><span>{progress}%</span></div>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-ink transition-all duration-300" style={{ width: `${Math.max(4, progress)}%` }} /></div>
                    {status === "loading" && <p className="mt-2 text-[11px] text-slate-500">The first run downloads the AI model. It is saved in your browser for next time; your photo is not uploaded.</p>}
                  </div>
                )}
                {status === "error" && <div role="alert" className="flex items-start gap-2 text-sm text-rose-700"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /><span>{error}</span></div>}
                {status === "error" && <Button className="mt-3" size="sm" onClick={removeAgain}><RotateCcw className="h-4 w-4" /> Try again</Button>}
              </div>
            )}
          </section>

          <aside className="space-y-4">
            <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-soft sm:p-5" aria-label="Background settings">
              <div className="flex items-center gap-2"><Palette className="h-5 w-5 text-ink" /><h2 className="font-display text-lg font-bold text-ink">Choose a background</h2></div>
              <p className="mt-1 text-xs leading-relaxed text-slate-500">Try transparent PNG, a color, a soft blur, or your own photo.</p>

              <div className="mt-4 grid grid-cols-2 gap-2">
                <button type="button" onClick={() => chooseMode("transparent")} disabled={!hasResult} aria-pressed={backgroundMode === "transparent"} className={`rounded-xl border p-3 text-left text-xs font-semibold transition disabled:opacity-45 ${backgroundMode === "transparent" ? "border-ink bg-img-soft text-ink ring-1 ring-ink/10" : "border-slate-200 text-slate-700 hover:bg-slate-50"}`}>
                  <span className="mb-2 block h-8 rounded-md border border-slate-200" style={checkerboardStyle()} /><span className="flex items-center justify-between gap-1">Transparent {backgroundMode === "transparent" && <Check className="h-3.5 w-3.5" />}</span>
                </button>
                <button type="button" onClick={() => chooseMode("color")} disabled={!hasResult} aria-pressed={backgroundMode === "color"} className={`rounded-xl border p-3 text-left text-xs font-semibold transition disabled:opacity-45 ${backgroundMode === "color" ? "border-ink bg-img-soft text-ink ring-1 ring-ink/10" : "border-slate-200 text-slate-700 hover:bg-slate-50"}`}>
                  <span className="mb-2 block h-8 rounded-md border border-slate-200" style={{ backgroundColor }} /><span className="flex items-center justify-between gap-1">Solid color {backgroundMode === "color" && <Check className="h-3.5 w-3.5" />}</span>
                </button>
                <button type="button" onClick={() => chooseMode("blur")} disabled={!hasResult} aria-pressed={backgroundMode === "blur"} className={`rounded-xl border p-3 text-left text-xs font-semibold transition disabled:opacity-45 ${backgroundMode === "blur" ? "border-ink bg-img-soft text-ink ring-1 ring-ink/10" : "border-slate-200 text-slate-700 hover:bg-slate-50"}`}>
                  <span className="mb-2 block h-8 overflow-hidden rounded-md border border-slate-200 bg-gradient-to-br from-sky-200 via-violet-200 to-rose-200 blur-[1px]" /><span className="flex items-center justify-between gap-1">Blur original {backgroundMode === "blur" && <Check className="h-3.5 w-3.5" />}</span>
                </button>
                <button type="button" onClick={() => chooseMode("image")} disabled={!hasResult} aria-pressed={backgroundMode === "image"} className={`rounded-xl border p-3 text-left text-xs font-semibold transition disabled:opacity-45 ${backgroundMode === "image" ? "border-ink bg-img-soft text-ink ring-1 ring-ink/10" : "border-slate-200 text-slate-700 hover:bg-slate-50"}`}>
                  <span className="mb-2 flex h-8 items-center justify-center rounded-md border border-dashed border-slate-300 bg-slate-50"><ImagePlus className="h-4 w-4" /></span><span className="flex items-center justify-between gap-1">Your photo {backgroundMode === "image" && <Check className="h-3.5 w-3.5" />}</span>
                </button>
              </div>

              {backgroundMode === "color" && hasResult && (
                <div className="mt-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <input type="color" value={backgroundColor} onChange={(event) => setBackgroundColor(event.target.value)} className="h-10 w-12 cursor-pointer rounded-lg border border-slate-200 bg-white p-1" aria-label="Choose a custom background color" />
                    <input type="text" value={backgroundColor.toUpperCase()} onChange={(event) => { const next = event.target.value.trim(); if (/^#[0-9a-fA-F]{6}$/.test(next)) setBackgroundColor(next); }} className={`${CONTROL_CLASS} font-mono uppercase`} aria-label="Background color hex value" />
                  </div>
                  <div className="flex flex-wrap gap-2" aria-label="Background color presets">
                    {BACKGROUND_COLORS.map((color) => <button key={color} type="button" onClick={() => setBackgroundColor(color)} title={color} aria-label={`Use ${color} background`} className={`h-7 w-7 rounded-full border border-slate-300 shadow-sm ${backgroundColor.toLowerCase() === color ? "ring-2 ring-ink ring-offset-2" : ""}`} style={{ backgroundColor: color }} />)}
                  </div>
                </div>
              )}
              {backgroundMode === "blur" && hasResult && <label className="mt-4 block text-xs font-semibold text-slate-700">Blur strength <span className="float-right tabular-nums text-slate-500">{backgroundBlur}px</span><input type="range" min={4} max={48} value={backgroundBlur} onChange={(event) => setBackgroundBlur(Number(event.target.value))} className={`${RANGE_CLASS} mt-2`} aria-label="Blur strength" /></label>}
              {backgroundMode === "image" && hasResult && <div className="mt-3 flex items-center gap-2 rounded-xl bg-slate-50 p-3 text-xs text-slate-600"><ImagePlus className="h-4 w-4 shrink-0" /><span className="min-w-0 flex-1 truncate">{backgroundName || "Choose a background image"}</span><button type="button" onClick={() => backgroundInputRef.current?.click()} className="font-bold text-ink hover:underline">Change</button></div>}
              {exportFormat === "image/jpeg" && backgroundMode === "transparent" && hasResult && <p className="mt-2 text-[11px] text-amber-700">JPG cannot be transparent, so it will download with a white background.</p>}
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-soft sm:p-5" aria-label="Fine edge editing">
              <div className="flex flex-wrap items-center justify-between gap-2"><div className="flex items-center gap-2"><Brush className="h-5 w-5 text-ink" /><h2 className="font-display text-lg font-bold text-ink">Fine-tune the edges</h2></div><Button size="sm" variant={manualControl ? "primary" : "outline"} disabled={!hasResult || busy || compare} onClick={toggleManualControl} aria-pressed={manualControl}>{manualControl ? "Manual Control on" : "Manual Control"}</Button></div>
              <p className="mt-1 text-xs leading-relaxed text-slate-500">{manualControl ? "Brush over the image to erase leftovers or restore missed areas. Turn this off when you finish." : "Turn on Manual Control before using brushes or changing edge softness."}</p>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <Button size="sm" variant={brushMode === "erase" ? "primary" : "outline"} disabled={!hasResult || !manualControl || busy || compare} onClick={() => setBrushMode("erase")} aria-pressed={brushMode === "erase"}><Eraser className="h-4 w-4" /> Erase</Button>
                <Button size="sm" variant={brushMode === "restore" ? "primary" : "outline"} disabled={!hasResult || !manualControl || busy || compare} onClick={() => setBrushMode("restore")} aria-pressed={brushMode === "restore"}><Brush className="h-4 w-4" /> Restore</Button>
              </div>
              <div className="mt-4 flex items-center gap-3">
                <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 ${manualControl ? "bg-slate-50" : "bg-slate-100 opacity-50"}`} aria-label={`Brush size preview: ${brushSize} pixels`} title={`Brush size preview: ${brushSize}px`}>
                  <span className={`block rounded-full border border-slate-700/70 ${brushMode === "erase" ? "bg-rose-300/70" : "bg-sky-300/70"}`} style={{ width: Math.max(4, Math.round(brushSize / 120 * 32)), height: Math.max(4, Math.round(brushSize / 120 * 32)) }} />
                </div>
                <label className="min-w-0 flex-1 text-xs font-semibold text-slate-700">Brush size <span className="float-right tabular-nums text-slate-500">{brushSize}px</span><input type="range" min={4} max={120} value={brushSize} onChange={(event) => setBrushSize(clampBrushSize(Number(event.target.value)))} className={`${RANGE_CLASS} mt-2`} disabled={!hasResult || !manualControl || busy || compare} aria-label="Brush size" /></label>
              </div>
              <p className="mt-2 text-[11px] leading-relaxed text-slate-500">{manualControl ? "The brush-size preview follows your pointer and changes with the slider." : "The brush and edge controls become available after you turn on Manual Control."}</p>
              <label className="mt-4 block text-xs font-semibold text-slate-700">Edge softness <span className="float-right tabular-nums text-slate-500">{edgeSoftness}%</span><input type="range" min={0} max={100} value={edgeSoftness} onChange={(event) => setEdgeSoftness(clampEdgeSoftness(Number(event.target.value)))} className={`${RANGE_CLASS} mt-2`} disabled={!hasResult || !manualControl || busy} aria-label="Edge softness" /></label>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={undo} disabled={!hasResult || !manualControl || !canUndo || busy}><Undo2 className="h-4 w-4" /> Undo</Button>
                <Button variant="outline" size="sm" onClick={redo} disabled={!hasResult || !manualControl || !canRedo || busy}><Redo2 className="h-4 w-4" /> Redo</Button>
                <Button variant="ghost" size="sm" onClick={resetMask} disabled={!hasResult || !manualControl || (!canUndo && !canRedo) || busy}><RotateCcw className="h-4 w-4" /> Reset mask</Button>
              </div>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-soft sm:p-5" aria-label="Download settings">
              <div className="flex items-center gap-2"><ArrowDownToLine className="h-5 w-5 text-ink" /><h2 className="font-display text-lg font-bold text-ink">Save your image</h2></div>
              <label className="mt-4 block text-xs font-semibold text-slate-700" htmlFor="background-output-format">File type</label>
              <select id="background-output-format" value={exportFormat} onChange={(event) => setExportFormat(event.target.value as ExportFormat)} className={`${CONTROL_CLASS} mt-1.5`} disabled={!hasResult || busy}>{EXPORT_FORMATS.map((format) => <option key={format.value} value={format.value}>{format.label}</option>)}</select>
              {exportFormat !== "image/png" && <label className="mt-4 block text-xs font-semibold text-slate-700">Image quality <span className="float-right tabular-nums text-slate-500">{quality}%</span><input type="range" min={60} max={100} value={quality} onChange={(event) => setQuality(Number(event.target.value))} className={`${RANGE_CLASS} mt-2`} disabled={!hasResult || busy} aria-label="Image quality" /></label>}
              <Button className="mt-4 w-full" size="lg" disabled={!hasResult || busy || isExporting} onClick={() => void downloadResult()}>
                {isExporting ? <><Loader2 className="h-5 w-5 animate-spin" /> Preparing download…</> : <><ArrowDownToLine className="h-5 w-5" /> Download edited image</>}
              </Button>
              {status === "error" && <Button variant="outline" className="mt-2 w-full" onClick={removeAgain}><RotateCcw className="h-4 w-4" /> Try background removal again</Button>}
              <div className="mt-3 flex items-start gap-2 rounded-xl bg-emerald-50 p-3 text-[11px] leading-relaxed text-emerald-900"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" /><span>Your photo stays on your device. Only the AI model files are downloaded; your image is never uploaded.</span></div>
            </section>
          </aside>
        </div>
      )}

      {(error && status !== "error") && <div role="alert" className="flex items-start gap-2 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /><span>{error}</span><button type="button" className="ml-auto" onClick={() => setError("")} aria-label="Dismiss message"><X className="h-4 w-4" /></button></div>}
      {notice && <div role="status" className="flex items-start gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-3 text-xs leading-relaxed text-slate-700"><Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-ink" /><span>{notice}</span><button type="button" className="ml-auto" onClick={() => setNotice("")} aria-label="Dismiss message"><X className="h-4 w-4" /></button></div>}

      {status === "done" && hasResult && <p className="sr-only" role="status">Background removed successfully. {formatImageDimensions(dimensions?.width ?? 0, dimensions?.height ?? 0)}.</p>}
    </div>
  );
}
