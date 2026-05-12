import Link from "next/link";
import {
  ArrowRight,
  Circle,
  FileCode,
  FileSpreadsheet,
  FileStack,
  FileText,
  Minimize2,
  PenLine,
  Sparkles,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/reveal";
import { GithubIcon } from "@/components/icons/github";

const GITHUB_URL = "https://github.com/rahmanashis01/ONEPDF";

const UPCOMING = [
  {
    icon: FileCode,
    title: "Markdown preview",
    description:
      "Drop a .md file, get a clean, printable PDF with code blocks, tables, and math.",
    tint: "bg-fuchsia-500/10 text-fuchsia-600",
  },
  {
    icon: FileText,
    title: "DOCX → PDF",
    description:
      "Convert Word documents to PDF right in the browser, styles preserved.",
    tint: "bg-violet-500/10 text-violet-600",
  },
  {
    icon: FileSpreadsheet,
    title: "More formats",
    description:
      "XLSX, PPTX and image → PDF. One drop-zone, every common input.",
    tint: "bg-pink-500/10 text-pink-600",
  },
  {
    icon: PenLine,
    title: "PDF text editing",
    description:
      "Fix typos, update headers, redact lines — edit text in existing PDFs in place.",
    tint: "bg-amber-500/10 text-amber-600",
  },
];

export default function LandingPage() {
  return (
    <main className="page-wash">
      {/* HERO */}
      <section className="mx-auto flex max-w-6xl flex-col gap-10 px-4 py-20 sm:py-28">
        <Reveal className="flex flex-col gap-6">
          <span className="inline-flex w-fit items-center gap-2 rounded-full border bg-white/70 px-3 py-1 text-xs font-medium text-foreground/80 backdrop-blur">
            <Circle className="size-2 fill-fuchsia-500 text-fuchsia-500" />
            Open-source · browser-only
          </span>
          <h1 className="font-display text-5xl leading-[1.05] tracking-tight sm:text-6xl md:text-7xl">
            your PDFs never{" "}
            <span className="gradient-text italic">leave</span>
            <br className="hidden sm:block" /> your browser.
          </h1>
          <p className="max-w-2xl text-base text-muted-foreground sm:text-lg">
            onepdf is a tiny open-source toolkit for everyday PDF tasks. Merge
            and compress today, edit and convert soon — every byte processed on
            your device, nothing ever uploaded.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <Button
              size="lg"
              className="gradient-brand rounded-full px-6 text-white shadow-md shadow-fuchsia-500/20 hover:brightness-105"
              render={
                <Link href="/merge">
                  Merge a PDF <ArrowRight className="ml-1" />
                </Link>
              }
            />
            <Button
              variant="outline"
              size="lg"
              className="rounded-full"
              render={<Link href="/compress">Compress a PDF</Link>}
            />
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noreferrer noopener"
              title="github"
              className="inline-flex items-center gap-2 rounded-full border bg-white/70 px-4 py-2 text-sm font-medium text-foreground/80 backdrop-blur transition-colors hover:bg-white"
            >
              <GithubIcon className="size-4" /> Star on GitHub
            </a>
          </div>
        </Reveal>
      </section>

      {/* TOOLS */}
      <section id="tools" className="mx-auto max-w-6xl px-4 pb-16">
        <Reveal className="mb-8 flex flex-col gap-2">
          <Badge variant="secondary" className="w-fit rounded-full">
            Tools
          </Badge>
          <h2 className="font-display text-3xl tracking-tight sm:text-4xl">
            Two tools, zero uploads.
          </h2>
          <p className="max-w-2xl text-sm text-muted-foreground">
            Built for speed and privacy. Drop your files, drag, click, done.
          </p>
        </Reveal>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Reveal delay={0.05}>
            <Link
              href="/merge"
              className="group block rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
            >
              <Card className="h-full border-border/60 bg-white/70 shadow-sm backdrop-blur transition-all hover:-translate-y-0.5 hover:shadow-md">
                <CardHeader>
                  <div className="mb-3 flex size-11 items-center justify-center rounded-xl bg-fuchsia-500/10 text-fuchsia-600">
                    <FileStack className="size-5" />
                  </div>
                  <CardTitle className="font-display text-2xl tracking-tight">
                    Merge PDFs
                  </CardTitle>
                  <CardDescription>
                    Combine two or more PDFs. Reorder and drop individual pages
                    across files before you export.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <span className="inline-flex items-center gap-1 text-sm font-medium text-fuchsia-600 group-hover:underline">
                    Open merge tool <ArrowRight className="size-4" />
                  </span>
                </CardContent>
              </Card>
            </Link>
          </Reveal>

          <Reveal delay={0.12}>
            <Link
              href="/compress"
              className="group block rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
            >
              <Card className="h-full border-border/60 bg-white/70 shadow-sm backdrop-blur transition-all hover:-translate-y-0.5 hover:shadow-md">
                <CardHeader>
                  <div className="mb-3 flex size-11 items-center justify-center rounded-xl bg-violet-500/10 text-violet-600">
                    <Minimize2 className="size-5" />
                  </div>
                  <CardTitle className="font-display text-2xl tracking-tight">
                    Compress a PDF
                  </CardTitle>
                  <CardDescription>
                    Shrink a PDF with a quality preset. High, medium, or low —
                    trade detail for a smaller download.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <span className="inline-flex items-center gap-1 text-sm font-medium text-violet-600 group-hover:underline">
                    Open compress tool <ArrowRight className="size-4" />
                  </span>
                </CardContent>
              </Card>
            </Link>
          </Reveal>
        </div>
      </section>

      {/* UPCOMING */}
      <section id="upcoming" className="mx-auto max-w-6xl px-4 py-16">
        <Reveal className="mb-8 flex flex-col gap-2">
          <Badge variant="secondary" className="w-fit rounded-full">
            <Sparkles className="size-3" />
            Coming soon
          </Badge>
          <h2 className="font-display text-3xl tracking-tight sm:text-4xl">
            What&apos;s <span className="gradient-text italic">next</span>.
          </h2>
          <p className="max-w-2xl text-sm text-muted-foreground">
            A short roadmap — each of these will land as a card on this page
            when ready.
          </p>
        </Reveal>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {UPCOMING.map((item, index) => {
            const Icon = item.icon;
            return (
              <Reveal key={item.title} delay={index * 0.06}>
                <Card className="h-full border-border/60 bg-white/70 shadow-sm backdrop-blur transition-all hover:-translate-y-0.5 hover:shadow-md">
                  <CardHeader>
                    <div
                      className={`mb-3 flex size-11 items-center justify-center rounded-xl ${item.tint}`}
                    >
                      <Icon className="size-5" />
                    </div>
                    <CardTitle className="font-display text-xl tracking-tight">
                      {item.title}
                    </CardTitle>
                    <CardDescription>{item.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Badge variant="outline" className="rounded-full">
                      Coming soon
                    </Badge>
                  </CardContent>
                </Card>
              </Reveal>
            );
          })}
        </div>
      </section>

      {/* OPEN SOURCE STRIP */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <Reveal>
          <div className="relative overflow-hidden rounded-3xl border bg-white/70 p-8 shadow-sm backdrop-blur sm:p-12">
            <div className="pointer-events-none absolute inset-0 opacity-40 [background:radial-gradient(600px_300px_at_100%_0%,rgba(225,29,116,0.18),transparent_60%),radial-gradient(500px_250px_at_0%_100%,rgba(124,58,237,0.18),transparent_60%)]" />
            <div className="relative flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
              <div className="flex flex-col gap-2">
                <Badge variant="secondary" className="w-fit rounded-full">
                  Open source
                </Badge>
                <h3 className="font-display text-2xl tracking-tight sm:text-3xl">
                  Built in the{" "}
                  <span className="gradient-text italic">open</span>.
                </h3>
                <p className="max-w-xl text-sm text-muted-foreground">
                  onepdf is MIT-licensed and developed on GitHub. Issues, PRs
                  and ideas are welcome.
                </p>
              </div>
              <a
                href={GITHUB_URL}
                target="_blank"
                rel="noreferrer noopener"
                title="github"
                className="inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background transition-colors hover:bg-foreground/90"
              >
                <GithubIcon className="size-4" /> View on GitHub
              </a>
            </div>
          </div>
        </Reveal>
      </section>
    </main>
  );
}
