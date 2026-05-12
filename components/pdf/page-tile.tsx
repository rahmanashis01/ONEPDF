"use client";

import { ImageOff, Loader, Minus, Plus } from "lucide-react";
import { forwardRef } from "react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Page } from "@/components/pdf/merge-reducer";

export interface PageTileProps extends React.HTMLAttributes<HTMLDivElement> {
  page: Page;
  sourceName: string;
  position: number; // 1-based grid index
  onDelete: (pageId: string) => void;
  onDuplicate: (pageId: string) => void;
  isDragging?: boolean;
}

export const PageTile = forwardRef<HTMLDivElement, PageTileProps>(
  function PageTile(
    {
      page,
      sourceName,
      position,
      onDelete,
      onDuplicate,
      isDragging,
      className,
      ...rest
    },
    ref,
  ) {
    return (
      <div
        ref={ref}
        className={cn(
          "group/tile surface-dark relative flex flex-col overflow-hidden rounded-lg border shadow-sm transition-all",
          isDragging
            ? "opacity-70 ring-2 ring-fuchsia-400"
            : "hover:-translate-y-0.5 hover:shadow-md hover:shadow-fuchsia-500/10",
          className,
        )}
        {...rest}
      >
        <div className="relative flex aspect-[3/4] items-center justify-center overflow-hidden bg-muted">
          {page.status === "ready" && page.thumbUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={page.thumbUrl}
              alt={`${sourceName}, page ${page.sourcePageIndex + 1}`}
              className="h-full w-full select-none object-contain"
              draggable={false}
            />
          ) : page.status === "error" ? (
            <div className="flex flex-col items-center gap-1 text-muted-foreground">
              <ImageOff className="size-6" />
              <span className="text-xs">Preview failed</span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-1 text-muted-foreground">
              <Loader className="size-5 animate-spin" />
              <span className="text-xs">Rendering…</span>
            </div>
          )}

          <Badge
            variant="secondary"
            className="absolute top-1.5 left-1.5 bg-background/85 backdrop-blur"
          >
            #{position}
          </Badge>

          {/* Top-right tile controls: + (duplicate) and − (delete).
              Always visible so it's obvious they're interactive. */}
          <div className="absolute top-1.5 right-1.5 flex gap-1.5">
            <button
              type="button"
              aria-label={`Duplicate page ${position}`}
              title="Duplicate page"
              onPointerDown={(event) => event.stopPropagation()}
              onClick={(event) => {
                event.stopPropagation();
                onDuplicate(page.id);
              }}
              className="flex size-7 items-center justify-center rounded-full bg-background/85 text-foreground shadow ring-1 ring-black/5 backdrop-blur transition hover:bg-emerald-500 hover:text-white hover:ring-emerald-500"
            >
              <Plus className="size-3.5" />
            </button>
            <button
              type="button"
              aria-label={`Remove page ${position}`}
              title="Remove page"
              onPointerDown={(event) => event.stopPropagation()}
              onClick={(event) => {
                event.stopPropagation();
                onDelete(page.id);
              }}
              className="flex size-7 items-center justify-center rounded-full bg-background/85 text-foreground shadow ring-1 ring-black/5 backdrop-blur transition hover:bg-rose-500 hover:text-white hover:ring-rose-500"
            >
              <Minus className="size-3.5" />
            </button>
          </div>
        </div>
        <div className="flex flex-col gap-1 px-2 py-2">
          <p className="truncate text-xs font-medium" title={sourceName}>
            {sourceName}
          </p>
          <div className="flex items-center justify-between text-[11px] text-muted-foreground">
            <span>Page {page.sourcePageIndex + 1}</span>
            <span>Position {position}</span>
          </div>
        </div>
      </div>
    );
  },
);

export default PageTile;
