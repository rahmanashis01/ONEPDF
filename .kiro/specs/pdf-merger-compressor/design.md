# Design Document

## Overview

The PDF Merger & Compressor is implemented as two client-rendered tools inside the existing Next.js 16 App Router app. Both tools run entirely in the browser — `pdfjs-dist` parses/rasterizes input PDFs and `pdf-lib` assembles the output PDFs. The app ships a new landing page, two tool routes (`/merge`, `/compress`), and a shared Navbar that replaces the inline header currently living in `app/layout.tsx`.

The design deliberately keeps state local to each page via `useReducer` — there is no global store, no context beyond what Clerk already provides, and no server state for PDF bytes. All heavy operations yield between pages so the UI stays responsive, and all object URLs / PDF document handles are released on unmount.

## Goals and Non-Goals

### Goals

- Two tools (merge, compress) usable signed-out or signed-in.
- Zero PDF bytes sent off-device.
- Incremental thumbnail rendering and per-page progress during compression.
- Drag-and-drop reorder across source boundaries in the merge grid.
- Documented, fixed compression presets (High / Medium / Low).
- Clean integration with the existing shadcn style and Clerk auth shell.

### Non-Goals (v1)

- No OCR.
- No handling of password-protected / encrypted PDFs (rejected with an inline error).
- No server upload, no Next.js API routes, no server actions that touch PDF bytes.
- No auth-gating — the tools work without signing in.
- No page rotation UI (future).
- No split / extract feature (future).
- No persistence between sessions — reloading the page clears state.

## Architecture

### Runtime topology

```
Browser (Client_Runtime)
├── app/layout.tsx        ── renders <Navbar/> + children (server component shell)
├── app/page.tsx          ── Landing_Page (server component, static)
├── app/merge/page.tsx    ── mounts <MergeTool/> (client component, "use client")
├── app/compress/page.tsx ── mounts <CompressTool/> (client component, "use client")
├── components/navbar.tsx ── client component (Clerk <Show/> needs client)
├── components/pdf/*      ── all "use client"
└── lib/pdf/*             ── client-only modules; imported from client components
```

No `app/api/**` route handler imports `pdfjs-dist` or `pdf-lib` and no server action accepts PDF bytes. This is enforced by code organization and a lint rule described in "Client Boundary Enforcement".

### Module layout

```
app/
  layout.tsx                     # uses <Navbar/> in place of inline <header>
  page.tsx                       # Landing_Page (two cards linking to /merge, /compress)
  merge/page.tsx                 # client page; hosts MergeTool
  compress/page.tsx              # client page; hosts CompressTool

components/
  navbar.tsx                     # brand + nav links + Clerk controls
  pdf/
    dropzone.tsx                 # shared drag-drop + <input type="file"> wrapper
    page-tile.tsx                # one thumbnail tile in the merge grid
    page-grid.tsx                # @dnd-kit grid of PageTile
    summary-panel.tsx            # merge counts + download button + progress
    preset-picker.tsx            # RadioGroup for compression presets
    file-summary-card.tsx        # compress-side file info + size comparison

lib/
  pdf/
    load-pdfjs.ts                # dynamic import of pdfjs-dist + worker setup
    thumbnail.ts                 # renderPageToThumbnail(pdfDocument, pageIndex)
    merge.ts                     # buildMergedPdf(pages, sources) -> Blob
    compress.ts                  # compressPdf(source, preset, onProgress) -> { bytes, outSize }
    mime.ts                      # isPdfFile(File), formatBytes(n), timestampedName
```

Everything under `components/pdf/` and `lib/pdf/` is client-only. Importing these from a server component is disallowed by the `"use client"` directives at the entry components (`MergeTool`, `CompressTool`) and by `lib/pdf/*` depending on browser globals (`OffscreenCanvas`, `URL.createObjectURL`).

### Next.js 16 / Turbopack conventions

- All PDF-interacting components declare `"use client"` at the top of the file.
- `pdfjs-dist` and `pdf-lib` are **only** imported from within `lib/pdf/*` (which is only imported from client components). They are never imported from `app/layout.tsx`, `app/page.tsx`, `components/navbar.tsx` (Navbar only uses Clerk), or any server-only code path.
- Worker setup uses a build-time-resolvable URL so Turbopack bundles the worker and emits a stable asset URL:

```ts
// lib/pdf/load-pdfjs.ts
"use client";

let cached: Promise<typeof import("pdfjs-dist")> | null = null;

export function loadPdfjs() {
  if (!cached) {
    cached = (async () => {
      const pdfjs = await import("pdfjs-dist");
      // new URL(..., import.meta.url) lets Turbopack fingerprint + serve the worker.
      const workerUrl = new URL(
        "pdfjs-dist/build/pdf.worker.min.mjs",
        import.meta.url,
      ).toString();
      pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;
      return pdfjs;
    })();
  }
  return cached;
}
```

- The `proxy.ts` file (Clerk middleware) is unchanged — it does not touch `/merge` or `/compress` bodies.
- The existing file-skipping matcher already excludes static assets, so worker chunks emitted by Turbopack are served without going through Clerk.

## Components and Interfaces

### `app/layout.tsx`

Replaces the inline `<header>` with `<Navbar/>`. Remains a server component. `ClerkProvider` stays at the root so `<Navbar/>` (a client component) can use `<Show/>`, `<SignInButton/>`, etc. Fonts and global CSS are unchanged.

### `components/navbar.tsx` (client)

```tsx
"use client";

import Link from "next/link";
import { Show, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";

export function Navbar() {
  return (
    <header className="border-b">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="font-semibold">onepdf</Link>
        <nav className="flex items-center gap-4">
          <Link href="/merge">Merge</Link>
          <Link href="/compress">Compress</Link>
        </nav>
        <div className="flex items-center gap-2">
          <Show when="signed-out">
            <SignInButton mode="modal">
              <Button variant="ghost" size="sm">Sign in</Button>
            </SignInButton>
            <SignUpButton mode="modal">
              <Button size="sm">Sign up</Button>
            </SignUpButton>
          </Show>
          <Show when="signed-in">
            <UserButton />
          </Show>
        </div>
      </div>
    </header>
  );
}
```

The Navbar is the only header rendered by `app/layout.tsx`.

### `app/page.tsx` — Landing_Page

Server component. Replaces the existing demo sign-in form with:

- Hero: `<h1>onepdf</h1>` and a single sentence stating that merging and compressing happen in the browser.
- A two-column grid with exactly two shadcn `Card` components:
  - `MergeCard` wrapping a `<Link href="/merge">` with title "Merge PDFs" and a short description.
  - `CompressCard` wrapping a `<Link href="/compress">` with title "Compress a PDF" and a short description.

### `components/pdf/dropzone.tsx` (client)

Shared drop zone used by both tools. Props:

```ts
type DropzoneProps = {
  accept: "application/pdf";
  multiple: boolean;        // true on merge, false on compress
  onFiles: (files: File[]) => void;
  onReject: (rejected: { name: string; reason: string }[]) => void;
  label: string;            // e.g. "Drop PDFs here or click to browse"
};
```

- Uses native HTML5 DnD events (`dragenter`, `dragover`, `dragleave`, `drop`) plus a hidden `<input type="file">`.
- Filters files through `isPdfFile(f)` in `lib/pdf/mime.ts` (`f.type === "application/pdf" || /\.pdf$/i.test(f.name)`).
- Emits accepted files via `onFiles` and rejected via `onReject`. Never reads file contents itself.

### Merge tool

#### `app/merge/page.tsx`

```tsx
"use client";
import { MergeTool } from "@/components/pdf/merge-tool"; // local to this section

export default function MergePage() {
  return <MergeTool />;
}
```

`MergeTool` hosts the drop zone, the page grid, and the summary panel and owns the reducer.

#### State shape

```ts
// One Source_PDF held in memory while the page is mounted.
type Source = {
  id: string;                  // nanoid
  name: string;
  bytes: ArrayBuffer;          // original bytes, used for pdf-lib copyPages
  pageCount: number;
  pdfDocument: PDFDocumentProxy; // pdfjs document for thumbnail rendering
};

// One tile in the grid.
type Page = {
  id: string;                  // nanoid, stable across reorders
  sourceId: string;
  sourcePageIndex: number;     // 0-based
  thumbUrl: string | null;     // object URL of a PNG blob, or null
  status: "pending" | "ready" | "error";
};

type MergeState = {
  sources: Map<string, Source>;
  pages: Page[];
  rejected: { name: string; reason: string }[];
  building: boolean;
  error: string | null;
};

type MergeAction =
  | { type: "add-sources"; sources: Source[]; pages: Page[] }
  | { type: "reject"; items: { name: string; reason: string }[] }
  | { type: "thumb-ready"; pageId: string; url: string }
  | { type: "thumb-error"; pageId: string }
  | { type: "reorder"; from: number; to: number }
  | { type: "delete"; pageId: string }
  | { type: "build-start" }
  | { type: "build-done" }
  | { type: "build-error"; message: string }
  | { type: "reset" };
```

Why `Map` for sources: we never iterate sources by index and lookups by `sourceId` happen in `buildMergedPdf`.

The `delete` action also drops any source whose tile set becomes empty, so its `ArrayBuffer` and `PDFDocumentProxy` are eligible for GC. The reducer calls `source.pdfDocument.destroy()` inside an effect when a source is removed (reducers themselves stay pure).

#### Drag-and-drop

```tsx
import {
  DndContext,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCenter,
} from "@dnd-kit/core";
import {
  SortableContext,
  rectSortingStrategy,
  arrayMove,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
```

- `PointerSensor` with `activationConstraint: { distance: 6 }` so clicks on the delete button don't start drags.
- `KeyboardSensor` with `sortableKeyboardCoordinates` for keyboard reorder (a11y).
- `SortableContext` wraps the grid with `rectSortingStrategy` (the tiles are a 2D wrap grid).
- `onDragEnd({ active, over })` dispatches `{ type: "reorder", from, to }` where `from = pages.findIndex(p => p.id === active.id)` and `to = pages.findIndex(p => p.id === over.id)`.

#### Thumbnail pipeline

```ts
// lib/pdf/thumbnail.ts
export async function renderThumbnail(
  pdf: PDFDocumentProxy,
  pageIndex: number,
): Promise<Blob> {
  const page = await pdf.getPage(pageIndex + 1);
  const viewport = page.getViewport({ scale: 0.3 }); // ~thumbnail size
  const canvas = typeof OffscreenCanvas !== "undefined"
    ? new OffscreenCanvas(viewport.width, viewport.height)
    : Object.assign(document.createElement("canvas"), {
        width: viewport.width,
        height: viewport.height,
      });
  const ctx = canvas.getContext("2d")!;
  await page.render({ canvasContext: ctx as any, viewport }).promise;
  const blob = canvas instanceof OffscreenCanvas
    ? await canvas.convertToBlob({ type: "image/png" })
    : await new Promise<Blob>((resolve, reject) => {
        (canvas as HTMLCanvasElement).toBlob(
          (b) => (b ? resolve(b) : reject(new Error("toBlob failed"))),
          "image/png",
        );
      });
  page.cleanup();
  return blob;
}
```

`MergeTool` runs a sequential queue over `pages.filter(p => p.status === "pending")`, awaiting `renderThumbnail` for each. Between each page it awaits a microtask (`await Promise.resolve()`) so React can paint and the main thread yields. Each completion dispatches `thumb-ready` with a fresh `URL.createObjectURL(blob)`; errors dispatch `thumb-error`.

#### Merge build

```ts
// lib/pdf/merge.ts
import { PDFDocument } from "pdf-lib";

export async function buildMergedPdf(
  pages: Page[],
  sources: Map<string, Source>,
): Promise<Blob> {
  const out = await PDFDocument.create();
  // Load each source's PDFDocument once and cache copied pages by (sourceId, index).
  const loaded = new Map<string, PDFDocument>();
  for (const src of sources.values()) {
    loaded.set(src.id, await PDFDocument.load(src.bytes));
  }
  for (const p of pages) {
    const src = loaded.get(p.sourceId)!;
    const [copied] = await out.copyPages(src, [p.sourcePageIndex]);
    out.addPage(copied);
    await Promise.resolve(); // yield
  }
  const bytes = await out.save();
  return new Blob([bytes], { type: "application/pdf" });
}
```

`SummaryPanel` triggers a download via an anchor with `download={timestampedName("merged")}` where `timestampedName("merged") === "merged-" + Date.now() + ".pdf"`.

### Compress tool

#### State shape

```ts
type Preset = "high" | "medium" | "low";

type CompressState = {
  source: {
    name: string;
    bytes: ArrayBuffer;
    size: number;
    pdfDocument: PDFDocumentProxy;
  } | null;
  preset: Preset;              // default "medium"
  progress: { done: number; total: number } | null;
  result: { blob: Blob; size: number } | null;
  ignoredExtra: number;        // count of files ignored when >1 dropped
  rejectReason: string | null; // non-PDF error
  running: boolean;
  error: string | null;
};
```

Actions cover: `set-source`, `set-preset`, `start`, `progress`, `done`, `error`, `reset`.

#### Preset table

All values are fixed constants exported from `lib/pdf/compress.ts`:

| Preset | Target DPI | JPEG quality | Scale (DPI/72) |
|--------|-----------:|-------------:|---------------:|
| High   | 150        | 0.85         | 2.0833…        |
| Medium | 110        | 0.70         | 1.5277…        |
| Low    | 80         | 0.55         | 1.1111…        |

```ts
export const PRESETS = {
  high:   { dpi: 150, quality: 0.85 },
  medium: { dpi: 110, quality: 0.70 },
  low:    { dpi:  80, quality: 0.55 },
} as const;
```

#### Compression algorithm

```ts
// lib/pdf/compress.ts
export async function compressPdf(
  source: { bytes: ArrayBuffer; pdfDocument: PDFDocumentProxy },
  preset: Preset,
  onProgress: (done: number, total: number) => void,
): Promise<Blob> {
  const { dpi, quality } = PRESETS[preset];
  const scale = dpi / 72;

  const out = await PDFDocument.create();
  const total = source.pdfDocument.numPages;

  for (let i = 1; i <= total; i++) {
    const page = await source.pdfDocument.getPage(i);
    const viewport = page.getViewport({ scale });

    const canvas = typeof OffscreenCanvas !== "undefined"
      ? new OffscreenCanvas(viewport.width, viewport.height)
      : Object.assign(document.createElement("canvas"), {
          width: viewport.width,
          height: viewport.height,
        });
    const ctx = canvas.getContext("2d")!;
    await page.render({ canvasContext: ctx as any, viewport }).promise;

    const jpegBlob = canvas instanceof OffscreenCanvas
      ? await canvas.convertToBlob({ type: "image/jpeg", quality })
      : await new Promise<Blob>((res, rej) =>
          (canvas as HTMLCanvasElement).toBlob(
            (b) => (b ? res(b) : rej(new Error("toBlob failed"))),
            "image/jpeg",
            quality,
          ),
        );

    const jpegBytes = new Uint8Array(await jpegBlob.arrayBuffer());
    const embedded = await out.embedJpg(jpegBytes);

    // Preserve original page dimensions (in PDF points).
    const originalViewport = page.getViewport({ scale: 1 });
    const newPage = out.addPage([originalViewport.width, originalViewport.height]);
    newPage.drawImage(embedded, {
      x: 0,
      y: 0,
      width: originalViewport.width,
      height: originalViewport.height,
    });

    page.cleanup();
    onProgress(i, total);
    await Promise.resolve(); // yield so the UI can paint the progress bar
  }

  const bytes = await out.save();
  return new Blob([bytes], { type: "application/pdf" });
}
```

Download filename: `${basename(originalName)}-compressed-${preset}.pdf`, where `basename` strips a trailing `.pdf` case-insensitively.

### `components/pdf/file-summary-card.tsx`

Shows file name, original bytes (`formatBytes(size)`), and — after compression — compressed bytes, absolute delta, and percent reduction. Uses `Badge` for the preset tag and `Alert` for the reject / ignored-extra messages.

### `components/pdf/preset-picker.tsx`

Wraps shadcn `RadioGroup` over the three preset values with a helper caption showing DPI and JPEG quality. Emits `onChange(preset)` to the parent reducer.

## Data Models

```ts
// Identifiers
type SourceId = string;   // nanoid(10)
type PageId   = string;   // nanoid(10)

// Merge
type Source = { id: SourceId; name: string; bytes: ArrayBuffer;
                pageCount: number; pdfDocument: PDFDocumentProxy };
type Page   = { id: PageId; sourceId: SourceId; sourcePageIndex: number;
                thumbUrl: string | null; status: "pending" | "ready" | "error" };

// Compress
type Preset = "high" | "medium" | "low";
type PresetValue = { dpi: number; quality: number };
```

## Memory and Resource Management

Resource release is handled at three points:

1. **Thumbnail object URLs**: every `thumb-ready` dispatch stores the URL in `Page.thumbUrl`. When a tile is deleted, a cleanup effect calls `URL.revokeObjectURL(page.thumbUrl)`. On unmount, a single effect iterates `pages` and revokes all non-null URLs.
2. **pdf.js documents**: when a source is removed (all its tiles deleted, or the whole state is reset), an effect calls `source.pdfDocument.destroy()`. On unmount, the same effect tears down every source's document.
3. **Source bytes**: dropping the `Source` from the `Map` in `MergeState.sources` (or clearing the `CompressState.source` field) is enough — once no reference is held, the `ArrayBuffer` is GC-eligible.

```tsx
useEffect(() => {
  return () => {
    for (const p of stateRef.current.pages) {
      if (p.thumbUrl) URL.revokeObjectURL(p.thumbUrl);
    }
    for (const s of stateRef.current.sources.values()) {
      s.pdfDocument.destroy();
    }
  };
}, []);
```

The same unmount-cleanup pattern is used on `/compress`.

## Client Boundary Enforcement

- Every file that imports `pdfjs-dist` or `pdf-lib` starts with `"use client"`.
- `lib/pdf/*` files are only imported from `components/pdf/*` and the two tool pages.
- `app/page.tsx`, `app/layout.tsx`, and `components/navbar.tsx` have no imports from `lib/pdf/*`.
- No file under `app/api/**` exists for this feature and none will be added.

## Error Handling

| Failure | Surface | Recovery |
|---|---|---|
| Non-PDF file selected | Inline `Alert` under the drop zone listing file names | User reselects |
| `PDFDocument.load` throws (corrupt / encrypted PDF) | Inline `Alert` | Source not added; other sources keep working |
| Thumbnail render throws | Tile enters `status: "error"` and shows a fallback icon | Remaining tiles still render; merge still works |
| Merge build throws | `sonner` toast with the error message; `building` flag cleared | Download button re-enables |
| Compress run throws | `sonner` toast; `running` flag cleared; partial output discarded | User can re-run |
| Worker fails to load | `sonner` toast and Alert | User reloads |

Errors never leak raw stack traces to the UI — we surface `err instanceof Error ? err.message : "Unknown error"`.

## shadcn Components to Add

Added via the shadcn CLI before implementation:

```
npx shadcn@latest add tabs radio-group progress sonner dialog separator badge alert
```

- `tabs`: reserved for future use (currently unused but the design scaffolds the picker area).
- `radio-group`: preset picker.
- `progress`: compression + merge progress bars.
- `sonner`: error and success toasts.
- `dialog`: optional confirm-reset dialog.
- `separator`: visual divider in the summary panel.
- `badge`: preset chips, source labels on tiles.
- `alert`: inline rejection and error messages.

`card`, `button`, `input`, `label` are already in `components/ui/`.

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Ingest grows the grid by the sum of page counts

For any sequence of valid PDF files added via either entry point (drop or picker), and for any prior `MergeState`, the new state satisfies `sources.size = prior.sources.size + N`, `pages.length = prior.pages.length + Σ pageCount_i`, and the suffix of `pages` consists of exactly the pages of the newly added sources in selection order with `sourcePageIndex` running `0..pageCount_i - 1` for each source.

**Validates: Requirements 3.2, 3.3, 4.1**

### Property 2: Only PDFs enter ingest state

For any file whose MIME type is not `application/pdf` and whose filename does not end in `.pdf` (case-insensitive), ingesting that file (on either `/merge` or `/compress`) leaves the application state unchanged and produces an inline error message containing that file's name.

**Validates: Requirements 3.4, 7.4**

### Property 3: Download-merged gate tracks page count

For any `MergeState`, the "Download merged PDF" control is disabled and shows guidance text exactly when `pages.length < 2`, and is enabled otherwise (while not `building`).

**Validates: Requirements 3.5, 6.1**

### Property 4: Grid order is the export order

For any `MergeState` produced by any sequence of `add-sources`, `reorder`, and `delete` actions, the order of tiles rendered in the DOM equals `pages` in the reducer, and `buildMergedPdf(pages, sources)` produces a PDF whose i-th page is the i-th page referenced by `pages[i]` (same `sourceId`, `sourcePageIndex`).

**Validates: Requirements 4.2, 5.1, 5.2, 5.5, 6.2**

### Property 5: Tile text reflects position, source, and page index

For any `MergeState` and any tile at index `i` with `sourceId = s`, `sourcePageIndex = p`, the rendered tile contains the source's file name, the number `p + 1`, and the number `i + 1`.

**Validates: Requirements 4.3**

### Property 6: Delete preserves multiset minus one and prunes unreferenced sources

For any `MergeState` and any `pageId` present in `pages`, after dispatching `{ type: "delete", pageId }`:
- `pages.length` decreases by exactly 1 and the removed id is absent.
- The multiset of remaining tiles equals the prior multiset minus one occurrence of that id.
- `sources.has(sourceId)` holds iff at least one remaining tile references `sourceId`.

**Validates: Requirements 5.3, 5.4**

### Property 7: Reorder is array-move

For any `pages` array and any valid indices `(from, to)`, the result of `{ type: "reorder", from, to }` equals `arrayMove(pages, from, to)`: same length, same multiset of ids, and the relative order of all ids other than `pages[from]` is preserved.

**Validates: Requirements 5.1, 5.2**

### Property 8: Merge filename is timestamped

For any moment in time `t`, the generated merge download filename matches `/^merged-\d+\.pdf$/` and encodes `t` (e.g. `Date.now()`), so two builds at distinct times produce distinct filenames.

**Validates: Requirements 6.3**

### Property 9: Compressed PDF preserves page count and original dimensions

For any valid `Source_PDF` with `k` pages and any `preset`, `compressPdf(source, preset, _)` produces a PDF with exactly `k` pages; for each page `i`, the output page's width and height in PDF points equal the input page's width and height (at `scale = 1`), and the only image embedded in page `i` has content-type `image/jpeg`.

**Validates: Requirements 9.1, 9.2**

### Property 10: Canvas dimensions match preset DPI

For any input page with unit viewport `v = getViewport({ scale: 1 })` and any `preset`, the canvas used during compression has width `round(v.width * preset.dpi / 72)` and height `round(v.height * preset.dpi / 72)`.

**Validates: Requirements 9.1, 8.3**

### Property 11: Compression emits one progress tick per page

For any source with `k` pages, `compressPdf` invokes `onProgress` at least `k` times; the sequence of `(done, total)` tuples observed is strictly monotonically increasing in `done`, with `total = k` throughout, and the final tuple is `(k, k)`.

**Validates: Requirements 9.3, 11.3**

### Property 12: Size report matches bytes

For any successful compression with original size `orig` and result size `comp` (with `orig > 0`), the UI displays `orig`, `comp`, and a reduction that equals `round(((orig - comp) / orig) * 100)` percent. When `comp >= orig`, the reduction is shown as `0%` or "no reduction".

**Validates: Requirements 9.4**

### Property 13: Compressed filename is deterministic

For any original filename `name` and any `preset`, `compressedFilename(name, preset)` equals `${stripPdfExt(name)}-compressed-${preset}.pdf`, where `stripPdfExt` removes a single trailing `.pdf` extension case-insensitively and is an identity otherwise.

**Validates: Requirements 9.5**

### Property 14: Preset invalidation

For any `CompressState` with `result ≠ null` and any preset change where `newPreset ≠ state.preset`, after dispatching `{ type: "set-preset", preset: newPreset }`, `state.result` is `null` and the "Download compressed PDF" control is not shown.

**Validates: Requirements 8.4**

### Property 15: Single-preset invariant

For any `CompressState`, exactly one preset in `{"high", "medium", "low"}` is selected, and the preset radio reflects that value.

**Validates: Requirements 8.1, 8.2**

### Property 16: Compress replace resets result

For any `CompressState` and any valid new `Source_PDF`, after ingest the new source is active, `result` is `null`, `progress` is `null`, and `ignoredExtra` and `rejectReason` are reset.

**Validates: Requirements 7.5**

### Property 17: Multi-drop keeps the first PDF and counts the rest

For any drop containing `N ≥ 2` files whose first file is a valid PDF, after ingest on `/compress` the state's `source` is that first file and `ignoredExtra` equals `N - 1`, and a message reflecting that count is displayed.

**Validates: Requirements 7.3**

### Property 18: Async action error recovery

For any forced error thrown by `buildMergedPdf` or `compressPdf`, the tool dispatches an error action that (a) clears the `building`/`running` flag, (b) leaves the rest of state untouched, and (c) displays a `sonner` toast whose text contains the error message. The triggering button becomes enabled again after the dispatch.

**Validates: Requirements 6.5, 9.6**

### Property 19: No PDF bytes leave the client

During any merge or compress run, no outbound `fetch`, `XMLHttpRequest.send`, `Navigator.sendBeacon`, or `WebSocket.send` carries a body whose bytes match (or contain) any source `ArrayBuffer` or any produced output `Blob`.

**Validates: Requirements 10.1, 10.2, 10.3**

### Property 20: Unmount releases resources

For any `MergeState` or `CompressState` with at least one source, unmounting the tool page:
- Invokes `pdfDocument.destroy()` exactly once per source.
- Invokes `URL.revokeObjectURL` exactly once per non-null `thumbUrl`.
- Clears the in-memory `sources` map / `source` field.

**Validates: Requirements 10.4**

### Property 21: Thumbnails emit one ready-transition per page

For any source with `k` pages successfully rendered, the reducer observes exactly `k` `thumb-ready` dispatches (one per page) interleaved with React renders, rather than a single batch at the end; a tile becomes `status: "ready"` independently of the status of other tiles in the same source.

**Validates: Requirements 4.4, 4.5, 11.1, 11.2**

### Property 22: Secondary action during processing is disabled or queued

For any state where `building` or `running` is true, any secondary action control (e.g. "Download", "Compress", "Reset") is either:
- disabled and shows guidance text indicating processing is in progress, or
- queued — the action is recorded and executed exactly once after processing finishes, with no duplicate effect.

**Validates: Requirements 11.4**

## Testing Strategy

### Unit / example tests

- `lib/pdf/mime.ts`: `isPdfFile`, `formatBytes`, `timestampedName`, `stripPdfExt`, `compressedFilename`.
- `app/page.tsx`: renders hero + two cards with correct links; old demo form is gone.
- `components/navbar.tsx`: signed-in vs signed-out branches render the expected Clerk components (Clerk mocked).
- `preset-picker.tsx`: default selection is `medium`; changing preset dispatches `set-preset`.
- Edge cases: zero-page PDF (rejected), single-page PDF on merge (download disabled), drop of zero files, drop of one non-PDF + one PDF.

### Property tests

Every property above is implemented with `fast-check` and tagged:

```
Feature: pdf-merger-compressor, Property N: <property text>
```

Property tests run at least 100 iterations each. Generators:

- `arbitraryPdfBytes(pageCount)` produces a synthetic PDF via `pdf-lib` at test time with deterministic content per page.
- `arbitraryMergeState` composes `add-sources`, `reorder`, and `delete` actions over a freshly-initialised reducer to produce diverse `MergeState` values.
- PDF pipeline properties (9, 10, 11) run in a jsdom + `OffscreenCanvas` polyfill environment; the canvas is stubbed where pixel fidelity is not asserted.
- Property 19 instruments `fetch`, `XMLHttpRequest.prototype.send`, `Navigator.prototype.sendBeacon`, and `WebSocket.prototype.send` with spies that diff bodies against tracked source/output bytes.
- Property 20 uses `@testing-library/react`'s `unmount()` with spies on `URL.revokeObjectURL` and `pdfDocument.destroy`.

Each property test imports the exact property text from a shared constants module so the tag and the assertion remain in lockstep.
