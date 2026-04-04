import Image from "next/image";
import Link from "next/link";
import {
  ROHDE_AUDIO_CLOUD_URL,
  ROHDE_AUDIO_TICKETSHOP_URL,
} from "@/lib/externalLinks";

export default function Footer() {
  return (
    <footer className="bg-(--page-bg) border-t border-white/10 relative overflow-hidden">
      <div aria-hidden="true" className="absolute inset-0 pointer-events-none">
        <span className="pulse-orb pulse-orb--one" />
        <span className="pulse-orb pulse-orb--two" />
        <span className="pulse-orb pulse-orb--three" />
      </div>
      <div className="max-w-7xl mx-auto px-6 py-20 grid gap-16 md:grid-cols-4 text-gray-400">
        
        {/* BRAND */}
        <div>
          <div className="flex items-center gap-3 mb-4">
            <Image
              src="/favicon.ico"
              alt="Rohde Audio Logo"
              width={24}
              height={24}
              className="h-6 w-6 rounded"
            />
            <h3 className="text-xl font-extrabold text-white">
              Rohde <span className="text-purple-500">Audio</span>
            </h3>
          </div>
          <p className="text-sm leading-relaxed">
            Musikanlagen Vermietung für Partys & Events.
            Zuverlässiger Sound, faire Preise und einfacher Hol- & Bringservice.
          </p>
          <div className="mt-6 rounded-2xl border border-purple-500/20 bg-purple-500/10 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-purple-200">
              Rohde Audio Cloud
            </p>
            <a
              href={ROHDE_AUDIO_CLOUD_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex text-sm font-semibold text-white hover:text-purple-200 transition"
            >
              Hier geht&apos;s in die Cloud →
            </a>
            <p className="mt-2 text-xs text-gray-300">
              Für schnellen Zugriff auf Dateien, Planung und Orga.
            </p>
          </div>
        </div>

        {/* NAVIGATION */}
        <div>
          <h4 className="text-white font-semibold mb-4">Navigation</h4>
          <ul className="space-y-3 text-sm">
            <li>
              <Link href="/" className="hover:text-white transition">
                Startseite
              </Link>
            </li>
            <li>
              <Link href="/services" className="hover:text-white transition">
                Leistungen
              </Link>
            </li>
            <li>
              <Link href="/contact" className="hover:text-white transition">
                Kontakt
              </Link>
            </li>
            <li>
              <a
                href={ROHDE_AUDIO_TICKETSHOP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white transition"
              >
                Ticketshop
              </a>
            </li>
          </ul>
        </div>

        {/* RECHTLICHES */}
        <div>
          <h4 className="text-white font-semibold mb-4">Rechtliches</h4>
          <ul className="space-y-3 text-sm">
            <li>
              <Link href="/agb" className="hover:text-white transition">
                AGB
              </Link>
            </li>
            <li>
              <Link href="/impressum" className="hover:text-white transition">
                Impressum
              </Link>
            </li>
            <li>
              <Link href="/datenschutz" className="hover:text-white transition">
                Datenschutz
              </Link>
            </li>
          </ul>
        </div>

        {/* KONTAKT */}
        <div>
          <h4 className="text-white font-semibold mb-4">Kontakt</h4>
          <ul className="space-y-3 text-sm">
            <li>✉️ info@rohde-audio.com</li>
            <li>📍 Ulrich-Thater-Straße 7, Bonenburg</li>
          </ul>
        </div>
      </div>

      {/* BOTTOM BAR */}
      <div className="border-t border-white/5 py-6 text-center text-xs text-gray-500">
        © {new Date().getFullYear()} Rohde Audio · Designed by Philipp Dierkes
      </div>
    </footer>
  );
}
