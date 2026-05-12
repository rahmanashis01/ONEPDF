# onepdf

**Your PDFs never leave your browser.**

An open-source, browser-only PDF toolkit. Drop a file, merge or compress it entirely on your device, download the result. No uploads, no tracking.

Repo: [github.com/rahmanashis01/ONEPDF](https://github.com/rahmanashis01/ONEPDF)

## Features

- **Merge PDFs** — drop multiple files, reorder and delete pages across them, export one merged PDF.
- **Compress PDFs** — pick High / Medium / Low (150 / 110 / 80 DPI) and download a smaller file.
- **Optional Clerk auth** — the tools work for everyone; sign-in lives only in the navbar.
- **Upcoming** — Markdown → PDF, DOCX → PDF, more formats, in-place PDF text editing.

## Why

- **100% client-side.** Parsed with `pdfjs-dist`, rebuilt with `pdf-lib`. No API routes touch file bytes.
- **Privacy by default.** Nothing persists once you close the tab.
- **Modern stack.** Next.js 16 (App Router + Turbopack), React 19, TypeScript, Tailwind v4, shadcn/ui, @dnd-kit, motion.

## Run locally

```bash
git clone https://github.com/rahmanashis01/ONEPDF.git
cd ONEPDF
npm install
```

Add `.env.local` (Clerk keys are optional but the middleware expects them to exist):

```bash
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
```

Start the dev server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

```bash
npm run dev     # dev server
npm run build   # production build
npm run start   # serve the built app
npm run lint    # eslint
```

## License

MIT.
