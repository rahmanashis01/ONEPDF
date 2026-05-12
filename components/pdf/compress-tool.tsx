"use client";

import { Download, Loader, Wand } from "lucide-react";
import { useCallback, useEffect, useReducer, useRef } from "react";
import { toast } from "sonner";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Progress,
  ProgressLabel,
  ProgressValue,
} from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Dropzone } from "@/components/pdf/dropzone";
import { FileSummaryCard } from "@/components/pdf/file-summary-card";
import { PresetPicker } from "@/components/pdf/preset-picker";
import {
  compressReducer,
  initialCompressState,
  type CompressSource,
  type CompressState,
  type Preset,
} from "@/components/pdf/compress-reducer";
import { compressPdf } from "@/lib/pdf/compress";
import { loadPdfjs } from "@/lib/pdf/load-pdfjs";
import { compressedFilename } from "@/lib/pdf/mime";

export function CompressTool() {
  const [state, dispatch] = useReducer(compressReducer, initialCompressState);
  const stateRef = useRef<CompressState>(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  // Track which source we've committed so we can destroy the previous one cleanly.
  const lastSourceRef = useRef<CompressSource | null>(null);
  useEffect(() => {
    if (lastSourceRef.current && lastSourceRef.current !== state.source) {
      try {
        lastSourceRef.current.pdfDocument.destroy();
      } catch {
        // best effort
      }
    }
    lastSourceRef.current = state.source;
  }, [state.source]);

  useEffect(() => {
    return () => {
      if (lastSourceRef.current) {
        try {
          lastSourceRef.current.pdfDocument.destroy();
        } catch {
          // best effort
        }
        lastSourceRef.current = null;
      }
    };
  }, []);

  const handleFiles = useCallback(async (files: File[]) => {
    if (files.length === 0) return;
    const [first, ...rest] = files;
    const ignoredExtra = rest.length;
    try {
      const pdfjs = await loadPdfjs();
      const bytes = await first.arrayBuffer();
      const pdfDocument = await pdfjs.getDocument({
        data: bytes.slice(0),
      }).promise;
      const source: CompressSource = {
        name: first.name,
        bytes,
        size: first.size,
        pdfDocument,
      };
      dispatch({ type: "set-source", source, ignoredExtra });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      toast.error(`Could not open ${first.name}`, { description: message });
      dispatch({ type: "reject", reason: message });
    }
  }, []);

  const handleReject = useCallback(
    (items: { name: string; reason: string }[]) => {
      if (items.length === 0) return;
      const summary = items
        .map((item) => `${item.name} (${item.reason})`)
        .join(", ");
      dispatch({ type: "reject", reason: summary });
    },
    [],
  );

  const handlePresetChange = useCallback((preset: Preset) => {
    dispatch({ type: "set-preset", preset });
  }, []);

  const handleCompress = useCallback(async () => {
    const current = stateRef.current;
    if (!current.source || current.running) return;
    dispatch({ type: "start" });
    try {
      const blob = await compressPdf(
        current.source,
        current.preset,
        (done, total) => {
          dispatch({ type: "progress", done, total });
        },
      );
      dispatch({ type: "done", blob, size: blob.size });
      toast.success("Compression complete");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      toast.error("Compression failed", { description: message });
      dispatch({ type: "error", message });
    }
  }, []);

  const handleDownload = useCallback(() => {
    const current = stateRef.current;
    if (!current.source || !current.result) return;
    const url = URL.createObjectURL(current.result.blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = compressedFilename(current.source.name, current.preset);
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 30_000);
  }, []);

  const progress = state.progress;
  const progressPercent =
    progress && progress.total > 0
      ? Math.round((progress.done / progress.total) * 100)
      : 0;

  return (
    <div className="flex flex-col gap-6">
      <Dropzone
        accept="application/pdf"
        multiple={false}
        label="Drop a PDF here or click to browse"
        description="One PDF at a time. Extra files in the same drop are ignored."
        onFiles={handleFiles}
        onReject={handleReject}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
        <section className="flex flex-col gap-6">
          <FileSummaryCard
            source={state.source}
            preset={state.preset}
            result={state.result}
            ignoredExtra={state.ignoredExtra}
            rejectReason={state.rejectReason}
          />

          {state.source ? (
            <div className="flex flex-col gap-4 rounded-xl border bg-card p-4">
              <h2 className="text-sm font-semibold">Compression preset</h2>
              <PresetPicker
                value={state.preset}
                onChange={handlePresetChange}
                disabled={state.running}
              />
            </div>
          ) : null}

          {state.error ? (
            <Alert variant="destructive">
              <AlertTitle>Compression failed</AlertTitle>
              <AlertDescription>{state.error}</AlertDescription>
            </Alert>
          ) : null}
        </section>

        <aside className="sticky top-4 flex flex-col gap-4 rounded-xl border bg-card p-4">
          <div className="flex flex-col gap-1">
            <h2 className="text-sm font-semibold">Run compression</h2>
            <p className="text-xs text-muted-foreground">
              Everything runs in your browser — the PDF never leaves this page.
            </p>
          </div>
          <Separator />
          <Button
            type="button"
            onClick={handleCompress}
            disabled={!state.source || state.running}
            className="w-full"
            size="lg"
          >
            {state.running ? (
              <>
                <Loader className="animate-spin" /> Compressing…
              </>
            ) : (
              <>
                <Wand /> Compress
              </>
            )}
          </Button>

          {progress ? (
            <Progress value={progressPercent} aria-label="Compression progress">
              <ProgressLabel>Pages</ProgressLabel>
              <ProgressValue>
                {() => `${progress.done} / ${progress.total}`}
              </ProgressValue>
            </Progress>
          ) : null}

          <Button
            type="button"
            variant="outline"
            onClick={handleDownload}
            disabled={!state.result || state.running}
            className="w-full"
          >
            <Download /> Download compressed PDF
          </Button>

          {!state.source ? (
            <p className="text-xs text-muted-foreground">
              Drop a PDF above to enable compression.
            </p>
          ) : state.running ? (
            <p className="text-xs text-muted-foreground">
              Processing pages. This can take a moment for large PDFs.
            </p>
          ) : null}
        </aside>
      </div>
    </div>
  );
}

export default CompressTool;
