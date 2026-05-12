"use client";

import { Upload } from "lucide-react";
import { useCallback, useId, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { isPdfFile } from "@/lib/pdf/mime";

export type DropzoneRejection = { name: string; reason: string };

export interface DropzoneProps {
  accept: "application/pdf";
  multiple: boolean;
  onFiles: (files: File[]) => void;
  onReject: (rejected: DropzoneRejection[]) => void;
  label: string;
  description?: string;
}

function partition(files: File[]): {
  accepted: File[];
  rejected: DropzoneRejection[];
} {
  const accepted: File[] = [];
  const rejected: DropzoneRejection[] = [];
  for (const file of files) {
    if (isPdfFile(file)) {
      accepted.push(file);
    } else {
      rejected.push({
        name: file.name || "(unnamed file)",
        reason: "Not a PDF file",
      });
    }
  }
  return { accepted, rejected };
}

export function Dropzone({
  accept,
  multiple,
  onFiles,
  onReject,
  label,
  description,
}: DropzoneProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const dragCounterRef = useRef(0);

  const emit = useCallback(
    (files: File[]) => {
      if (files.length === 0) return;
      const { accepted, rejected } = partition(files);
      if (rejected.length > 0) onReject(rejected);
      if (accepted.length > 0) onFiles(accepted);
    },
    [onFiles, onReject],
  );

  const handleDragEnter = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    dragCounterRef.current += 1;
    setDragging(true);
  }, []);

  const handleDragLeave = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    dragCounterRef.current = Math.max(0, dragCounterRef.current - 1);
    if (dragCounterRef.current === 0) setDragging(false);
  }, []);

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = "copy";
    }
  }, []);

  const handleDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      event.stopPropagation();
      dragCounterRef.current = 0;
      setDragging(false);
      const files = Array.from(event.dataTransfer?.files ?? []);
      emit(files);
    },
    [emit],
  );

  const handleInputChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(event.target.files ?? []);
      emit(files);
      // Reset so the same file can be reselected.
      event.target.value = "";
    },
    [emit],
  );

  const openFilePicker = useCallback(() => {
    inputRef.current?.click();
  }, []);

  return (
    <div
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors",
        dragging
          ? "border-primary bg-primary/5"
          : "border-border bg-card hover:border-foreground/30",
      )}
      role="button"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          openFilePicker();
        }
      }}
      onClick={openFilePicker}
      aria-label={label}
    >
      <div className="flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <Upload className="size-5" />
      </div>
      <div className="flex flex-col gap-1">
        <p className="text-sm font-medium">{label}</p>
        {description ? (
          <p className="text-xs text-muted-foreground">{description}</p>
        ) : null}
      </div>
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={(event) => {
          event.stopPropagation();
          openFilePicker();
        }}
      >
        Browse
      </Button>
      <input
        id={inputId}
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        className="sr-only"
        onChange={handleInputChange}
      />
    </div>
  );
}

export default Dropzone;
