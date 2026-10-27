"use client";

import * as React from "react";
import {
  Brush, Check, CircleHelp, Download, Eraser, ImagePlus, Loader2, Redo2,
  RotateCcw, Trash2, Undo2, UploadCloud, X, ZoomIn, ZoomOut, Move,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { formatBytes } from "@/modules/image-compressor/engine";
import {
  BrushStroke, EditOperation, Point, WATERMARK_MAX_FILE_BYTES,
  canvasToPng, decodeImage, isWatermarkImageType, outputFilename, previewSize, renderOperations,
} from "./engine";

type Mode = "heal" | "clone";
type CursorPoint = Point | null;

const RANGE_CLASS = "h-2 w-full cursor-pointer appearance-none rounded-full bg-slate-200 accent-ink disabled:cursor-not-allowed disabled:opacity-50";

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function drawStrokes(canvas: HTMLCanvasElement | null, width: number, height: number, strokes: BrushStroke[]) {
  if (!canvas) return;
  const context = canvas.getContext("2d");
  if (!context) return;
  context.clearRect(0, 0, width, height);
  context.strokeStyle = "#f43f5e";
  context.fillStyle = "#f43f5e";
  context.globalAlpha = 0.46;
  context.lineCap = "round";
  context.lineJoin = "round";
  for (const stroke of strokes) {
    if (!stroke.points.length) continue;
    const lineWidth = Math.max(1, stroke.width * width);
    context.lineWidth = lineWidth;
    const first = stroke.points[0]!;
    if (stroke.points.length === 1) {
      context.beginPath();
      context.arc(first.x * width, first.y * height, lineWidth / 2, 0, Math.PI * 2);
      context.fill();
      continue;
    }
    context.beginPath();
    context.moveTo(first.x * width, first.y * height);
    for (const point of stroke.points.slice(1)) context.lineTo(point.x * width, point.y * height);
    context.stroke();
  }
  context.globalAlpha = 1;
}

export function WatermarkRemoverTool() {
  const [file, setFile] = React.useState<File | null>(null);
  const [imageSize, setImageSize] = React.useState<{ width: number; height: number; previewWidth: number; previewHeight: number } | null>(null);
  const [mode, setMode] = React.useState<Mode>("heal");
  const [brushSize, setBrushSize] = React.useState(30);
  const [strokes, setStrokes] = React.useState<BrushStroke[]>([]);
  const [history, setHistory] = React.useState<EditOperation[]>([]);
  const [historyIndex, setHistoryIndex] = React.useState(0);
  const [cloneSource, setCloneSource] = React.useState<Point | null>(null);
  const [pickingSource, setPickingSource] = React.useState(false);
  const [cursor, setCursor] = React.useState<CursorPoint>(null);
  const [showOriginal, setShowOriginal] = React.useState(false);
  const [previewRevision, setPreviewRevision] = React.useState(0);
  const [zoom, setZoom] = React.useState(100);
  const [panMode, setPanMode] = React.useState(false);
  const [viewSize, setViewSize] = React.useState({ width: 0, height: 0 });
  const [dragging, setDragging] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [processing, setProcessing] = React.useState(false);
  const [downloading, setDownloading] = React.useState(false);
  const [error, setError] = React.useState("");
  const [notice, setNotice] = React.useState("");

  const inputRef = React.useRef<HTMLInputElement>(null);
  const previewRef = React.useRef<HTMLCanvasElement>(null);
  const maskRef = React.useRef<HTMLCanvasElement>(null);
  const viewportRef = React.useRef<HTMLDivElement>(null);
  const resultCanvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const originalPreviewRef = React.useRef<HTMLCanvasElement | null>(null);
  const strokesRef = React.useRef<BrushStroke[]>([]);
  const activeStrokeRef = React.useRef<BrushStroke | null>(null);
  const pointerIdRef = React.useRef<number | null>(null);
  const panRef = React.useRef<{ pointerId: number; x: number; y: number; left: number; top: number } | null>(null);
  const processingRef = React.useRef(false);
  const loadGenerationRef = React.useRef(0);

  React.useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport || !imageSize) return;
    const update = () => setViewSize({ width: viewport.clientWidth, height: viewport.clientHeight });
    update();
    const observer = new ResizeObserver(update);
    observer.observe(viewport);
    return () => observer.disconnect();
  }, [imageSize]);

  React.useEffect(() => { strokesRef.current = strokes; }, [strokes]);

  const drawPreview = React.useCallback((original = showOriginal) => {
    if (!imageSize || !previewRef.current) return;
    const source = original ? originalPreviewRef.current : resultCanvasRef.current;
    const context = previewRef.current.getContext("2d");
    if (!source || !context) return;
    context.clearRect(0, 0, imageSize.previewWidth, imageSize.previewHeight);
    context.drawImage(source, 0, 0, imageSize.previewWidth, imageSize.previewHeight);
  }, [imageSize, showOriginal]);

  React.useEffect(() => {
    drawPreview(showOriginal);
  }, [drawPreview, showOriginal, previewRevision]);

  React.useEffect(() => {
    if (!imageSize) return;
    drawStrokes(maskRef.current, imageSize.previewWidth, imageSize.previewHeight, strokes);
    if (activeStrokeRef.current) drawStrokes(maskRef.current, imageSize.previewWidth, imageSize.previewHeight, [...strokes, activeStrokeRef.current]);
  }, [imageSize, strokes]);

  const clearImage = React.useCallback(() => {
    loadGenerationRef.current++;
    setFile(null);
    setImageSize(null);
    setStrokes([]);
    strokesRef.current = [];
    setHistory([]);
    setHistoryIndex(0);
    setCloneSource(null);
    setPickingSource(false);
    setCursor(null);
    setShowOriginal(false);
    setZoom(100);
    setPanMode(false);
    setError("");
    setNotice("");
    if (resultCanvasRef.current) { resultCanvasRef.current.width = 0; resultCanvasRef.current.height = 0; }
    if (originalPreviewRef.current) { originalPreviewRef.current.width = 0; originalPreviewRef.current.height = 0; }
    resultCanvasRef.current = null;
    originalPreviewRef.current = null;
    if (previewRef.current) previewRef.current.width = 0;
    if (maskRef.current) maskRef.current.width = 0;
    if (inputRef.current) inputRef.current.value = "";
  }, []);

  const loadFile = React.useCallback(async (nextFile: File) => {
    setError("");
    setNotice("");
    if (!isWatermarkImageType(nextFile.type)) {
      setError("Choose a JPG, PNG, WebP, or BMP image. Animated GIF files are not supported.");
      return;
    }
    if (nextFile.size > WATERMARK_MAX_FILE_BYTES) {
      setError(`This image is larger than the ${formatBytes(WATERMARK_MAX_FILE_BYTES)} limit.`);
      return;
    }
    const generation = ++loadGenerationRef.current;
    setLoading(true);
    try {
      const loaded = await decodeImage(nextFile);
      if (generation !== loadGenerationRef.current) {
        loaded.canvas.width = 0;
        loaded.canvas.height = 0;
        return;
      }
      const preview = previewSize(loaded.width, loaded.height);
      const originalPreview = document.createElement("canvas");
      originalPreview.width = preview.width;
      originalPreview.height = preview.height;
      const originalContext = originalPreview.getContext("2d");
      if (!originalContext) throw new Error("This browser could not prepare the preview.");
      originalContext.imageSmoothingEnabled = true;
      originalContext.imageSmoothingQuality = "high";
      originalContext.drawImage(loaded.canvas, 0, 0, preview.width, preview.height);

      if (resultCanvasRef.current) { resultCanvasRef.current.width = 0; resultCanvasRef.current.height = 0; }
      if (originalPreviewRef.current) { originalPreviewRef.current.width = 0; originalPreviewRef.current.height = 0; }
      resultCanvasRef.current = loaded.canvas;
      originalPreviewRef.current = originalPreview;
      setFile(nextFile);
      setImageSize({ width: loaded.width, height: loaded.height, previewWidth: preview.width, previewHeight: preview.height });
      setStrokes([]);
      strokesRef.current = [];
      setHistory([]);
      setHistoryIndex(0);
      setCloneSource(null);
      setShowOriginal(false);
      setZoom(100);
      setPanMode(false);
      setNotice("Image ready. Brush over the watermark, then choose Remove mark.");
    } catch (cause) {
      if (generation === loadGenerationRef.current) setError(cause instanceof Error ? cause.message : "This image could not be opened.");
    } finally {
      if (generation === loadGenerationRef.current) setLoading(false);
    }
  }, []);

  const mapPointer = (event: React.PointerEvent<HTMLCanvasElement>): { point: Point; width: number } | null => {
    const canvas = previewRef.current;
    if (!canvas || !imageSize) return null;
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return null;
    return {
      point: {
        x: Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width)),
        y: Math.max(0, Math.min(1, (event.clientY - rect.top) / rect.height)),
      },
      width: brushSize / rect.width,
    };
  };

  const onPointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!imageSize || processing || loading || showOriginal) return;
    if (panMode && viewportRef.current) {
      event.currentTarget.setPointerCapture(event.pointerId);
      panRef.current = { pointerId: event.pointerId, x: event.clientX, y: event.clientY, left: viewportRef.current.scrollLeft, top: viewportRef.current.scrollTop };
      return;
    }
    const mapped = mapPointer(event);
    if (!mapped) return;
    if (pickingSource) {
      setCloneSource(mapped.point);
      setPickingSource(false);
      setNotice("Clone source selected. Paint over the mark with the brush.");
      return;
    }
    if (mode === "clone" && !cloneSource) {
      setCloneSource(mapped.point);
      setPickingSource(false);
      setNotice("Clone source selected. Paint over the mark with the brush.");
      return;
    }
    event.currentTarget.setPointerCapture(event.pointerId);
    pointerIdRef.current = event.pointerId;
    const active: BrushStroke = { points: [mapped.point], width: mapped.width };
    activeStrokeRef.current = active;
    setCursor(mapped.point);
    drawStrokes(maskRef.current, imageSize.previewWidth, imageSize.previewHeight, [...strokesRef.current, active]);
  };

  const onPointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const pan = panRef.current;
    if (pan && pan.pointerId === event.pointerId && viewportRef.current) {
      viewportRef.current.scrollLeft = pan.left - (event.clientX - pan.x);
      viewportRef.current.scrollTop = pan.top - (event.clientY - pan.y);
      return;
    }
    const mapped = mapPointer(event);
    if (!mapped) return;
    setCursor(mapped.point);
    if (pointerIdRef.current !== event.pointerId || !activeStrokeRef.current) return;
    const active = activeStrokeRef.current;
    const previous = active.points[active.points.length - 1]!;
    const dx = (mapped.point.x - previous.x) * imageSize!.previewWidth;
    const dy = (mapped.point.y - previous.y) * imageSize!.previewHeight;
    if (dx * dx + dy * dy < 2.25) return;
    active.points.push(mapped.point);
    drawStrokes(maskRef.current, imageSize!.previewWidth, imageSize!.previewHeight, [...strokesRef.current, active]);
  };

  const finishStroke = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (panRef.current?.pointerId === event.pointerId) {
      panRef.current = null;
      return;
    }
    if (pointerIdRef.current !== event.pointerId || !activeStrokeRef.current) return;
    const final = activeStrokeRef.current;
    activeStrokeRef.current = null;
    pointerIdRef.current = null;
    const next = [...strokesRef.current, final].slice(-40);
    strokesRef.current = next;
    setStrokes(next);
  };

  const runOperations = React.useCallback(async (operations: EditOperation[], action: "apply" | "undo" | "redo" | "reset") => {
    if (!file || processingRef.current) return false;
    processingRef.current = true;
    setProcessing(true);
    setError("");
    setNotice(action === "apply" ? "Removing the selected mark…" : "Updating the edit…");
    try {
      const rendered = await renderOperations(file, operations, setNotice);
      const oldCanvas = resultCanvasRef.current;
      resultCanvasRef.current = rendered.canvas;
      if (oldCanvas && oldCanvas !== rendered.canvas) { oldCanvas.width = 0; oldCanvas.height = 0; }
      setPreviewRevision((revision) => revision + 1);
      setShowOriginal(false);
      if (action === "apply" || action === "reset") {
        setHistory(operations);
        setHistoryIndex(operations.length);
      } else {
        setHistoryIndex(operations.length);
      }
      if (action === "apply" || action === "reset") {
        setStrokes([]);
        strokesRef.current = [];
        if (action === "reset") setCloneSource(null);
      }
      setNotice(action === "reset" ? "Original image restored." : action === "apply" ? "Done. Inspect the result and add another pass if needed." : "Edit history updated.");
      return true;
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The selected area could not be edited.");
      setNotice("");
      return false;
    } finally {
      processingRef.current = false;
      setProcessing(false);
    }
  }, [file]);

  const applySelection = async () => {
    if (!file || !strokes.length) return;
    if (mode === "clone" && !cloneSource) {
      setError("Choose a clean source area first.");
      return;
    }
    const offset = mode === "clone" && cloneSource
      ? { x: strokes[0]!.points[0]!.x - cloneSource.x, y: strokes[0]!.points[0]!.y - cloneSource.y }
      : undefined;
    const operation: EditOperation = { mode, strokes, ...(offset ? { cloneOffset: offset } : {}) };
    const next = [...history.slice(0, historyIndex), operation];
    await runOperations(next, "apply");
  };

  const undo = () => {
    if (!historyIndex) return;
    void runOperations(history.slice(0, historyIndex - 1), "undo");
  };
  const redo = () => {
    if (historyIndex >= history.length) return;
    void runOperations(history.slice(0, historyIndex + 1), "redo");
  };
  const reset = () => {
    if (!file) return;
    void runOperations([], "reset");
  };

  const download = async () => {
    if (!resultCanvasRef.current || downloading) return;
    setDownloading(true);
    setError("");
    try {
      const blob = await canvasToPng(resultCanvasRef.current);
      triggerDownload(blob, outputFilename(file?.name ?? "image"));
      setNotice(`Saved as full-size PNG (${imageSize?.width.toLocaleString()} × ${imageSize?.height.toLocaleString()}).`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The PNG could not be downloaded.");
    } finally {
      setDownloading(false);
    }
  };

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length;
  const busy = loading || processing;
  const fitScale = imageSize && viewSize.width && viewSize.height
    ? Math.min(1, viewSize.width / imageSize.previewWidth, viewSize.height / imageSize.previewHeight)
    : 1;
  const displayWidth = imageSize ? Math.max(1, Math.round(imageSize.previewWidth * fitScale * zoom / 100)) : 1;
  const displayHeight = imageSize ? Math.max(1, Math.round(imageSize.previewHeight * fitScale * zoom / 100)) : 1;
  const contentWidth = Math.max(viewSize.width, displayWidth);
  const contentHeight = Math.max(viewSize.height, displayHeight);

  return (
    <section className="space-y-5">
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-soft">
        {!file ? (
          <div
            onDragOver={(event) => { event.preventDefault(); setDragging(true); }}
            onDragLeave={(event) => { event.preventDefault(); setDragging(false); }}
            onDrop={(event) => { event.preventDefault(); setDragging(false); const dropped = event.dataTransfer.files[0]; if (dropped) void loadFile(dropped); }}
            className={`m-3 flex min-h-[300px] flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 text-center transition sm:m-5 sm:min-h-[380px] ${dragging ? "border-ink bg-img-soft" : "border-slate-300 bg-slate-50/70"}`}
          >
            <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-img-soft text-ink"><UploadCloud className="h-8 w-8" /></span>
            <h2 className="mt-5 font-display text-xl font-bold text-ink sm:text-2xl">Remove a watermark from your image</h2>
            <p className="mt-2 max-w-lg text-sm leading-relaxed text-slate-600">Brush over the mark and fill it from nearby pixels, or use Clone to copy a clean nearby area for detailed texture.</p>
            <Button className="mt-5" onClick={() => inputRef.current?.click()} disabled={loading}>
              {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Opening image…</> : <><ImagePlus className="h-4 w-4" /> Choose an image</>}
            </Button>
            <p className="mt-3 text-xs text-slate-500">JPG, PNG, WebP, or BMP · up to 50 MB and 24 MP · processed on this device</p>
          </div>
        ) : (
          <>
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-3 sm:px-5">
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-ink">{file.name}</p>
                <p className="mt-0.5 text-xs text-slate-500">{imageSize?.width.toLocaleString()} × {imageSize?.height.toLocaleString()} px · {formatBytes(file.size)}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {history.length > 0 && <Button variant="outline" size="sm" onClick={() => setShowOriginal((value) => !value)} aria-pressed={showOriginal}>{showOriginal ? "Show edit" : "Compare original"}</Button>}
                <Button variant="ghost" size="icon" onClick={clearImage} disabled={busy} aria-label="Remove image" title="Remove image"><X className="h-4 w-4" /></Button>
              </div>
            </div>
            <div className="bg-[repeating-conic-gradient(#e2e8f0_0%_25%,#fff_0%_50%)] bg-[length:18px_18px] p-3 sm:p-5">
              {imageSize && (
                <>
                  <div className="mb-3 flex justify-end gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setZoom((value) => Math.max(50, value - 25))} disabled={zoom <= 50} aria-label="Zoom out"><ZoomOut className="h-4 w-4" /></Button>
                    <span className="flex min-w-[52px] items-center justify-center text-xs font-semibold tabular-nums text-slate-600">{zoom}%</span>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setZoom((value) => Math.min(300, value + 25))} disabled={zoom >= 300} aria-label="Zoom in"><ZoomIn className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="sm" className="h-8 px-2 text-xs" onClick={() => setZoom(100)} disabled={zoom === 100}>Fit</Button>
                    <Button variant={panMode ? "primary" : "ghost"} size="sm" className="h-8 px-2 text-xs" onClick={() => setPanMode((value) => !value)} aria-pressed={panMode}><Move className="h-3.5 w-3.5" /> {panMode ? "Move on" : "Move"}</Button>
                  </div>
                  <div className="h-[62vh] min-h-[260px] max-h-[800px] w-full overflow-auto" ref={viewportRef}>
                    <div className="flex items-center justify-center" style={{ width: contentWidth, height: contentHeight }}>
                      <div className="relative shrink-0" style={{ width: displayWidth, height: displayHeight }}>
                        <canvas ref={previewRef} width={imageSize.previewWidth} height={imageSize.previewHeight} style={{ width: displayWidth, height: displayHeight }} className="block select-none rounded-lg shadow-soft" aria-label={showOriginal ? "Original image preview" : "Edited image preview"} />
                        <canvas
                          ref={maskRef}
                          width={imageSize.previewWidth}
                          height={imageSize.previewHeight}
                          style={{ width: displayWidth, height: displayHeight }}
                          className={`absolute inset-0 touch-none ${showOriginal || processing ? "pointer-events-none opacity-0" : panMode ? "cursor-grab active:cursor-grabbing" : "cursor-none"}`}
                          onPointerDown={onPointerDown}
                          onPointerMove={onPointerMove}
                          onPointerUp={finishStroke}
                          onPointerCancel={finishStroke}
                          onPointerLeave={() => setCursor(null)}
                          aria-label="Brush over the watermark to select it"
                        />
                        {cloneSource && mode === "clone" && !showOriginal && (
                          <span className="pointer-events-none absolute z-10 flex h-5 w-5 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-white bg-sky-500 text-[10px] font-bold text-white shadow" style={{ left: `${cloneSource.x * 100}%`, top: `${cloneSource.y * 100}%` }}>+</span>
                        )}
                        {cursor && !showOriginal && !pickingSource && !panMode && (
                          <span className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white shadow-[0_0_0_1px_rgba(15,23,42,0.8)]" style={{ left: `${cursor.x * 100}%`, top: `${cursor.y * 100}%`, width: brushSize, height: brushSize }} />
                        )}
                        {pickingSource && <div className="pointer-events-none absolute inset-x-0 top-3 mx-auto w-fit rounded-full bg-slate-900/85 px-3 py-1.5 text-xs font-semibold text-white shadow">Click a clean area to copy from</div>}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 px-4 py-3 sm:px-5">
              <p className="text-xs text-slate-500">{showOriginal ? "Original preview" : "Brush over the mark; the red overlay shows what will change."}</p>
              <div className="flex flex-wrap items-center gap-2">
                <Button variant="outline" size="sm" onClick={undo} disabled={!canUndo || busy}><Undo2 className="h-4 w-4" /> Undo</Button>
                <Button variant="outline" size="sm" onClick={redo} disabled={!canRedo || busy}><Redo2 className="h-4 w-4" /> Redo</Button>
                <Button variant="ghost" size="sm" onClick={reset} disabled={!historyIndex || busy}><RotateCcw className="h-4 w-4" /> Reset</Button>
              </div>
            </div>
          </>
        )}
      </div>

      {file && (
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-soft sm:p-5">
            <div className="flex items-center gap-2"><Brush className="h-5 w-5 text-ink" /><h2 className="font-display text-lg font-bold text-ink">Choose how to fill the mark</h2></div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <button type="button" onClick={() => { setMode("heal"); setPickingSource(false); }} aria-pressed={mode === "heal"} className={`rounded-2xl border p-4 text-left transition ${mode === "heal" ? "border-ink bg-img-soft ring-1 ring-ink/10" : "border-slate-200 hover:bg-slate-50"}`}>
                <span className="flex items-center gap-2 text-sm font-bold text-ink"><Eraser className="h-4 w-4" /> Smart fill</span>
                <span className="mt-1.5 block text-xs leading-relaxed text-slate-600">Fills a small mark by extending nearby colors. Best for smooth areas and small marks.</span>
              </button>
              <button type="button" onClick={() => { setMode("clone"); setPickingSource(false); }} aria-pressed={mode === "clone"} className={`rounded-2xl border p-4 text-left transition ${mode === "clone" ? "border-ink bg-img-soft ring-1 ring-ink/10" : "border-slate-200 hover:bg-slate-50"}`}>
                <span className="flex items-center gap-2 text-sm font-bold text-ink"><CopyIcon /> Clone from nearby</span>
                <span className="mt-1.5 block text-xs leading-relaxed text-slate-600">Copies texture from a clean spot. Use this for fabric, grass, walls, or detailed backgrounds.</span>
              </button>
            </div>
            {mode === "clone" && <div className="mt-3 flex flex-wrap items-center gap-2 rounded-xl bg-slate-50 p-3 text-xs text-slate-600"><Button size="sm" variant={pickingSource ? "primary" : "outline"} onClick={() => setPickingSource(true)} disabled={busy}>{pickingSource ? "Click the image…" : "Pick clean source"}</Button><span>{cloneSource ? "Source set. Paint over the watermark." : "Choose an unmarked area close to the watermark."}</span>{cloneSource && <Button variant="ghost" size="sm" className="ml-auto" onClick={() => setCloneSource(null)}><X className="h-3.5 w-3.5" /> Clear source</Button>}</div>}
            <label className="mt-5 block text-xs font-semibold text-slate-700">Brush size <span className="float-right tabular-nums text-slate-500">{brushSize} px</span><input type="range" min={12} max={72} value={brushSize} onChange={(event) => setBrushSize(Number(event.target.value))} className={`${RANGE_CLASS} mt-2`} disabled={busy || showOriginal} aria-label="Brush size" /></label>
            <div className="mt-5 flex flex-wrap gap-2">
              <Button onClick={() => void applySelection()} disabled={busy || showOriginal || !strokes.length || (mode === "clone" && !cloneSource)}>{processing ? <><Loader2 className="h-4 w-4 animate-spin" /> Working…</> : <><Eraser className="h-4 w-4" /> Remove mark</>}</Button>
              <Button variant="outline" onClick={() => { setStrokes([]); strokesRef.current = []; setError(""); }} disabled={busy || !strokes.length}><RotateCcw className="h-4 w-4" /> Clear selection</Button>
              {historyIndex > 0 && <Button variant="outline" onClick={() => void download()} disabled={busy || downloading}>{downloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />} Download PNG</Button>}
            </div>
            <p className="mt-4 flex items-start gap-2 rounded-xl bg-amber-50 p-3 text-xs leading-relaxed text-amber-900"><CircleHelp className="mt-0.5 h-4 w-4 shrink-0" />Smart fill works best on small marks and smooth backgrounds. For detailed texture, Clone gives you control over what is copied. Always compare the result at full size.</p>
          </div>
          <aside className="rounded-3xl border border-slate-200 bg-white p-4 shadow-soft sm:p-5">
            <div className="flex items-center gap-2"><Check className="h-5 w-5 text-emerald-600" /><h2 className="font-display text-lg font-bold text-ink">Full-size PNG export</h2></div>
            <p className="mt-3 text-sm leading-relaxed text-slate-600">The download keeps the image&apos;s {imageSize?.width.toLocaleString()} × {imageSize?.height.toLocaleString()} pixel dimensions. Unselected pixels are kept as decoded; the edited areas are saved in lossless PNG.</p>
            <p className="mt-3 rounded-xl bg-slate-50 p-3 text-xs leading-relaxed text-slate-600">PNG may be larger than the original JPG or WebP. Image metadata such as camera details is not copied into the edited file.</p>
            <Button className="mt-4 w-full" onClick={() => void download()} disabled={busy || downloading || historyIndex === 0}>{downloading ? <><Loader2 className="h-4 w-4 animate-spin" /> Creating PNG…</> : <><Download className="h-4 w-4" /> Download full-size PNG</>}</Button>
            {historyIndex > 0 && <Button className="mt-2 w-full" variant="ghost" onClick={reset} disabled={busy}><Trash2 className="h-4 w-4" /> Start over</Button>}
          </aside>
        </div>
      )}

      {error && <div role="alert" className="flex items-start gap-2 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800"><X className="mt-0.5 h-4 w-4 shrink-0" /><span>{error}</span></div>}
      {notice && !error && <div role="status" className="rounded-2xl border border-slate-200 bg-white p-3 text-sm text-slate-600">{notice}</div>}
      <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp,image/bmp" className="hidden" onChange={(event) => { const chosen = event.currentTarget.files?.[0]; if (chosen) void loadFile(chosen); }} />
    </section>
  );
}

function CopyIcon() {
  return <span aria-hidden="true" className="inline-flex h-4 w-4 items-center justify-center text-[13px] font-black">⧉</span>;
}
