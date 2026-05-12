"use client";

import { ImageOff, Loader, Trash2 } from "lucide-react";
import { forwardRef } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Page } from "@/components/pdf/merge-reducer";

export interface PageTileProps extends React.HTMLAttributes<HTMLDivElement> {
  page: Page;
  sourceName: string;
  position: number; // 1-based grid index
  onDelete: (pageId: string) => void;
  isDragging?: boolean;
}

export const PageTile = forwardRef<HTMLDivElement, PageTileProps>(
  function PageTile(
    { page, sourceName, position, onDelete, isDragging, className, ...rest },
    ref,
  ) {
    return (
      <div
        ref={ref}
        className={cn(
          "group relative flex flex-col overflow-hidden rounded-lg border bg-card shadow-sm transition-shadow",
          isDragging ? "opacity-70 ring-2 ring-primary" : "hover:shadow",
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
            className="absolute top-1.5 left-1.5 bg-background/90"
          >
            #{position}
          </Badge>
          <Button
            type="button"
            variant="destructive"
            size="icon-xs"
            aria-label={`Remove page ${position}`}
            className="absolute top-1.5 right-1.5 opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
            onPointerDown={(event) => event.stopPropagation()}
            onClick={(event) => {
              event.stopPropagation();
              onDelete(page.id);
            }}
          >
            <Trash2 />
          </Button>
        </div>
        <div className="flex flex-col gap-1 px-2 py-2">
          <p
            className="truncate text-xs font-medium"
            title={sourceName}
          >
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
