"use client";

import { arrayMove } from "@dnd-kit/sortable";
import { nanoid } from "nanoid";
import type { PDFDocumentProxy } from "pdfjs-dist";

export type SourceId = string;
export type PageId = string;

export type Source = {
  id: SourceId;
  name: string;
  bytes: ArrayBuffer;
  pageCount: number;
  pdfDocument: PDFDocumentProxy;
};

export type PageStatus = "pending" | "ready" | "error";

export type Page = {
  id: PageId;
  sourceId: SourceId;
  sourcePageIndex: number;
  thumbUrl: string | null;
  status: PageStatus;
};

export type RejectedItem = { name: string; reason: string };

export type MergeState = {
  sources: Map<SourceId, Source>;
  pages: Page[];
  rejected: RejectedItem[];
  building: boolean;
  error: string | null;
};

export type MergeAction =
  | { type: "add-sources"; sources: Source[]; pages: Page[] }
  | { type: "reject"; items: RejectedItem[] }
  | { type: "thumb-ready"; pageId: PageId; url: string }
  | { type: "thumb-error"; pageId: PageId }
  | { type: "reorder"; from: number; to: number }
  | { type: "delete"; pageId: PageId }
  | { type: "build-start" }
  | { type: "build-done" }
  | { type: "build-error"; message: string }
  | { type: "reset" };

export const initialMergeState: MergeState = {
  sources: new Map(),
  pages: [],
  rejected: [],
  building: false,
  error: null,
};

/** Build the initial pages array (all `pending`) for a new Source. */
export function buildPagesForSource(source: Source): Page[] {
  const pages: Page[] = [];
  for (let i = 0; i < source.pageCount; i += 1) {
    pages.push({
      id: nanoid(10),
      sourceId: source.id,
      sourcePageIndex: i,
      thumbUrl: null,
      status: "pending",
    });
  }
  return pages;
}

export function mergeReducer(
  state: MergeState,
  action: MergeAction,
): MergeState {
  switch (action.type) {
    case "add-sources": {
      if (action.sources.length === 0) return state;
      const nextSources = new Map(state.sources);
      for (const src of action.sources) {
        nextSources.set(src.id, src);
      }
      return {
        ...state,
        sources: nextSources,
        pages: [...state.pages, ...action.pages],
        rejected: [],
        error: null,
      };
    }
    case "reject": {
      if (action.items.length === 0) return state;
      return {
        ...state,
        rejected: [...state.rejected, ...action.items],
      };
    }
    case "thumb-ready": {
      let touched = false;
      const pages = state.pages.map((p) => {
        if (p.id !== action.pageId) return p;
        touched = true;
        return { ...p, status: "ready" as const, thumbUrl: action.url };
      });
      if (!touched) return state;
      return { ...state, pages };
    }
    case "thumb-error": {
      let touched = false;
      const pages = state.pages.map((p) => {
        if (p.id !== action.pageId) return p;
        touched = true;
        return { ...p, status: "error" as const };
      });
      if (!touched) return state;
      return { ...state, pages };
    }
    case "reorder": {
      if (action.from === action.to) return state;
      if (
        action.from < 0 ||
        action.to < 0 ||
        action.from >= state.pages.length ||
        action.to >= state.pages.length
      ) {
        return state;
      }
      return {
        ...state,
        pages: arrayMove(state.pages, action.from, action.to),
      };
    }
    case "delete": {
      const idx = state.pages.findIndex((p) => p.id === action.pageId);
      if (idx < 0) return state;
      const pages = state.pages.slice(0, idx).concat(state.pages.slice(idx + 1));
      const stillReferenced = new Set<SourceId>();
      for (const p of pages) stillReferenced.add(p.sourceId);
      let sources = state.sources;
      if (stillReferenced.size !== state.sources.size) {
        sources = new Map();
        for (const [id, src] of state.sources) {
          if (stillReferenced.has(id)) sources.set(id, src);
        }
      }
      return { ...state, pages, sources };
    }
    case "build-start":
      return { ...state, building: true, error: null };
    case "build-done":
      return { ...state, building: false, error: null };
    case "build-error":
      return { ...state, building: false, error: action.message };
    case "reset":
      return initialMergeState;
    default: {
      // Exhaustiveness check
      void (action satisfies never);
      return state;
    }
  }
}
