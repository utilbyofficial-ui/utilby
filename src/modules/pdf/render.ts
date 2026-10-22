"use client";

import type { PDFDocumentProxy } from "pdfjs-dist";

export const PDFJS_WORKER_SRC = "/vendor/pdfjs/pdf.worker-4.10.38.min.js";

type PdfjsModule = typeof import("pdfjs-dist");
let pdfjsPromise: Promise<PdfjsModule> | null = null;

/** Lazily loads pdf.js only in the browser (keeps it out of the initial bundle and SSR). */
export function getPdfjs(): Promise<PdfjsModule> {
  if (!pdfjsPromise) {
    pdfjsPromise = import("pdfjs-dist").then((mod) => {
      mod.GlobalWorkerOptions.workerSrc = PDFJS_WORKER_SRC;
      return mod;
    });
  }
  return pdfjsPromise;
}

export async function openPdfForRendering(bytes: Uint8Array): Promise<PDFDocumentProxy> {
  const pdfjs = await getPdfjs();
  // pdf.js transfers the buffer to its worker, so give it a copy.
  const task = pdfjs.getDocument({ data: bytes.slice(), isEvalSupported: false });
  return task.promise;
}

/** Renders one page (0-based) to a PNG/JPEG object URL at roughly `targetWidth` CSS pixels. */
export async function renderPageToUrl(
  doc: PDFDocumentProxy,
  pageIndex: number,
  targetWidth: number
): Promise<string> {
  const page = await doc.getPage(pageIndex + 1);
  const base = page.getViewport({ scale: 1 });
  const dpr = typeof window !== "undefined" ? Math.min(2, window.devicePixelRatio || 1) : 1;
  const scale = (targetWidth * dpr) / base.width;
  const viewport = page.getViewport({ scale });
  const canvas = document.createElement("canvas");
  canvas.width = Math.ceil(viewport.width);
  canvas.height = Math.ceil(viewport.height);
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  await page.render({ canvasContext: ctx, viewport }).promise;
  page.cleanup();
  const blob: Blob = await new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Render failed"))), "image/jpeg", 0.85)
  );
  canvas.width = 0;
  canvas.height = 0;
  return URL.createObjectURL(blob);
}
