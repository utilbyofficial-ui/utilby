/**
 * Maps the editor's normalized display coordinates (0–1, origin top-left of the page *as shown*,
 * i.e. after the page's /Rotate) to PDF user space. Handles rotated pages and CropBoxes that do
 * not start at (0, 0) — both are common in scanned and exported documents.
 */

export interface PageGeometry {
  /** 0 | 90 | 180 | 270 — the page's /Rotate value (clockwise) */
  rotation: number;
  /** CropBox (visible area) in PDF user space */
  x0: number;
  y0: number;
  width: number;
  height: number;
}

export function normalizeRotation(deg: number): 0 | 90 | 180 | 270 {
  const r = (((Math.round(deg / 90) * 90) % 360) + 360) % 360;
  return r as 0 | 90 | 180 | 270;
}

/** Size of the page as displayed (after rotation), in PDF points. */
export function displaySize(g: PageGeometry): { width: number; height: number } {
  return normalizeRotation(g.rotation) % 180 === 0 ? { width: g.width, height: g.height } : { width: g.height, height: g.width };
}

/** Normalized display point (u right, v down) → PDF user-space point. */
export function toPdfPoint(g: PageGeometry, u: number, v: number): { x: number; y: number } {
  const { x0, y0, width: w, height: h } = g;
  switch (normalizeRotation(g.rotation)) {
    case 90:
      return { x: x0 + v * w, y: y0 + u * h };
    case 180:
      return { x: x0 + (1 - u) * w, y: y0 + v * h };
    case 270:
      return { x: x0 + (1 - v) * w, y: y0 + (1 - u) * h };
    default:
      return { x: x0 + u * w, y: y0 + (1 - v) * h };
  }
}

/** PDF user-space point → normalized display point. Inverse of toPdfPoint. */
export function toDisplayPoint(g: PageGeometry, x: number, y: number): { u: number; v: number } {
  const { x0, y0, width: w, height: h } = g;
  const nx = (x - x0) / w;
  const ny = (y - y0) / h;
  switch (normalizeRotation(g.rotation)) {
    case 90:
      return { u: ny, v: nx };
    case 180:
      return { u: 1 - nx, v: ny };
    case 270:
      return { u: 1 - ny, v: 1 - nx };
    default:
      return { u: nx, v: 1 - ny };
  }
}

/** Normalized display box → axis-aligned PDF rectangle (rotation is always a multiple of 90°). */
export function toPdfRect(
  g: PageGeometry,
  normX: number,
  normY: number,
  normW: number,
  normH: number
): { x: number; y: number; width: number; height: number } {
  const a = toPdfPoint(g, normX, normY);
  const b = toPdfPoint(g, normX + normW, normY + normH);
  const x = Math.min(a.x, b.x);
  const y = Math.min(a.y, b.y);
  return { x, y, width: Math.max(0.5, Math.abs(b.x - a.x)), height: Math.max(0.5, Math.abs(b.y - a.y)) };
}

/**
 * Anchor + rotation for drawing an upright object (image / text) whose display box is given.
 * `anchorV` is the normalized display y of the object's bottom edge (or text baseline).
 */
export function uprightAnchor(
  g: PageGeometry,
  normX: number,
  anchorV: number
): { x: number; y: number; rotate: number } {
  const p = toPdfPoint(g, normX, anchorV);
  return { x: p.x, y: p.y, rotate: normalizeRotation(g.rotation) };
}
