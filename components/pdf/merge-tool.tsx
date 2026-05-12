"use client";

import { nanoid } from "nanoid";
import { useCallback, useEffect, useMemo, useReducer, useRef } from "react";
import { toast } from "sonner";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Dropzone } from "@/components/pdf/dropzone";
import { PageGrid } from "@/components/pdf/page-grid";
import { SummaryPanel } from "@/components/pdf/summary-panel";
import {
  buildPagesForSource,
  initialMergeState,
  mergeReducer,
  type MergeState,
  type Source,
} from "@/components/pdf/merge-reducer";
import { loadPdfjs } from "@/lib/pdf/load-pdfjs";
import { buildMergedPdf } from "@/lib/pdf/merge";
import { renderThumbnail } from "@/lib/pdf/thumbnail";
import { timestampedName } from "@/lib/pdf/mime";

async function readFileBytes(file: File): Promise<ArrayBuffer> {
  return file.arrayBuffer();
}

export function MergeTool() {
  const [state, dispatch] = useReducer(mergeReducer, initialMergeState);

  // Refs to always-latest state + live cleanup tracking so effects never
  // leak object URLs or PDFDocument handles.
  const stateRef = useRef<MergeState>(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const knownThumbUrlsRef = useRef<Map<string, string>>(new Map());
  const knownSourcesRef = useRef<Map<string, Source>>(new Map());

  // Reconcile pages ↔ object URLs: revoke any URL whose page is gone.
  useEffect(() => {
    const presentPageIds = new Set(state.pages.map((p) => p.id));
    for (const [pageId, url] of knownThumbUrlsRef.current) {
      if (!presentPageIds.has(pageId)) {
        URL.revokeObjectURL(url);
        knownThumbUrlsRef.current.delete(pageId);
      }
    }
    for (const p of state.pages) {
      if (p.thumbUrl) {
        knownThumbUrlsRef.current.set(p.id, p.thumbUrl);
      } else {
        knownThumbUrlsRef.current.delete(p.id);
      }
    }
  }, [state.pages]);

  // Reconcile sources: destroy pdf documents that have been dropped.
  useEffect(() => {
    for (const [id, source] of knownSourcesRef.current) {
      if (!state.sources.has(id)) {
        try {
          source.pdfDocument.destroy();
        } catch {
          // best effort
        }
        knownSourcesRef.current.delete(id);
      }
    }
    for (const [id, source] of state.sources) {
      knownSourcesRef.current.set(id, source);
    }
  }, [state.sources]);

  // Unmount cleanup.
  useEffect(() => {
    const thumbUrls = knownThumbUrlsRef.current;
    const sources = knownSourcesRef.current;
    return () => {
      for (const [, url] of thumbUrls) {
        URL.revokeObjectURL(url);
      }
      thumbUrls.clear();
      for (const [, source] of sources) {
        try {
          source.pdfDocument.destroy();
        } catch {
          // best effort
        }
      }
      sources.clear();
    };
  }, []);

  // Thumbnail queue — walks pending pages sequentially so large merges stay responsive.
  const renderingRef = useRef(false);
  useEffect(() => {
    if (renderingRef.current) return;
    const pending = state.pages.find((p) => p.status === "pending");
    if (!pending) return;

    let cancelled = false;
    renderingRef.current = true;

    (async () => {
      try {
        while (!cancelled) {
          const current = stateRef.current.pages.find(
            (p) => p.status === "pending",
          );
          if (!current) break;
          const source = stateRef.current.sources.get(current.sourceId);
          if (!source) {
            dispatch({ type: "thumb-error", pageId: current.id });
            continue;
          }
          try {
            const blob = await renderThumbnail(
              source.pdfDocument,
              current.sourcePageIndex,
            );
            if (cancelled) return;
            const url = URL.createObjectURL(blob);
            dispatch({ type: "thumb-ready", pageId: current.id, url });
          } catch (err) {
            console.error("Thumbnail render failed", err);
            if (!cancelled) {
              dispatch({ type: "thumb-error", pageId: current.id });
            }
          }
          // Yield so React can paint the new tile.
          await Promise.resolve();
        }
      } finally {
        renderingRef.current = false;
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [state.pages, state.sources]);

  const handleFiles = useCallback(async (files: File[]) => {
    try {
      const pdfjs = await loadPdfjs();
      const newSources: Source[] = [];
      const newPages = [] as ReturnType<typeof buildPagesForSource>;
      for (const file of files) {
        try {
          const bytes = await readFileBytes(file);
          const loadingTask = pdfjs.getDocument({
            // Pass a copy so pdfjs-dist can transfer without affecting our cache.
            data: bytes.slice(0),
          });
          const pdfDocument = await loadingTask.promise;
          const source: Source = {
            id: nanoid(10),
            name: file.name,
            bytes,
            pageCount: pdfDocument.numPages,
            pdfDocument,
          };
          newSources.push(source);
          newPages.push(...buildPagesForSource(source));
        } catch (err) {
          const message = err instanceof Error ? err.message : "Unknown error";
          toast.error(`Could not open ${file.name}`, { description: message });
        }
      }
      if (newSources.length > 0) {
        dispatch({
          type: "add-sources",
          sources: newSources,
          pages: newPages,
        });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      toast.error("Failed to load PDF engine", { description: message });
    }
  }, []);

  const handleReject = useCallback(
    (items: { name: string; reason: string }[]) => {
      dispatch({ type: "reject", items });
    },
    [],
  );

  const handleDelete = useCallback((pageId: string) => {
    dispatch({ type: "delete", pageId });
  }, []);

  const handleReorder = useCallback((from: number, to: number) => {
    dispatch({ type: "reorder", from, to });
  }, []);

  const handleDownload = useCallback(async () => {
    const current = stateRef.current;
    if (current.pages.length < 2 || current.building) return;
    dispatch({ type: "build-start" });
    try {
      const blob = await buildMergedPdf(current.pages, current.sources);
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = timestampedName("merged");
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      // Revoke shortly after so the download completes.
      setTimeout(() => URL.revokeObjectURL(url), 30_000);
      dispatch({ type: "build-done" });
      toast.success("Merged PDF downloaded");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      toast.error("Merge failed", { description: message });
      dispatch({ type: "build-error", message });
    }
  }, []);

  const thumbStats = useMemo(() => {
    let ready = 0;
    for (const p of state.pages) {
      if (p.status === "ready" || p.status === "error") ready += 1;
    }
    return { ready, total: state.pages.length };
  }, [state.pages]);

  return (
    <div className="flex flex-col gap-6">
      <Dropzone
        accept="application/pdf"
        multiple
        label="Drop PDFs here or click to browse"
        description="Add two or more PDFs. You can drop more any time."
        onFiles={handleFiles}
        onReject={handleReject}
      />

      {state.rejected.length > 0 ? (
        <Alert variant="destructive">
          <AlertTitle>Some files weren&apos;t added</AlertTitle>
          <AlertDescription>
            <ul className="list-disc pl-5">
              {state.rejected.map((item, idx) => (
                <li key={`${item.name}-${idx}`}>
                  <span className="font-medium">{item.name}</span>: {item.reason}
                </li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      ) : null}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
        <section className="min-w-0">
          <PageGrid
            pages={state.pages}
            sources={state.sources}
            onReorder={handleReorder}
            onDelete={handleDelete}
          />
        </section>
        <SummaryPanel
          sourceCount={state.sources.size}
          pageCount={state.pages.length}
          thumbsReady={thumbStats.ready}
          thumbsTotal={thumbStats.total}
          building={state.building}
          onDownload={handleDownload}
        />
      </div>
    </div>
  );
}

export default MergeTool;
