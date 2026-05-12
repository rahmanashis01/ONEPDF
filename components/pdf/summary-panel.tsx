"use client";

import { Download, Loader } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Progress, ProgressLabel, ProgressValue } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";

export interface SummaryPanelProps {
  sourceCount: number;
  pageCount: number;
  thumbsReady: number;
  thumbsTotal: number;
  building: boolean;
  onDownload: () => void;
}

export function SummaryPanel({
  sourceCount,
  pageCount,
  thumbsReady,
  thumbsTotal,
  building,
  onDownload,
}: SummaryPanelProps) {
  const disabled = pageCount < 2 || building;
  const guidance =
    pageCount < 2
      ? "Add at least two pages across one or more PDFs before exporting."
      : building
        ? "Building merged PDF…"
        : null;

  const thumbPercent =
    thumbsTotal > 0 ? Math.round((thumbsReady / thumbsTotal) * 100) : 0;

  return (
    <aside className="sticky top-4 flex flex-col gap-4 rounded-xl border bg-card p-4">
      <div className="flex flex-col gap-1">
        <h2 className="text-sm font-semibold">Merge summary</h2>
        <p className="text-xs text-muted-foreground">
          Tiles on the left describe the final document top-to-bottom.
        </p>
      </div>
      <Separator />
      <dl className="grid grid-cols-2 gap-3 text-sm">
        <div className="flex flex-col gap-0.5">
          <dt className="text-xs text-muted-foreground">Sources</dt>
          <dd className="text-lg font-semibold tabular-nums">{sourceCount}</dd>
        </div>
        <div className="flex flex-col gap-0.5">
          <dt className="text-xs text-muted-foreground">Pages kept</dt>
          <dd className="text-lg font-semibold tabular-nums">{pageCount}</dd>
        </div>
      </dl>
      {thumbsTotal > 0 && thumbsReady < thumbsTotal ? (
        <div className="flex flex-col gap-1">
          <Progress value={thumbPercent} aria-label="Thumbnail rendering progress">
            <ProgressLabel>Thumbnails</ProgressLabel>
            <ProgressValue>
              {() => `${thumbsReady} / ${thumbsTotal}`}
            </ProgressValue>
          </Progress>
        </div>
      ) : null}
      <Button
        type="button"
        onClick={onDownload}
        disabled={disabled}
        className="w-full"
        size="lg"
      >
        {building ? (
          <>
            <Loader className="animate-spin" /> Building…
          </>
        ) : (
          <>
            <Download /> Download merged PDF
          </>
        )}
      </Button>
      {guidance ? (
        <p className="text-xs text-muted-foreground">{guidance}</p>
      ) : null}
    </aside>
  );
}

export default SummaryPanel;
