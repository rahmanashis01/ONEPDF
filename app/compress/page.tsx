"use client";

import { CompressTool } from "@/components/pdf/compress-tool";

export default function CompressPage() {
  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8">
      <header className="flex flex-col gap-1">
        <h1 className="font-heading text-2xl font-semibold">Compress a PDF</h1>
        <p className="text-sm text-muted-foreground">
          Pick a preset, compress in the browser, and download a smaller PDF.
          Nothing is uploaded — everything happens on your device.
        </p>
      </header>
      <CompressTool />
    </main>
  );
}
