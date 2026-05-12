"use client";

import { PDFDocument } from "pdf-lib";

import type { Page, Source, SourceId } from "@/components/pdf/merge-reducer";

/**
 * Build a merged PDF from an ordered list of page references plus a source map.
 * Loads each source exactly once with `pdf-lib` then copies pages one at a
 * time, yielding between pages so the UI stays responsive on large merges.
 */
export async function buildMergedPdf(
  pages: Page[],
  sources: Map<SourceId, Source>,
): Promise<Blob> {
  const out = await PDFDocument.create();

  const loaded = new Map<SourceId, PDFDocument>();
  const sourceIdsInUse = new Set<SourceId>();
  for (const p of pages) sourceIdsInUse.add(p.sourceId);

  for (const sourceId of sourceIdsInUse) {
    const source = sources.get(sourceId);
    if (!source) {
      throw new Error(`Source ${sourceId} is missing`);
    }
    const doc = await PDFDocument.load(source.bytes);
    loaded.set(sourceId, doc);
  }

  for (const page of pages) {
    const src = loaded.get(page.sourceId);
    if (!src) {
      throw new Error(`Source ${page.sourceId} was not preloaded`);
    }
    const [copied] = await out.copyPages(src, [page.sourcePageIndex]);
    out.addPage(copied);
    await Promise.resolve();
  }

  const bytes = await out.save();
  // pdf-lib returns a Uint8Array; wrap the underlying buffer for a typed Blob.
  return new Blob([bytes as BlobPart], { type: "application/pdf" });
}
