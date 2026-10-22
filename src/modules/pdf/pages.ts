/**
 * Pure page-model helpers for the PDF workspace. No browser APIs here so it is fully unit-testable.
 */

export type Rotation = 0 | 90 | 180 | 270;
export type PageKind = "pdf" | "image" | "blank";

export interface SourceFile {
  id: string;
  name: string;
  kind: "pdf" | "image";
  /** Color used to tag pages from this file in the grid */
  color: string;
  pageCount: number;
}

export interface PageItem {
  id: string;
  kind: PageKind;
  sourceId: string | null;
  /** 0-based page index inside the source PDF (0 for images/blank) */
  sourceIndex: number;
  /** Extra rotation added by the user, on top of the page's own rotation */
  rotation: Rotation;
  /** Page size in PDF points (used for blank pages and placeholders) */
  width: number;
  height: number;
}

export const A4 = { width: 595.28, height: 841.89 };
export const LETTER = { width: 612, height: 792 };

export const SOURCE_COLORS = ["#6366f1", "#f97316", "#10b981", "#ec4899", "#0ea5e9", "#eab308", "#8b5cf6", "#ef4444"];

export function normalizeRotation(deg: number): Rotation {
  const r = (((Math.round(deg / 90) * 90) % 360) + 360) % 360;
  return r as Rotation;
}

export function rotatePages(pages: PageItem[], ids: Set<string>, delta: number): PageItem[] {
  return pages.map((p) => (ids.has(p.id) ? { ...p, rotation: normalizeRotation(p.rotation + delta) } : p));
}

export function deletePages(pages: PageItem[], ids: Set<string>): PageItem[] {
  return pages.filter((p) => !ids.has(p.id));
}

/** Moves the page at `from` so that it ends up at index `to`. */
export function movePage<T>(list: T[], from: number, to: number): T[] {
  if (from === to || from < 0 || from >= list.length) return list;
  const next = list.slice();
  const [item] = next.splice(from, 1);
  const target = Math.max(0, Math.min(next.length, to));
  next.splice(target, 0, item);
  return next;
}

/** Moves a set of selected pages as a block so they start at `toIndex` (index in the original list). */
export function moveSelection(pages: PageItem[], ids: Set<string>, toIndex: number): PageItem[] {
  const moving = pages.filter((p) => ids.has(p.id));
  if (!moving.length) return pages;
  const before = pages.slice(0, toIndex).filter((p) => !ids.has(p.id)).length;
  const rest = pages.filter((p) => !ids.has(p.id));
  return [...rest.slice(0, before), ...moving, ...rest.slice(before)];
}

export function duplicatePages(pages: PageItem[], ids: Set<string>, makeId: () => string): PageItem[] {
  const out: PageItem[] = [];
  for (const p of pages) {
    out.push(p);
    if (ids.has(p.id)) out.push({ ...p, id: makeId() });
  }
  return out;
}

export function insertBlankAfter(
  pages: PageItem[],
  afterIndex: number,
  makeId: () => string,
  size: { width: number; height: number } = A4
): PageItem[] {
  const blank: PageItem = { id: makeId(), kind: "blank", sourceId: null, sourceIndex: 0, rotation: 0, ...size };
  const next = pages.slice();
  next.splice(Math.max(0, Math.min(pages.length, afterIndex + 1)), 0, blank);
  return next;
}

export function reversePages(pages: PageItem[]): PageItem[] {
  return pages.slice().reverse();
}

export interface RangeParseResult {
  /** Groups of 0-based indexes; each group becomes one output file when splitting */
  groups: number[][];
  error?: string;
}

/**
 * Parses a human page-range string like "1-3, 5, 8-" (1-based, inclusive).
 * Each comma-separated part becomes its own group. "8-" means 8 to the end, "-3" means 1 to 3.
 */
export function parseRanges(input: string, pageCount: number): RangeParseResult {
  const text = input.trim();
  if (!text) return { groups: [], error: "Enter page numbers, for example 1-3, 5" };
  if (pageCount <= 0) return { groups: [], error: "There are no pages" };
  const groups: number[][] = [];
  for (const raw of text.split(/[,;]+/)) {
    const part = raw.trim();
    if (!part) continue;
    const m = part.match(/^(\d*)\s*[-–]\s*(\d*)$/);
    let start: number;
    let end: number;
    if (m) {
      start = m[1] ? parseInt(m[1], 10) : 1;
      end = m[2] ? parseInt(m[2], 10) : pageCount;
      if (!m[1] && !m[2]) return { groups: [], error: `"${part}" is not a valid range` };
    } else if (/^\d+$/.test(part)) {
      start = end = parseInt(part, 10);
    } else {
      return { groups: [], error: `"${part}" is not a valid page number or range` };
    }
    if (start < 1 || end < 1 || start > pageCount || end > pageCount) {
      return { groups: [], error: `Page ${Math.max(start, end)} doesn't exist — this document has ${pageCount} page${pageCount > 1 ? "s" : ""}` };
    }
    const group: number[] = [];
    if (start <= end) for (let i = start; i <= end; i++) group.push(i - 1);
    else for (let i = start; i >= end; i--) group.push(i - 1);
    groups.push(group);
  }
  if (!groups.length) return { groups: [], error: "Enter page numbers, for example 1-3, 5" };
  return { groups };
}

/** Splits `count` pages into chunks of `size` pages. */
export function chunkIndexes(count: number, size: number): number[][] {
  const n = Math.max(1, Math.floor(size));
  const out: number[][] = [];
  for (let i = 0; i < count; i += n) {
    out.push(Array.from({ length: Math.min(n, count - i) }, (_, k) => i + k));
  }
  return out;
}

/** Formats 0-based indexes as a compact 1-based label: [0,1,2,4] -> "1-3, 5" */
export function formatIndexes(indexes: number[]): string {
  const sorted = Array.from(new Set(indexes)).sort((a, b) => a - b);
  const parts: string[] = [];
  let i = 0;
  while (i < sorted.length) {
    let j = i;
    while (j + 1 < sorted.length && sorted[j + 1] === sorted[j] + 1) j++;
    parts.push(i === j ? `${sorted[i] + 1}` : `${sorted[i] + 1}-${sorted[j] + 1}`);
    i = j + 1;
  }
  return parts.join(", ");
}

export function baseName(name: string): string {
  const dot = name.lastIndexOf(".");
  return (dot > 0 ? name.slice(0, dot) : name).trim() || "document";
}

export function safeFilename(name: string): string {
  return name.replace(/[\\/:*?"<>|]+/g, "-").replace(/\s+/g, " ").trim().slice(0, 120) || "document";
}

/** Effective page size after rotation, for layout of thumbnails. */
export function rotatedSize(width: number, height: number, rotation: number): { width: number; height: number } {
  return normalizeRotation(rotation) % 180 === 0 ? { width, height } : { width: height, height: width };
}

/** Image placement for "image to PDF": fit image inside page with margin, centered. */
export function fitImageOnPage(
  imgW: number,
  imgH: number,
  pageW: number,
  pageH: number,
  margin: number
): { x: number; y: number; width: number; height: number } {
  const availW = Math.max(1, pageW - margin * 2);
  const availH = Math.max(1, pageH - margin * 2);
  const scale = Math.min(availW / imgW, availH / imgH);
  const width = imgW * scale;
  const height = imgH * scale;
  return { x: (pageW - width) / 2, y: (pageH - height) / 2, width, height };
}
