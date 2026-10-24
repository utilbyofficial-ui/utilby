"use client";

import * as React from "react";
import type { PDFDocumentProxy } from "pdfjs-dist";
import { getPdfjs } from "@/modules/pdf/render";
import {
  Annotation,
  TextAnnotation,
  ImageAnnotation,
  WhiteoutAnnotation,
  ShapeAnnotation,
  ToolMode,
  ExistingTextItem,
  groupPdfTextItems,
  toDisplayTextItems,
  buildCombinedAnnotations,
  captureCanvasRegion,
  createBackgroundRepairPatch,
  sampleCanvasBorderColor,
  sampleTextColor,
  newAnnotationId,
  exportPdfWithAnnotations,
} from "./engine";
import { Box, Handle, HANDLES, getBox, setBox, moveBox, resizeBox, fitImageBox, clamp } from "./elements";
import { FONT_CSS, loadImageForPdf, rasterizeText } from "./media";
import { SignatureDialog } from "./SignatureDialog";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import {
  UploadCloud,
  Download,
  Undo2,
  Redo2,
  Trash2,
  ZoomIn,
  ZoomOut,
  ChevronLeft,
  ChevronRight,
  MousePointer2,
  Type,
  PenTool,
  Highlighter,
  Eraser,
  Square,
  Circle,
  Image as ImageIcon,
  CheckCircle2,
  Loader2,
  Signature,
  TextCursorInput,
  Scissors,
  Copy,
  Replace,
  Lock,
  Unlock,
  Info,
  RotateCcw,
  BringToFront,
} from "lucide-react";

// ---------------------------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------------------------

const COLORS = ["#16141F", "#E11D48", "#2563EB", "#16A34A", "#D97706", "#9333EA", "#FFFFFF"];
const HIGHLIGHTS = ["#FACC15", "#4ADE80", "#60A5FA", "#F472B6"];
const FONT_SIZES = [8, 9, 10, 11, 12, 14, 16, 18, 20, 24, 28, 32, 36, 48, 60, 72];
const MAX_PDF_BYTES = 100 * 1024 * 1024;
const MAX_PDF_PAGES = 500;
const MAX_CANVAS_PIXELS = 32_000_000;
const MAX_DISPLAY_PIXELS = 8_000_000;
const MAX_DISPLAY_DIMENSION = 8192;

type FontFamily = "Helvetica" | "Times" | "Courier";

interface Snapshot {
  annotations: Annotation[];
  textEdits: Record<string, ExistingTextItem>;
}

type Gesture =
  | { kind: "create"; tool: ToolMode; startX: number; startY: number; points: { normX: number; normY: number }[] }
  | {
      kind: "move";
      target: "ann" | "existing";
      id: string;
      startClientX: number;
      startClientY: number;
      orig: Box;
      before: Snapshot;
      moved: boolean;
      onClick?: () => void;
    }
  | { kind: "resize"; id: string; handle: Handle; startClientX: number; startClientY: number; orig: Box; keepAspect: boolean; before: Snapshot }
  | { kind: "fontScale"; target: "ann" | "existing"; id: string; startClientY: number; startSize: number; before: Snapshot };

const TOOLS: { id: ToolMode; label: string; icon: React.ElementType; hint: string }[] = [
  { id: "select", label: "Select", icon: MousePointer2, hint: "Click any element to select it. Drag to move, pull the handles to resize." },
  { id: "editText", label: "Edit text", icon: TextCursorInput, hint: "Click a text line to edit it. Scanned pages may contain background details that cannot be reconstructed exactly." },
  { id: "text", label: "Add text", icon: Type, hint: "Click where you want to add text." },
  { id: "moveElement", label: "Cut & move", icon: Scissors, hint: "Drag around an image or block to lift it out. Background repair is approximate; inspect the result before exporting." },
  { id: "draw", label: "Draw", icon: PenTool, hint: "Draw freehand with your mouse, finger or pen." },
  { id: "highlight", label: "Highlight", icon: Highlighter, hint: "Drag across text to highlight it." },
  { id: "whiteout", label: "Whiteout", icon: Eraser, hint: "Drag over anything to cover it. Text underneath is removed from the file too." },
  { id: "rect", label: "Box", icon: Square, hint: "Drag to draw a rectangle." },
  { id: "circle", label: "Ellipse", icon: Circle, hint: "Drag to draw an ellipse." },
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

interface LoadedDoc {
  name: string;
  bytes: Uint8Array;
  pdf: PDFDocumentProxy;
  numPages: number;
}

// ---------------------------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------------------------

export function PdfEditorTool() {
  const [doc, setDoc] = React.useState<LoadedDoc | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [loadError, setLoadError] = React.useState("");
  const [pageIndex, setPageIndex] = React.useState(0);
  const [pageSize, setPageSize] = React.useState<{ w: number; h: number } | null>(null); // display size in pt
  const [containerW, setContainerW] = React.useState(800);
  const [zoom, setZoom] = React.useState(1);
  const [rendering, setRendering] = React.useState(false);

  const [tool, setTool] = React.useState<ToolMode>("select");
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [editingId, setEditingId] = React.useState<string | null>(null);

  // style defaults for new elements
  const [textStyle, setTextStyle] = React.useState<{ fontSize: number; fontFamily: FontFamily; isBold: boolean; color: string }>({
    fontSize: 14,
    fontFamily: "Helvetica",
    isBold: false,
    color: "#16141F",
  });
  const [ink, setInk] = React.useState({ color: "#E11D48", width: 3 });
  const [highlightColor, setHighlightColor] = React.useState(HIGHLIGHTS[0]!);
  const [shapeColor, setShapeColor] = React.useState("#E11D48");
  const [cutMode, setCutMode] = React.useState<"repair" | "white" | "duplicate">("repair");
  const [keepAspect, setKeepAspect] = React.useState(true);

  // content + history
  const [annotations, setAnnotationsState] = React.useState<Annotation[]>([]);
  const [textEdits, setTextEditsState] = React.useState<Record<string, ExistingTextItem>>({});
  const [detected, setDetected] = React.useState<Record<number, ExistingTextItem[]>>({});
  const annRef = React.useRef<Annotation[]>([]);
  const editsRef = React.useRef<Record<string, ExistingTextItem>>({});
  const histRef = React.useRef<{ past: Snapshot[]; future: Snapshot[] }>({ past: [], future: [] });
  const [, setHistVersion] = React.useState(0);
  const typingBefore = React.useRef<Snapshot | null>(null);

  const [live, setLive] = React.useState<{ box?: Box; points?: { normX: number; normY: number }[] } | null>(null);
  const [sigOpen, setSigOpen] = React.useState(false);
  const [toast, setToast] = React.useState<{ msg: string; tone: "info" | "success" | "error" } | null>(null);
  const [exporting, setExporting] = React.useState(false);
  const [confirmReset, setConfirmReset] = React.useState(false);

  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const overlayRef = React.useRef<HTMLDivElement>(null);
  const wrapRef = React.useRef<HTMLDivElement>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const imageInputRef = React.useRef<HTMLInputElement>(null);
  const replaceInputRef = React.useRef<HTMLInputElement>(null);
  const gestureRef = React.useRef<Gesture | null>(null);
  const detectedRef = React.useRef<Record<number, ExistingTextItem[]>>({});
  const toastTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const loadGeneration = React.useRef(0);

  React.useEffect(() => () => { loadGeneration.current++; }, []);

  const notify = React.useCallback((msg: string, tone: "info" | "success" | "error" = "info") => {
    setToast({ msg, tone });
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), tone === "error" ? 7000 : 4500);
  }, []);

  // ---------- history ----------
  const snapshot = (): Snapshot => ({ annotations: annRef.current, textEdits: editsRef.current });
  const setLiveState = React.useCallback((anns?: Annotation[], edits?: Record<string, ExistingTextItem>) => {
    if (anns) {
      annRef.current = anns;
      setAnnotationsState(anns);
    }
    if (edits) {
      editsRef.current = edits;
      setTextEditsState(edits);
    }
  }, []);
  const pushPast = (before: Snapshot) => {
    histRef.current.past.push(before);
    if (histRef.current.past.length > 100) histRef.current.past.shift();
    histRef.current.future = [];
    setHistVersion((v) => v + 1);
  };
  const commit = (anns?: Annotation[], edits?: Record<string, ExistingTextItem>) => {
    pushPast(snapshot());
    setLiveState(anns, edits);
  };
  const commitFrom = (before: Snapshot | null) => {
    if (!before) return;
    if (before.annotations === annRef.current && before.textEdits === editsRef.current) return;
    pushPast(before);
  };
  const undo = React.useCallback(() => {
    const h = histRef.current;
    const prev = h.past.pop();
    if (!prev) return;
    h.future.unshift({ annotations: annRef.current, textEdits: editsRef.current });
    setLiveState(prev.annotations, prev.textEdits);
    setSelectedId(null);
    setEditingId(null);
    setHistVersion((v) => v + 1);
  }, [setLiveState]);
  const redo = React.useCallback(() => {
    const h = histRef.current;
    const next = h.future.shift();
    if (!next) return;
    h.past.push({ annotations: annRef.current, textEdits: editsRef.current });
    setLiveState(next.annotations, next.textEdits);
    setSelectedId(null);
    setEditingId(null);
    setHistVersion((v) => v + 1);
  }, [setLiveState]);

  // ---------- loading ----------
  const loadFile = async (f: File) => {
    if (!(f.type === "application/pdf" || /\.pdf$/i.test(f.name))) {
      setLoadError("Please choose a PDF file.");
      return;
    }
    if (f.size > MAX_PDF_BYTES) {
      setLoadError("This PDF is larger than the 100 MB processing limit.");
      return;
    }
    const generation = ++loadGeneration.current;
    setLoading(true);
    setLoadError("");
    setDoc(null);
    try {
      const bytes = new Uint8Array(await f.arrayBuffer());
      if (generation !== loadGeneration.current) return;
      const pdfjs = await getPdfjs();
      const pdf = await pdfjs.getDocument({ data: bytes.slice(), isEvalSupported: false }).promise;
      if (generation !== loadGeneration.current) {
        await pdf.destroy();
        return;
      }
      if (pdf.numPages > MAX_PDF_PAGES) {
        await pdf.destroy();
        throw new Error(`This tool supports up to ${MAX_PDF_PAGES} pages per PDF. Split the document first.`);
      }
      histRef.current = { past: [], future: [] };
      setLiveState([], {});
      detectedRef.current = {};
      setDetected({});
      setSelectedId(null);
      setEditingId(null);
      setPageIndex(0);
      setZoom(1);
      setTool("select");
      setDoc({ name: f.name, bytes, pdf, numPages: pdf.numPages });
    } catch (err) {
      if (generation !== loadGeneration.current) return;
      const name = (err as { name?: string })?.name;
      setLoadError(
        err instanceof Error && err.message.startsWith("This tool supports")
          ? err.message
          : name === "PasswordException"
          ? "This PDF is password-protected. Remove the password first (open it, then Print → Save as PDF)."
          : "This PDF couldn't be opened. The file may be damaged."
      );
    } finally {
      if (generation === loadGeneration.current) setLoading(false);
    }
  };

  React.useEffect(() => () => void doc?.pdf.destroy().catch(() => undefined), [doc]);

  // container width → fit-to-width scale
  React.useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => setContainerW(entries[0]!.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, [doc]);

  const fitScale = pageSize ? Math.min(1.6, Math.max(0.3, (containerW - 24) / pageSize.w)) : 1;
  const maxSafeScale = pageSize
    ? Math.min(MAX_DISPLAY_DIMENSION / pageSize.w, MAX_DISPLAY_DIMENSION / pageSize.h, Math.sqrt(MAX_DISPLAY_PIXELS / (pageSize.w * pageSize.h)))
    : 4.8;
  const scale = Math.min(fitScale * zoom, maxSafeScale); // CSS px per PDF point
  const dispW = pageSize ? pageSize.w * scale : 0;
  const dispH = pageSize ? pageSize.h * scale : 0;

  // ---------- render current page + detect text ----------
  React.useEffect(() => {
    if (!doc) return;
    let cancelled = false;
    let task: { cancel: () => void; promise: Promise<unknown> } | null = null;
    (async () => {
      setRendering(true);
      try {
        const page = await doc.pdf.getPage(pageIndex + 1);
        if (cancelled) return;
        const base = page.getViewport({ scale: 1 });
        if (!Number.isFinite(base.width) || !Number.isFinite(base.height) || !Number.isFinite(base.width * base.height) || base.width <= 0 || base.height <= 0) {
          page.cleanup();
          notify("This PDF page has unsupported dimensions.", "error");
          return;
        }
        setPageSize((s) => (s && s.w === base.width && s.h === base.height ? s : { w: base.width, h: base.height }));
        const requestedScale = (Math.min(1.6, Math.max(0.3, (containerW - 24) / base.width))) * zoom;
        const safeScale = Math.min(
          MAX_DISPLAY_DIMENSION / base.width,
          MAX_DISPLAY_DIMENSION / base.height,
          Math.sqrt(MAX_DISPLAY_PIXELS / (base.width * base.height))
        );
        const effScale = Math.min(requestedScale, safeScale);
        const vp = page.getViewport({ scale: effScale });
        const canvas = canvasRef.current;
        if (!canvas) return;
        const desiredDpr = Math.min(2, window.devicePixelRatio || 1);
        const dpr = Math.min(
          desiredDpr,
          16384 / vp.width,
          16384 / vp.height,
          Math.sqrt(MAX_CANVAS_PIXELS / (vp.width * vp.height))
        );
        canvas.width = Math.ceil(vp.width * dpr);
        canvas.height = Math.ceil(vp.height * dpr);
        canvas.style.width = `${vp.width}px`;
        canvas.style.height = `${vp.height}px`;
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (!ctx) throw new Error("Canvas is not supported in this browser.");
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, vp.width, vp.height);
        task = page.render({ canvasContext: ctx, viewport: vp }) as unknown as typeof task;
        await task!.promise;
        if (cancelled) return;

        // Detect existing text once per page (after render so fonts and pixels are available)
        if (!detectedRef.current[pageIndex]) {
          const content = await page.getTextContent();
          if (cancelled) return;
          const styled = (content.items as Array<{ str?: string; transform?: number[]; width?: number; height?: number; fontName?: string }>).map((it) => {
            let fontName = it.fontName ?? "";
            try {
              if (it.fontName && page.commonObjs.has(it.fontName)) {
                const font = page.commonObjs.get(it.fontName) as {
                  name?: string;
                  bold?: boolean;
                  black?: boolean;
                  isSerifFont?: boolean;
                  isMonospace?: boolean;
                };
                fontName = [
                  font.name ?? "",
                  font.isMonospace ? "mono" : "",
                  font.isSerifFont ? "serif" : "",
                  font.bold || font.black ? "bold" : "",
                ].join(" ");
              }
            } catch {
              // font not resolved — fall back to name heuristics
            }
            return { ...it, fontName };
          });
          const items = toDisplayTextItems(styled, Array.from(base.transform), base.height);
          const lines = groupPdfTextItems(items, base.width, base.height, pageIndex).map((l, idx) => {
            const bg = sampleCanvasBorderColor(canvas, l.origNormX, l.origNormY, l.origNormW, l.origNormH);
            const color = sampleTextColor(canvas, l.origNormX, l.origNormY, l.origNormW, l.origNormH, bg);
            return { ...l, id: `p${pageIndex}-l${idx}`, bgColor: bg, color };
          });
          detectedRef.current = { ...detectedRef.current, [pageIndex]: lines };
          setDetected(detectedRef.current);
        }
      } catch (err) {
        if ((err as { name?: string })?.name !== "RenderingCancelledException") {
          console.error(err);
          notify("This PDF page could not be rendered. Try reopening the document or reducing the zoom.", "error");
        }
      } finally {
        if (!cancelled) setRendering(false);
      }
    })();
    return () => {
      cancelled = true;
      try {
        task?.cancel();
      } catch {
        // ignore
      }
    };
  }, [doc, pageIndex, zoom, containerW, notify]);

  // ---------- derived ----------
  const pageAnns = annotations.filter((a) => a.pageIndex === pageIndex);
  const pageTexts = (detected[pageIndex] ?? []).map((d) => textEdits[d.id] ?? d);
  const selectedAnn = annotations.find((a) => a.id === selectedId) ?? null;
  const selectedExisting = pageTexts.find((t) => t.id === selectedId) ?? null;
  const editCount =
    annotations.length + Object.values(textEdits).filter((t) => t.isDeleted || t.currentText !== t.originalText || t.normX !== t.origNormX || t.normY !== t.origNormY || t.styleChanged).length;

  // ---------- coordinates ----------
  const normFromEvent = (e: { clientX: number; clientY: number }) => {
    const r = overlayRef.current!.getBoundingClientRect();
    return { normX: clamp((e.clientX - r.left) / r.width, 0, 1), normY: clamp((e.clientY - r.top) / r.height, 0, 1) };
  };
  const deltaNorm = (dxPx: number, dyPx: number) => {
    const r = overlayRef.current!.getBoundingClientRect();
    return { dx: dxPx / r.width, dy: dyPx / r.height };
  };

  // ---------- element mutation helpers ----------
  const updateAnn = (id: string, fn: (a: Annotation) => Annotation, withHistory = true) => {
    const next = annRef.current.map((a) => (a.id === id ? fn(a) : a));
    if (withHistory) commit(next);
    else setLiveState(next);
  };
  const updateExisting = (id: string, patch: Partial<ExistingTextItem>, withHistory = true) => {
    const base = editsRef.current[id] ?? (detectedRef.current[pageIndex] ?? []).find((t) => t.id === id);
    if (!base) return;
    const next = { ...editsRef.current, [id]: { ...base, isEdited: true, ...patch } };
    if (withHistory) commit(undefined, next);
    else setLiveState(undefined, next);
  };
  const deleteSelected = () => {
    if (selectedAnn) commit(annRef.current.filter((a) => a.id !== selectedAnn.id));
    else if (selectedExisting) updateExisting(selectedExisting.id, { isDeleted: true });
    setSelectedId(null);
    setEditingId(null);
  };
  const duplicateSelected = () => {
    if (!selectedAnn) return;
    const box = getBox(selectedAnn);
    const moved: Annotation = box
      ? setBox(selectedAnn, moveBox(box, 0.02, 0.02))
      : selectedAnn.type === "text"
      ? { ...selectedAnn, normX: selectedAnn.normX + 0.02, normY: selectedAnn.normY + 0.02 }
      : selectedAnn;
    const copy = { ...moved, id: newAnnotationId("dup") } as Annotation;
    commit([...annRef.current, copy]);
    setSelectedId(copy.id);
  };
  const bringToFront = () => {
    if (!selectedAnn) return;
    commit([...annRef.current.filter((a) => a.id !== selectedAnn.id), selectedAnn]);
  };

  // ---------- gestures ----------
  const startGesture = (g: Gesture) => {
    gestureRef.current = g;
    window.addEventListener("pointermove", onWindowMove);
    window.addEventListener("pointerup", onWindowUp, { once: true });
    window.addEventListener("pointercancel", onWindowUp, { once: true });
  };

  const onWindowMove = (e: PointerEvent) => {
    const g = gestureRef.current;
    if (!g) return;
    if (g.kind === "create") {
      const p = normFromEvent(e);
      if (g.tool === "draw") {
        g.points.push(p);
        setLive({ points: [...g.points] });
      } else {
        setLive({
          box: {
            normX: Math.min(g.startX, p.normX),
            normY: Math.min(g.startY, p.normY),
            normW: Math.abs(p.normX - g.startX),
            normH: Math.abs(p.normY - g.startY),
          },
        });
      }
      return;
    }
    if (g.kind === "move") {
      const dxPx = e.clientX - g.startClientX;
      const dyPx = e.clientY - g.startClientY;
      if (!g.moved && Math.hypot(dxPx, dyPx) < 4) return;
      g.moved = true;
      const { dx, dy } = deltaNorm(dxPx, dyPx);
      const nb = moveBox(g.orig, dx, dy);
      if (g.target === "ann")
        updateAnn(
          g.id,
          (a) => {
            const b = getBox(a);
            return b ? setBox(a, { ...b, normX: nb.normX, normY: nb.normY }) : { ...a, normX: nb.normX, normY: nb.normY } as Annotation;
          },
          false
        );
      else updateExisting(g.id, { normX: clamp(nb.normX, 0, 0.98), normY: clamp(nb.normY, 0, 0.98) }, false);
      return;
    }
    if (g.kind === "resize") {
      const { dx, dy } = deltaNorm(e.clientX - g.startClientX, e.clientY - g.startClientY);
      const minNorm = 8 / (overlayRef.current?.getBoundingClientRect().width || 800);
      const nb = resizeBox(g.orig, g.handle, dx, dy, { keepAspect: g.keepAspect !== e.shiftKey, minNorm });
      updateAnn(g.id, (a) => setBox(a, nb), false);
      return;
    }
    if (g.kind === "fontScale") {
      const dyPx = e.clientY - g.startClientY;
      const startPx = g.startSize * scaleRef.current;
      const size = Math.round(clamp((g.startSize * (startPx + dyPx)) / Math.max(1, startPx), 6, 144));
      if (g.target === "ann") updateAnn(g.id, (a) => (a.type === "text" ? { ...a, fontSize: size } : a), false);
      else updateExisting(g.id, { fontSize: size, styleChanged: true }, false);
    }
  };

  const onWindowUp = (e: PointerEvent) => {
    window.removeEventListener("pointermove", onWindowMove);
    const g = gestureRef.current;
    gestureRef.current = null;
    if (!g) return;
    if (g.kind === "create") finishCreate(g, normFromEvent(e));
    else if (g.kind === "move") {
      if (g.moved) commitFrom(g.before);
      else g.onClick?.();
    } else commitFrom(g.before);
  };

  const scaleRef = React.useRef(scale);
  scaleRef.current = scale;

  // ---------- creation ----------
  const onOverlayPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0 || !doc) return;
    const p = normFromEvent(e);
    claimPointer(e);
    if (tool === "select") {
      setSelectedId(null);
      setEditingId(null);
      return;
    }
    if (tool === "text") {
      e.preventDefault();
      const t: TextAnnotation = {
        id: newAnnotationId("txt"),
        pageIndex,
        type: "text",
        normX: clamp(p.normX, 0, 0.95),
        normY: clamp(p.normY - (textStyle.fontSize * 0.6) / (pageSize?.h || 800), 0, 0.97),
        text: "",
        ...textStyle,
      };
      typingBefore.current = snapshot();
      setLiveState([...annRef.current, t]);
      setSelectedId(t.id);
      setEditingId(t.id);
      return;
    }
    e.preventDefault();
    setSelectedId(null);
    setEditingId(null);
    startGesture({ kind: "create", tool, startX: p.normX, startY: p.normY, points: [p] });
    setLive(tool === "draw" ? { points: [p] } : { box: { normX: p.normX, normY: p.normY, normW: 0, normH: 0 } });
  };

  const finishCreate = (g: Extract<Gesture, { kind: "create" }>, end: { normX: number; normY: number }) => {
    setLive(null);
    const box: Box = {
      normX: Math.min(g.startX, end.normX),
      normY: Math.min(g.startY, end.normY),
      normW: Math.abs(end.normX - g.startX),
      normH: Math.abs(end.normY - g.startY),
    };
    const big = box.normW > 0.006 && box.normH > 0.004;
    const canvas = canvasRef.current;

    if (g.tool === "draw") {
      if (g.points.length >= 2) commit([...annRef.current, { id: newAnnotationId("drw"), pageIndex, type: "draw", points: g.points, color: ink.color, strokeWidth: ink.width }]);
      return;
    }
    if (!big) return;

    if (g.tool === "highlight") {
      commit([...annRef.current, { id: newAnnotationId("hl"), pageIndex, type: "highlight", ...box, color: highlightColor, opacity: 0.35 }]);
      return;
    }
    if (g.tool === "whiteout") {
      const wo: WhiteoutAnnotation = { id: newAnnotationId("wo"), pageIndex, type: "whiteout", ...box, color: "#FFFFFF" };
      commit([...annRef.current, wo]);
      setSelectedId(wo.id);
      setTool("select");
      return;
    }
    if (g.tool === "rect" || g.tool === "circle") {
      const s: ShapeAnnotation = { id: newAnnotationId("shp"), pageIndex, type: g.tool, ...box, strokeColor: shapeColor, strokeWidth: 2 };
      commit([...annRef.current, s]);
      setSelectedId(s.id);
      setTool("select");
      return;
    }
    if (g.tool === "moveElement" && canvas) {
      const dataUrl = captureCanvasRegion(canvas, box.normX, box.normY, box.normW, box.normH);
      if (!dataUrl) return;
      const bg = sampleCanvasBorderColor(canvas, box.normX, box.normY, box.normW, box.normH);
      const backgroundPatch = cutMode === "repair" ? createBackgroundRepairPatch(canvas, box.normX, box.normY, box.normW, box.normH) : null;
      const img: ImageAnnotation = { id: newAnnotationId("cut"), pageIndex, type: "image", ...box, dataUrl };
      const patch: WhiteoutAnnotation[] =
        cutMode === "duplicate" ? [] : [{ id: newAnnotationId("patch"), pageIndex, type: "whiteout", ...box, color: cutMode === "repair" ? bg : "#FFFFFF", dataUrl: backgroundPatch ?? undefined }];
      commit([...annRef.current, ...patch, cutMode === "duplicate" ? { ...img, normX: box.normX + 0.02, normY: box.normY + 0.02 } : img]);
      setSelectedId(img.id);
      setTool("select");
      notify("Element lifted out. Drag it anywhere, pull the handles to resize, or use Replace image.");
      return;
    }
    if (g.tool === "editText" && canvas) {
      // Scanned / image text: repair the page pixels underneath, then place an editable text box.
      const eraseX = Math.max(0, box.normX - 0.004);
      const eraseY = Math.max(0, box.normY - 0.004);
      const eraseRight = Math.min(1, box.normX + box.normW + 0.004);
      const eraseBottom = Math.min(1, box.normY + box.normH + 0.004);
      const eraseBox = { normX: eraseX, normY: eraseY, normW: eraseRight - eraseX, normH: eraseBottom - eraseY };
      const bg = sampleCanvasBorderColor(canvas, eraseBox.normX, eraseBox.normY, eraseBox.normW, eraseBox.normH);
      const backgroundPatch = createBackgroundRepairPatch(canvas, eraseBox.normX, eraseBox.normY, eraseBox.normW, eraseBox.normH);
      const color = sampleTextColor(canvas, box.normX, box.normY, box.normW, box.normH, bg);
      const fontSize = Math.round(clamp(box.normH * (pageSize?.h || 800) * 0.72, 6, 96));
      const wo: WhiteoutAnnotation = { id: newAnnotationId("erase"), pageIndex, type: "whiteout", ...eraseBox, color: bg, dataUrl: backgroundPatch ?? undefined };
      const t: TextAnnotation = {
        id: newAnnotationId("rep"),
        pageIndex,
        type: "text",
        normX: box.normX,
        normY: box.normY + Math.max(0, (box.normH - (fontSize * 1.2) / (pageSize?.h || 800)) / 2),
        text: "",
        fontSize,
        color,
        fontFamily: textStyle.fontFamily,
        isBold: textStyle.isBold,
      };
      commit([...annRef.current, wo, t]);
      setSelectedId(t.id);
      setEditingId(t.id);
      typingBefore.current = snapshot();
    }
  };

  /**
   * Finish any text being typed (so its edit is committed) and stop the browser from firing the
   * compatibility mouse events after a touch tap — those would steal focus from a just-opened editor.
   */
  const claimPointer = (e: React.PointerEvent) => {
    const active = document.activeElement as HTMLElement | null;
    if (active && active.tagName === "TEXTAREA" && !(e.target as HTMLElement).closest("textarea")) active.blur();
    e.preventDefault();
  };

  // ---------- element pointer handlers ----------
  const elementsInteractive = tool === "select" || tool === "editText" || tool === "text";

  const onAnnPointerDown = (e: React.PointerEvent, a: Annotation) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    if (editingId === a.id) return; // typing inside the text box
    claimPointer(e);
    setSelectedId(a.id);
    if (editingId && editingId !== a.id) setEditingId(null);
    const box = getBox(a) ?? (a.type === "text" ? { normX: a.normX, normY: a.normY, normW: 0, normH: 0 } : null);
    if (!box) return;
    startGesture({
      kind: "move",
      target: "ann",
      id: a.id,
      startClientX: e.clientX,
      startClientY: e.clientY,
      orig: box,
      before: snapshot(),
      moved: false,
      onClick:
        a.type === "text" && selectedId === a.id
          ? () => {
              typingBefore.current = snapshot();
              setEditingId(a.id);
            }
          : undefined,
    });
  };

  const startEditExisting = (t: ExistingTextItem) => {
    typingBefore.current = snapshot();
    if (!editsRef.current[t.id]) {
      const canvas = canvasRef.current;
      const patchX = Math.max(0, t.origNormX - 0.003);
      const patchY = Math.max(0, t.origNormY - 0.003);
      const patchRight = Math.min(1, t.origNormX + t.origNormW + 0.003);
      const patchBottom = Math.min(1, t.origNormY + t.origNormH + 0.003);
      const bgPatchDataUrl = canvas
        ? createBackgroundRepairPatch(canvas, patchX, patchY, patchRight - patchX, patchBottom - patchY)
        : null;
      setLiveState(undefined, { ...editsRef.current, [t.id]: { ...t, isEdited: true, bgPatchDataUrl: bgPatchDataUrl ?? undefined } });
    }
    setSelectedId(t.id);
    setEditingId(t.id);
  };

  const onExistingPointerDown = (e: React.PointerEvent, t: ExistingTextItem) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    if (editingId === t.id) return;
    claimPointer(e);
    setSelectedId(t.id);
    setEditingId(null);
    startGesture({
      kind: "move",
      target: "existing",
      id: t.id,
      startClientX: e.clientX,
      startClientY: e.clientY,
      orig: { normX: t.normX, normY: t.normY, normW: t.normW, normH: t.normH },
      before: snapshot(),
      moved: false,
      onClick: () => startEditExisting(t),
    });
  };

  const onHandlePointerDown = (e: React.PointerEvent, a: Annotation, handle: Handle) => {
    e.stopPropagation();
    claimPointer(e);
    const box = getBox(a);
    if (!box) return;
    const aspectDefault = a.type === "image" || a.type === "signature" ? keepAspect : false;
    startGesture({ kind: "resize", id: a.id, handle, startClientX: e.clientX, startClientY: e.clientY, orig: box, keepAspect: aspectDefault, before: snapshot() });
  };

  const onFontHandlePointerDown = (e: React.PointerEvent, target: "ann" | "existing", id: string, startSize: number) => {
    e.stopPropagation();
    claimPointer(e);
    startGesture({ kind: "fontScale", target, id, startClientY: e.clientY, startSize, before: snapshot() });
  };

  // ---------- images ----------
  const insertImage = async (source: Blob | string, kind: "image" | "signature") => {
    try {
      const img = await loadImageForPdf(source, { trim: kind === "signature" });
      const pw = pageSize?.w || 595;
      const ph = pageSize?.h || 842;
      const { normW, normH } = fitImageBox(img.width, img.height, pw, ph, kind === "signature" ? 0.3 : 0.4, kind === "signature" ? 0.15 : 0.45);
      const a: ImageAnnotation = {
        id: newAnnotationId(kind === "signature" ? "sig" : "img"),
        pageIndex,
        type: kind,
        normX: (1 - normW) / 2,
        normY: kind === "signature" ? Math.min(0.8, 0.75) : clamp(0.35 - normH / 2, 0.05, 1 - normH),
        normW,
        normH,
        dataUrl: img.dataUrl,
      };
      commit([...annRef.current, a]);
      setSelectedId(a.id);
      setTool("select");
    } catch {
      notify("That image couldn't be read. Try a JPG or PNG file.", "error");
    }
  };

  const replaceSelectedImage = async (file: File) => {
    if (!selectedAnn || (selectedAnn.type !== "image" && selectedAnn.type !== "signature")) return;
    try {
      const img = await loadImageForPdf(file);
      const pw = pageSize?.w || 595;
      const ph = pageSize?.h || 842;
      const target = selectedAnn;
      // keep the same width & centre, adopt the new image's proportions
      const normH = (target.normW * pw * (img.height / img.width)) / ph;
      const cy = target.normY + target.normH / 2;
      updateAnn(target.id, (a) => ({ ...(a as ImageAnnotation), dataUrl: img.dataUrl, normH, normY: cy - normH / 2 }));
      notify("Image replaced.", "success");
    } catch {
      notify("That image couldn't be read. Try a JPG or PNG file.", "error");
    }
  };

  // ---------- keyboard ----------
  React.useEffect(() => {
    if (!doc) return;
    const onKey = (e: KeyboardEvent) => {
      const el = document.activeElement as HTMLElement | null;
      const typing = el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.tagName === "SELECT" || el.isContentEditable);
      const mod = e.ctrlKey || e.metaKey;
      if (mod && e.key.toLowerCase() === "z" && !typing) {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
        return;
      }
      if (mod && e.key.toLowerCase() === "y" && !typing) {
        e.preventDefault();
        redo();
        return;
      }
      if (typing) return;
      if ((e.key === "Delete" || e.key === "Backspace") && selectedId) {
        e.preventDefault();
        deleteSelected();
      } else if (mod && e.key.toLowerCase() === "d" && selectedAnn) {
        e.preventDefault();
        duplicateSelected();
      } else if (e.key === "Escape") {
        setSelectedId(null);
        setEditingId(null);
      } else if (e.key.startsWith("Arrow") && selectedAnn) {
        e.preventDefault();
        const step = (e.shiftKey ? 10 : 1) / Math.max(1, dispW);
        const stepY = (e.shiftKey ? 10 : 1) / Math.max(1, dispH);
        const dx = e.key === "ArrowLeft" ? -step : e.key === "ArrowRight" ? step : 0;
        const dy = e.key === "ArrowUp" ? -stepY : e.key === "ArrowDown" ? stepY : 0;
        const box = getBox(selectedAnn);
        if (box) updateAnn(selectedAnn.id, (a) => setBox(a, { ...box, normX: box.normX + dx, normY: box.normY + dy }));
        else if (selectedAnn.type === "text") updateAnn(selectedAnn.id, (a) => ({ ...(a as TextAnnotation), normX: (a as TextAnnotation).normX + dx, normY: (a as TextAnnotation).normY + dy }));
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  // ---------- export ----------
  const exportPdf = async () => {
    if (!doc) return;
    setEditingId(null);
    setExporting(true);
    try {
      const combined = buildCombinedAnnotations(annRef.current, Object.values(editsRef.current));
      const bytes = await exportPdfWithAnnotations(doc.bytes, combined, { rasterizeText });
      downloadBlob(new Blob([bytes as BlobPart], { type: "application/pdf" }), `${doc.name.replace(/\.pdf$/i, "")}-edited.pdf`);
      notify("Your edited PDF has been downloaded.", "success");
    } catch (err) {
      console.error(err);
      notify("Something went wrong while saving. Your edits are still here — please try again.", "error");
    } finally {
      setExporting(false);
    }
  };

  // ---------- style controls targeting ----------
  const selectedTextAnn = selectedAnn && selectedAnn.type === "text" ? selectedAnn : null;
  const textTarget = selectedTextAnn
    ? { fontSize: selectedTextAnn.fontSize, fontFamily: selectedTextAnn.fontFamily, isBold: !!selectedTextAnn.isBold, color: selectedTextAnn.color }
    : selectedExisting
    ? { fontSize: selectedExisting.fontSize, fontFamily: selectedExisting.fontFamily, isBold: !!selectedExisting.isBold, color: selectedExisting.color }
    : textStyle;
  const applyTextStyle = (patch: Partial<typeof textStyle>) => {
    if (selectedTextAnn) updateAnn(selectedTextAnn.id, (a) => ({ ...(a as TextAnnotation), ...patch }));
    else if (selectedExisting) updateExisting(selectedExisting.id, { ...patch, styleChanged: true });
    else setTextStyle((s) => ({ ...s, ...patch }));
  };

  // ---------------------------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------------------------

  if (!doc) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-soft sm:p-6">
        <div
          role="button"
          tabIndex={0}
          onClick={() => fileInputRef.current?.click()}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              fileInputRef.current?.click();
            }
          }}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const f = e.dataTransfer.files?.[0];
            if (f) void loadFile(f);
          }}
          className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 px-6 py-14 text-center transition-colors hover:border-pdf hover:bg-pdf-soft/40"
        >
          <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-pdf text-ink">
            {loading ? <Loader2 className="h-7 w-7 animate-spin" /> : <UploadCloud className="h-7 w-7" />}
          </span>
          <p className="font-display text-xl font-bold text-ink">{loading ? "Opening your PDF…" : "Drop a PDF here or click to choose"}</p>
          <p className="mt-2 max-w-md text-sm text-slate-600">
            Edit existing text, add text and images, resize and move anything, sign, draw and highlight. PDFs up to 100 MB and 500 pages.
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,application/pdf"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void loadFile(f);
              e.target.value = "";
            }}
          />
        </div>
        {loadError && <p className="mt-4 rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{loadError}</p>}
      </div>
    );
  }

  const activeHint = TOOLS.find((t) => t.id === tool)?.hint;

  return (
    <div className="rounded-3xl border border-slate-200 bg-white shadow-soft">
      {/* Top bar */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 px-3 py-2.5 sm:px-4">
        <div className="flex min-w-0 items-center gap-1 rounded-xl bg-slate-100 p-1">
          <button type="button" className="rounded-lg p-1.5 text-slate-600 hover:bg-white hover:text-ink disabled:opacity-40" onClick={() => setPageIndex((p) => Math.max(0, p - 1))} disabled={pageIndex === 0} aria-label="Previous page">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="min-w-[64px] text-center text-xs font-semibold tabular-nums text-ink">
            {pageIndex + 1} / {doc.numPages}
          </span>
          <button type="button" className="rounded-lg p-1.5 text-slate-600 hover:bg-white hover:text-ink disabled:opacity-40" onClick={() => setPageIndex((p) => Math.min(doc.numPages - 1, p + 1))} disabled={pageIndex >= doc.numPages - 1} aria-label="Next page">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
        <div className="flex items-center gap-1 rounded-xl bg-slate-100 p-1">
          <button type="button" className="rounded-lg p-1.5 text-slate-600 hover:bg-white hover:text-ink" onClick={() => setZoom((z) => Math.max(0.5, +(z - 0.25).toFixed(2)))} aria-label="Zoom out">
            <ZoomOut className="h-4 w-4" />
          </button>
          <button type="button" className="min-w-[48px] text-center text-xs font-semibold tabular-nums text-ink" onClick={() => setZoom(1)} title="Fit to width">
            {Math.round(zoom * 100)}%
          </button>
          <button type="button" className="rounded-lg p-1.5 text-slate-600 hover:bg-white hover:text-ink" onClick={() => setZoom((z) => Math.min(3, +(z + 0.25).toFixed(2)))} aria-label="Zoom in">
            <ZoomIn className="h-4 w-4" />
          </button>
        </div>
        <div className="flex items-center gap-1">
          <button type="button" className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 hover:text-ink disabled:opacity-40" onClick={undo} disabled={!histRef.current.past.length} aria-label="Undo" title="Undo (Ctrl+Z)">
            <Undo2 className="h-4 w-4" />
          </button>
          <button type="button" className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 hover:text-ink disabled:opacity-40" onClick={redo} disabled={!histRef.current.future.length} aria-label="Redo" title="Redo (Ctrl+Shift+Z)">
            <Redo2 className="h-4 w-4" />
          </button>
        </div>
        <span className="hidden truncate text-xs text-slate-500 md:inline" title={doc.name}>
          {doc.name}
        </span>
        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              if (!confirmReset && editCount > 0) {
                setConfirmReset(true);
                setTimeout(() => setConfirmReset(false), 3000);
                return;
              }
              setConfirmReset(false);
              setDoc(null);
            }}
            className="rounded-xl px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 hover:text-ink"
          >
            {confirmReset ? (
              "Click again to discard edits"
            ) : (
              <>
                <span className="sm:hidden">New PDF</span>
                <span className="hidden sm:inline">Open another PDF</span>
              </>
            )}
          </button>
          <Button size="sm" onClick={exportPdf} disabled={exporting}>
            {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            {exporting ? "Saving…" : "Download PDF"}
          </Button>
        </div>
      </div>

      {/* Tools */}
      <div className="flex items-center gap-1 overflow-x-auto border-b border-slate-200 px-3 py-2 sm:px-4" role="toolbar" aria-label="Editing tools">
        {TOOLS.map((t) => {
          const Icon = t.icon;
          const active = tool === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => {
                setTool(t.id);
                setEditingId(null);
                if (t.id !== "select") setSelectedId(null);
              }}
              aria-pressed={active}
              className={cn(
                "flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition-colors",
                active ? "bg-ink text-white" : "text-slate-700 hover:bg-slate-100 hover:text-ink"
              )}
            >
              <Icon className="h-4 w-4" />
              {t.label}
            </button>
          );
        })}
        <span className="mx-1 h-5 w-px shrink-0 bg-slate-200" />
        <button type="button" onClick={() => imageInputRef.current?.click()} className="flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 hover:text-ink">
          <ImageIcon className="h-4 w-4" />
          Image
        </button>
        <button type="button" onClick={() => setSigOpen(true)} className="flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 hover:text-ink">
          <Signature className="h-4 w-4" />
          Sign
        </button>
        <input
          ref={imageInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif,image/bmp"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void insertImage(f, "image");
            e.target.value = "";
          }}
        />
        <input
          ref={replaceInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif,image/bmp"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void replaceSelectedImage(f);
            e.target.value = "";
          }}
        />
      </div>

      {(tool === "editText" || tool === "moveElement") && (
        <div className="flex items-start gap-2 border-b border-amber-200 bg-amber-50 px-4 py-2.5 text-xs text-amber-950" role="status">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />
          <p>
            Scanned or watermarked pages may have background details under the text that the editor cannot recover exactly. Any background fill is approximate—review the edited page beside the original before downloading. For official identity documents, use the issuing authority’s correction process.
          </p>
        </div>
      )}

      {/* Properties bar — fixed height so the page never jumps when switching tools */}
      <div className="flex min-h-[52px] flex-wrap items-center gap-x-4 gap-y-2 border-b border-slate-200 bg-slate-50 px-3 py-2 text-xs sm:px-4">
        {selectedTextAnn || selectedExisting || tool === "text" || (tool === "editText" && !selectedAnn) ? (
          <TextStyleControls value={textTarget} onChange={applyTextStyle} />
        ) : selectedAnn && (selectedAnn.type === "image" || selectedAnn.type === "signature") ? (
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" className={pill} onClick={() => replaceInputRef.current?.click()}>
              <Replace className="h-3.5 w-3.5" /> Replace image
            </button>
            <button type="button" className={cn(pill, keepAspect && "bg-ink text-white hover:bg-ink")} onClick={() => setKeepAspect((v) => !v)} aria-pressed={keepAspect} title="Hold Shift while resizing to switch temporarily">
              {keepAspect ? <Lock className="h-3.5 w-3.5" /> : <Unlock className="h-3.5 w-3.5" />} Keep proportions
            </button>
          </div>
        ) : selectedAnn && (selectedAnn.type === "rect" || selectedAnn.type === "circle") ? (
          <div className="flex flex-wrap items-center gap-3">
            <Swatches label="Line" colors={COLORS} value={selectedAnn.strokeColor} onChange={(c) => updateAnn(selectedAnn.id, (a) => ({ ...(a as ShapeAnnotation), strokeColor: c }))} />
            <Swatches label="Fill" colors={["none", ...COLORS]} value={selectedAnn.fillColor ?? "none"} onChange={(c) => updateAnn(selectedAnn.id, (a) => ({ ...(a as ShapeAnnotation), fillColor: c === "none" ? undefined : c }))} />
            <Stepper label="Width" value={selectedAnn.strokeWidth} options={[1, 2, 3, 5, 8]} onChange={(w) => updateAnn(selectedAnn.id, (a) => ({ ...(a as ShapeAnnotation), strokeWidth: w }))} />
          </div>
        ) : selectedAnn && selectedAnn.type === "whiteout" ? (
          <Swatches label={selectedAnn.dataUrl ? "Repair / cover colour" : "Cover colour"} colors={["#FFFFFF", "#F4F2FA", "#16141F", selectedAnn.color ?? "#FFFFFF"].filter((c, i, arr) => arr.indexOf(c) === i)} value={selectedAnn.color ?? "#FFFFFF"} onChange={(c) => updateAnn(selectedAnn.id, (a) => ({ ...(a as WhiteoutAnnotation), color: c, dataUrl: undefined }))} />
        ) : selectedAnn && selectedAnn.type === "highlight" ? (
          <Swatches label="Highlight" colors={HIGHLIGHTS} value={selectedAnn.color} onChange={(c) => updateAnn(selectedAnn.id, (a) => ({ ...a, color: c }) as Annotation)} />
        ) : selectedAnn && selectedAnn.type === "draw" ? (
          <div className="flex flex-wrap items-center gap-3">
            <Swatches label="Ink" colors={COLORS} value={selectedAnn.color} onChange={(c) => updateAnn(selectedAnn.id, (a) => ({ ...a, color: c }) as Annotation)} />
            <Stepper label="Width" value={selectedAnn.strokeWidth} options={[1, 2, 3, 5, 8, 12]} onChange={(w) => updateAnn(selectedAnn.id, (a) => ({ ...a, strokeWidth: w }) as Annotation)} />
          </div>
        ) : tool === "draw" ? (
          <div className="flex flex-wrap items-center gap-3">
            <Swatches label="Ink" colors={COLORS} value={ink.color} onChange={(c) => setInk((s) => ({ ...s, color: c }))} />
            <Stepper label="Width" value={ink.width} options={[1, 2, 3, 5, 8, 12]} onChange={(w) => setInk((s) => ({ ...s, width: w }))} />
          </div>
        ) : tool === "highlight" ? (
          <Swatches label="Highlight" colors={HIGHLIGHTS} value={highlightColor} onChange={setHighlightColor} />
        ) : tool === "rect" || tool === "circle" ? (
          <Swatches label="Line" colors={COLORS} value={shapeColor} onChange={setShapeColor} />
        ) : tool === "moveElement" ? (
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-slate-700">Leave behind:</span>
            {(
              [
                ["repair", "Approximate background fill"],
                ["white", "White"],
                ["duplicate", "Nothing (copy)"],
              ] as const
            ).map(([id, label]) => (
              <button key={id} type="button" onClick={() => setCutMode(id)} aria-pressed={cutMode === id} className={cn(pill, cutMode === id && "bg-ink text-white hover:bg-ink")}>
                {label}
              </button>
            ))}
          </div>
        ) : (
          <p className="flex items-center gap-2 text-slate-600">
            <Info className="h-4 w-4 shrink-0 text-slate-400" />
            {activeHint}
          </p>
        )}

        {(selectedAnn || selectedExisting) && (
          <div className="ml-auto flex items-center gap-1">
            {selectedAnn && (
              <>
                <button type="button" className={pill} onClick={duplicateSelected} title="Duplicate (Ctrl+D)">
                  <Copy className="h-3.5 w-3.5" /> Duplicate
                </button>
                <button type="button" className={pill} onClick={bringToFront} title="Bring to front">
                  <BringToFront className="h-3.5 w-3.5" />
                </button>
              </>
            )}
            {selectedExisting && textEdits[selectedExisting.id] && (
              <button type="button" className={pill} onClick={() => commit(undefined, Object.fromEntries(Object.entries(editsRef.current).filter(([k]) => k !== selectedExisting.id)))} title="Restore original text">
                <RotateCcw className="h-3.5 w-3.5" /> Restore
              </button>
            )}
            <button type="button" className={cn(pill, "text-rose-600 hover:bg-rose-50 hover:text-rose-700")} onClick={deleteSelected} title="Delete (Del)">
              <Trash2 className="h-3.5 w-3.5" /> Delete
            </button>
          </div>
        )}
      </div>

      {/* Toast */}
      <div aria-live="polite" className="pointer-events-none relative z-30 h-0">
        {toast && (
          <div
            className={cn(
              "animate-pop-in pointer-events-auto absolute left-1/2 top-3 flex max-w-[92%] -translate-x-1/2 items-center gap-2 rounded-2xl px-4 py-2.5 text-xs font-semibold shadow-lift",
              toast.tone === "error" ? "bg-rose-600 text-white" : "bg-ink text-white"
            )}
          >
            {toast.tone === "success" ? <CheckCircle2 className="h-4 w-4 text-sec" /> : <Info className="h-4 w-4" />}
            {toast.msg}
          </div>
        )}
      </div>

      {/* Workspace */}
      <div ref={wrapRef} className="overflow-x-auto bg-slate-100 p-3 sm:p-4">
        <div className="relative mx-auto bg-white shadow-lift" style={{ width: dispW || undefined, height: dispH || undefined }}>
          <canvas ref={canvasRef} className="block" />
          {rendering && (
            <div className="absolute right-2 top-2 z-30 flex items-center gap-1.5 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-semibold text-slate-600 shadow-soft">
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Rendering
            </div>
          )}

          <div
            ref={overlayRef}
            onPointerDown={onOverlayPointerDown}
            className={cn("absolute inset-0 z-20 touch-none select-none", tool === "select" ? "cursor-default" : tool === "text" ? "cursor-text" : "cursor-crosshair")}
          >
            {/* Existing text */}
            {pageTexts.map((t) => {
              const edited = !!textEdits[t.id];
              const changed = edited && (t.isDeleted || t.currentText !== t.originalText || t.normX !== t.origNormX || t.normY !== t.origNormY || t.styleChanged);
              const isEditing = editingId === t.id;
              const isSelected = selectedId === t.id;
              const showPatch = changed || isEditing;
              const patchX = Math.max(0, t.origNormX - 0.003);
              const patchY = Math.max(0, t.origNormY - 0.003);
              const patchRight = Math.min(1, t.origNormX + t.origNormW + 0.003);
              const patchBottom = Math.min(1, t.origNormY + t.origNormH + 0.003);
              return (
                <React.Fragment key={t.id}>
                  {showPatch && (
                    <div
                      className="pointer-events-none absolute"
                      style={{
                        left: `${patchX * 100}%`,
                        top: `${patchY * 100}%`,
                        width: `${Math.max(0, patchRight - patchX) * 100}%`,
                        height: `${Math.max(0, patchBottom - patchY) * 100}%`,
                        backgroundColor: t.bgColor ?? "#FFFFFF",
                        backgroundImage: t.bgPatchDataUrl ? `url("${t.bgPatchDataUrl}")` : undefined,
                        backgroundSize: "100% 100%",
                      }}
                    />
                  )}
                  {!t.isDeleted && showPatch ? (
                    <TextBox
                      id={t.id}
                      text={t.currentText}
                      normX={t.normX}
                      normY={t.normY}
                      fontSize={t.fontSize}
                      fontFamily={t.fontFamily}
                      isBold={!!t.isBold}
                      color={t.color}
                      scale={scale}
                      selected={isSelected}
                      editing={isEditing}
                      interactive={elementsInteractive}
                      onPointerDown={(e) => onExistingPointerDown(e, t)}
                      onChange={(v) => updateExisting(t.id, { currentText: v }, false)}
                      onFocus={() => (typingBefore.current = typingBefore.current ?? snapshot())}
                      onBlur={() => {
                        commitFrom(typingBefore.current);
                        typingBefore.current = null;
                        setEditingId((id) => (id === t.id ? null : id));
                      }}
                      onFontHandle={(e) => onFontHandlePointerDown(e, "existing", t.id, t.fontSize)}
                    />
                  ) : !t.isDeleted && (isSelected || (elementsInteractive && (tool === "select" || tool === "editText"))) ? (
                    <div
                      onPointerDown={(e) => onExistingPointerDown(e, t)}
                      title="Click to edit · drag to move"
                      className={cn(
                        "absolute cursor-text rounded-[3px] transition-colors",
                        isSelected
                          ? "outline outline-2 outline-indigo-500"
                          : tool === "editText"
                          ? "bg-pdf/10 outline outline-1 outline-dashed outline-pdf/60 hover:bg-pdf/20"
                          : "hover:bg-indigo-500/10 hover:outline hover:outline-1 hover:outline-indigo-500/60"
                      )}
                      style={{
                        left: `${t.origNormX * 100}%`,
                        top: `${t.origNormY * 100}%`,
                        width: `${t.origNormW * 100}%`,
                        height: `${t.origNormH * 100}%`,
                      }}
                    />
                  ) : null}
                </React.Fragment>
              );
            })}

            {/* Annotations */}
            {pageAnns.map((a) => (
              <AnnotationView
                key={a.id}
                ann={a}
                scale={scale}
                selected={selectedId === a.id}
                editing={editingId === a.id}
                interactive={tool === "select" || (a.type === "text" && elementsInteractive)}
                onPointerDown={(e) => onAnnPointerDown(e, a)}
                onHandle={(e, h) => onHandlePointerDown(e, a, h)}
                onFontHandle={(e) => a.type === "text" && onFontHandlePointerDown(e, "ann", a.id, a.fontSize)}
                onTextChange={(v) => updateAnn(a.id, (x) => ({ ...(x as TextAnnotation), text: v }), false)}
                onTextFocus={() => (typingBefore.current = typingBefore.current ?? snapshot())}
                onTextBlur={() => {
                  const before = typingBefore.current;
                  typingBefore.current = null;
                  setEditingId((id) => (id === a.id ? null : id));
                  const cur = annRef.current.find((x) => x.id === a.id);
                  if (cur && cur.type === "text" && !cur.text.trim()) {
                    // Empty text box: drop it. Only record history if it existed before typing.
                    setLiveState(annRef.current.filter((x) => x.id !== a.id));
                    setSelectedId((sel) => (sel === a.id ? null : sel));
                    if (before?.annotations.some((x) => x.id === a.id)) commitFrom(before);
                    return;
                  }
                  commitFrom(before);
                }}
                onDoubleClick={() => {
                  if (a.type === "text") {
                    typingBefore.current = snapshot();
                    setEditingId(a.id);
                  }
                }}
              />
            ))}

            {/* Live previews */}
            {live?.box && (
              <div
                className={cn("pointer-events-none absolute border-2 border-dashed", tool === "whiteout" ? "border-slate-400 bg-white" : tool === "highlight" ? "border-transparent" : "border-indigo-500 bg-indigo-500/10")}
                style={{
                  left: `${live.box.normX * 100}%`,
                  top: `${live.box.normY * 100}%`,
                  width: `${live.box.normW * 100}%`,
                  height: `${live.box.normH * 100}%`,
                  background: tool === "highlight" ? `${highlightColor}59` : undefined,
                }}
              />
            )}
            {live?.points && live.points.length > 1 && (
              <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 1 1" preserveAspectRatio="none">
                <polyline
                  points={live.points.map((p) => `${p.normX},${p.normY}`).join(" ")}
                  fill="none"
                  stroke={ink.color}
                  strokeWidth={ink.width * scale}
                  vectorEffect="non-scaling-stroke"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </div>
        </div>
      </div>

      <p className="px-4 py-3 text-[11px] text-slate-500">
        Tip: drag any element to move it · pull the handles to resize · Shift+drag a corner to ignore proportions · arrow keys nudge · Ctrl+Z undo.
      </p>

      <SignatureDialog isOpen={sigOpen} onClose={() => setSigOpen(false)} onInsertSignature={(url) => void insertImage(url, "signature")} />
    </div>
  );
}

// ---------------------------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------------------------

const pill =
  "inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-100 hover:text-ink";

function Swatches({ label, colors, value, onChange }: { label: string; colors: string[]; value: string; onChange: (c: string) => void }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="font-semibold text-slate-700">{label}</span>
      {colors.map((c) => (
        <button
          key={c}
          type="button"
          onClick={() => onChange(c)}
          aria-label={c === "none" ? "No fill" : c}
          aria-pressed={value.toLowerCase() === c.toLowerCase()}
          className={cn(
            "relative h-6 w-6 rounded-full border border-slate-300 transition-transform",
            value.toLowerCase() === c.toLowerCase() && "ring-2 ring-ink ring-offset-2"
          )}
          style={{ background: c === "none" ? "repeating-linear-gradient(45deg,#fff 0 4px,#ECEAF3 4px 8px)" : c }}
        />
      ))}
      <label className="relative h-6 w-6 cursor-pointer overflow-hidden rounded-full border border-slate-300" title="Custom colour">
        <span className="absolute inset-0" style={{ background: "conic-gradient(red,yellow,lime,cyan,blue,magenta,red)" }} />
        <input type="color" className="absolute inset-0 cursor-pointer opacity-0" value={/^#[0-9a-f]{6}$/i.test(value) ? value : "#000000"} onChange={(e) => onChange(e.target.value)} aria-label={`Custom ${label.toLowerCase()} colour`} />
      </label>
    </div>
  );
}

function Stepper({ label, value, options, onChange }: { label: string; value: number; options: number[]; onChange: (v: number) => void }) {
  return (
    <label className="flex items-center gap-1.5">
      <span className="font-semibold text-slate-700">{label}</span>
      <select value={value} onChange={(e) => onChange(Number(e.target.value))} className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs text-ink">
        {options.map((o) => (
          <option key={o} value={o}>
            {o} pt
          </option>
        ))}
      </select>
    </label>
  );
}

function TextStyleControls({
  value,
  onChange,
}: {
  value: { fontSize: number; fontFamily: FontFamily; isBold: boolean; color: string };
  onChange: (patch: Partial<{ fontSize: number; fontFamily: FontFamily; isBold: boolean; color: string }>) => void;
}) {
  const sizes = FONT_SIZES.includes(value.fontSize) ? FONT_SIZES : [...FONT_SIZES, value.fontSize].sort((a, b) => a - b);
  return (
    <div className="flex flex-wrap items-center gap-3">
      <select value={value.fontFamily} onChange={(e) => onChange({ fontFamily: e.target.value as FontFamily })} className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs text-ink" aria-label="Font">
        <option value="Helvetica">Sans (Helvetica)</option>
        <option value="Times">Serif (Times)</option>
        <option value="Courier">Mono (Courier)</option>
      </select>
      <select value={value.fontSize} onChange={(e) => onChange({ fontSize: Number(e.target.value) })} className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs text-ink" aria-label="Font size">
        {sizes.map((s) => (
          <option key={s} value={s}>
            {s} pt
          </option>
        ))}
      </select>
      <button type="button" onClick={() => onChange({ isBold: !value.isBold })} aria-pressed={value.isBold} className={cn(pill, "px-2.5 font-black", value.isBold && "bg-ink text-white hover:bg-ink")}>
        B
      </button>
      <Swatches label="Colour" colors={COLORS} value={value.color} onChange={(c) => onChange({ color: c })} />
    </div>
  );
}

interface TextBoxProps {
  id: string;
  text: string;
  normX: number;
  normY: number;
  fontSize: number;
  fontFamily: FontFamily;
  isBold: boolean;
  color: string;
  scale: number;
  selected: boolean;
  editing: boolean;
  interactive: boolean;
  placeholder?: string;
  onPointerDown: (e: React.PointerEvent) => void;
  onDoubleClick?: () => void;
  onChange: (v: string) => void;
  onFocus: () => void;
  onBlur: () => void;
  onFontHandle: (e: React.PointerEvent) => void;
}

/** A text element that renders exactly like the exported PDF text (baseline = 1em below the top). */
function TextBox(p: TextBoxProps) {
  const ref = React.useRef<HTMLTextAreaElement>(null);
  React.useEffect(() => {
    if (p.editing && ref.current) {
      ref.current.focus({ preventScroll: true });
      const len = ref.current.value.length;
      ref.current.setSelectionRange(len, len);
    }
  }, [p.editing]);
  const lines = (p.text || p.placeholder || " ").split("\n");
  const cols = Math.max(4, ...lines.map((l) => l.length + 1));
  const style: React.CSSProperties = {
    fontSize: `${p.fontSize * p.scale}px`,
    fontFamily: FONT_CSS[p.fontFamily],
    fontWeight: p.isBold ? 700 : 400,
    color: p.color,
    lineHeight: 1.2,
    paddingTop: "0.05em",
  };
  return (
    <div
      onPointerDown={p.onPointerDown}
      onDoubleClick={p.onDoubleClick}
      className={cn(
        "absolute whitespace-pre rounded-[2px]",
        p.interactive || p.selected ? "pointer-events-auto" : "pointer-events-none",
        p.editing ? "cursor-text outline outline-2 outline-indigo-500" : p.selected ? "cursor-move outline outline-2 outline-indigo-500" : "cursor-move hover:outline hover:outline-1 hover:outline-indigo-500/60"
      )}
      style={{ left: `${p.normX * 100}%`, top: `${p.normY * 100}%`, ...style }}
    >
      {p.editing ? (
        <textarea
          ref={ref}
          value={p.text}
          placeholder={p.placeholder ?? "Type here"}
          onChange={(e) => p.onChange(e.target.value)}
          onFocus={p.onFocus}
          onBlur={p.onBlur}
          onKeyDown={(e) => {
            if (e.key === "Escape") (e.target as HTMLTextAreaElement).blur();
            e.stopPropagation();
          }}
          rows={lines.length}
          cols={cols}
          spellCheck={false}
          className="block resize-none overflow-hidden border-0 bg-white/70 p-0 outline-none placeholder:text-slate-400"
          style={{ ...style, paddingTop: 0, width: `${cols * 0.6}em`, minWidth: "3em" }}
        />
      ) : (
        <span className={cn(!p.text && "text-slate-400")}>{p.text || p.placeholder || "Type here"}</span>
      )}
      {p.selected && !p.editing && (
        <span
          role="button"
          aria-label="Drag to change text size"
          onPointerDown={p.onFontHandle}
          className="absolute -bottom-2 -right-2 h-3.5 w-3.5 cursor-nwse-resize rounded-sm border-2 border-indigo-500 bg-white [@media(pointer:coarse)]:h-5 [@media(pointer:coarse)]:w-5"
        />
      )}
    </div>
  );
}

function AnnotationView({
  ann,
  scale,
  selected,
  editing,
  interactive,
  onPointerDown,
  onHandle,
  onFontHandle,
  onTextChange,
  onTextFocus,
  onTextBlur,
  onDoubleClick,
}: {
  ann: Annotation;
  scale: number;
  selected: boolean;
  editing: boolean;
  interactive: boolean;
  onPointerDown: (e: React.PointerEvent) => void;
  onHandle: (e: React.PointerEvent, h: Handle) => void;
  onFontHandle: (e: React.PointerEvent) => void;
  onTextChange: (v: string) => void;
  onTextFocus: () => void;
  onTextBlur: () => void;
  onDoubleClick: () => void;
}) {
  if (ann.type === "text") {
    return (
      <TextBox
        id={ann.id}
        text={ann.text}
        normX={ann.normX}
        normY={ann.normY}
        fontSize={ann.fontSize}
        fontFamily={ann.fontFamily}
        isBold={!!ann.isBold}
        color={ann.color}
        scale={scale}
        selected={selected}
        editing={editing}
        interactive={interactive}
        onPointerDown={onPointerDown}
        onDoubleClick={onDoubleClick}
        onChange={onTextChange}
        onFocus={onTextFocus}
        onBlur={onTextBlur}
        onFontHandle={onFontHandle}
      />
    );
  }

  const box = getBox(ann);
  if (!box) return null;
  const pos: React.CSSProperties = {
    left: `${box.normX * 100}%`,
    top: `${box.normY * 100}%`,
    width: `${box.normW * 100}%`,
    height: `${box.normH * 100}%`,
  };

  let content: React.ReactNode = null;
  switch (ann.type) {
    case "whiteout":
      content = <div className="h-full w-full" style={{ backgroundColor: ann.color ?? "#FFFFFF", backgroundImage: ann.dataUrl ? `url("${ann.dataUrl}")` : undefined, backgroundSize: "100% 100%" }} />;
      break;
    case "highlight":
      content = <div className="h-full w-full mix-blend-multiply" style={{ background: ann.color, opacity: ann.opacity ?? 0.35 }} />;
      break;
    case "rect":
    case "circle":
      content = (
        <div
          className={cn("h-full w-full", ann.type === "circle" && "rounded-[50%]")}
          style={{ border: `${Math.max(1, ann.strokeWidth * scale)}px solid ${ann.strokeColor}`, background: ann.fillColor ?? "transparent", boxSizing: "border-box" }}
        />
      );
      break;
    case "image":
    case "signature":
      // eslint-disable-next-line @next/next/no-img-element
      content = <img src={ann.dataUrl} alt="" draggable={false} className="pointer-events-none h-full w-full select-none" style={{ objectFit: "fill" }} />;
      break;
    case "draw": {
      const pts = ann.points.map((p) => `${(p.normX - box.normX) / box.normW},${(p.normY - box.normY) / box.normH}`).join(" ");
      content = (
        <svg className="h-full w-full overflow-visible" viewBox="0 0 1 1" preserveAspectRatio="none">
          <polyline points={pts} fill="none" stroke={ann.color} strokeWidth={ann.strokeWidth * scale} vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
      break;
    }
  }

  return (
    <div
      onPointerDown={onPointerDown}
      className={cn("absolute", interactive || selected ? "pointer-events-auto cursor-move" : "pointer-events-none", selected ? "outline outline-2 outline-indigo-500" : interactive && "hover:outline hover:outline-1 hover:outline-indigo-500/60")}
      style={pos}
    >
      {content}
      {selected && !editing &&
        HANDLES.map((h) => (
          <span
            key={h}
            role="button"
            aria-label={`Resize ${h}`}
            onPointerDown={(e) => onHandle(e, h)}
            className={cn(
              "absolute z-10 h-3 w-3 rounded-sm border-2 border-indigo-500 bg-white shadow-soft [@media(pointer:coarse)]:h-5 [@media(pointer:coarse)]:w-5",
              HANDLE_POS[h]
            )}
          />
        ))}
    </div>
  );
}

const HANDLE_POS: Record<Handle, string> = {
  nw: "-left-1.5 -top-1.5 cursor-nwse-resize [@media(pointer:coarse)]:-left-2.5 [@media(pointer:coarse)]:-top-2.5",
  n: "left-1/2 -top-1.5 -translate-x-1/2 cursor-ns-resize [@media(pointer:coarse)]:-top-2.5",
  ne: "-right-1.5 -top-1.5 cursor-nesw-resize [@media(pointer:coarse)]:-right-2.5 [@media(pointer:coarse)]:-top-2.5",
  e: "-right-1.5 top-1/2 -translate-y-1/2 cursor-ew-resize [@media(pointer:coarse)]:-right-2.5",
  se: "-bottom-1.5 -right-1.5 cursor-nwse-resize [@media(pointer:coarse)]:-bottom-2.5 [@media(pointer:coarse)]:-right-2.5",
  s: "-bottom-1.5 left-1/2 -translate-x-1/2 cursor-ns-resize [@media(pointer:coarse)]:-bottom-2.5",
  sw: "-bottom-1.5 -left-1.5 cursor-nesw-resize [@media(pointer:coarse)]:-bottom-2.5 [@media(pointer:coarse)]:-left-2.5",
  w: "-left-1.5 top-1/2 -translate-y-1/2 cursor-ew-resize [@media(pointer:coarse)]:-left-2.5",
};
