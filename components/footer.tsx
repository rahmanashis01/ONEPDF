import Link from "next/link";

import { GithubIcon } from "@/components/icons/github";

const GITHUB_URL = "https://github.com/rahmanashis01/ONEPDF";

export function Footer() {
  return (
    <footer className="mt-24 border-t bg-muted/30">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:grid-cols-2 md:grid-cols-4">
        <div className="flex flex-col gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-1 font-display text-2xl leading-none tracking-tight"
          >
            <span>one</span>
            <span className="gradient-text">pdf</span>
          </Link>
          <p className="text-sm text-muted-foreground">
            Open-source PDF toolkit. Merging, compressing and more — on your
            device, never uploaded.
          </p>
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noreferrer noopener"
            title="github"
            className="mt-1 inline-flex items-center gap-2 self-start rounded-full border bg-background px-3 py-1.5 text-xs font-medium text-foreground/80 transition-colors hover:bg-black/5"
          >
            <GithubIcon className="size-3.5" /> Star on GitHub
          </a>
        </div>

        <div className="flex flex-col gap-3">
          <h3 className="text-sm font-semibold">Tools</h3>
          <Link className="text-sm text-muted-foreground hover:text-foreground" href="/merge">
            Merge PDF
          </Link>
          <Link className="text-sm text-muted-foreground hover:text-foreground" href="/compress">
            Compress PDF
          </Link>
          <Link className="text-sm text-muted-foreground hover:text-foreground" href="/#upcoming">
            Upcoming
          </Link>
        </div>

        <div className="flex flex-col gap-3">
          <h3 className="text-sm font-semibold">Project</h3>
          <a
            className="text-sm text-muted-foreground hover:text-foreground"
            href={GITHUB_URL}
            target="_blank"
            rel="noreferrer noopener"
            title="github"
          >
            Source code
          </a>
          <a
            className="text-sm text-muted-foreground hover:text-foreground"
            href={`${GITHUB_URL}/issues`}
            target="_blank"
            rel="noreferrer noopener"
          >
            Report an issue
          </a>
          <a
            className="text-sm text-muted-foreground hover:text-foreground"
            href={`${GITHUB_URL}/blob/main/README.md`}
            target="_blank"
            rel="noreferrer noopener"
          >
            Docs
          </a>
        </div>

        <div className="flex flex-col gap-3">
          <h3 className="text-sm font-semibold">Privacy</h3>
          <p className="text-sm text-muted-foreground">
            Everything runs in your browser. No file ever leaves your device,
            no analytics on your documents.
          </p>
        </div>
      </div>

      <div className="border-t bg-background/60">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-4 py-5 text-xs text-muted-foreground sm:flex-row">
          <p>© {new Date().getFullYear()} onepdf · open-source project.</p>
          <p>
            Built with Next.js and shadcn/ui ·{" "}
            <a
              href={GITHUB_URL}
              className="hover:text-foreground"
              target="_blank"
              rel="noreferrer noopener"
              title="github"
            >
              GitHub
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
