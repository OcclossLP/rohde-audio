"use client";

import Link from "next/link";
import { theme } from "./Theme";

export default function Navbar() {
  return (
    <nav className="fixed top-0 inset-x-0 z-50 backdrop-blur-md bg-black/40 border-b border-white/10">
      <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
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
        <div className="flex gap-8 text-sm text-gray-300 items-center">
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
        </div>
      </div>
    </nav>
  );
}
