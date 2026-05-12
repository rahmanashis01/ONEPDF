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
    <header className="glass fixed top-0 z-50 w-full">
      <div className="mx-auto flex h-16 max-w-4xl items-center justify-between gap-4 px-4">
        <Link
          href="/"
          className="flex items-center gap-1 rounded-md px-1 py-1 font-display text-2xl leading-none tracking-tight"
          aria-label="onepdf home"
        >
          <span>one</span>
          <span className="gradient-text">pdf</span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-full px-3 py-1.5 text-sm text-foreground/75 transition-colors hover:bg-white/5 hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noreferrer noopener"
            title="github"
            aria-label="github"
            className="inline-flex size-9 items-center justify-center rounded-full text-foreground/75 transition-colors hover:bg-white/5 hover:text-foreground"
          >
            <GithubIcon className="size-4" />
          </a>
          <Show when="signed-out">
            <SignInButton mode="modal">
              <button
                type="button"
                className="hidden h-9 items-center rounded-full px-3 text-sm font-medium text-foreground/80 transition-colors hover:bg-white/5 hover:text-foreground sm:inline-flex"
              >
                Log in
              </button>
            </SignInButton>
            <SignUpButton mode="modal">
              <button
                type="button"
                className="gradient-brand inline-flex h-9 items-center rounded-full px-4 text-sm font-medium text-white shadow-sm shadow-fuchsia-500/30 transition-all hover:-translate-y-0.5 hover:brightness-110"
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
