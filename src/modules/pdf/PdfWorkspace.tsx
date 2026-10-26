"use client";

import * as React from "react";
import { zipSync } from "fflate";
import type { PDFDocumentProxy } from "pdfjs-dist";
import {
  PageItem,
  SourceFile,
  SOURCE_COLORS,
  rotatePages,
  deletePages,
  movePage,
  moveSelection,
  duplicatePages,
  insertBlankAfter,
  reversePages,
  parseRanges,
  chunkIndexes,
  formatIndexes,
  baseName,
  safeFilename,
  rotatedSize,
  A4,
} from "./pages";
import { buildPdf, buildPdfGroups, loadPdf, EncryptedPdfError, SourceData, ImagePageSize, DEFAULT_BUILD_OPTIONS } from "./build";
import { prepareImage } from "./image";
import { openPdfForRendering, renderPageToUrl } from "./render";
import { addPdfPageMarks, type VisiblePdfStamp } from "./marks";
import { formatBytes, dedupeFilenames } from "@/modules/image-compressor/engine";
import { Button } from "@/components/ui/Button";
import {
  UploadCloud,
  FilePlus2,
  RotateCcw,
  RotateCw,
  Trash2,
  Copy,
  ChevronLeft,
  ChevronRight,
  Undo2,
  Redo2,
  CheckSquare,
  Square,
  FileDown,
  Scissors,
  Loader2,
  AlertTriangle,
  X,
  ArrowUpDown,
  FileText,
  ImageIcon,
  Plus,
  Check,
} from "lucide-react";

export type PdfWorkspaceMode = "merge" | "split" | "organize" | "rotate" | "delete" | "extract" | "images" | "page-marks";

type SplitMode = "selected" | "each" | "ranges" | "every";

const ACCEPT_PDF = "application/pdf";
const ACCEPT_IMAGES = "image/jpeg,image/png,image/webp,image/gif,image/bmp";
const MAX_FILE_BYTES = 200 * 1024 * 1024;
const MAX_WORKSPACE_BYTES = 50 * 1024 * 1024;
const MAX_WORKSPACE_PAGES = 500;
const MAX_SPLIT_GROUPS = 100;
const MAX_IMPORT_FILES = 20;
const MAX_EXPORT_BYTES = 100 * 1024 * 1024;
const THUMB_WIDTH = 160;

let counter = 0;
const uid = (p: string) => `${p}-${Date.now().toString(36)}-${(counter++).toString(36)}`;

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

const thumbKey = (p: PageItem) => `${p.sourceId}:${p.sourceIndex}`;

const MODE_DEFAULTS: Record<PdfWorkspaceMode, { tab: "save" | "split"; split: SplitMode; hint: string }> = {
  merge: { tab: "save", split: "ranges", hint: "Add two or more PDFs, drag pages into the order you want, then download one merged PDF." },
  split: { tab: "split", split: "ranges", hint: "Choose how to split — by ranges, every N pages, or every page as its own PDF." },
  organize: { tab: "save", split: "ranges", hint: "Drag to reorder, rotate, duplicate, delete, or insert blank pages — then save." },
  rotate: { tab: "save", split: "ranges", hint: "Rotate individual pages with the arrows, or select pages and rotate them together." },
  delete: { tab: "save", split: "ranges", hint: "Click pages to select them, press Delete, then download the cleaned-up PDF." },
  extract: { tab: "split", split: "selected", hint: "Click the pages you want to keep, then extract them into a new PDF." },
  images: { tab: "save", split: "ranges", hint: "Add JPG or PNG images — each becomes a page. Reorder them, then download your PDF." },
  "page-marks": { tab: "save", split: "ranges", hint: "Add page numbers or a clearly visible COPY, DRAFT, SAMPLE, or CONFIDENTIAL label." },
};

interface PdfWorkspaceProps {
  mode?: PdfWorkspaceMode;
}

export function PdfWorkspace({ mode = "organize" }: PdfWorkspaceProps) {
  const defaults = MODE_DEFAULTS[mode];
  const [sources, setSources] = React.useState<SourceFile[]>([]);
  const [pages, setPages] = React.useState<PageItem[]>([]);
  const [selected, setSelected] = React.useState<Set<string>>(new Set());
  const [thumbs, setThumbs] = React.useState<Record<string, string>>({});
  const [loading, setLoading] = React.useState(0);
  const [errors, setErrors] = React.useState<string[]>([]);
  const [dragging, setDragging] = React.useState(false);
  const [dragPageId, setDragPageId] = React.useState<string | null>(null);
  const [dropIndex, setDropIndex] = React.useState<number | null>(null);
  const [exportTab, setExportTab] = React.useState<"save" | "split">(defaults.tab);
  const [splitMode, setSplitMode] = React.useState<SplitMode>(defaults.split);
  const [rangeText, setRangeText] = React.useState("");
  const [everyN, setEveryN] = React.useState(2);
  const [fileName, setFileName] = React.useState("");
  const [imagePageSize, setImagePageSize] = React.useState<ImagePageSize>("a4");
  const [includePageNumbers, setIncludePageNumbers] = React.useState(true);
  const [stamp, setStamp] = React.useState<VisiblePdfStamp>("");
  const [exporting, setExporting] = React.useState(false);
  const [done, setDone] = React.useState("");
  const [history, setHistory] = React.useState<{ past: PageItem[][]; future: PageItem[][] }>({ past: [], future: [] });
  const lastClicked = React.useRef<string | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const sourceData = React.useRef(new Map<string, SourceData>());
  const renderDocs = React.useRef(new Map<string, Promise<PDFDocumentProxy>>());
  const sourceBytes = React.useRef(new Map<string, Uint8Array>());
  const importGeneration = React.useRef(0);
  const imageUrls = React.useRef(new Map<string, string>());
  const thumbQueue = React.useRef<PageItem[]>([]);
  const thumbPending = React.useRef(new Set<string>());
  const thumbsRef = React.useRef<Record<string, string>>({});
  const activeRenders = React.useRef(0);
  const commitThumbs = React.useCallback((next: Record<string, string>) => {
    thumbsRef.current = next;
    setThumbs(next);
  }, []);

  // Clean up object URLs and pdf.js documents on unmount.
  React.useEffect(() => {
    const urls = imageUrls.current;
    const docs = renderDocs.current;
    return () => {
      importGeneration.current++;
      Object.values(thumbsRef.current).forEach((u) => URL.revokeObjectURL(u));
      urls.forEach((u) => URL.revokeObjectURL(u));
      docs.forEach((p) => p.then((d) => d.destroy()).catch(() => undefined));
    };
  }, []);

  // Page list + undo history live in refs (source of truth) and are mirrored to state for rendering.
  const pagesRef = React.useRef<PageItem[]>([]);
  const historyRef = React.useRef<{ past: PageItem[][]; future: PageItem[][] }>({ past: [], future: [] });

  const commitPages = React.useCallback((next: PageItem[]) => {
    pagesRef.current = next;
    setPages(next);
    setHistory({ ...historyRef.current });
  }, []);

  /** Applies a page change and records it for undo. */
  const applyPages = React.useCallback(
    (updater: (prev: PageItem[]) => PageItem[]) => {
      const prev = pagesRef.current;
      const next = updater(prev);
      if (next === prev) return;
      historyRef.current = { past: [...historyRef.current.past.slice(-49), prev], future: [] };
      commitPages(next);
      setDone("");
    },
    [commitPages]
  );

  const undo = React.useCallback(() => {
    const h = historyRef.current;
    if (!h.past.length) return;
    const prev = h.past[h.past.length - 1];
    historyRef.current = { past: h.past.slice(0, -1), future: [pagesRef.current, ...h.future] };
    commitPages(prev);
  }, [commitPages]);

  const redo = React.useCallback(() => {
    const h = historyRef.current;
    if (!h.future.length) return;
    const [next, ...rest] = h.future;
    historyRef.current = { past: [...h.past, pagesRef.current], future: rest };
    commitPages(next);
  }, [commitPages]);

  // ---------- Thumbnail rendering queue (2 at a time, only for visible pages) ----------
  const pumpThumbs = React.useCallback(() => {
    while (activeRenders.current < 2 && thumbQueue.current.length) {
      const page = thumbQueue.current.shift()!;
      const key = thumbKey(page);
      const docPromise = page.sourceId ? renderDocs.current.get(page.sourceId) : undefined;
      if (!docPromise) {
        thumbPending.current.delete(key);
        continue;
      }
      activeRenders.current++;
      docPromise
        .then((doc) => renderPageToUrl(doc, page.sourceIndex, THUMB_WIDTH))
        .then((url) => {
          if (!page.sourceId || !sourceData.current.has(page.sourceId)) {
            URL.revokeObjectURL(url);
            return;
          }
          commitThumbs({ ...thumbsRef.current, [key]: url });
        })
        .catch(() => undefined)
        .finally(() => {
          thumbPending.current.delete(key);
          activeRenders.current--;
          pumpThumbs();
        });
    }
  }, [commitThumbs]);

  const requestThumb = React.useCallback(
    (page: PageItem) => {
      if (page.kind !== "pdf") return;
      const key = thumbKey(page);
      if (thumbsRef.current[key] || thumbPending.current.has(key)) return;
      thumbPending.current.add(key);
      thumbQueue.current.push(page);
      pumpThumbs();
    },
    [pumpThumbs]
  );

  // ---------- Adding files ----------
  const addFiles = async (list: FileList | File[]) => {
    if (mode === "page-marks" && sources.length > 0) {
      setErrors(["Start over before choosing a different PDF."]);
      return;
    }
    const submittedFiles = Array.from(list);
    const maxFiles = mode === "page-marks" ? 1 : MAX_IMPORT_FILES;
    const files = submittedFiles.slice(0, maxFiles);
    if (!files.length) return;
    const generation = importGeneration.current;
    const newErrors: string[] = [];
    if (submittedFiles.length > maxFiles) {
      newErrors.push(
        mode === "page-marks"
          ? "Choose one PDF at a time. Start over to work on a different file."
          : `Only ${MAX_IMPORT_FILES} files can be added at once. The first ${MAX_IMPORT_FILES} are being processed.`
      );
    }
    setLoading((n) => n + files.length);
    const added: { source: SourceFile; pages: PageItem[] }[] = [];

    for (const file of files) {
      if (generation !== importGeneration.current) break;
      try {
        const isPdf = file.type === "application/pdf" || /\.pdf$/i.test(file.name);
        const isImage = mode !== "page-marks" && file.type.startsWith("image/");
        if (!isPdf && !isImage) {
          newErrors.push(`${file.name}: ${mode === "page-marks" ? "choose a PDF file." : "not a PDF or image file."}`);
          continue;
        }
        if (file.size > MAX_FILE_BYTES) {
          newErrors.push(`${file.name}: larger than ${formatBytes(MAX_FILE_BYTES)}.`);
          continue;
        }
        const usedBytes = [...sourceBytes.current.values()].reduce((sum, bytes) => sum + bytes.byteLength, 0) +
          [...sourceData.current.values()].reduce((sum, source) => sum + (source.kind === "image" ? source.bytes.byteLength : 0), 0);
        if (file.size > MAX_WORKSPACE_BYTES - usedBytes) {
          newErrors.push(`${file.name}: the workspace has a ${formatBytes(MAX_WORKSPACE_BYTES)} combined input limit. Remove files before adding more.`);
          continue;
        }
        const id = uid("src");
        const color = SOURCE_COLORS[(sources.length + added.length) % SOURCE_COLORS.length];
        if (isPdf) {
          const bytes = new Uint8Array(await file.arrayBuffer());
          if (generation !== importGeneration.current) continue;
          const doc = await loadPdf(bytes);
          if (generation !== importGeneration.current) continue;
          const docPages = doc.getPages().map((pg, i) => {
            const { width, height } = pg.getSize();
            const own = pg.getRotation().angle;
            const size = rotatedSize(width, height, own);
            return { id: uid("pg"), kind: "pdf" as const, sourceId: id, sourceIndex: i, rotation: 0 as const, ...size };
          });
          const pendingPageCount = added.reduce((sum, entry) => sum + entry.pages.length, 0);
          if (!docPages.length || pagesRef.current.length + pendingPageCount + docPages.length > MAX_WORKSPACE_PAGES) {
            newErrors.push(!docPages.length ? `${file.name}: this PDF has no pages.` : `${file.name}: the workspace is limited to ${MAX_WORKSPACE_PAGES} pages.`);
            continue;
          }
          sourceData.current.set(id, { kind: "pdf", doc });
          sourceBytes.current.set(id, bytes);
          renderDocs.current.set(id, openPdfForRendering(bytes));
          added.push({ source: { id, name: file.name, kind: "pdf", color, pageCount: docPages.length }, pages: docPages });
        } else {
          const img = await prepareImage(file);
          if (generation !== importGeneration.current) continue;
          const pendingPageCount = added.reduce((sum, entry) => sum + entry.pages.length, 0);
          if (pagesRef.current.length + pendingPageCount + 1 > MAX_WORKSPACE_PAGES) {
            newErrors.push(`${file.name}: the workspace is limited to ${MAX_WORKSPACE_PAGES} pages.`);
            continue;
          }
          sourceData.current.set(id, { kind: "image", ...img });
          const url = URL.createObjectURL(new Blob([img.bytes as BlobPart], { type: img.format === "jpg" ? "image/jpeg" : "image/png" }));
          imageUrls.current.set(id, url);
          added.push({
            source: { id, name: file.name, kind: "image", color, pageCount: 1 },
            pages: [{ id: uid("pg"), kind: "image", sourceId: id, sourceIndex: 0, rotation: 0, width: img.width, height: img.height }],
          });
        }
      } catch (e) {
        newErrors.push(
          e instanceof EncryptedPdfError
            ? `${file.name}: password-protected PDFs aren't supported yet. Remove the password first.`
            : `${file.name}: ${e instanceof Error ? e.message : "couldn't be opened. The file may be damaged."}`
        );
      } finally {
        setLoading((n) => Math.max(0, n - 1));
      }
    }

    if (generation !== importGeneration.current) return;
    setErrors(newErrors);
    if (!added.length) return;
    setSources((s) => [...s, ...added.map((a) => a.source)]);
    applyPages((prev) => [...prev, ...added.flatMap((a) => a.pages)]);
    if (!fileName) {
      const first = added[0].source.name;
      setFileName(
        safeFilename(
          mode === "merge" && sources.length + added.length > 1
            ? "merged"
            : mode === "images"
            ? baseName(first) + "-images"
            : mode === "page-marks"
            ? baseName(first) + "-labeled"
            : baseName(first) + (mode === "merge" || mode === "split" || mode === "extract" ? "" : "-edited")
        )
      );
    }
  };

  const removeSource = (id: string) => {
    const removedPages = pagesRef.current.filter((p) => p.sourceId === id);
    const nextPages = pagesRef.current.filter((p) => p.sourceId !== id);
    for (const page of removedPages) {
      const key = thumbKey(page);
      const url = thumbsRef.current[key];
      if (url) URL.revokeObjectURL(url);
      thumbPending.current.delete(key);
      delete thumbsRef.current[key];
    }
    const nextThumbs = { ...thumbsRef.current };
    for (const page of removedPages) delete nextThumbs[thumbKey(page)];
    commitThumbs(nextThumbs);
    thumbQueue.current = thumbQueue.current.filter((page) => page.sourceId !== id);
    historyRef.current = { past: [], future: [] };
    commitPages(nextPages);
    setSelected((prev) => new Set([...prev].filter((pageId) => nextPages.some((p) => p.id === pageId))));
    setDone("");
    sourceData.current.delete(id);
    sourceBytes.current.delete(id);
    const imageUrl = imageUrls.current.get(id);
    if (imageUrl) URL.revokeObjectURL(imageUrl);
    imageUrls.current.delete(id);
    const renderDoc = renderDocs.current.get(id);
    renderDoc?.then((doc) => doc.destroy()).catch(() => undefined);
    renderDocs.current.delete(id);
    setSources((s) => s.filter((x) => x.id !== id));
  };

  const clearAll = () => {
    importGeneration.current++;
    setLoading(0);
    Object.values(thumbsRef.current).forEach((u) => URL.revokeObjectURL(u));
    imageUrls.current.forEach((u) => URL.revokeObjectURL(u));
    renderDocs.current.forEach((p) => p.then((d) => d.destroy()).catch(() => undefined));
    sourceData.current.clear();
    sourceBytes.current.clear();
    renderDocs.current.clear();
    imageUrls.current.clear();
    thumbQueue.current = [];
    thumbPending.current.clear();
    commitThumbs({});
    setSources([]);
    historyRef.current = { past: [], future: [] };
    commitPages([]);
    setSelected(new Set());
    setErrors([]);
    setDone("");
    setFileName("");
  };

  // ---------- Selection ----------
  const toggleSelect = (id: string, e: React.MouseEvent | React.KeyboardEvent) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if ("shiftKey" in e && e.shiftKey && lastClicked.current) {
        const a = pages.findIndex((p) => p.id === lastClicked.current);
        const b = pages.findIndex((p) => p.id === id);
        if (a >= 0 && b >= 0) {
          const [from, to] = a < b ? [a, b] : [b, a];
          for (let i = from; i <= to; i++) next.add(pages[i].id);
          return next;
        }
      }
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    lastClicked.current = id;
  };

  const allSelected = pages.length > 0 && selected.size === pages.length;
  const selectedIds = React.useMemo(() => new Set(pages.filter((p) => selected.has(p.id)).map((p) => p.id)), [pages, selected]);
  const selectedIndexes = pages.map((p, i) => (selected.has(p.id) ? i : -1)).filter((i) => i >= 0);

  // Keyboard shortcuts: Ctrl/Cmd+Z, Ctrl+Shift+Z / Ctrl+Y, Delete, Ctrl+A
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) return;
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
      } else if (mod && e.key.toLowerCase() === "y") {
        e.preventDefault();
        redo();
      } else if ((e.key === "Delete" || e.key === "Backspace") && selectedIds.size) {
        e.preventDefault();
        applyPages((prev) => deletePages(prev, selectedIds));
        setSelected(new Set());
      } else if (mod && e.key.toLowerCase() === "a" && pages.length) {
        e.preventDefault();
        setSelected(new Set(pages.map((p) => p.id)));
      } else if (e.key === "Escape" && selectedIds.size) {
        e.preventDefault();
        setSelected(new Set());
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [undo, redo, applyPages, selectedIds, pages]);

  // ---------- Drag & drop reordering ----------
  const onCardDragStart = (e: React.DragEvent, id: string) => {
    setDragPageId(id);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", id);
  };
  const onCardDragOver = (e: React.DragEvent, index: number) => {
    if (!dragPageId) return;
    e.preventDefault();
    e.stopPropagation();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const after = e.clientX > rect.left + rect.width / 2;
    setDropIndex(after ? index + 1 : index);
  };
  const onCardDrop = (e: React.DragEvent) => {
    if (!dragPageId) return;
    e.preventDefault();
    e.stopPropagation();
    const to = dropIndex ?? pages.length;
    const id = dragPageId;
    applyPages((prev) => {
      if (selectedIds.has(id) && selectedIds.size > 1) return moveSelection(prev, selectedIds, to);
      const from = prev.findIndex((p) => p.id === id);
      return movePage(prev, from, from < to ? to - 1 : to);
    });
    setDragPageId(null);
    setDropIndex(null);
  };

  // ---------- Export ----------
  const splitGroups = React.useMemo((): { groups: number[][]; error?: string } => {
    if (!pages.length) return { groups: [] };
    switch (splitMode) {
      case "selected":
        return selectedIndexes.length ? { groups: [selectedIndexes] } : { groups: [], error: "Select the pages you want to extract." };
      case "each":
        return { groups: pages.map((_, i) => [i]) };
      case "every":
        return { groups: chunkIndexes(pages.length, everyN) };
      case "ranges":
        return parseRanges(rangeText || `1-${pages.length}`, pages.length);
    }
  }, [splitMode, pages, selectedIndexes, everyN, rangeText]);

  const hasImages = pages.some((p) => p.kind === "image");
  const outName = safeFilename(fileName || "document");

  const runExport = async () => {
    setExporting(true);
    setDone("");
    setErrors([]);
    try {
      const opts = { ...DEFAULT_BUILD_OPTIONS, imagePageSize, title: outName };
      const addMarks = (bytes: Uint8Array) =>
        mode === "page-marks" ? addPdfPageMarks(bytes, { includePageNumbers, stamp }) : Promise.resolve(bytes);
      if (exportTab === "save") {
        const bytes = await addMarks(await buildPdf(pages, sourceData.current, opts));
        if (bytes.byteLength > MAX_EXPORT_BYTES) throw new Error(`The PDF output exceeded the ${formatBytes(MAX_EXPORT_BYTES)} download limit. Remove pages or export smaller groups.`);
        triggerDownload(new Blob([bytes as BlobPart], { type: "application/pdf" }), `${outName}.pdf`);
        setDone(`Saved ${outName}.pdf • ${pages.length} page${pages.length > 1 ? "s" : ""} • ${formatBytes(bytes.length)}`);
      } else {
        const { groups, error } = splitGroups;
        if (error || !groups.length) throw new Error(error || "Nothing to export");
        if (groups.length > MAX_SPLIT_GROUPS) throw new Error(`Split exports are limited to ${MAX_SPLIT_GROUPS} output files at a time.`);
        const rawFiles = await buildPdfGroups(pages, groups, sourceData.current, opts, MAX_EXPORT_BYTES);
        const files = await Promise.all(rawFiles.map(addMarks));
        if (files.reduce((sum, file) => sum + file.byteLength, 0) > MAX_EXPORT_BYTES) {
          throw new Error(`The PDF output exceeded the ${formatBytes(MAX_EXPORT_BYTES)} download limit. Export fewer pages at a time.`);
        }
        if (files.length === 1) {
          const name = `${outName}-pages-${formatIndexes(groups[0]).replace(/\s/g, "")}.pdf`;
          triggerDownload(new Blob([files[0] as BlobPart], { type: "application/pdf" }), name);
          setDone(`Saved ${name} • ${groups[0].length} page${groups[0].length > 1 ? "s" : ""}`);
        } else {
          const names = dedupeFilenames(
            groups.map((g, i) => `${outName}-${String(i + 1).padStart(2, "0")}-p${formatIndexes(g).replace(/\s/g, "")}.pdf`)
          );
          const entries: Record<string, Uint8Array> = {};
          files.forEach((f, i) => (entries[names[i]] = f));
          const zip = zipSync(entries, { level: 0 });
          if (zip.byteLength > MAX_EXPORT_BYTES) throw new Error(`The ZIP output exceeded the ${formatBytes(MAX_EXPORT_BYTES)} download limit.`);
          triggerDownload(new Blob([zip as BlobPart], { type: "application/zip" }), `${outName}-split.zip`);
          setDone(`Saved ${files.length} PDFs in ${outName}-split.zip • ${formatBytes(zip.length)}`);
        }
      }
    } catch (e) {
      setErrors([e instanceof Error ? e.message : "Something went wrong while creating the PDF."]);
    } finally {
      setExporting(false);
    }
  };

  // ---------- Render ----------
  const acceptAttr = mode === "page-marks" ? ACCEPT_PDF : mode === "images" ? `${ACCEPT_IMAGES},${ACCEPT_PDF}` : `${ACCEPT_PDF},${ACCEPT_IMAGES}`;
  const sourceMap = new Map(sources.map((s) => [s.id, s]));
  const pageNumberOfIndex = (i: number) => i + 1;

  const dropzone = (
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
        if (dragPageId) return;
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        if (dragPageId) return;
        e.preventDefault();
        setDragging(false);
        if (e.dataTransfer.files?.length) void addFiles(e.dataTransfer.files);
      }}
      className={`flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-12 text-center transition-colors ${
        dragging
          ? "border-ink bg-slate-100"
          : "border-slate-300 bg-slate-50/60 hover:border-slate-400 hover:bg-slate-100/60"
      }`}
    >
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
        <UploadCloud className="h-6 w-6 text-ink" />
      </div>
      <p className="text-sm font-semibold text-slate-900 dark:text-white">
        {mode === "images" ? "Drop images here or click to browse" : mode === "page-marks" ? "Drop one PDF here or click to browse" : "Drop PDF files here or click to browse"}
      </p>
      <p className="mt-1 text-xs text-slate-500">
        {mode === "images" ? "JPG, PNG, WebP, GIF, BMP — PDFs can be added too" : mode === "page-marks" ? "One PDF • 50 MB maximum" : "PDF files and images (JPG, PNG) • 20 files per import • 50 MB combined • 500 pages per workspace"}
      </p>
    </div>
  );

  const hiddenInput = (
    <input
      ref={inputRef}
      type="file"
      multiple={mode !== "page-marks"}
      accept={acceptAttr}
      className="hidden"
      onChange={(e) => {
        if (e.target.files?.length) void addFiles(e.target.files);
        e.target.value = "";
      }}
    />
  );

  const errorBox = errors.length > 0 && (
    <div className="mt-4 flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300">
      <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
      <div className="space-y-0.5">
        {errors.map((er, i) => (
          <p key={i}>{er}</p>
        ))}
      </div>
    </div>
  );

  if (!pages.length) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        {dropzone}
        {hiddenInput}
        {loading > 0 && (
          <p className="mt-4 flex items-center justify-center gap-2 text-sm text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin" /> Opening files…
          </p>
        )}
        {errorBox}
        <p className="mt-4 text-center text-xs text-slate-500">{defaults.hint}</p>
      </div>
    );
  }

  const toolbarBtn =
    "inline-flex h-9 items-center gap-1.5 rounded-lg px-2.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-100 disabled:pointer-events-none disabled:opacity-40 dark:text-slate-300 dark:hover:bg-slate-800";
  const iconBtn =
    "inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 disabled:opacity-30 dark:hover:bg-slate-800 dark:hover:text-white";
  const actionTargets = selectedIds.size ? selectedIds : null;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      {hiddenInput}
      {/* Source files */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 p-4 dark:border-slate-800">
        {sources.map((s) => (
          <span
            key={s.id}
            className="inline-flex max-w-full items-center gap-2 rounded-lg border border-slate-200 bg-white py-1 pl-2 pr-1 text-xs dark:border-slate-700 dark:bg-slate-900"
          >
            <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: s.color }} />
            {s.kind === "pdf" ? <FileText className="h-3.5 w-3.5 text-slate-400" /> : <ImageIcon className="h-3.5 w-3.5 text-slate-400" />}
            <span className="truncate font-medium text-slate-800 dark:text-slate-200 max-w-[180px]" title={s.name}>
              {s.name}
            </span>
            <span className="text-slate-400">{s.pageCount}p</span>
            <button
              type="button"
              onClick={() => removeSource(s.id)}
              className="rounded p-0.5 text-slate-400 hover:bg-slate-100 hover:text-rose-600 dark:hover:bg-slate-800"
              aria-label={`Remove ${s.name}`}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </span>
        ))}
        {!(mode === "page-marks" && sources.length > 0) && (
          <Button type="button" size="sm" variant="outline" onClick={() => inputRef.current?.click()}>
            <FilePlus2 className="h-4 w-4" /> Add files
          </Button>
        )}
        {loading > 0 && (
          <span className="inline-flex items-center gap-1.5 text-xs text-slate-500">
            <Loader2 className="h-3.5 w-3.5 animate-spin" /> Opening…
          </span>
        )}
        <button type="button" onClick={clearAll} className="ml-auto text-xs font-medium text-slate-500 hover:text-rose-600">
          Start over
        </button>
      </div>

      {/* Toolbar */}
      <div className="sticky top-16 z-10 flex flex-wrap items-center gap-1 border-b border-slate-100 bg-white/95 px-3 py-2 backdrop-blur dark:border-slate-800 dark:bg-slate-900/95">
        <button
          type="button"
          className={toolbarBtn}
          onClick={() => setSelected(allSelected ? new Set() : new Set(pages.map((p) => p.id)))}
        >
          {allSelected ? <CheckSquare className="h-4 w-4 text-ink" /> : <Square className="h-4 w-4" />}
          {selected.size ? `${selected.size} selected` : "Select all"}
        </button>
        <span className="mx-1 h-5 w-px bg-slate-200 dark:bg-slate-700" />
        <button
          type="button"
          className={toolbarBtn}
          title="Rotate left"
          onClick={() => applyPages((prev) => rotatePages(prev, actionTargets ?? new Set(prev.map((p) => p.id)), -90))}
        >
          <RotateCcw className="h-4 w-4" />
          <span className="hidden sm:inline">{actionTargets ? "Rotate" : "Rotate all"}</span>
        </button>
        <button
          type="button"
          className={toolbarBtn}
          title="Rotate right"
          onClick={() => applyPages((prev) => rotatePages(prev, actionTargets ?? new Set(prev.map((p) => p.id)), 90))}
        >
          <RotateCw className="h-4 w-4" />
        </button>
        <button
          type="button"
          className={toolbarBtn}
          disabled={!actionTargets}
          onClick={() => {
            if (!actionTargets) return;
            const counts = new Map<string, number>();
            for (const page of pages) {
              const key = page.kind === "blank" ? page.id : `${page.sourceId}:${page.sourceIndex}`;
              counts.set(key, (counts.get(key) ?? 0) + 1);
            }
            const wouldExceedCopies = pages.some((page) => {
              if (!actionTargets.has(page.id)) return false;
              const key = page.kind === "blank" ? page.id : `${page.sourceId}:${page.sourceIndex}`;
              return (counts.get(key) ?? 0) >= 2;
            });
            if (pages.length + actionTargets.size > MAX_WORKSPACE_PAGES || wouldExceedCopies) {
              setErrors([wouldExceedCopies ? "A source page can be included at most twice per workspace." : `The workspace is limited to ${MAX_WORKSPACE_PAGES} pages.`]);
              return;
            }
            applyPages((prev) => duplicatePages(prev, actionTargets, () => uid("pg")));
          }}
          title="Duplicate selected"
        >
          <Copy className="h-4 w-4" />
          <span className="hidden sm:inline">Duplicate</span>
        </button>
        <button
          type="button"
          className={`${toolbarBtn} hover:text-rose-600`}
          disabled={!actionTargets}
          onClick={() => {
            if (!actionTargets) return;
            applyPages((prev) => deletePages(prev, actionTargets));
            setSelected(new Set());
          }}
          title="Delete selected (Del)"
        >
          <Trash2 className="h-4 w-4" />
          <span className="hidden sm:inline">Delete</span>
        </button>
        <button
          type="button"
          className={toolbarBtn}
          onClick={() => {
            if (pages.length >= MAX_WORKSPACE_PAGES) {
              setErrors([`The workspace is limited to ${MAX_WORKSPACE_PAGES} pages.`]);
              return;
            }
            const last = selectedIndexes.length ? selectedIndexes[selectedIndexes.length - 1] : pages.length - 1;
            const ref = pages[last];
            applyPages((prev) =>
              insertBlankAfter(prev, last, () => uid("pg"), ref && ref.kind !== "image" ? { width: ref.width, height: ref.height } : A4)
            );
          }}
          title="Insert blank page"
        >
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Blank page</span>
        </button>
        <button type="button" className={toolbarBtn} onClick={() => applyPages(reversePages)} title="Reverse page order">
          <ArrowUpDown className="h-4 w-4" />
          <span className="hidden lg:inline">Reverse</span>
        </button>
        <span className="ml-auto" />
        <button type="button" className={toolbarBtn} disabled={!history.past.length} onClick={undo} title="Undo (Ctrl+Z)">
          <Undo2 className="h-4 w-4" />
        </button>
        <button type="button" className={toolbarBtn} disabled={!history.future.length} onClick={redo} title="Redo (Ctrl+Shift+Z)">
          <Redo2 className="h-4 w-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px]">
        {/* Page grid */}
        <div
          className="min-w-0 p-4 sm:p-5"
          onDragOver={(e) => {
            if (dragPageId) {
              e.preventDefault();
              return;
            }
            e.preventDefault();
          }}
          onDrop={(e) => {
            if (dragPageId) {
              onCardDrop(e);
              return;
            }
            e.preventDefault();
            if (e.dataTransfer.files?.length) void addFiles(e.dataTransfer.files);
          }}
        >
          <p className="mb-3 text-xs text-slate-500">
            {pages.length} page{pages.length > 1 ? "s" : ""} • Click to select (Shift+click for a range) • Drag to reorder
          </p>
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4">
            {pages.map((p, i) => (
              <PageCard
                key={p.id}
                page={p}
                index={i}
                total={pages.length}
                source={p.sourceId ? sourceMap.get(p.sourceId) : undefined}
                thumbUrl={p.kind === "pdf" ? thumbs[thumbKey(p)] : p.kind === "image" && p.sourceId ? imageUrls.current.get(p.sourceId) : undefined}
                selected={selected.has(p.id)}
                isDragging={dragPageId === p.id || (dragPageId !== null && selectedIds.has(dragPageId) && selectedIds.has(p.id))}
                dropBefore={dropIndex === i}
                dropAfter={dropIndex === pages.length && i === pages.length - 1}
                onVisible={requestThumb}
                onToggle={(e) => toggleSelect(p.id, e)}
                onRotate={(d) => applyPages((prev) => rotatePages(prev, new Set([p.id]), d))}
                onDelete={() => {
                  applyPages((prev) => deletePages(prev, new Set([p.id])));
                  setSelected((s) => {
                    const n = new Set(s);
                    n.delete(p.id);
                    return n;
                  });
                }}
                onMove={(d) => applyPages((prev) => movePage(prev, i, i + d))}
                onDragStart={(e) => onCardDragStart(e, p.id)}
                onDragOver={(e) => onCardDragOver(e, i)}
                onDragEnd={() => {
                  setDragPageId(null);
                  setDropIndex(null);
                }}
                iconBtn={iconBtn}
                pageNumber={pageNumberOfIndex(i)}
              />
            ))}
          </ul>
        </div>

        {/* Export panel */}
        <aside className="border-t border-slate-100 p-4 sm:p-5 lg:border-l lg:border-t-0 dark:border-slate-800">
          <div className="lg:sticky lg:top-32 space-y-4">
            <div role="tablist" className={`grid ${mode === "page-marks" ? "grid-cols-1" : "grid-cols-2"} gap-1 rounded-lg bg-slate-100 p-1 dark:bg-slate-800`}>
              {(
                (mode === "page-marks" ? [
                  ["save", "Save as PDF", FileDown],
                ] as const : [
                  ["save", "Save as PDF", FileDown],
                  ["split", "Split / Extract", Scissors],
                ] as const)
              ).map(([id, label, Icon]) => (
                <button
                  key={id}
                  type="button"
                  role="tab"
                  aria-selected={exportTab === id}
                  onClick={() => setExportTab(id)}
                  className={`inline-flex items-center justify-center gap-1.5 rounded-md px-2 py-2 text-xs font-semibold transition-colors ${
                    exportTab === id
                      ? "bg-white text-ink shadow-sm"
                      : "text-slate-600 hover:text-ink"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {label}
                </button>
              ))}
            </div>

            {mode === "page-marks" && (
              <fieldset className="space-y-3 rounded-xl border border-slate-200 p-3">
                <legend className="px-1 text-xs font-semibold text-slate-800">Visible page marks</legend>
                <label className="flex items-start gap-2.5 text-xs text-slate-700">
                  <input
                    type="checkbox"
                    checked={includePageNumbers}
                    onChange={(e) => setIncludePageNumbers(e.target.checked)}
                    className="mt-0.5 accent-ink"
                  />
                  <span><strong>Page numbers</strong><span className="mt-0.5 block text-slate-500">Adds “Page 1 of N” at the bottom of each page.</span></span>
                </label>
                <label className="block space-y-1.5 text-xs font-medium text-slate-700" htmlFor="pdf-visible-stamp">
                  Optional visible label
                  <select
                    id="pdf-visible-stamp"
                    value={stamp}
                    onChange={(e) => setStamp(e.target.value as VisiblePdfStamp)}
                    className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 focus:border-ink focus:outline-none focus:ring-2 focus:ring-ink/20"
                  >
                    <option value="">No label</option>
                    <option value="COPY">COPY</option>
                    <option value="DRAFT">DRAFT</option>
                    <option value="SAMPLE">SAMPLE</option>
                    <option value="CONFIDENTIAL">CONFIDENTIAL</option>
                  </select>
                </label>
                <p className="text-[11px] leading-relaxed text-slate-500">Labels are printed diagonally across every page, so they remain easy to see. This tool does not hide or remove existing PDF content.</p>
              </fieldset>
            )}

            <div className="space-y-1.5">
              <label htmlFor="pdf-name" className="text-xs font-medium text-slate-700">
                File name
              </label>
              <div className="flex items-center rounded-lg border border-slate-300 bg-white focus-within:ring-2 focus-within:ring-ink/20 focus-within:border-ink">
                <input
                  id="pdf-name"
                  value={fileName}
                  onChange={(e) => setFileName(e.target.value)}
                  className="h-10 min-w-0 flex-1 bg-transparent px-3 text-sm text-slate-900 focus:outline-none"
                />
                <span className="pr-3 text-xs text-slate-400">.pdf</span>
              </div>
            </div>

            {hasImages && (
              <div className="space-y-1.5">
                <label htmlFor="img-size" className="text-xs font-medium text-slate-700">
                  Page size for images
                </label>
                <select
                  id="img-size"
                  value={imagePageSize}
                  onChange={(e) => setImagePageSize(e.target.value as ImagePageSize)}
                  className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-ink/20 focus:border-ink"
                >
                  <option value="a4">A4 (with margin)</option>
                  <option value="letter">US Letter (with margin)</option>
                  <option value="fit">Same as image (no margin)</option>
                </select>
              </div>
            )}

            {exportTab === "split" && (
              <fieldset className="space-y-2">
                <legend className="mb-1.5 text-xs font-medium text-slate-700">How to split</legend>
                {(
                  [
                    ["selected", "Selected pages → one PDF", selected.size ? `Pages ${formatIndexes(selectedIndexes)}` : "Click pages to select them"],
                    ["ranges", "Custom ranges", "Each range becomes its own PDF"],
                    ["every", "Every N pages", "Split into equal parts"],
                    ["each", "Every page separately", `${pages.length} single-page PDFs`],
                  ] as const
                ).map(([id, label, hint]) => (
                  <label
                    key={id}
                    className={`flex cursor-pointer items-start gap-3 rounded-lg border p-2.5 text-xs transition-colors ${
                      splitMode === id
                        ? "border-ink bg-slate-100/70 shadow-xs"
                        : "border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <input
                      type="radio"
                      name="split-mode"
                      className="mt-0.5 accent-ink"
                      checked={splitMode === id}
                      onChange={() => setSplitMode(id)}
                    />
                    <span>
                      <span className="block font-semibold text-slate-900">{label}</span>
                      <span className="block text-slate-500">{hint}</span>
                    </span>
                  </label>
                ))}
                {splitMode === "ranges" && (
                  <input
                    value={rangeText}
                    onChange={(e) => setRangeText(e.target.value)}
                    placeholder={`e.g. 1-3, 4-${Math.max(4, pages.length)}`}
                    aria-label="Page ranges"
                    className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 font-mono text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-ink/20 focus:border-ink"
                  />
                )}
                {splitMode === "every" && (
                  <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                    Every
                    <input
                      type="number"
                      min={1}
                      max={pages.length}
                      value={everyN}
                      onChange={(e) => setEveryN(Math.max(1, Math.min(pages.length, Number(e.target.value) || 1)))}
                      aria-label="Pages per file"
                      className="h-9 w-20 rounded-lg border border-slate-300 bg-white px-2 font-mono text-sm dark:border-slate-700 dark:bg-slate-900"
                    />
                    pages
                  </div>
                )}
                {splitGroups.error ? (
                  <p className="text-xs text-amber-700 dark:text-amber-400">{splitGroups.error}</p>
                ) : (
                  splitGroups.groups.length > 0 && (
                    <p className="text-xs text-slate-500">
                      Creates {splitGroups.groups.length} PDF{splitGroups.groups.length > 1 ? "s" : ""}
                      {splitGroups.groups.length > 1 ? " in a ZIP" : ""}
                      {splitGroups.groups.length <= 6
                        ? `: ${splitGroups.groups.map((g) => formatIndexes(g)).join(" | ")}`
                        : ""}
                    </p>
                  )
                )}
              </fieldset>
            )}

            <Button
              type="button"
              size="lg"
              className="w-full"
              onClick={runExport}
              disabled={exporting || loading > 0 || (exportTab === "split" && (!!splitGroups.error || !splitGroups.groups.length))}
            >
              {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : exportTab === "save" ? <FileDown className="h-4 w-4" /> : <Scissors className="h-4 w-4" />}
              {exporting
                ? "Creating…"
                : exportTab === "save"
                ? `Download PDF (${pages.length} page${pages.length > 1 ? "s" : ""})`
                : splitGroups.groups.length > 1
                ? `Split into ${splitGroups.groups.length} PDFs`
                : "Extract PDF"}
            </Button>

            {done && (
              <p className="flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-2.5 text-xs text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300">
                <Check className="h-4 w-4 shrink-0" />
                {done}
              </p>
            )}
            {errorBox}
            <p className="text-[11px] leading-relaxed text-slate-400">
              Original files are kept unchanged on your device.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}

interface PageCardProps {
  page: PageItem;
  index: number;
  total: number;
  pageNumber: number;
  source?: SourceFile;
  thumbUrl?: string;
  selected: boolean;
  isDragging: boolean;
  dropBefore: boolean;
  dropAfter: boolean;
  iconBtn: string;
  onVisible: (p: PageItem) => void;
  onToggle: (e: React.MouseEvent | React.KeyboardEvent) => void;
  onRotate: (delta: number) => void;
  onDelete: () => void;
  onMove: (delta: number) => void;
  onDragStart: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragEnd: () => void;
}

const PageCard = React.memo(function PageCard({
  page,
  index,
  total,
  pageNumber,
  source,
  thumbUrl,
  selected,
  isDragging,
  dropBefore,
  dropAfter,
  iconBtn,
  onVisible,
  onToggle,
  onRotate,
  onDelete,
  onMove,
  onDragStart,
  onDragOver,
  onDragEnd,
}: PageCardProps) {
  const ref = React.useRef<HTMLLIElement>(null);

  React.useEffect(() => {
    if (page.kind !== "pdf" || thumbUrl) return;
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          onVisible(page);
          io.disconnect();
        }
      },
      { rootMargin: "400px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [page, thumbUrl, onVisible]);

  // Box keeps the page's (rotated) aspect ratio; image inside is rotated with CSS.
  const shown = rotatedSize(page.width, page.height, page.rotation);
  const ratio = shown.width / shown.height;
  const sideways = page.rotation % 180 !== 0;

  return (
    <li
      ref={ref}
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
      className={`group relative flex flex-col rounded-xl border bg-white p-2 transition-all ${
        selected ? "border-ink ring-2 ring-ink/20 shadow-xs" : "border-slate-200 hover:border-slate-300"
      } ${isDragging ? "opacity-40" : ""}`}
    >
      {dropBefore && <span className="absolute -left-2 top-2 bottom-2 w-1 rounded-full bg-ink" />}
      {dropAfter && <span className="absolute -right-2 top-2 bottom-2 w-1 rounded-full bg-ink" />}
      <button
        type="button"
        onClick={onToggle}
        aria-pressed={selected}
        aria-label={`Page ${pageNumber}${selected ? ", selected" : ""}`}
        className="relative flex aspect-[3/4] w-full cursor-grab items-center justify-center overflow-hidden rounded-lg bg-slate-100 active:cursor-grabbing dark:bg-slate-800"
      >
        <span
          className="relative flex items-center justify-center bg-white shadow-sm ring-1 ring-slate-200 dark:ring-slate-700"
          style={ratio >= 0.75 ? { width: "88%", aspectRatio: `${ratio}` } : { height: "92%", aspectRatio: `${ratio}` }}
        >
          {page.kind === "blank" ? (
            <span className="text-[10px] text-slate-300">Blank</span>
          ) : thumbUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={thumbUrl}
              alt=""
              draggable={false}
              className="absolute left-1/2 top-1/2 max-w-none object-contain"
              style={{
                width: sideways ? `${(1 / ratio) * 100}%` : "100%",
                height: sideways ? `${ratio * 100}%` : "100%",
                transform: `translate(-50%, -50%) rotate(${page.rotation}deg)`,
              }}
            />
          ) : (
            <Loader2 className="h-4 w-4 animate-spin text-slate-300" />
          )}
        </span>
        <span
          className={`absolute left-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-md border text-white transition-colors ${
            selected ? "border-ink bg-ink shadow-xs" : "border-slate-300 bg-white/90 opacity-0 group-hover:opacity-100"
          }`}
        >
          {selected && <Check className="h-3.5 w-3.5" />}
        </span>
        {page.rotation !== 0 && (
          <span className="absolute right-1.5 top-1.5 rounded bg-slate-900/70 px-1 text-[9px] font-semibold text-white">{page.rotation}°</span>
        )}
      </button>
      <div className="mt-1.5 flex items-center justify-between gap-1 px-0.5">
        <span className="flex shrink-0 items-center gap-1.5 text-[11px] font-semibold tabular-nums text-slate-700 dark:text-slate-300">
          {source && <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: source.color }} title={source.name} />}
          {pageNumber}
        </span>
        <span className="flex min-w-0 items-center">
          <button type="button" className={iconBtn} onClick={() => onMove(-1)} disabled={index === 0} aria-label="Move left">
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
          <button type="button" className={iconBtn} onClick={() => onMove(1)} disabled={index === total - 1} aria-label="Move right">
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
          <button type="button" className={iconBtn} onClick={() => onRotate(90)} aria-label="Rotate page">
            <RotateCw className="h-3.5 w-3.5" />
          </button>
          <button type="button" className={`${iconBtn} hover:!text-rose-600`} onClick={onDelete} aria-label="Delete page">
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </span>
      </div>
    </li>
  );
});
