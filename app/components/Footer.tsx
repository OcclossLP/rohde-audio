import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-[#0f1012] border-t border-white/10">
      <div className="max-w-7xl mx-auto px-6 py-20 grid gap-16 md:grid-cols-4 text-gray-400">
        
        {/* BRAND */}
        <div>
          <h3 className="text-xl font-extrabold text-white mb-4">
            Rohde <span className="text-purple-500">Audio</span>
          </h3>
          <p className="text-sm leading-relaxed">
            Musikanlagen Vermietung für Partys & Events.  
            Zuverlässiger Sound, faire Preise und einfacher Hol- & Bringservice.
          </p>
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
              <Link href="/about-us" className="hover:text-white transition">
                Über uns
              </Link>
            </li>
            <li>
              <Link href="/contact" className="hover:text-white transition">
                Kontakt
              </Link>
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
            <li>📞 +49 170 6480129</li>
            <li>✉️ kontakt@rohde-audio.com</li>
            <li>📍 Ulrich-Thater-Straße 7, Bonenburg</li>
          </ul>
        </div>
      </div>

      {/* BOTTOM BAR */}
      <div className="border-t border-white/5 py-6 text-center text-xs text-gray-500">
        © {new Date().getFullYear()} Rohde Audio · Website by Philipp Dierkes
      </div>
    </footer>
  );
}
