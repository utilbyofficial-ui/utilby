import {
  extractAlphaChannel,
  getModelInputDimensions,
  hasUsableAlphaMask,
  preserveOpaqueSubjectInterior,
  validateImageDimensions,
} from "./engine";

type WorkerMessage =
  | { type: "remove-background"; jobId: number; file: Blob }
  | { type: "dispose" };

type WorkerReply = {
  type: "progress" | "complete" | "error" | "cancelled";
  jobId?: number;
  stage?: "model" | "fallback" | "image" | "processing";
  percent?: number;
  message?: string;
  backend?: "primary" | "fallback";
  width?: number;
  height?: number;
  alpha?: ArrayBuffer;
};

type WorkerGlobal = {
  addEventListener: (type: "message", callback: (event: MessageEvent<WorkerMessage>) => void) => void;
  postMessage: (message: WorkerReply, transfer?: Transferable[]) => void;
};

type ImageInput = Blob | OffscreenCanvas;
type MaskResult = { alpha: Uint8Array; width: number; height: number };
type Engine = {
  segment: (image: ImageInput) => Promise<MaskResult>;
  backend: "primary" | "fallback";
};
type Pipeline = (image: ImageInput) => Promise<unknown>;

const worker = globalThis as unknown as WorkerGlobal;
const PRIMARY_MODEL = "xrds/isnet-general-onnx-int8";
const FALLBACK_MODEL = "Xenova/modnet";
let enginePromise: Promise<Engine> | null = null;

function send(reply: WorkerReply, transfer?: Transferable[]) {
  worker.postMessage(reply, transfer);
}

function progressCallback(jobId: number, modelLabel: string) {
  return (event: unknown) => {
    const value = typeof event === "object" && event !== null && "progress" in event
      ? (event as { progress?: unknown }).progress
      : undefined;
    const progress = typeof value === "number" ? Math.max(0, Math.min(100, value)) : undefined;
    send({
      type: "progress",
      jobId,
      stage: "model",
      percent: progress === undefined ? undefined : Math.round(progress),
      message: progress === undefined ? `Loading ${modelLabel}…` : `Preparing ${modelLabel}…`,
    });
  };
}

function validateAlphaMask(alpha: Uint8Array) {
  if (!hasUsableAlphaMask(alpha)) {
    throw new Error("The AI model could not identify a clear subject in this photo. Try a photo where the subject is easier to see.");
  }
}

async function loadPipelineEngine(
  modelId: string,
  jobId: number,
  label: string,
  backend: "primary" | "fallback"
): Promise<Engine> {
  const { env, pipeline } = await import("@huggingface/transformers");
  env.allowLocalModels = false;
  env.allowRemoteModels = true;
  env.useBrowserCache = true;

  const segment = await pipeline("background-removal", modelId, {
    device: "wasm",
    dtype: "q8",
    progress_callback: progressCallback(jobId, label),
  });
  return {
    backend,
    segment: async (image) => {
      const raw = await (segment as unknown as Pipeline)(image);
      const result = Array.isArray(raw) ? raw[0] : raw;
      if (!result || typeof result !== "object") throw new Error("The AI model returned an empty result.");
      const output = result as { data?: ArrayLike<number>; width?: number; height?: number; channels?: number };
      if (!output.data || !output.width || !output.height || !output.channels) {
        throw new Error("The AI model returned an incomplete result.");
      }
      const alpha = extractAlphaChannel(output.data, output.width, output.height, output.channels);
      validateAlphaMask(alpha);
      return { alpha: preserveOpaqueSubjectInterior(alpha, output.width, output.height), width: output.width, height: output.height };
    },
  };
}

async function getPipeline(jobId: number): Promise<Engine> {
  if (!enginePromise) {
    enginePromise = (async () => {
      try {
        return await loadPipelineEngine(PRIMARY_MODEL, jobId, "general image model", "primary");
      } catch {
        send({
          type: "progress",
          jobId,
          stage: "fallback",
          percent: 0,
          message: "The general model is unavailable. Trying the portrait-focused model instead.",
        });
        return loadPipelineEngine(FALLBACK_MODEL, jobId, "portrait model", "fallback");
      }
    })();
  }
  try {
    return await enginePromise;
  } catch (error) {
    enginePromise = null;
    throw error;
  }
}

async function loadFallbackEngine(jobId: number): Promise<Engine> {
  enginePromise = null;
  send({
    type: "progress",
    jobId,
    stage: "fallback",
    percent: 0,
    message: "Trying the portrait-focused model instead. Your photo remains on this device.",
  });
  return loadPipelineEngine(FALLBACK_MODEL, jobId, "portrait model", "fallback");
}

async function prepareModelImage(file: Blob): Promise<{ image: Blob | OffscreenCanvas; width: number; height: number }> {
  if (typeof createImageBitmap !== "function") throw new Error("This browser cannot open this image format.");
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  try {
    const dimensionError = validateImageDimensions(bitmap.width, bitmap.height);
    if (dimensionError) throw new Error(dimensionError);

    const dimensions = getModelInputDimensions(bitmap.width, bitmap.height);
    if (typeof OffscreenCanvas === "undefined") {
      return { image: file, width: bitmap.width, height: bitmap.height };
    }

    const canvas = new OffscreenCanvas(dimensions.width, dimensions.height);
    const context = canvas.getContext("2d", { alpha: false });
    if (!context) throw new Error("The browser could not prepare the image for editing.");
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = "high";
    context.drawImage(bitmap, 0, 0, dimensions.width, dimensions.height);
    const image = await canvas.convertToBlob({ type: "image/png" });
    if (!image.size) throw new Error("The browser could not prepare the image for editing.");
    return { image, width: bitmap.width, height: bitmap.height };
  } finally {
    bitmap.close();
  }
}

worker.addEventListener("message", async (event) => {
  const message = event.data;
  if (message.type === "dispose") {
    enginePromise = null;
    return;
  }
  if (message.type !== "remove-background") return;

  const { jobId, file } = message;
  try {
    send({ type: "progress", jobId, stage: "image", percent: 0, message: "Opening your image…" });
    const { image } = await prepareModelImage(file);
    send({ type: "progress", jobId, stage: "processing", percent: 0, message: "Finding the subject and fine edges…" });

    let loaded = await getPipeline(jobId);
    let result: MaskResult;
    try {
      send({
        type: "progress",
        jobId,
        stage: "processing",
        percent: 80,
        message: loaded.backend === "primary" ? "Refining fine edges…" : "Finishing the cutout…",
      });
      result = await loaded.segment(image);
    } catch (error) {
      if (loaded.backend !== "primary") throw error;
      loaded = await loadFallbackEngine(jobId);
      result = await loaded.segment(image);
    }

    const alphaBuffer = result.alpha.buffer as ArrayBuffer;
    send({
      type: "complete",
      jobId,
      backend: loaded.backend,
      width: result.width,
      height: result.height,
      alpha: alphaBuffer,
    }, [alphaBuffer]);
  } catch (error) {
    const detail = error instanceof Error ? error.message : "Unknown processing error";
    const networkError = /fetch|network|download|cors|failed to load/i.test(detail);
    send({
      type: "error",
      jobId,
      message: networkError
        ? "The AI model could not be downloaded. Check your internet connection, then press Try again. Your image was not uploaded."
        : detail || "This image could not be processed. Try a JPG, PNG, WebP, or BMP image.",
    });
  }
});
