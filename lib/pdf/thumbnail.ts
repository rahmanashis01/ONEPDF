"use client";

import type { PDFDocumentProxy } from "pdfjs-dist";

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

async function canvasToPngBlob(canvas: RenderCanvas): Promise<Blob> {
  if (
    typeof OffscreenCanvas !== "undefined" &&
    canvas instanceof OffscreenCanvas
  ) {
    return canvas.convertToBlob({ type: "image/png" });
  }
  return new Promise<Blob>((resolve, reject) => {
    (canvas as HTMLCanvasElement).toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Canvas toBlob returned null"));
      },
      "image/png",
    );
  });
}

/**
 * Render a PDF page as a small PNG thumbnail suitable for the merge grid.
 * Picks the smaller of a fixed scale or a bounded max width so that very large
 * pages do not blow out the canvas budget.
 */
export async function renderThumbnail(
  pdf: PDFDocumentProxy,
  pageIndex: number,
): Promise<Blob> {
  const page = await pdf.getPage(pageIndex + 1);
  try {
    const baseViewport = page.getViewport({ scale: 1 });
    const maxWidth = 240; // CSS pixels at devicePixelRatio 1
    const scale = Math.min(0.5, maxWidth / baseViewport.width);
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
      canvas: canvas as unknown as HTMLCanvasElement,
      viewport,
    }).promise;

    return await canvasToPngBlob(canvas);
  } finally {
    page.cleanup();
  }
}
