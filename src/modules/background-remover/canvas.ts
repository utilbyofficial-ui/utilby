import type { BackgroundMode, ExportFormat } from "./engine";

export interface CompositeOptions {
  mode: BackgroundMode;
  color: string;
  blur: number;
  edgeSoftness: number;
  format?: ExportFormat;
  quality?: number;
}

export function makeAlphaMaskCanvas(alpha: Uint8Array, width: number, height: number): HTMLCanvasElement {
  if (!Number.isSafeInteger(width) || !Number.isSafeInteger(height) || width < 1 || height < 1 || alpha.length !== width * height) {
    throw new RangeError("The AI result has invalid mask dimensions.");
  }
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) throw new Error("This browser cannot edit image masks.");
  const imageData = context.createImageData(width, height);
  for (let i = 0; i < alpha.length; i++) {
    const offset = i * 4;
    imageData.data[offset] = 255;
    imageData.data[offset + 1] = 255;
    imageData.data[offset + 2] = 255;
    imageData.data[offset + 3] = alpha[i] ?? 0;
  }
  context.putImageData(imageData, 0, 0);
  return canvas;
}

export function captureMaskAlpha(canvas: HTMLCanvasElement): Uint8Array {
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) throw new Error("This browser cannot read the image mask.");
  const rgba = context.getImageData(0, 0, canvas.width, canvas.height).data;
  const alpha = new Uint8Array(canvas.width * canvas.height);
  for (let i = 0; i < alpha.length; i++) alpha[i] = rgba[i * 4 + 3] ?? 0;
  return alpha;
}

export function restoreMaskAlpha(canvas: HTMLCanvasElement, alpha: Uint8Array): void {
  if (alpha.length !== canvas.width * canvas.height) throw new RangeError("The edit history does not match this image.");
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) throw new Error("This browser cannot restore the image mask.");
  const imageData = context.createImageData(canvas.width, canvas.height);
  for (let i = 0; i < alpha.length; i++) {
    const offset = i * 4;
    imageData.data[offset] = 255;
    imageData.data[offset + 1] = 255;
    imageData.data[offset + 2] = 255;
    imageData.data[offset + 3] = alpha[i] ?? 0;
  }
  context.putImageData(imageData, 0, 0);
}

function drawCover(context: CanvasRenderingContext2D, image: ImageBitmap, width: number, height: number): void {
  const scale = Math.max(width / image.width, height / image.height);
  const drawWidth = image.width * scale;
  const drawHeight = image.height * scale;
  context.drawImage(image, (width - drawWidth) / 2, (height - drawHeight) / 2, drawWidth, drawHeight);
}

/** Paints a full-resolution cutout into one canvas; no image data is uploaded or retained. */
export function paintBackgroundRemoval(
  canvas: HTMLCanvasElement,
  source: ImageBitmap,
  mask: HTMLCanvasElement,
  options: CompositeOptions,
  backgroundImage?: ImageBitmap | null
): void {
  const width = canvas.width;
  const height = canvas.height;
  const context = canvas.getContext("2d", { alpha: true });
  if (!context) throw new Error("This browser cannot render the edited image.");
  context.clearRect(0, 0, width, height);

  context.drawImage(source, 0, 0, width, height);
  context.globalCompositeOperation = "destination-in";
  const softness = Math.min(100, Math.max(0, options.edgeSoftness)) / 100;
  const scale = Math.max(width / mask.width, height / mask.height);
  context.filter = softness > 0 ? `blur(${(softness * 1.2 * scale).toFixed(2)}px)` : "none";
  context.drawImage(mask, 0, 0, width, height);

  context.filter = "none";
  context.globalCompositeOperation = "destination-over";
  if (options.mode === "color") {
    context.fillStyle = options.color;
    context.fillRect(0, 0, width, height);
  } else if (options.mode === "image" && backgroundImage) {
    drawCover(context, backgroundImage, width, height);
  } else if (options.mode === "blur") {
    const blur = Math.max(0, options.blur) * Math.max(width / source.width, height / source.height);
    const overscan = Math.ceil(blur * 3);
    context.filter = blur > 0 ? `blur(${blur.toFixed(2)}px)` : "none";
    context.drawImage(source, -overscan, -overscan, width + overscan * 2, height + overscan * 2);
  }
  context.filter = "none";
  context.globalCompositeOperation = "source-over";
}

export function drawBrushStroke(
  context: CanvasRenderingContext2D,
  from: { x: number; y: number },
  to: { x: number; y: number },
  size: number,
  mode: "erase" | "restore"
): void {
  context.save();
  context.lineCap = "round";
  context.lineJoin = "round";
  context.lineWidth = size;
  context.globalCompositeOperation = mode === "erase" ? "destination-out" : "source-over";
  context.strokeStyle = mode === "erase" ? "rgba(0, 0, 0, 1)" : "rgba(255, 255, 255, 1)";
  context.beginPath();
  context.moveTo(from.x, from.y);
  context.lineTo(to.x, to.y);
  context.stroke();
  context.restore();
}

export function canvasToBlob(canvas: HTMLCanvasElement, format: ExportFormat, quality = 92): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const q = Math.min(100, Math.max(1, Math.round(quality))) / 100;
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("The browser could not save this image. Try PNG or a smaller image."))),
      format,
      format === "image/png" ? undefined : q
    );
  });
}
