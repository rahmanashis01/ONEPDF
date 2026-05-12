"use client";

import { PDFDocument } from "pdf-lib";
import type { PDFDocumentProxy } from "pdfjs-dist";

import type { Preset } from "@/components/pdf/compress-reducer";

export const PRESETS = {
  high: { dpi: 150, quality: 0.85 },
  medium: { dpi: 110, quality: 0.7 },
  low: { dpi: 80, quality: 0.55 },
} as const;

export type PresetValue = (typeof PRESETS)[Preset];

type RenderCanvas = OffscreenCanvas | HTMLCanvasElement;

function createCanvas(width: number, height: number): RenderCanvas {
  const w = Math.max(1, Math.round(width));
  const h = Math.max(1, Math.round(height));
  if (typeof OffscreenCanvas !== "undefined") {
    return new OffscreenCanvas(w, h);
  }
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  return canvas;
}

async function canvasToJpegBlob(
  canvas: RenderCanvas,
  quality: number,
): Promise<Blob> {
  if (
    typeof OffscreenCanvas !== "undefined" &&
    canvas instanceof OffscreenCanvas
  ) {
    return canvas.convertToBlob({ type: "image/jpeg", quality });
  }
  return new Promise<Blob>((resolve, reject) => {
    (canvas as HTMLCanvasElement).toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Canvas toBlob returned null"));
      },
      "image/jpeg",
      quality,
    );
  });
}

export async function compressPdf(
  source: { bytes: ArrayBuffer; pdfDocument: PDFDocumentProxy },
  preset: Preset,
  onProgress: (done: number, total: number) => void,
): Promise<Blob> {
  const { dpi, quality } = PRESETS[preset];
  const scale = dpi / 72;

  const out = await PDFDocument.create();
  const total = source.pdfDocument.numPages;

  for (let i = 1; i <= total; i += 1) {
    const page = await source.pdfDocument.getPage(i);
    const viewport = page.getViewport({ scale });
    const canvas = createCanvas(viewport.width, viewport.height);
    const ctx = (
      canvas as unknown as {
        getContext: (
          id: "2d",
        ) => CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D | null;
      }
    ).getContext("2d");
    if (!ctx) throw new Error("Unable to obtain 2D canvas context");

    await page.render({
      // pdfjs-dist accepts both regular and offscreen canvases at runtime,
      // but its public TS type is HTMLCanvasElement.
      canvas: canvas as unknown as HTMLCanvasElement,
      viewport,
    }).promise;

    const jpegBlob = await canvasToJpegBlob(canvas, quality);
    const jpegBytes = new Uint8Array(await jpegBlob.arrayBuffer());
    const embedded = await out.embedJpg(jpegBytes);

    const originalViewport = page.getViewport({ scale: 1 });
    const newPage = out.addPage([
      originalViewport.width,
      originalViewport.height,
    ]);
    newPage.drawImage(embedded, {
      x: 0,
      y: 0,
      width: originalViewport.width,
      height: originalViewport.height,
    });

    page.cleanup();
    onProgress(i, total);
    await Promise.resolve();
  }

  const bytes = await out.save();
  return new Blob([bytes as BlobPart], { type: "application/pdf" });
}
