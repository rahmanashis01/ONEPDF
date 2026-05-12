"use client";

import { AlertTriangle, FileText } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatBytes } from "@/lib/pdf/mime";
import type { CompressState } from "@/components/pdf/compress-reducer";

export interface FileSummaryCardProps {
  source: CompressState["source"];
  preset: CompressState["preset"];
  result: CompressState["result"];
  ignoredExtra: number;
  rejectReason: string | null;
}

function presetLabel(preset: CompressState["preset"]): string {
  return preset.charAt(0).toUpperCase() + preset.slice(1);
}

export function FileSummaryCard({
  source,
  preset,
  result,
  ignoredExtra,
  rejectReason,
}: FileSummaryCardProps) {
  const hasSource = !!source;
  const origSize = source?.size ?? 0;
  const compSize = result?.size ?? 0;
  const delta = origSize > 0 ? origSize - compSize : 0;
  const percent =
    origSize > 0 && result
      ? Math.max(0, Math.round(((origSize - compSize) / origSize) * 100))
      : 0;
  const noReduction = result && compSize >= origSize;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="size-4 text-muted-foreground" />
          <span className="truncate" title={source?.name}>
            {source?.name ?? "No PDF loaded"}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {hasSource ? (
          <>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">Preset · {presetLabel(preset)}</Badge>
              <Badge variant="outline">{source!.pdfDocument.numPages} pages</Badge>
            </div>
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex flex-col gap-0.5">
                <dt className="text-xs text-muted-foreground">Original size</dt>
                <dd className="font-semibold tabular-nums">
                  {formatBytes(origSize)}
                </dd>
              </div>
              {result ? (
                <div className="flex flex-col gap-0.5">
                  <dt className="text-xs text-muted-foreground">
                    Compressed size
                  </dt>
                  <dd className="font-semibold tabular-nums">
                    {formatBytes(compSize)}
                  </dd>
                </div>
              ) : null}
            </dl>
            {result ? (
              <p className="text-xs text-muted-foreground">
                {noReduction
                  ? "No reduction — result is the same size or larger. Try a different preset."
                  : `Saved ${formatBytes(Math.max(0, delta))} (${percent}% smaller).`}
              </p>
            ) : null}
          </>
        ) : (
          <p className="text-sm text-muted-foreground">
            Drop a PDF above or use the Browse button to select one.
          </p>
        )}
        {ignoredExtra > 0 ? (
          <Alert>
            <AlertTriangle />
            <AlertTitle>Extra files were ignored</AlertTitle>
            <AlertDescription>
              Compress accepts one PDF at a time. {ignoredExtra} additional file
              {ignoredExtra === 1 ? "" : "s"} from the drop were skipped.
            </AlertDescription>
          </Alert>
        ) : null}
        {rejectReason ? (
          <Alert variant="destructive">
            <AlertTriangle />
            <AlertTitle>Couldn&apos;t use that file</AlertTitle>
            <AlertDescription>{rejectReason}</AlertDescription>
          </Alert>
        ) : null}
      </CardContent>
    </Card>
  );
}

export default FileSummaryCard;
