// Pure helpers shared across the merge and compress tools.
// These functions never touch the DOM or any browser API that would
// prevent them from being imported by server code for incidental use
// (e.g. the filename helpers), even though every PDF pipeline that
// calls them runs on the client.

export type CompressPreset = "high" | "medium" | "low";

export function isPdfFile(file: File): boolean {
  return file.type === "application/pdf" || /\.pdf$/i.test(file.name);
}

export function formatBytes(n: number): string {
  if (!Number.isFinite(n) || n < 0) return "0 B";
  if (n === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"] as const;
  const i = Math.min(
    units.length - 1,
    Math.floor(Math.log(n) / Math.log(1024)),
  );
  const value = n / Math.pow(1024, i);
  const precision = i === 0 ? 0 : value >= 100 ? 0 : value >= 10 ? 1 : 2;
  return `${value.toFixed(precision)} ${units[i]}`;
}

export function timestampedName(prefix: string): string {
  return `${prefix}-${Date.now()}.pdf`;
}

export function stripPdfExt(name: string): string {
  return name.replace(/\.pdf$/i, "");
}

export function compressedFilename(
  name: string,
  preset: CompressPreset,
): string {
  return `${stripPdfExt(name)}-compressed-${preset}.pdf`;
}
