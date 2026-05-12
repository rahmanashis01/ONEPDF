"use client";

import { MergeTool } from "@/components/pdf/merge-tool";

export default function MergePage() {
  return (
    <main className="page-wash min-h-[calc(100svh-4rem)]">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8">
        <header className="flex flex-col gap-1">
          <h1 className="font-display text-3xl tracking-tight">Merge PDFs</h1>
          <p className="text-sm text-muted-foreground">
            Drop two or more PDFs. Rearrange pages across files, drop any you
            don&apos;t need, then export one merged PDF — without anything
            leaving your browser.
          </p>
        </header>
        <MergeTool />
      </div>
    </main>
  );
}
