import { resolveOutputMime, clampQuality, OutputFormat } from "@/modules/image-compressor/engine";

export type ResizeMode = "pixels" | "percent" | "preset";
export type FitMode = "contain" | "cover" | "stretch";

export interface ResizePreset {
  id: string;
  group: string;
  label: string;
  width: number;
  height: number;
}

export const RESIZE_PRESETS: ResizePreset[] = [
  { id: "ig-post", group: "Instagram", label: "Instagram Post (Square)", width: 1080, height: 1080 },
  { id: "ig-portrait", group: "Instagram", label: "Instagram Portrait (4:5)", width: 1080, height: 1350 },
  { id: "ig-story", group: "Instagram", label: "Instagram / Reels Story (9:16)", width: 1080, height: 1920 },
  { id: "fb-post", group: "Facebook", label: "Facebook Post", width: 1200, height: 630 },
  { id: "fb-cover", group: "Facebook", label: "Facebook Cover", width: 851, height: 315 },
  { id: "yt-thumb", group: "YouTube", label: "YouTube Thumbnail", width: 1280, height: 720 },
  { id: "yt-banner", group: "YouTube", label: "YouTube Channel Banner", width: 2560, height: 1440 },
  { id: "x-post", group: "X / Twitter", label: "X Post Image", width: 1600, height: 900 },
  { id: "x-header", group: "X / Twitter", label: "X Header", width: 1500, height: 500 },
  { id: "li-post", group: "LinkedIn", label: "LinkedIn Post", width: 1200, height: 627 },
  { id: "li-banner", group: "LinkedIn", label: "LinkedIn Banner", width: 1584, height: 396 },
  { id: "hd", group: "Screen", label: "Full HD (1920×1080)", width: 1920, height: 1080 },
  { id: "4k", group: "Screen", label: "4K UHD (3840×2160)", width: 3840, height: 2160 },
  { id: "og", group: "Web", label: "Open Graph / Link Preview", width: 1200, height: 630 },
  { id: "favicon", group: "Web", label: "App Icon (512×512)", width: 512, height: 512 },
];

export interface ResizeSettings {
  mode: ResizeMode;
  width: number;
  height: number;
  lockAspect: boolean;
  percent: number;
  presetId: string;
  fit: FitMode;
  background: string;
  noEnlarge: boolean;
  format: OutputFormat;
  quality: number;
}

export const DEFAULT_RESIZE_SETTINGS: ResizeSettings = {
  mode: "pixels",
  width: 1920,
  height: 1080,
  lockAspect: true,
  percent: 50,
  presetId: "ig-post",
  fit: "cover",
  background: "#ffffff",
  noEnlarge: false,
  format: "original",
  quality: 90,
};

export const MAX_DIMENSION = 16384;

function clampDim(n: number): number {
  return Math.min(MAX_DIMENSION, Math.max(1, Math.round(n)));
}

export interface Plan {
  /** Final canvas size */
  width: number;
  height: number;
  /** Source rectangle to sample */
  sx: number;
  sy: number;
  sw: number;
  sh: number;
  /** Destination rectangle on the canvas */
  dx: number;
  dy: number;
  dw: number;
  dh: number;
  /** True when padding is visible (contain mode with different aspect) */
  padded: boolean;
}

/** Fits a source image into a target box using contain / cover / stretch. */
export function planFit(srcW: number, srcH: number, dstW: number, dstH: number, fit: FitMode): Plan {
  const width = clampDim(dstW);
  const height = clampDim(dstH);
  const base = { width, height, sx: 0, sy: 0, sw: srcW, sh: srcH, dx: 0, dy: 0, dw: width, dh: height, padded: false };
  if (fit === "stretch") return base;

  const srcRatio = srcW / srcH;
  const dstRatio = width / height;
  if (Math.abs(srcRatio - dstRatio) < 1e-6) return base;

  if (fit === "cover") {
    // Crop the source (centered) to the target aspect ratio.
    if (srcRatio > dstRatio) {
      const sw = srcH * dstRatio;
      return { ...base, sx: (srcW - sw) / 2, sw };
    }
    const sh = srcW / dstRatio;
    return { ...base, sy: (srcH - sh) / 2, sh };
  }

  // contain: letterbox inside the target
  if (srcRatio > dstRatio) {
    const dh = width / srcRatio;
    return { ...base, dy: (height - dh) / 2, dh, padded: true };
  }
  const dw = height * srcRatio;
  return { ...base, dx: (width - dw) / 2, dw, padded: true };
}

/** Works out the output plan for one image given the user's settings. */
export function planResize(srcW: number, srcH: number, s: ResizeSettings): Plan {
  let plan: Plan;
  if (s.mode === "percent") {
    const p = Math.max(1, s.percent) / 100;
    plan = planFit(srcW, srcH, srcW * p, srcH * p, "stretch");
  } else if (s.mode === "preset") {
    const preset = RESIZE_PRESETS.find((x) => x.id === s.presetId) ?? RESIZE_PRESETS[0];
    plan = planFit(srcW, srcH, preset.width, preset.height, s.fit);
  } else if (s.lockAspect) {
    // Fit inside width × height keeping aspect ratio (either side may be 0 = auto).
    const w = s.width > 0 ? s.width : 0;
    const h = s.height > 0 ? s.height : 0;
    let scale: number;
    if (w && h) scale = Math.min(w / srcW, h / srcH);
    else if (w) scale = w / srcW;
    else if (h) scale = h / srcH;
    else scale = 1;
    plan = planFit(srcW, srcH, srcW * scale, srcH * scale, "stretch");
  } else {
    plan = planFit(srcW, srcH, s.width > 0 ? s.width : srcW, s.height > 0 ? s.height : srcH, s.fit);
  }

  if (s.noEnlarge && (plan.width > srcW || plan.height > srcH) && s.mode !== "preset") {
    return planFit(srcW, srcH, srcW, srcH, "stretch");
  }
  return plan;
}

/** Height that keeps the aspect ratio for a given width (used to auto-fill inputs). */
export function heightForWidth(width: number, srcW: number, srcH: number): number {
  return srcW > 0 ? Math.max(1, Math.round((width * srcH) / srcW)) : width;
}

export function widthForHeight(height: number, srcW: number, srcH: number): number {
  return srcH > 0 ? Math.max(1, Math.round((height * srcW) / srcH)) : height;
}

const EXT: Record<string, string> = { "image/jpeg": "jpg", "image/webp": "webp", "image/png": "png" };

export function buildResizedFilename(originalName: string, width: number, height: number, mime: string): string {
  const dot = originalName.lastIndexOf(".");
  const base = (dot > 0 ? originalName.slice(0, dot) : originalName).trim() || "image";
  return `${base}-${width}x${height}.${EXT[mime] ?? "png"}`;
}

/** Number of halving steps used for high-quality downscaling (avoids aliasing on big reductions). */
export function downscaleSteps(srcSize: number, dstSize: number): number {
  let steps = 0;
  let size = srcSize;
  while (size / 2 >= dstSize && steps < 8) {
    size /= 2;
    steps++;
  }
  return steps;
}

export interface ResizeResult {
  blob: Blob;
  width: number;
  height: number;
  outputMime: string;
}

function toBlob(canvas: HTMLCanvasElement, mime: string, quality?: number): Promise<Blob> {
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Encoding failed"))), mime, quality)
  );
}

/** Browser-only: resizes an image file according to the settings. */
export async function resizeImage(file: File, s: ResizeSettings): Promise<ResizeResult> {
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" } as ImageBitmapOptions);
  const plan = planResize(bitmap.width, bitmap.height, s);
  const mime = resolveOutputMime(file.type, s.format);

  // Progressive halving of the cropped source for sharp, alias-free downscales.
  let source: CanvasImageSource = bitmap;
  let sx = plan.sx, sy = plan.sy, sw = plan.sw, sh = plan.sh;
  const steps = downscaleSteps(Math.max(sw / plan.dw, sh / plan.dh), 1);
  let temp: HTMLCanvasElement | null = null;
  for (let i = 0; i < steps; i++) {
    const c = document.createElement("canvas");
    c.width = Math.max(1, Math.round(sw / 2));
    c.height = Math.max(1, Math.round(sh / 2));
    const cx = c.getContext("2d")!;
    cx.imageSmoothingEnabled = true;
    cx.imageSmoothingQuality = "high";
    cx.drawImage(source, sx, sy, sw, sh, 0, 0, c.width, c.height);
    if (temp) { temp.width = 0; temp.height = 0; }
    temp = c;
    source = c;
    sx = 0; sy = 0; sw = c.width; sh = c.height;
  }

  const canvas = document.createElement("canvas");
  canvas.width = plan.width;
  canvas.height = plan.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas is not supported in this browser");
  if (plan.padded || mime === "image/jpeg") {
    // JPEG can't be transparent; padded areas use the chosen background (transparent for PNG/WebP if chosen).
    if (mime === "image/jpeg" || s.background !== "transparent") {
      ctx.fillStyle = s.background === "transparent" ? "#ffffff" : s.background;
      ctx.fillRect(0, 0, plan.width, plan.height);
    }
  }
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(source, sx, sy, sw, sh, plan.dx, plan.dy, plan.dw, plan.dh);
  bitmap.close();
  if (temp) { temp.width = 0; temp.height = 0; }

  const quality = mime === "image/png" ? undefined : clampQuality(s.quality) / 100;
  const blob = await toBlob(canvas, mime, quality);
  canvas.width = 0;
  canvas.height = 0;
  return { blob, width: plan.width, height: plan.height, outputMime: blob.type || mime };
}
