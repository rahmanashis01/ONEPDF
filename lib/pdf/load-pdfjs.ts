"use client";

// Lazy, cached loader for pdfjs-dist. Turbopack fingerprints the worker URL
// thanks to the `new URL("...", import.meta.url)` pattern below, so we get a
// stable, content-hashed asset URL without any runtime bundling.

type PdfjsModule = typeof import("pdfjs-dist");

let cached: Promise<PdfjsModule> | null = null;

export function loadPdfjs(): Promise<PdfjsModule> {
  if (!cached) {
    cached = (async () => {
      const pdfjs = await import("pdfjs-dist");
      const workerUrl = new URL(
        "pdfjs-dist/build/pdf.worker.min.mjs",
        import.meta.url,
      ).toString();
      pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;
      return pdfjs;
    })();
  }
  return cached;
}
