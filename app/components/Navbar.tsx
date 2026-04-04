"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { ROHDE_AUDIO_TICKETSHOP_URL } from "@/lib/externalLinks";
import { getPortalHref } from "@/lib/subdomains";
import { theme } from "./Theme";
import ThemeToggle from "./ThemeToggle";

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const adminLoginHref = getPortalHref("admin", "/login");
  const ticketShopHref = ROHDE_AUDIO_TICKETSHOP_URL;

  return (
    <nav className="site-nav fixed top-0 inset-x-0 z-50 backdrop-blur-md bg-[var(--nav-bg)] border-b border-[var(--border)]">
      <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center relative z-20">
        <Link href="/">
          <span className="flex items-center gap-3 font-extrabold text-xl text-white">
            <Image
              src="/favicon.ico"
              alt="Rohde Audio Logo"
              width={24}
              height={24}
              className="h-6 w-6 rounded"
              priority
            />
            Rohde <span style={{ color: theme.primary }}>Audio</span>
          </span>
        </Link>
        <div className="hidden md:flex gap-6 text-sm text-gray-300 items-center">
          <Link href="/">Startseite</Link>
          <Link href="/services">Leistungen</Link>
          <Link href="/contact">Kontakt</Link>
          <a
            href={ticketShopHref}
            target="_blank"
            rel="noopener noreferrer"
            className="text-violet-600 dark:text-purple-300 hover:text-violet-700 dark:hover:text-purple-200 transition font-semibold"
          >
            Ticketshop
          </a>
          <Link
            href={adminLoginHref}
            className="site-nav-login rounded-full px-4 py-2 text-xs font-semibold text-white border border-white/20 hover:bg-white/10 transition"
          >
            Login
          </Link>
          <ThemeToggle />
        </div>
        <button
          type="button"
          className={`site-nav-burger md:hidden flex h-10 w-10 items-center justify-center rounded-full border border-white/20 text-white transition hover:bg-white/10 burger-button ${
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
        className={`site-nav-panel md:hidden border-t border-white/10 bg-[var(--nav-bg)] mobile-nav relative z-10 ${
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
          <Link href="/contact" onClick={() => setMenuOpen(false)}>
            Kontakt
          </Link>
          <a
            href={ticketShopHref}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setMenuOpen(false)}
          >
            Ticketshop
          </a>
          <Link
            href={adminLoginHref}
            onClick={() => setMenuOpen(false)}
            className="site-nav-login inline-flex w-fit rounded-full px-4 py-2 text-xs font-semibold text-white border border-white/20 hover:bg-white/10 transition"
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
