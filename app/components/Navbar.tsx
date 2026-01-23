"use client";

import Link from "next/link";
import { useState } from "react";
import { theme } from "./Theme";
import ThemeToggle from "./ThemeToggle";

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="fixed top-0 inset-x-0 z-50 backdrop-blur-md bg-[var(--nav-bg)] border-b border-[var(--border)]">
      <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center relative z-20">
        <Link href="/">
          <span className="flex items-center gap-3 font-extrabold text-xl text-white">
            <img
              src="/favicon.ico"
              alt="Rohde Audio Logo"
              className="h-6 w-6 rounded"
            />
            Rohde <span style={{ color: theme.primary }}>Audio</span>
          </span>
        </Link>
        <div className="hidden md:flex gap-6 text-sm text-gray-300 items-center">
          <Link href="/">Startseite</Link>
          <Link href="/services">Leistungen</Link>
          <Link href="/about-us">Über uns</Link>
          <Link href="/contact">Kontakt</Link>
          <Link
            href="/admin/login"
            className="rounded-full px-4 py-2 text-xs font-semibold text-white border border-white/20 hover:bg-white/10 transition"
          >
            Login
          </Link>
          <ThemeToggle />
        </div>
        <button
          type="button"
          className={`md:hidden flex h-10 w-10 items-center justify-center rounded-full border border-white/20 text-white transition hover:bg-white/10 burger-button ${
            menuOpen ? "burger-button--open" : ""
          }`}
          aria-expanded={menuOpen}
          aria-controls="mobile-nav"
          onClick={() => setMenuOpen((open) => !open)}
        >
          <span className="sr-only">Menü öffnen</span>
          <span className="flex flex-col gap-1">
            <span className="h-0.5 w-5 bg-current" />
            <span className="h-0.5 w-5 bg-current" />
            <span className="h-0.5 w-5 bg-current" />
          </span>
        </button>
      </div>

      <div
        className={`md:hidden border-t border-white/10 bg-[var(--nav-bg)] mobile-nav relative z-10 ${
          menuOpen ? "mobile-nav--open" : ""
        }`}
        aria-hidden={!menuOpen}
      >
        <div
          id="mobile-nav"
          className="px-6 py-4 flex flex-col gap-4 text-sm text-gray-300"
        >
          <Link href="/" onClick={() => setMenuOpen(false)}>
            Startseite
          </Link>
          <Link href="/services" onClick={() => setMenuOpen(false)}>
            Leistungen
          </Link>
          <Link href="/about-us" onClick={() => setMenuOpen(false)}>
            Über uns
          </Link>
          <Link href="/contact" onClick={() => setMenuOpen(false)}>
            Kontakt
          </Link>
          <Link
            href="/admin/login"
            onClick={() => setMenuOpen(false)}
            className="inline-flex w-fit rounded-full px-4 py-2 text-xs font-semibold text-white border border-white/20 hover:bg-white/10 transition"
          >
            Login
          </Link>
          <div className="pt-2">
            <ThemeToggle />
          </div>
        </div>
      </div>
    </nav>
  );
}
