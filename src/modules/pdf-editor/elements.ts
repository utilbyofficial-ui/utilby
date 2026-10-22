/**
 * Pure helpers for moving / resizing editor elements in normalized (0–1) page coordinates.
 */
import type { Annotation, DrawAnnotation } from "./engine";

export interface Box {
  normX: number;
  normY: number;
  normW: number;
  normH: number;
}

export type Handle = "nw" | "n" | "ne" | "e" | "se" | "s" | "sw" | "w";
export const HANDLES: Handle[] = ["nw", "n", "ne", "e", "se", "s", "sw", "w"];

export type BoxAnnotation = Extract<Annotation, { normW: number }>;

export function isBoxAnnotation(a: Annotation): a is BoxAnnotation {
  return "normW" in a && "normH" in a;
}

export function drawBounds(a: DrawAnnotation): Box {
  const xs = a.points.map((p) => p.normX);
  const ys = a.points.map((p) => p.normY);
  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  return { normX: minX, normY: minY, normW: Math.max(0.002, Math.max(...xs) - minX), normH: Math.max(0.002, Math.max(...ys) - minY) };
}

/** Bounding box of any resizable/movable annotation (text uses only its origin). */
export function getBox(a: Annotation): Box | null {
  if (isBoxAnnotation(a)) return { normX: a.normX, normY: a.normY, normW: a.normW, normH: a.normH };
  if (a.type === "draw") return drawBounds(a);
  return null;
}

/** Returns a copy of the annotation fitted to the new box (draw paths are scaled). */
export function setBox(a: Annotation, box: Box): Annotation {
  if (isBoxAnnotation(a)) return { ...a, ...box };
  if (a.type === "draw") {
    const old = drawBounds(a);
    const sx = box.normW / (old.normW || 1);
    const sy = box.normH / (old.normH || 1);
    return {
      ...a,
      points: a.points.map((p) => ({
        normX: box.normX + (p.normX - old.normX) * sx,
        normY: box.normY + (p.normY - old.normY) * sy,
      })),
    };
  }
  if (a.type === "text") return { ...a, normX: box.normX, normY: box.normY };
  return a;
}

export function moveBox(box: Box, dx: number, dy: number): Box {
  return {
    ...box,
    normX: clamp(box.normX + dx, -box.normW * 0.8, 1 - box.normW * 0.2),
    normY: clamp(box.normY + dy, -box.normH * 0.8, 1 - box.normH * 0.2),
  };
}

/**
 * Resizes a box by dragging a handle.
 * Corner handles keep the box's proportions when `keepAspect` is true (normalized ratio is
 * enough because the page's own aspect ratio never changes while dragging).
 */
export function resizeBox(
  box: Box,
  handle: Handle,
  dx: number,
  dy: number,
  opts: { keepAspect?: boolean; minNorm?: number } = {}
): Box {
  const min = opts.minNorm ?? 0.01;
  let left = box.normX;
  let top = box.normY;
  let right = box.normX + box.normW;
  let bottom = box.normY + box.normH;

  if (handle.includes("w")) left = Math.min(left + dx, right - min);
  if (handle.includes("e")) right = Math.max(right + dx, left + min);
  if (handle.includes("n")) top = Math.min(top + dy, bottom - min);
  if (handle.includes("s")) bottom = Math.max(bottom + dy, top + min);

  let next: Box = { normX: left, normY: top, normW: right - left, normH: bottom - top };

  const isCorner = handle.length === 2;
  if (opts.keepAspect && isCorner) {
    const ratio = box.normW / box.normH;
    // pick the dimension that changed most (relative) and derive the other
    const scaleW = next.normW / box.normW;
    const scaleH = next.normH / box.normH;
    const scale = Math.max(Math.abs(scaleW - 1), Math.abs(scaleH - 1)) === Math.abs(scaleW - 1) ? scaleW : scaleH;
    let w = Math.max(min, box.normW * scale);
    let h = w / ratio;
    if (h < min) {
      h = min;
      w = h * ratio;
    }
    const anchorRight = handle.includes("w");
    const anchorBottom = handle.includes("n");
    next = {
      normW: w,
      normH: h,
      normX: anchorRight ? box.normX + box.normW - w : box.normX,
      normY: anchorBottom ? box.normY + box.normH - h : box.normY,
    };
  }
  return next;
}

/** Fits an image of `imgW × imgH` px on a page with display aspect `pageW/pageH`, `widthFrac` of the page wide. */
export function fitImageBox(
  imgW: number,
  imgH: number,
  pageW: number,
  pageH: number,
  widthFrac = 0.35,
  maxHeightFrac = 0.45
): { normW: number; normH: number } {
  let normW = widthFrac;
  let normH = (normW * pageW * (imgH / imgW)) / pageH;
  if (normH > maxHeightFrac) {
    const s = maxHeightFrac / normH;
    normW *= s;
    normH *= s;
  }
  return { normW, normH };
}

export function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}
