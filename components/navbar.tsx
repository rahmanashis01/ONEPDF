"use client";

import Link from "next/link";
import {
  Show,
  SignInButton,
  SignUpButton,
  UserButton,
} from "@clerk/nextjs";

import { GithubIcon } from "@/components/icons/github";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/merge", label: "Merge" },
  { href: "/compress", label: "Compress" },
  { href: "/#upcoming", label: "Upcoming" },
];

const GITHUB_URL = "https://github.com/rahmanashis01/ONEPDF";

export function Navbar() {
  return (
    <header className="pointer-events-none fixed inset-x-0 top-3 z-50 flex justify-center px-3 sm:top-4">
      <div className="glass pointer-events-auto flex h-12 w-full max-w-2xl items-center justify-between gap-2 rounded-full border px-3 shadow-lg shadow-black/30 sm:h-14 sm:px-4">
        <Link
          href="/"
          className="flex items-center gap-0.5 rounded-full px-2 py-1 font-display text-xl leading-none tracking-tight"
          aria-label="onepdf home"
        >
          <span>one</span>
          <span className="gradient-text">pdf</span>
        </Link>

        <nav className="hidden items-center gap-0.5 md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-full px-2.5 py-1.5 text-xs font-medium text-foreground/75 transition-colors hover:bg-white/5 hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-1">
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noreferrer noopener"
            title="github"
            aria-label="github"
            className="inline-flex size-8 items-center justify-center rounded-full text-foreground/75 transition-colors hover:bg-white/5 hover:text-foreground"
          >
            <GithubIcon className="size-4" />
          </a>
          <Show when="signed-out">
            <SignInButton mode="modal">
              <button
                type="button"
                className="hidden h-8 items-center rounded-full px-3 text-xs font-medium text-foreground/80 transition-colors hover:bg-white/5 hover:text-foreground sm:inline-flex"
              >
                Log in
              </button>
            </SignInButton>
            <SignUpButton mode="modal">
              <button
                type="button"
                className="gradient-brand inline-flex h-8 items-center rounded-full px-3.5 text-xs font-medium text-white shadow-sm shadow-fuchsia-500/30 transition-all hover:-translate-y-0.5 hover:brightness-110"
              >
                Register
              </button>
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

export default Navbar;
