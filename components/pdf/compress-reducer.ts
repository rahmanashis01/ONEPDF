"use client";

import type { PDFDocumentProxy } from "pdfjs-dist";

export type Preset = "high" | "medium" | "low";

export type CompressSource = {
  name: string;
  bytes: ArrayBuffer;
  size: number;
  pdfDocument: PDFDocumentProxy;
};

export type CompressState = {
  source: CompressSource | null;
  preset: Preset;
  progress: { done: number; total: number } | null;
  result: { blob: Blob; size: number } | null;
  ignoredExtra: number;
  rejectReason: string | null;
  running: boolean;
  error: string | null;
};

export type CompressAction =
  | { type: "set-source"; source: CompressSource; ignoredExtra: number }
  | { type: "reject"; reason: string }
  | { type: "set-preset"; preset: Preset }
  | { type: "start" }
  | { type: "progress"; done: number; total: number }
  | { type: "done"; blob: Blob; size: number }
  | { type: "error"; message: string }
  | { type: "reset" };

export const initialCompressState: CompressState = {
  source: null,
  preset: "medium",
  progress: null,
  result: null,
  ignoredExtra: 0,
  rejectReason: null,
  running: false,
  error: null,
};

export function compressReducer(
  state: CompressState,
  action: CompressAction,
): CompressState {
  switch (action.type) {
    case "set-source": {
      return {
        ...state,
        source: action.source,
        ignoredExtra: action.ignoredExtra,
        rejectReason: null,
        result: null,
        progress: null,
        error: null,
        running: false,
      };
    }
    case "reject": {
      return {
        ...state,
        rejectReason: action.reason,
      };
    }
    case "set-preset": {
      if (action.preset === state.preset) return state;
      return {
        ...state,
        preset: action.preset,
        result: null,
        progress: null,
        error: null,
      };
    }
    case "start":
      return {
        ...state,
        running: true,
        progress: { done: 0, total: state.source?.pdfDocument.numPages ?? 0 },
        result: null,
        error: null,
      };
    case "progress":
      return {
        ...state,
        progress: { done: action.done, total: action.total },
      };
    case "done":
      return {
        ...state,
        running: false,
        result: { blob: action.blob, size: action.size },
        progress: { done: state.progress?.total ?? 0, total: state.progress?.total ?? 0 },
      };
    case "error":
      return {
        ...state,
        running: false,
        error: action.message,
      };
    case "reset":
      return initialCompressState;
    default: {
      void (action satisfies never);
      return state;
    }
  }
}
