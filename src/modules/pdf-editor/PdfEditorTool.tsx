"use client";

import * as React from "react";
import type { PDFDocumentProxy } from "pdfjs-dist";
import { getPdfjs } from "@/modules/pdf/render";
import {
  Annotation,
  TextAnnotation,
  DrawAnnotation,
  HighlightAnnotation,
  WhiteoutAnnotation,
  ShapeAnnotation,
  ImageAnnotation,
  ToolMode,
  newAnnotationId,
  createDefaultTextAnnotation,
  createDefaultWhiteout,
  createDefaultHighlight,
  createDefaultShape,
  exportPdfWithAnnotations,
} from "./engine";
import { SignatureDialog } from "./SignatureDialog";
import { Button } from "@/components/ui/Button";
import {
  UploadCloud,
  Download,
  FileText,
  RotateCcw,
  RotateCw,
  Undo2,
  Redo2,
  Trash2,
  ZoomIn,
  ZoomOut,
  Maximize2,
  ChevronLeft,
  ChevronRight,
  MousePointer,
  Type,
  PenTool,
  Highlighter,
  Eraser,
  Square,
  Circle,
  Image as ImageIcon,
  CheckCircle2,
  Loader2,
  ShieldCheck,
  Sparkles,
  Layers,
  X,
  Plus,
} from "lucide-react";

const COLOR_PRESETS = [
  { id: "#16141F", label: "Black" },
  { id: "#E11D48", label: "Red" },
  { id: "#2563EB", label: "Blue" },
  { id: "#16A34A", label: "Green" },
  { id: "#D97706", label: "Amber" },
  { id: "#9333EA", label: "Purple" },
  { id: "#FFFFFF", label: "White" },
];

const HIGHLIGHT_COLORS = [
  { id: "#FACC15", label: "Yellow" },
  { id: "#4ADE80", label: "Green" },
  { id: "#60A5FA", label: "Blue" },
  { id: "#F472B6", label: "Pink" },
];

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

export function PdfEditorTool() {
  const [file, setFile] = React.useState<File | null>(null);
  const [pdfBytes, setPdfBytes] = React.useState<Uint8Array | null>(null);
  const [pdfDoc, setPdfDoc] = React.useState<PDFDocumentProxy | null>(null);
  const [totalPages, setTotalPages] = React.useState<number>(0);
  const [currentPage, setCurrentPage] = React.useState<number>(1); // 1-based for UI
  const [pageThumbs, setPageThumbs] = React.useState<Record<number, string>>({});
  const [showThumbnails, setShowThumbnails] = React.useState<boolean>(false);
  const [zoomScale, setZoomScale] = React.useState<number>(1.2);
  const [isRenderingPage, setIsRenderingPage] = React.useState<boolean>(false);
  const [isExporting, setIsExporting] = React.useState<boolean>(false);
  const [exportSuccess, setExportSuccess] = React.useState<boolean>(false);

  // Active Tool Mode
  const [activeTool, setActiveTool] = React.useState<ToolMode>("select");

  // Tool Specific Options
  const [textColor, setTextColor] = React.useState<string>("#16141F");
  const [fontSize, setFontSize] = React.useState<number>(16);
  const [fontFamily, setFontFamily] = React.useState<"Helvetica" | "Times" | "Courier">("Helvetica");
  const [isBold, setIsBold] = React.useState<boolean>(false);

  const [drawColor, setDrawColor] = React.useState<string>("#E11D48");
  const [strokeWidth, setStrokeWidth] = React.useState<number>(3);

  const [highlightColor, setHighlightColor] = React.useState<string>("#FACC15");
  const [shapeColor, setShapeColor] = React.useState<string>("#E11D48");

  // Annotations and Undo/Redo
  const [annotations, setAnnotations] = React.useState<Annotation[]>([]);
  const [history, setHistory] = React.useState<Annotation[][]>([[]]);
  const [historyIndex, setHistoryIndex] = React.useState<number>(0);

  // Selected annotation on current page
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [isSignatureModalOpen, setIsSignatureModalOpen] = React.useState<boolean>(false);

  // Canvas and interaction refs
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const overlayRef = React.useRef<HTMLDivElement | null>(null);
  const imageInputRef = React.useRef<HTMLInputElement | null>(null);
  const renderTaskRef = React.useRef<any>(null);

  // Dragging / drawing temp state
  const isInteracting = React.useRef(false);
  const dragStartPos = React.useRef<{ x: number; y: number } | null>(null);
  const currentDrawPoints = React.useRef<{ normX: number; normY: number }[]>([]);
  const [liveDrawing, setLiveDrawing] = React.useState<{ normX: number; normY: number }[] | null>(null);
  const [liveBox, setLiveBox] = React.useState<{ normX: number; normY: number; normW: number; normH: number } | null>(null);

  // Dragging an existing annotation
  const draggingAnnotation = React.useRef<{
    id: string;
    initialNormX: number;
    initialNormY: number;
    startClientX: number;
    startClientY: number;
  } | null>(null);

  // Push new state to undo/redo history
  const pushHistory = React.useCallback(
    (newAnnotations: Annotation[]) => {
      setHistory((prev) => {
        const next = prev.slice(0, historyIndex + 1);
        return [...next, newAnnotations];
      });
      setHistoryIndex((prev) => prev + 1);
      setAnnotations(newAnnotations);
    },
    [historyIndex]
  );

  const handleUndo = React.useCallback(() => {
    if (historyIndex > 0) {
      const nextIndex = historyIndex - 1;
      setHistoryIndex(nextIndex);
      setAnnotations(history[nextIndex] || []);
      setSelectedId(null);
    }
  }, [historyIndex, history]);

  const handleRedo = React.useCallback(() => {
    if (historyIndex < history.length - 1) {
      const nextIndex = historyIndex + 1;
      setHistoryIndex(nextIndex);
      setAnnotations(history[nextIndex] || []);
      setSelectedId(null);
    }
  }, [historyIndex, history]);

  // Load PDF file
  const handleFileUpload = async (uploadedFile: File) => {
    if (!uploadedFile.name.toLowerCase().endsWith(".pdf")) {
      alert("Please upload a valid PDF document.");
      return;
    }

    try {
      const arrayBuffer = await uploadedFile.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      setPdfBytes(bytes);
      setFile(uploadedFile);
      setAnnotations([]);
      setHistory([[]]);
      setHistoryIndex(0);
      setSelectedId(null);
      setCurrentPage(1);

      const pdfjs = await getPdfjs();
      const loaded = await pdfjs.getDocument({
        data: bytes.slice(),
        isEvalSupported: false,
      }).promise;

      setPdfDoc(loaded);
      setTotalPages(loaded.numPages);

      // Generate thumbnails in background
      const thumbs: Record<number, string> = {};
      for (let p = 1; p <= loaded.numPages; p++) {
        const page = await loaded.getPage(p);
        const vp = page.getViewport({ scale: 0.25 });
        const thumbCanvas = document.createElement("canvas");
        thumbCanvas.width = Math.ceil(vp.width);
        thumbCanvas.height = Math.ceil(vp.height);
        const tCtx = thumbCanvas.getContext("2d")!;
        tCtx.fillStyle = "#ffffff";
        tCtx.fillRect(0, 0, thumbCanvas.width, thumbCanvas.height);
        await page.render({ canvasContext: tCtx, viewport: vp }).promise;
        page.cleanup();
        thumbCanvas.toBlob((blob) => {
          if (blob) {
            thumbs[p] = URL.createObjectURL(blob);
            setPageThumbs((prev) => ({ ...prev, [p]: thumbs[p]! }));
          }
        }, "image/jpeg", 0.7);
      }
    } catch (err) {
      console.error("Error loading PDF:", err);
      alert("Failed to load PDF file. The file may be password protected or corrupted.");
    }
  };

  // Render current page onto canvas
  React.useEffect(() => {
    let isCancelled = false;

    async function renderPage() {
      if (!pdfDoc || !canvasRef.current) return;

      if (renderTaskRef.current) {
        try {
          renderTaskRef.current.cancel();
        } catch {
          // ignore
        }
      }

      setIsRenderingPage(true);
      try {
        const page = await pdfDoc.getPage(currentPage);
        if (isCancelled) return;

        const viewport = page.getViewport({ scale: zoomScale });
        const canvas = canvasRef.current;
        if (!canvas) return;

        const dpr = typeof window !== "undefined" ? Math.min(2, window.devicePixelRatio || 1) : 1;
        canvas.width = Math.ceil(viewport.width * dpr);
        canvas.height = Math.ceil(viewport.height * dpr);
        canvas.style.width = `${Math.ceil(viewport.width)}px`;
        canvas.style.height = `${Math.ceil(viewport.height)}px`;

        if (overlayRef.current) {
          overlayRef.current.style.width = `${Math.ceil(viewport.width)}px`;
          overlayRef.current.style.height = `${Math.ceil(viewport.height)}px`;
        }

        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, viewport.width, viewport.height);

        const renderTask = page.render({
          canvasContext: ctx,
          viewport,
        });
        renderTaskRef.current = renderTask;

        await renderTask.promise;
      } catch (err: any) {
        if (err?.name !== "RenderingCancelledException") {
          console.error("Render page error:", err);
        }
      } finally {
        if (!isCancelled) {
          setIsRenderingPage(false);
        }
      }
    }

    renderPage();

    return () => {
      isCancelled = true;
    };
  }, [pdfDoc, currentPage, zoomScale]);

  // Clean up thumbnails on unmount
  React.useEffect(() => {
    return () => {
      Object.values(pageThumbs).forEach((u) => URL.revokeObjectURL(u));
    };
  }, [pageThumbs]);

  // Keyboard shortcuts
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = (document.activeElement?.tagName || "").toLowerCase();
      if (activeTag === "input" || activeTag === "textarea") return;

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
        if (e.shiftKey) {
          handleRedo();
        } else {
          handleUndo();
        }
        e.preventDefault();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "y") {
        handleRedo();
        e.preventDefault();
      } else if (e.key === "Delete" || e.key === "Backspace") {
        if (selectedId) {
          pushHistory(annotations.filter((a) => a.id !== selectedId));
          setSelectedId(null);
          e.preventDefault();
        }
      } else if (e.key === "ArrowLeft") {
        if (currentPage > 1) setCurrentPage((p) => p - 1);
      } else if (e.key === "ArrowRight") {
        if (currentPage < totalPages) setCurrentPage((p) => p + 1);
      } else if (e.key === "Escape") {
        setSelectedId(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedId, annotations, currentPage, totalPages, handleUndo, handleRedo, pushHistory]);

  // Pointer event coordinate converter (relative to page overlay 0 to 1)
  const getNormalizedCoords = (e: React.PointerEvent<HTMLDivElement>) => {
    const overlay = overlayRef.current;
    if (!overlay) return { normX: 0, normY: 0 };
    const rect = overlay.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const normX = Math.max(0, Math.min(1, x / rect.width));
    const normY = Math.max(0, Math.min(1, y / rect.height));
    return { normX, normY };
  };

  // Overlay Pointer Down
  const handleOverlayPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return; // only left click
    const { normX, normY } = getNormalizedCoords(e);
    const pageIndex = currentPage - 1;

    if (activeTool === "select") {
      // If clicked empty area, deselect
      setSelectedId(null);
      return;
    }

    if (activeTool === "text") {
      const newText: TextAnnotation = {
        ...createDefaultTextAnnotation(pageIndex, normX, normY, "Type text here"),
        fontSize,
        color: textColor,
        fontFamily,
        isBold,
      };
      pushHistory([...annotations, newText]);
      setSelectedId(newText.id);
      setActiveTool("select");
      return;
    }

    // Start drawing
    if (activeTool === "draw") {
      isInteracting.current = true;
      currentDrawPoints.current = [{ normX, normY }];
      setLiveDrawing([{ normX, normY }]);
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      return;
    }

    // Start drag box tools (highlight, whiteout, rect, circle)
    if (
      activeTool === "highlight" ||
      activeTool === "whiteout" ||
      activeTool === "rect" ||
      activeTool === "circle"
    ) {
      isInteracting.current = true;
      dragStartPos.current = { x: normX, y: normY };
      setLiveBox({ normX, normY, normW: 0, normH: 0 });
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      return;
    }
  };

  // Overlay Pointer Move
  const handleOverlayPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isInteracting.current) return;
    const { normX, normY } = getNormalizedCoords(e);

    if (activeTool === "draw") {
      currentDrawPoints.current.push({ normX, normY });
      setLiveDrawing([...currentDrawPoints.current]);
      return;
    }

    if (dragStartPos.current) {
      const startX = dragStartPos.current.x;
      const startY = dragStartPos.current.y;
      const boxX = Math.min(startX, normX);
      const boxY = Math.min(startY, normY);
      const boxW = Math.abs(normX - startX);
      const boxH = Math.abs(normY - startY);
      setLiveBox({ normX: boxX, normY: boxY, normW: boxW, normH: boxH });
    }
  };

  // Overlay Pointer Up
  const handleOverlayPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isInteracting.current) return;
    isInteracting.current = false;
    const pageIndex = currentPage - 1;

    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }

    if (activeTool === "draw") {
      const points = currentDrawPoints.current;
      setLiveDrawing(null);
      currentDrawPoints.current = [];

      if (points.length >= 2) {
        const newDraw: DrawAnnotation = {
          id: newAnnotationId("drw"),
          pageIndex,
          type: "draw",
          points,
          color: drawColor,
          strokeWidth,
        };
        pushHistory([...annotations, newDraw]);
      }
      return;
    }

    if (liveBox && (liveBox.normW > 0.01 || liveBox.normH > 0.01)) {
      if (activeTool === "highlight") {
        const newHl: HighlightAnnotation = {
          id: newAnnotationId("hl"),
          pageIndex,
          type: "highlight",
          normX: liveBox.normX,
          normY: liveBox.normY,
          normW: Math.max(0.01, liveBox.normW),
          normH: Math.max(0.01, liveBox.normH),
          color: highlightColor,
          opacity: 0.35,
        };
        pushHistory([...annotations, newHl]);
      } else if (activeTool === "whiteout") {
        const newWo: WhiteoutAnnotation = {
          id: newAnnotationId("wo"),
          pageIndex,
          type: "whiteout",
          normX: liveBox.normX,
          normY: liveBox.normY,
          normW: Math.max(0.01, liveBox.normW),
          normH: Math.max(0.01, liveBox.normH),
        };
        pushHistory([...annotations, newWo]);
      } else if (activeTool === "rect" || activeTool === "circle") {
        const newShape: ShapeAnnotation = {
          id: newAnnotationId("shp"),
          pageIndex,
          type: activeTool,
          normX: liveBox.normX,
          normY: liveBox.normY,
          normW: Math.max(0.01, liveBox.normW),
          normH: Math.max(0.01, liveBox.normH),
          strokeColor: shapeColor,
          strokeWidth,
        };
        pushHistory([...annotations, newShape]);
      }
    }

    setLiveBox(null);
    dragStartPos.current = null;
  };

  // Insert signature
  const handleInsertSignature = (dataUrl: string) => {
    const pageIndex = currentPage - 1;
    const newSig: ImageAnnotation = {
      id: newAnnotationId("sig"),
      pageIndex,
      type: "signature",
      normX: 0.35,
      normY: 0.75,
      normW: 0.3,
      normH: 0.1,
      dataUrl,
    };
    pushHistory([...annotations, newSig]);
    setSelectedId(newSig.id);
    setActiveTool("select");
  };

  // Upload and insert custom stamp/image
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (!dataUrl) return;

      const pageIndex = currentPage - 1;
      const newImg: ImageAnnotation = {
        id: newAnnotationId("img"),
        pageIndex,
        type: "image",
        normX: 0.35,
        normY: 0.4,
        normW: 0.25,
        normH: 0.18,
        dataUrl,
      };
      pushHistory([...annotations, newImg]);
      setSelectedId(newImg.id);
      setActiveTool("select");
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  // Export & Download edited PDF
  const handleExportPdf = async () => {
    if (!pdfBytes) return;

    setIsExporting(true);
    setExportSuccess(false);

    try {
      const editedBytes = await exportPdfWithAnnotations(pdfBytes, annotations);
      const originalName = file?.name || "document.pdf";
      const cleanName = originalName.replace(/\.pdf$/i, "");
      const downloadFilename = `${cleanName}-edited.pdf`;

      const blob = new Blob([editedBytes as BlobPart], { type: "application/pdf" });
      downloadBlob(blob, downloadFilename);
      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 5000);
    } catch (err) {
      console.error("Export PDF failed:", err);
      alert("Failed to export edited PDF. Please check your annotations.");
    } finally {
      setIsExporting(false);
    }
  };

  // Active page annotations
  const currentPageIndex = currentPage - 1;
  const pageAnnotations = annotations.filter((a) => a.pageIndex === currentPageIndex);
  const selectedAnnotation = annotations.find((a) => a.id === selectedId);

  return (
    <div className="w-full flex flex-col gap-4">
      {/* Upload Dropzone (When no file is loaded) */}
      {!file && (
        <div className="w-full p-8 md:p-12 border-2 border-dashed border-border hover:border-amber-500/60 transition-colors rounded-3xl bg-card/60 backdrop-blur text-center flex flex-col items-center justify-center gap-4 relative overflow-hidden group">
          <div className="w-20 h-20 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 group-hover:scale-105 transition-transform duration-300">
            <UploadCloud className="w-10 h-10" />
          </div>

          <div className="space-y-1.5 max-w-md">
            <h3 className="text-xl font-bold tracking-tight text-foreground">
              Choose or Drop a PDF File to Edit
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Add text, signatures, highlights, drawings, shapes, and whiteout redactions directly in your browser.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
            <label className="cursor-pointer">
              <input
                type="file"
                accept=".pdf,application/pdf"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleFileUpload(f);
                }}
              />
              <span className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-black font-semibold shadow-lg shadow-amber-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]">
                <FileText className="w-4 h-4" />
                Select PDF File
              </span>
            </label>
          </div>

          {/* Privacy & Safety Badge */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-4 pt-4 border-t border-border/40">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>100% Client-Side Privacy: Your document is processed locally in your browser and never uploaded.</span>
          </div>
        </div>
      )}

      {/* Editor Interface (When PDF is loaded) */}
      {file && (
        <div className="w-full flex flex-col gap-3">
          {/* Top Control Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl border border-border bg-card/80 backdrop-blur-md shadow-sm">
            {/* Left: File info & page navigation */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowThumbnails((v) => !v)}
                className={`p-2 rounded-xl border transition-colors ${
                  showThumbnails
                    ? "bg-amber-500/10 border-amber-500/40 text-amber-600 dark:text-amber-400"
                    : "border-border hover:bg-muted text-muted-foreground"
                }`}
                title="Toggle page thumbnails"
              >
                <Layers className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-xl border border-border/50">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage <= 1}
                  className="p-1 rounded-lg text-muted-foreground hover:text-foreground disabled:opacity-40 disabled:hover:text-muted-foreground transition-colors"
                  title="Previous Page (ArrowLeft)"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-xs font-medium px-2 min-w-[75px] text-center">
                  {currentPage} / {totalPages || 1}
                </span>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage >= totalPages}
                  className="p-1 rounded-lg text-muted-foreground hover:text-foreground disabled:opacity-40 disabled:hover:text-muted-foreground transition-colors"
                  title="Next Page (ArrowRight)"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Zoom Controls */}
              <div className="hidden sm:flex items-center gap-1 bg-muted/60 p-1 rounded-xl border border-border/50">
                <button
                  onClick={() => setZoomScale((s) => Math.max(0.6, s - 0.2))}
                  className="p-1 rounded-lg text-muted-foreground hover:text-foreground transition-colors"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <span className="text-xs font-medium px-2 min-w-[45px] text-center">
                  {Math.round(zoomScale * 100)}%
                </span>
                <button
                  onClick={() => setZoomScale((s) => Math.min(2.5, s + 0.2))}
                  className="p-1 rounded-lg text-muted-foreground hover:text-foreground transition-colors"
                  title="Zoom In"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setZoomScale(1.0)}
                  className="p-1 rounded-lg text-muted-foreground hover:text-foreground transition-colors"
                  title="Reset Zoom (100%)"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Middle: Undo / Redo & Clear */}
            <div className="flex items-center gap-1">
              <button
                onClick={handleUndo}
                disabled={historyIndex <= 0}
                className="p-2 rounded-xl border border-border hover:bg-muted text-muted-foreground hover:text-foreground disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
                title="Undo (Ctrl+Z)"
              >
                <Undo2 className="w-4 h-4" />
              </button>
              <button
                onClick={handleRedo}
                disabled={historyIndex >= history.length - 1}
                className="p-2 rounded-xl border border-border hover:bg-muted text-muted-foreground hover:text-foreground disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
                title="Redo (Ctrl+Y)"
              >
                <Redo2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  if (confirm("Reset and clear all annotations on this document?")) {
                    pushHistory([]);
                    setSelectedId(null);
                  }
                }}
                disabled={annotations.length === 0}
                className="p-2 rounded-xl border border-border hover:bg-red-500/10 hover:text-red-600 disabled:opacity-40 transition-colors"
                title="Clear all annotations"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>

            {/* Right: Change Document & Download Edited PDF */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  if (confirm("Close this PDF and upload a different document?")) {
                    setFile(null);
                    setPdfBytes(null);
                    setPdfDoc(null);
                    setAnnotations([]);
                  }
                }}
                className="px-3 py-2 rounded-xl border border-border hover:bg-muted text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Change PDF
              </button>

              <Button
                onClick={handleExportPdf}
                disabled={isExporting}
                size="sm"
                className="bg-amber-500 hover:bg-amber-600 text-black font-semibold shadow-md shadow-amber-500/20"
              >
                {isExporting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                    Generating PDF...
                  </>
                ) : exportSuccess ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 mr-1.5 text-emerald-950" />
                    Downloaded!
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-1.5" />
                    Download PDF
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Tools Ribbon */}
          <div className="flex flex-col gap-2 p-3 rounded-2xl border border-border bg-card/60 backdrop-blur-sm">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {[
                { id: "select", label: "Select", icon: MousePointer },
                { id: "text", label: "Text", icon: Type },
                { id: "draw", label: "Draw", icon: PenTool },
                { id: "highlight", label: "Highlight", icon: Highlighter },
                { id: "whiteout", label: "Whiteout", icon: Eraser },
                { id: "rect", label: "Rectangle", icon: Square },
                { id: "circle", label: "Circle", icon: Circle },
              ].map((tool) => {
                const Icon = tool.icon;
                const isActive = activeTool === tool.id;
                return (
                  <button
                    key={tool.id}
                    onClick={() => {
                      setActiveTool(tool.id as ToolMode);
                      if (tool.id !== "select") setSelectedId(null);
                    }}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
                      isActive
                        ? "bg-amber-500 text-black font-semibold shadow-sm"
                        : "border border-border/80 hover:bg-muted text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{tool.label}</span>
                  </button>
                );
              })}

              <div className="h-5 w-[1px] bg-border mx-1" />

              {/* Signature Action */}
              <button
                onClick={() => setIsSignatureModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium border border-border/80 hover:border-amber-500/50 hover:bg-amber-500/10 text-foreground transition-all whitespace-nowrap"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Add Signature</span>
              </button>

              {/* Insert Stamp / Image Action */}
              <label className="cursor-pointer">
                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={handleImageFileChange}
                />
                <span className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium border border-border/80 hover:border-amber-500/50 hover:bg-amber-500/10 text-foreground transition-all whitespace-nowrap">
                  <ImageIcon className="w-3.5 h-3.5 text-amber-500" />
                  <span>Insert Image</span>
                </span>
              </label>
            </div>

            {/* Contextual Properties Bar */}
            <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-border/40 text-xs">
              {/* Text Tool Options */}
              {(activeTool === "text" || (selectedAnnotation && selectedAnnotation.type === "text")) && (
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-1">
                    <span className="text-muted-foreground">Size:</span>
                    <select
                      value={
                        selectedAnnotation && selectedAnnotation.type === "text"
                          ? selectedAnnotation.fontSize
                          : fontSize
                      }
                      onChange={(e) => {
                        const newSz = parseInt(e.target.value, 10);
                        setFontSize(newSz);
                        if (selectedAnnotation && selectedAnnotation.type === "text") {
                          pushHistory(
                            annotations.map((a) =>
                              a.id === selectedAnnotation.id ? { ...a, fontSize: newSz } : a
                            )
                          );
                        }
                      }}
                      className="bg-muted px-2 py-1 rounded-lg border border-border text-xs focus:outline-none"
                    >
                      {[10, 12, 14, 16, 18, 20, 24, 28, 36, 48].map((s) => (
                        <option key={s} value={s}>
                          {s} pt
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center gap-1">
                    <span className="text-muted-foreground">Font:</span>
                    <select
                      value={
                        selectedAnnotation && selectedAnnotation.type === "text"
                          ? selectedAnnotation.fontFamily
                          : fontFamily
                      }
                      onChange={(e) => {
                        const fam = e.target.value as any;
                        setFontFamily(fam);
                        if (selectedAnnotation && selectedAnnotation.type === "text") {
                          pushHistory(
                            annotations.map((a) =>
                              a.id === selectedAnnotation.id ? { ...a, fontFamily: fam } : a
                            )
                          );
                        }
                      }}
                      className="bg-muted px-2 py-1 rounded-lg border border-border text-xs focus:outline-none"
                    >
                      <option value="Helvetica">Helvetica (Sans)</option>
                      <option value="Times">Times (Serif)</option>
                      <option value="Courier">Courier (Mono)</option>
                    </select>
                  </div>

                  <button
                    onClick={() => {
                      const nextBold = !isBold;
                      setIsBold(nextBold);
                      if (selectedAnnotation && selectedAnnotation.type === "text") {
                        pushHistory(
                          annotations.map((a) =>
                            a.id === selectedAnnotation.id ? { ...a, isBold: nextBold } : a
                          )
                        );
                      }
                    }}
                    className={`px-2 py-1 rounded-lg border text-xs font-bold transition-colors ${
                      isBold ? "bg-amber-500/20 border-amber-500 text-foreground" : "border-border text-muted-foreground"
                    }`}
                  >
                    B
                  </button>

                  <div className="flex items-center gap-1.5 pl-2 border-l border-border/50">
                    <span className="text-muted-foreground">Color:</span>
                    {COLOR_PRESETS.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => {
                          setTextColor(c.id);
                          if (selectedAnnotation && selectedAnnotation.type === "text") {
                            pushHistory(
                              annotations.map((a) =>
                                a.id === selectedAnnotation.id ? { ...a, color: c.id } : a
                              )
                            );
                          }
                        }}
                        className={`w-5 h-5 rounded-full border transition-transform ${
                          textColor === c.id ? "scale-125 border-foreground shadow" : "border-border"
                        }`}
                        style={{ backgroundColor: c.id }}
                        title={c.label}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Draw Tool Options */}
              {activeTool === "draw" && (
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <span className="text-muted-foreground">Stroke:</span>
                    {[2, 3, 5, 8].map((w) => (
                      <button
                        key={w}
                        onClick={() => setStrokeWidth(w)}
                        className={`px-2 py-0.5 rounded border text-xs ${
                          strokeWidth === w ? "bg-amber-500/20 border-amber-500 font-bold" : "border-border text-muted-foreground"
                        }`}
                      >
                        {w}px
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center gap-1.5 pl-2 border-l border-border/50">
                    <span className="text-muted-foreground">Ink:</span>
                    {COLOR_PRESETS.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => setDrawColor(c.id)}
                        className={`w-5 h-5 rounded-full border transition-transform ${
                          drawColor === c.id ? "scale-125 border-foreground shadow" : "border-border"
                        }`}
                        style={{ backgroundColor: c.id }}
                        title={c.label}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Highlight Tool Options */}
              {activeTool === "highlight" && (
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Highlighter color:</span>
                  {HIGHLIGHT_COLORS.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => setHighlightColor(c.id)}
                      className={`w-5 h-5 rounded-full border transition-transform ${
                        highlightColor === c.id ? "scale-125 border-foreground shadow" : "border-border"
                      }`}
                      style={{ backgroundColor: c.id }}
                      title={c.label}
                    />
                  ))}
                  <span className="text-[11px] text-muted-foreground/80 pl-2">
                    Tip: Click and drag across any text area to highlight.
                  </span>
                </div>
              )}

              {/* Whiteout Info */}
              {activeTool === "whiteout" && (
                <div className="text-muted-foreground text-xs flex items-center gap-2">
                  <Eraser className="w-3.5 h-3.5 text-amber-500" />
                  <span>Click and drag over sensitive text or details to redact them cleanly with whiteout.</span>
                </div>
              )}

              {/* Shape Tool Options */}
              {(activeTool === "rect" || activeTool === "circle") && (
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <span className="text-muted-foreground">Border color:</span>
                    {COLOR_PRESETS.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => setShapeColor(c.id)}
                        className={`w-5 h-5 rounded-full border transition-transform ${
                          shapeColor === c.id ? "scale-125 border-foreground shadow" : "border-border"
                        }`}
                        style={{ backgroundColor: c.id }}
                        title={c.label}
                      />
                    ))}
                  </div>
                  <span className="text-[11px] text-muted-foreground/80 pl-2">
                    Tip: Click and drag on the page to draw shape.
                  </span>
                </div>
              )}

              {/* Delete Active Annotation Button */}
              {selectedAnnotation && (
                <div className="ml-auto flex items-center gap-2">
                  <button
                    onClick={() => {
                      pushHistory(annotations.filter((a) => a.id !== selectedAnnotation.id));
                      setSelectedId(null);
                    }}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-500/10 text-red-600 hover:bg-red-500/20 transition-colors font-medium text-xs"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete Element
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Main Document Workspace */}
          <div className="relative w-full flex items-start gap-4 min-h-[600px] max-h-[85vh] overflow-hidden rounded-2xl border border-border bg-muted/20 p-2 md:p-4">
            {/* Left Thumbnails Drawer */}
            {showThumbnails && (
              <div className="w-48 shrink-0 flex flex-col gap-2 p-2 bg-card/90 backdrop-blur rounded-xl border border-border max-h-[80vh] overflow-y-auto">
                <div className="flex items-center justify-between px-2 py-1 text-xs font-semibold text-muted-foreground border-b border-border/40">
                  <span>Pages ({totalPages})</span>
                  <button onClick={() => setShowThumbnails(false)} className="text-muted-foreground hover:text-foreground">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex flex-col gap-2">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((pNum) => {
                    const isSelected = pNum === currentPage;
                    const thumbUrl = pageThumbs[pNum];
                    return (
                      <button
                        key={pNum}
                        onClick={() => setCurrentPage(pNum)}
                        className={`flex flex-col items-center gap-1 p-2 rounded-lg border text-xs transition-all ${
                          isSelected
                            ? "border-amber-500 bg-amber-500/10 font-bold shadow-sm"
                            : "border-border/60 hover:border-border hover:bg-muted"
                        }`}
                      >
                        <div className="w-full aspect-[1/1.4] bg-white rounded border border-border overflow-hidden flex items-center justify-center">
                          {thumbUrl ? (
                            <img src={thumbUrl} alt={`Page ${pNum}`} className="w-full h-full object-contain" />
                          ) : (
                            <span className="text-[10px] text-muted-foreground">P.{pNum}</span>
                          )}
                        </div>
                        <span className="text-[11px]">Page {pNum}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Scrollable Canvas Viewport */}
            <div className="flex-1 w-full h-full overflow-auto flex items-center justify-center p-4">
              <div
                className="relative bg-white shadow-2xl rounded-sm transition-shadow select-none"
                style={{
                  cursor:
                    activeTool === "draw"
                      ? "crosshair"
                      : activeTool === "text"
                      ? "text"
                      : activeTool === "highlight" || activeTool === "whiteout" || activeTool === "rect" || activeTool === "circle"
                      ? "crosshair"
                      : "default",
                }}
              >
                {/* PDF Page Canvas */}
                <canvas ref={canvasRef} className="block shadow-md" />

                {/* Loading indicator */}
                {isRenderingPage && (
                  <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] flex items-center justify-center z-30">
                    <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-card border border-border shadow-lg text-xs font-medium">
                      <Loader2 className="w-4 h-4 animate-spin text-amber-500" />
                      Rendering Page...
                    </div>
                  </div>
                )}

                {/* Interactive Annotations Overlay */}
                <div
                  ref={overlayRef}
                  onPointerDown={handleOverlayPointerDown}
                  onPointerMove={handleOverlayPointerMove}
                  onPointerUp={handleOverlayPointerUp}
                  onPointerCancel={handleOverlayPointerUp}
                  className="absolute inset-0 z-20 touch-none overflow-hidden"
                >
                  {/* SVG Layer for Drawings, Highlights, Whiteouts, Shapes */}
                  <svg className="w-full h-full pointer-events-none absolute inset-0">
                    {/* Render Shapes (rect, circle) */}
                    {pageAnnotations
                      .filter((a): a is ShapeAnnotation => a.type === "rect" || a.type === "circle")
                      .map((shp) => {
                        const isSelected = selectedId === shp.id;
                        return (
                          <g key={shp.id} className="pointer-events-auto">
                            {shp.type === "rect" ? (
                              <rect
                                x={`${shp.normX * 100}%`}
                                y={`${shp.normY * 100}%`}
                                width={`${shp.normW * 100}%`}
                                height={`${shp.normH * 100}%`}
                                fill="transparent"
                                stroke={shp.strokeColor}
                                strokeWidth={shp.strokeWidth || 2}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedId(shp.id);
                                }}
                                className="cursor-pointer"
                              />
                            ) : (
                              <ellipse
                                cx={`${(shp.normX + shp.normW / 2) * 100}%`}
                                cy={`${(shp.normY + shp.normH / 2) * 100}%`}
                                rx={`${(shp.normW / 2) * 100}%`}
                                ry={`${(shp.normH / 2) * 100}%`}
                                fill="transparent"
                                stroke={shp.strokeColor}
                                strokeWidth={shp.strokeWidth || 2}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedId(shp.id);
                                }}
                                className="cursor-pointer"
                              />
                            )}
                            {isSelected && (
                              <rect
                                x={`${shp.normX * 100}%`}
                                y={`${shp.normY * 100}%`}
                                width={`${shp.normW * 100}%`}
                                height={`${shp.normH * 100}%`}
                                fill="transparent"
                                stroke="#3B82F6"
                                strokeWidth="2"
                                strokeDasharray="4 4"
                              />
                            )}
                          </g>
                        );
                      })}

                    {/* Render Highlights */}
                    {pageAnnotations
                      .filter((a): a is HighlightAnnotation => a.type === "highlight")
                      .map((hl) => {
                        const isSelected = selectedId === hl.id;
                        return (
                          <rect
                            key={hl.id}
                            x={`${hl.normX * 100}%`}
                            y={`${hl.normY * 100}%`}
                            width={`${hl.normW * 100}%`}
                            height={`${hl.normH * 100}%`}
                            fill={hl.color}
                            fillOpacity={hl.opacity || 0.35}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedId(hl.id);
                            }}
                            className="pointer-events-auto cursor-pointer"
                            stroke={isSelected ? "#3B82F6" : "none"}
                            strokeWidth={isSelected ? "2" : "0"}
                          />
                        );
                      })}

                    {/* Render Whiteout Redactions */}
                    {pageAnnotations
                      .filter((a): a is WhiteoutAnnotation => a.type === "whiteout")
                      .map((wo) => {
                        const isSelected = selectedId === wo.id;
                        return (
                          <rect
                            key={wo.id}
                            x={`${wo.normX * 100}%`}
                            y={`${wo.normY * 100}%`}
                            width={`${wo.normW * 100}%`}
                            height={`${wo.normH * 100}%`}
                            fill="#FFFFFF"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedId(wo.id);
                            }}
                            className="pointer-events-auto cursor-pointer"
                            stroke={isSelected ? "#3B82F6" : "#E2E8F0"}
                            strokeWidth="1"
                            strokeDasharray={isSelected ? "4 4" : "none"}
                          />
                        );
                      })}

                    {/* Render Freehand Drawings */}
                    {pageAnnotations
                      .filter((a): a is DrawAnnotation => a.type === "draw")
                      .map((drw) => {
                        if (drw.points.length < 2) return null;
                        const isSelected = selectedId === drw.id;
                        const pathData = drw.points.reduce((acc, pt, idx) => {
                          const x = `${pt.normX * 100}%`;
                          const y = `${pt.normY * 100}%`;
                          return idx === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
                        }, "");

                        return (
                          <path
                            key={drw.id}
                            d={pathData}
                            fill="none"
                            stroke={isSelected ? "#3B82F6" : drw.color}
                            strokeWidth={drw.strokeWidth || 3}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedId(drw.id);
                            }}
                            className="pointer-events-auto cursor-pointer"
                          />
                        );
                      })}

                    {/* Live Drawing Preview */}
                    {liveDrawing && liveDrawing.length > 1 && (
                      <path
                        d={liveDrawing.reduce((acc, pt, idx) => {
                          const x = `${pt.normX * 100}%`;
                          const y = `${pt.normY * 100}%`;
                          return idx === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
                        }, "")}
                        fill="none"
                        stroke={drawColor}
                        strokeWidth={strokeWidth}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    )}

                    {/* Live Box Selection Preview (Highlight / Whiteout / Shapes) */}
                    {liveBox && (
                      <rect
                        x={`${liveBox.normX * 100}%`}
                        y={`${liveBox.normY * 100}%`}
                        width={`${liveBox.normW * 100}%`}
                        height={`${liveBox.normH * 100}%`}
                        fill={
                          activeTool === "highlight"
                            ? highlightColor
                            : activeTool === "whiteout"
                            ? "#FFFFFF"
                            : "transparent"
                        }
                        fillOpacity={activeTool === "highlight" ? 0.35 : 1}
                        stroke={activeTool === "rect" || activeTool === "circle" ? shapeColor : "#3B82F6"}
                        strokeWidth="2"
                        strokeDasharray="4 4"
                      />
                    )}
                  </svg>

                  {/* DOM Layer: Text Annotations */}
                  {pageAnnotations
                    .filter((a): a is TextAnnotation => a.type === "text")
                    .map((txt) => {
                      const isSelected = selectedId === txt.id;
                      return (
                        <div
                          key={txt.id}
                          style={{
                            position: "absolute",
                            left: `${txt.normX * 100}%`,
                            top: `${txt.normY * 100}%`,
                            fontSize: `${txt.fontSize * zoomScale}px`,
                            color: txt.color,
                            fontFamily:
                              txt.fontFamily === "Times"
                                ? "Times New Roman, serif"
                                : txt.fontFamily === "Courier"
                                ? "Courier, monospace"
                                : "Helvetica, Arial, sans-serif",
                            fontWeight: txt.isBold ? "bold" : "normal",
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedId(txt.id);
                          }}
                          className={`cursor-move p-1 rounded transition-all leading-tight ${
                            isSelected
                              ? "ring-2 ring-blue-500 bg-blue-50/40 shadow-sm"
                              : "hover:ring-1 hover:ring-amber-500/50"
                          }`}
                        >
                          <input
                            type="text"
                            value={txt.text}
                            onChange={(e) => {
                              const val = e.target.value;
                              setAnnotations((prev) =>
                                prev.map((a) => (a.id === txt.id ? { ...a, text: val } : a))
                              );
                            }}
                            onBlur={() => {
                              // Save state to history on blur
                              pushHistory(annotations);
                            }}
                            className="bg-transparent border-none outline-none p-0 m-0 w-auto min-w-[60px]"
                            style={{ color: txt.color, font: "inherit" }}
                          />
                        </div>
                      );
                    })}

                  {/* DOM Layer: Signature & Image Annotations */}
                  {pageAnnotations
                    .filter((a): a is ImageAnnotation => a.type === "signature" || a.type === "image")
                    .map((img) => {
                      const isSelected = selectedId === img.id;
                      return (
                        <div
                          key={img.id}
                          style={{
                            position: "absolute",
                            left: `${img.normX * 100}%`,
                            top: `${img.normY * 100}%`,
                            width: `${img.normW * 100}%`,
                            height: `${img.normH * 100}%`,
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedId(img.id);
                          }}
                          className={`cursor-move group select-none transition-all ${
                            isSelected ? "ring-2 ring-blue-500 shadow-md" : "hover:ring-1 hover:ring-amber-500/50"
                          }`}
                        >
                          <img
                            src={img.dataUrl}
                            alt="Annotation"
                            className="w-full h-full object-contain pointer-events-none"
                          />
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Signature Dialog */}
      <SignatureDialog
        isOpen={isSignatureModalOpen}
        onClose={() => setIsSignatureModalOpen(false)}
        onInsertSignature={handleInsertSignature}
      />
    </div>
  );
}
