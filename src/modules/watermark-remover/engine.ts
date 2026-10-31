import { readImageDimensions } from "@/modules/image-compressor/engine";

export const WATERMARK_INPUT_TYPES = ["image/jpeg", "image/png", "image/webp", "image/bmp"];
export const WATERMARK_MAX_FILE_BYTES = 50 * 1024 * 1024;
export const WATERMARK_MAX_PIXELS = 24_000_000;
const MAX_IMAGE_DIMENSION = 16_384;
const MAX_INPAINT_REGION_PIXELS = 4_000_000;

export interface Point { x: number; y: number }
export interface BrushStroke {
  /** Normalized point coordinates (0–1). */
  points: Point[];
  /** Brush width divided by preview width. */
  width: number;
}
export interface EditOperation {
  mode: "heal" | "clone";
  strokes: BrushStroke[];
  /** Normalized destination-minus-source offset for clone stamp. */
  cloneOffset?: Point;
}
export interface LoadedImage {
  canvas: HTMLCanvasElement;
  width: number;
  height: number;
}

export function isWatermarkImageType(type: string): boolean {
  return WATERMARK_INPUT_TYPES.includes(type.toLowerCase());
}

export function previewSize(width: number, height: number, maxWidth = 1600, maxHeight = 1200): { width: number; height: number } {
  const scale = Math.min(1, maxWidth / width, maxHeight / height);
  return { width: Math.max(1, Math.round(width * scale)), height: Math.max(1, Math.round(height * scale)) };
}

function createCanvas(width: number, height: number): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

export async function decodeImage(file: File): Promise<LoadedImage> {
  if (!isWatermarkImageType(file.type)) throw new Error("Choose a JPG, PNG, WebP, or BMP image.");
  if (file.size > WATERMARK_MAX_FILE_BYTES) throw new Error("The image is larger than the 50 MB limit.");
  const headerDimensions = await readImageDimensions(file);
  if (headerDimensions && headerDimensions.width * headerDimensions.height > WATERMARK_MAX_PIXELS) {
    throw new Error("This image is larger than the 24-megapixel editing limit. Use a smaller copy to keep editing stable.");
  }

  if (typeof createImageBitmap !== "function") throw new Error("This browser cannot open images for editing.");
  let bitmap: ImageBitmap | null = null;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" } as ImageBitmapOptions);
    if (bitmap.width > MAX_IMAGE_DIMENSION || bitmap.height > MAX_IMAGE_DIMENSION || bitmap.width * bitmap.height > WATERMARK_MAX_PIXELS) {
      throw new Error("This image is larger than the 24-megapixel editing limit. Use a smaller copy to keep editing stable.");
    }
    const canvas = createCanvas(bitmap.width, bitmap.height);
    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context) throw new Error("This browser could not prepare the image canvas.");
    context.drawImage(bitmap, 0, 0);
    return { canvas, width: bitmap.width, height: bitmap.height };
  } catch (error) {
    if (error instanceof Error && error.message.includes("24-megapixel")) throw error;
    throw new Error("This image could not be opened. Try a different JPG, PNG, WebP, or BMP file.");
  } finally {
    bitmap?.close();
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function getSelectionBounds(strokes: BrushStroke[], width: number, height: number) {
  let minX = width, minY = height, maxX = 0, maxY = 0, maxBrush = 0;
  let hasPoint = false;
  for (const stroke of strokes) {
    maxBrush = Math.max(maxBrush, stroke.width * width);
    for (const point of stroke.points) {
      hasPoint = true;
      minX = Math.min(minX, point.x * width);
      minY = Math.min(minY, point.y * height);
      maxX = Math.max(maxX, point.x * width);
      maxY = Math.max(maxY, point.y * height);
    }
  }
  if (!hasPoint) return null;
  const padding = Math.max(24, Math.ceil(maxBrush * 1.5));
  return {
    left: clamp(Math.floor(minX - maxBrush / 2 - padding), 0, width - 1),
    top: clamp(Math.floor(minY - maxBrush / 2 - padding), 0, height - 1),
    right: clamp(Math.ceil(maxX + maxBrush / 2 + padding), 1, width),
    bottom: clamp(Math.ceil(maxY + maxBrush / 2 + padding), 1, height),
  };
}

function drawSelectionMask(
  strokes: BrushStroke[], width: number, height: number,
  left: number, top: number, fullWidth: number, fullHeight: number
): HTMLCanvasElement {
  const mask = createCanvas(width, height);
  const context = mask.getContext("2d", { willReadFrequently: true });
  if (!context) throw new Error("This browser could not prepare the selection.");
  context.strokeStyle = "#fff";
  context.fillStyle = "#fff";
  context.lineCap = "round";
  context.lineJoin = "round";
  for (const stroke of strokes) {
    if (!stroke.points.length) continue;
    const first = stroke.points[0]!;
    const x = first.x * fullWidth - left;
    const y = first.y * fullHeight - top;
    const lineWidth = Math.max(1, stroke.width * fullWidth);
    context.lineWidth = lineWidth;
    if (stroke.points.length === 1) {
      context.beginPath();
      context.arc(x, y, lineWidth / 2, 0, Math.PI * 2);
      context.fill();
      continue;
    }
    context.beginPath();
    context.moveTo(x, y);
    for (const point of stroke.points.slice(1)) {
      context.lineTo(point.x * fullWidth - left, point.y * fullHeight - top);
    }
    context.stroke();
  }
  return mask;
}

function averageKnownPixels(data: Uint8ClampedArray, states: Uint8Array, index: number, width: number, height: number, outsideOnly = false): [number, number, number] | null {
  const x = index % width;
  const y = Math.floor(index / width);
  let red = 0, green = 0, blue = 0, count = 0;
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      if (!dx && !dy) continue;
      const nx = x + dx;
      const ny = y + dy;
      if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;
      const neighbor = ny * width + nx;
      if (outsideOnly ? states[neighbor] !== 0 : states[neighbor] === 1) continue;
      const pixel = neighbor * 4;
      red += data[pixel]!;
      green += data[pixel + 1]!;
      blue += data[pixel + 2]!;
      count++;
    }
  }
  return count ? [red / count, green / count, blue / count] : null;
}

async function yieldToBrowser(): Promise<void> {
  await new Promise<void>((resolve) => setTimeout(resolve, 0));
}

export async function inpaintRegion(data: Uint8ClampedArray, original: Uint8ClampedArray, maskAlpha: Uint8ClampedArray, width: number, height: number): Promise<void> {
  const count = width * height;
  const states = new Uint8Array(count);
  const queue = new Uint32Array(count);
  const queueData = data;
  let tail = 0;

  for (let i = 0; i < count; i++) {
    if (maskAlpha[i]! >= 128) states[i] = 1;
  }

  // Seed the fill from the unmarked edge. The queue then advances inward once,
  // so work grows with the selected area instead of repeatedly scanning the image.
  for (let index = 0; index < count; index++) {
    if (index > 0 && index % 100_000 === 0) await yieldToBrowser();
    if (states[index] !== 1) continue;
    const color = averageKnownPixels(queueData, states, index, width, height, true);
    if (!color) continue;
    const pixel = index * 4;
    queueData[pixel] = color[0];
    queueData[pixel + 1] = color[1];
    queueData[pixel + 2] = color[2];
    states[index] = 2;
    queue[tail++] = index;
  }

  let head = 0;
  while (head < tail) {
    if (head > 0 && head % 100_000 === 0) await yieldToBrowser();
    const index = queue[head++]!;
    const x = index % width;
    const y = Math.floor(index / width);
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (!dx && !dy) continue;
        const nx = x + dx;
        const ny = y + dy;
        if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;
        const neighbor = ny * width + nx;
        if (states[neighbor] !== 1) continue;
        const color = averageKnownPixels(queueData, states, neighbor, width, height);
        if (!color) continue;
        const pixel = neighbor * 4;
        queueData[pixel] = color[0];
        queueData[pixel + 1] = color[1];
        queueData[pixel + 2] = color[2];
        states[neighbor] = 2;
        queue[tail++] = neighbor;
      }
    }
  }

  // Blend antialiased brush edges; leave every unselected pixel unchanged.
  for (let i = 0; i < count; i++) {
    const amount = maskAlpha[i]! / 255;
    if (amount <= 0 || states[i] !== 2) continue;
    const pixel = i * 4;
    data[pixel] = original[pixel]! * (1 - amount) + data[pixel]! * amount;
    data[pixel + 1] = original[pixel + 1]! * (1 - amount) + data[pixel + 1]! * amount;
    data[pixel + 2] = original[pixel + 2]! * (1 - amount) + data[pixel + 2]! * amount;
    data[pixel + 3] = original[pixel + 3]!;
  }
}

export interface CloneSourcePixels {
  data: Uint8ClampedArray;
  width: number;
  height: number;
  left: number;
  top: number;
}

export async function cloneSelectionRegion(input: {
  data: Uint8ClampedArray;
  original: Uint8ClampedArray;
  maskAlpha: Uint8ClampedArray;
  width: number;
  height: number;
  fullWidth: number;
  fullHeight: number;
  left: number;
  top: number;
  offsetX: number;
  offsetY: number;
  source: CloneSourcePixels;
}): Promise<void> {
  const { data, original, maskAlpha, width, height, fullWidth, fullHeight, left, top, offsetX, offsetY, source } = input;
  for (let y = 0; y < height; y++) {
    if (y > 0 && y % 64 === 0) await yieldToBrowser();
    for (let x = 0; x < width; x++) {
      const amount = maskAlpha[y * width + x]! / 255;
      if (amount <= 0) continue;
      const sourceX = left + x - offsetX;
      const sourceY = top + y - offsetY;
      if (sourceX < 0 || sourceY < 0 || sourceX >= fullWidth || sourceY >= fullHeight) continue;
      const sx = sourceX - source.left;
      const sy = sourceY - source.top;
      if (sx < 0 || sy < 0 || sx >= source.width || sy >= source.height) continue;
      const pixel = (y * width + x) * 4;
      const sourcePixel = (sy * source.width + sx) * 4;
      data[pixel] = original[pixel]! * (1 - amount) + source.data[sourcePixel]! * amount;
      data[pixel + 1] = original[pixel + 1]! * (1 - amount) + source.data[sourcePixel + 1]! * amount;
      data[pixel + 2] = original[pixel + 2]! * (1 - amount) + source.data[sourcePixel + 2]! * amount;
      data[pixel + 3] = original[pixel + 3]!;
    }
  }
}

async function applySelection(canvas: HTMLCanvasElement, operation: EditOperation): Promise<void> {
  const bounds = getSelectionBounds(operation.strokes, canvas.width, canvas.height);
  if (!bounds) return;
  const width = bounds.right - bounds.left;
  const height = bounds.bottom - bounds.top;
  if (width * height > MAX_INPAINT_REGION_PIXELS) {
    if (operation.strokes.length > 1) {
      for (const stroke of operation.strokes) await applySelection(canvas, { ...operation, strokes: [stroke] });
      return;
    }
    throw new Error("That brush selection is too large to process in one pass. Use a smaller brush or work on one section at a time.");
  }

  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) throw new Error("This browser could not edit the image.");
  const original = context.getImageData(bounds.left, bounds.top, width, height);
  const imageData = new ImageData(new Uint8ClampedArray(original.data), width, height);
  const originalPixels = new Uint8ClampedArray(original.data);
  const maskCanvas = drawSelectionMask(operation.strokes, width, height, bounds.left, bounds.top, canvas.width, canvas.height);
  const maskContext = maskCanvas.getContext("2d", { willReadFrequently: true });
  if (!maskContext) throw new Error("This browser could not prepare the selection.");
  const mask = maskContext.getImageData(0, 0, width, height).data;
  const alpha = new Uint8ClampedArray(width * height);
  for (let i = 0; i < alpha.length; i++) alpha[i] = mask[i * 4 + 3]!;

  if (operation.mode === "clone" && operation.cloneOffset) {
    // Clone pixels are sampled from the current full-resolution result so the
    // source can sit outside the small edited region.
    const offsetX = Math.round(operation.cloneOffset.x * canvas.width);
    const offsetY = Math.round(operation.cloneOffset.y * canvas.height);
    const sourceLeft = clamp(bounds.left - offsetX, 0, canvas.width - 1);
    const sourceTop = clamp(bounds.top - offsetY, 0, canvas.height - 1);
    const source = context.getImageData(
      sourceLeft,
      sourceTop,
      Math.min(width, canvas.width - sourceLeft),
      Math.min(height, canvas.height - sourceTop)
    );
    await cloneSelectionRegion({
      data: imageData.data,
      original: originalPixels,
      maskAlpha: alpha,
      width,
      height,
      fullWidth: canvas.width,
      fullHeight: canvas.height,
      left: bounds.left,
      top: bounds.top,
      offsetX,
      offsetY,
      source: { ...source, left: sourceLeft, top: sourceTop },
    });
  } else {
    await inpaintRegion(imageData.data, originalPixels, alpha, width, height);
  }

  context.putImageData(imageData, bounds.left, bounds.top);
  maskCanvas.width = 0;
  maskCanvas.height = 0;
}

export async function renderOperations(file: File, operations: EditOperation[], onProgress?: (message: string) => void): Promise<LoadedImage> {
  const loaded = await decodeImage(file);
  for (let index = 0; index < operations.length; index++) {
    onProgress?.(`Editing section ${index + 1} of ${operations.length}…`);
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
    await applySelection(loaded.canvas, operations[index]!);
  }
  return loaded;
}

export function canvasToPng(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) reject(new Error("The PNG could not be created. Try a smaller image or another browser."));
      else resolve(blob);
    }, "image/png");
  });
}

export function outputFilename(name: string): string {
  const dot = name.lastIndexOf(".");
  const base = (dot > 0 ? name.slice(0, dot) : name).trim() || "image";
  return `${base}-watermark-removed.png`;
}
