import {
  Music,
  Speaker,
  Truck,
  CalendarCheck,
  PartyPopper,
} from "lucide-react";
import Wave from "react-wavify";
import { theme } from "./components/Theme";
import { Metadata } from "next";
import { getPackages } from "@/lib/packages";

export const metadata: Metadata = {
  title: "Rohde Audio – Professionelle Musikanlagen & Eventtechnik",
  description:
    "Rohde Audio liefert hochwertige Musikanlagen, PA-Systeme und Rundum-Service für unvergessliche Feiern in Warburg und Umgebung.",
  keywords: [
    "Rohde Audio",
    "Musikanlagen Vermietung",
    "PA Systeme mieten",
    "Eventtechnik Warburg",
    "Sound & Musik Service",
    "Party Beschallung",
  ],
  openGraph: {
    title: "Rohde Audio – Professionelle Musikanlagen & Eventtechnik",
    description:
      "Hochwertige Musikanlagen, Beratung und Hol- & Bringservice für deine Feier – direkt von Rohde Audio.",
    url: "https://www.rohde-audio.de",
    siteName: "Rohde Audio",
    locale: "de_DE",
    type: "website",
    images: [
      {
        url: "/pictures/LogoTransparentOhneTextMitQuadrat.png", // Dein Logo
        width: 512,
        height: 512,
        alt: "Rohde Audio – Musikanlagen & Eventtechnik",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Rohde Audio – Professionelle Musikanlagen & Eventtechnik",
    description:
      "Rohde Audio liefert PA-Systeme, Sound & Musik Service für unvergessliche Events in Warburg.",
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
    ],
  },
};

type PackageCard = {
  id: string;
  title: string;
  description: string;
  price: string;
  highlight: boolean;
};

export default async function Home() {
  const packages = await getPackages();
  const packageCards: PackageCard[] = packages.length
    ? packages
    : [
        {
          id: "fallback-1",
          title: "Small Party",
          description: "Ideal für Geburtstage & kleine Feiern.",
          price: "ab 49 €",
          highlight: false,
        },
        {
          id: "fallback-2",
          title: "Birthday Special",
          description: "Mehr Leistung & Bass für größere Partys.",
          price: "ab 89 €",
          highlight: true,
        },
        {
          id: "fallback-3",
          title: "Event Pro",
          description: "Maximaler Sound für große Events.",
          price: "ab 149 €",
          highlight: false,
        },
      ];
  return (
    <main className="text-gray-200 bg-[var(--page-bg)]">
      {/* ================= HERO ================= */}
      <section
        className="relative min-h-screen flex items-center bg-cover bg-center"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=1800&q=80')",
        }}
      >
        {/* Gradient Overlay */}
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(to bottom, ${theme.bgFrom}cc, ${theme.bgTo}66)`,
          }}
        />

        <div className="relative z-10 max-w-6xl mx-auto px-6 text-center">
          <h1 className="text-6xl md:text-7xl font-extrabold text-white mb-6 leading-tight">
            Sound, der deine
            <br />
            <span style={{ color: theme.primary }}>Party trägt</span>
          </h1>

          <p className="text-xl md:text-2xl max-w-3xl mx-auto text-gray-300 mb-12">
            Hochwertige Musikanlagen für Partys & Events – kraftvoll,
            unkompliziert und mit Hol- & Bringservice.
          </p>

          <div className="flex justify-center gap-6 flex-wrap">
            <a
              href="/contact"
              className="px-12 py-5 rounded-full font-semibold transition hover:scale-105"
              style={{ backgroundColor: theme.primary }}
            >
              Jetzt anfragen
            </a>
            <a
              href="/services"
              className="px-12 py-5 rounded-full font-semibold border border-white/20 hover:bg-white/10 transition"
            >
              Mehr erfahren
            </a>
          </div>

          {/* TRUST BADGES */}
          <div className="mt-16 flex justify-center gap-10 text-sm text-gray-300 flex-wrap">
            <span>✔ Zuverlässig</span>
            <span>✔ Faire Preise</span>
            <span>✔ Einfache Abwicklung</span>
          </div>
        </div>

        {/* SOUND WAVE */}
        <div className="absolute -bottom-2 left-0 right-0">
          <Wave
            fill="rgba(168,85,247,0.6)"
            paused={false}
            options={{ height: 90, amplitude: 35, speed: 0.2, points: 6 }}
          />
        </div>
      </section>

      {/* ================= WARUM WIR ================= */}
      <section className="py-32 px-6 max-w-6xl mx-auto bg-[var(--page-bg)]">
        <h2 className="text-4xl md:text-5xl font-bold text-white text-center mb-20">
          Warum <span style={{ color: theme.primary }}>Rohde Audio</span>?
        </h2>

        <div className="grid md:grid-cols-3 gap-12">
          {[
            {
              icon: Speaker,
              title: "Satter Sound",
              text: "Moderne Lautsprecher mit klarem Klang und kräftigem Bass – kein Billig-Equipment.",
            },
            {
              icon: Truck,
              title: "Hol- & Bringservice",
              text: "Kein Stress mit Transport. Wir liefern oder du holst flexibel ab.",
            },
            {
              icon: CalendarCheck,
              title: "Einfach & fair",
              text: "Klare Preise, schnelle Antworten und unkomplizierte Buchung.",
            },
          ].map(({ icon: Icon, title, text }) => (
            <div
              key={title}
              className="group relative bg-[var(--surface-2)] rounded-3xl p-10 text-center transition-all duration-300 hover:-translate-y-2 hover:shadow-xl hover:shadow-purple-600/20"
            >
              <Icon
                size={48}
                className="mx-auto mb-6 transition-transform duration-300 group-hover:scale-110"
                style={{ color: theme.primary }}
              />
              <h3 className="text-2xl font-semibold text-white mb-4">
                {title}
              </h3>
              <p className="text-gray-400 leading-relaxed">{text}</p>

              {/* Hover Line */}
              <span
                className="absolute left-1/2 -bottom-1 h-[3px] w-0 -translate-x-1/2 rounded-full transition-all duration-300 group-hover:w-20"
                style={{ backgroundColor: theme.primary }}
              />
            </div>
          ))}
        </div>
      </section>

      {/* ================= PAKETE ================= */}
      <section className="py-32 px-6 bg-[var(--surface)]">
        <h2 className="text-4xl md:text-5xl font-bold text-white text-center mb-20">
          Für jede Feier das passende Setup
        </h2>

        <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-10">
          {packageCards.map(({ id, title, description, price, highlight }) => (
            <div
              key={id}
              className={`rounded-3xl p-10 text-center transition hover:-translate-y-2 ${
                highlight
                  ? "ring-2 ring-purple-500 bg-[var(--surface-2)]"
                  : "bg-[var(--surface-2)]"
              }`}
            >
              <h3 className="text-2xl font-bold text-white mb-4">
                {title}
              </h3>
              <p className="text-gray-400 mb-6">{description}</p>
              <p
                className="text-3xl font-extrabold"
                style={{ color: theme.primary }}
              >
                {price}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ================= ABLAUF ================= */}
      <section className="py-32 px-6 max-w-6xl mx-auto bg-[var(--page-bg)]">
        <h2 className="text-4xl md:text-5xl font-bold text-white text-center mb-20">
          So einfach geht’s
        </h2>

        <div className="grid md:grid-cols-4 gap-12 text-center">
          {[
            { icon: Music, text: "Anfrage senden" },
            { icon: CalendarCheck, text: "Details klären" },
            { icon: Truck, text: "Lieferung / Abholung" },
            { icon: PartyPopper, text: "Feiern & genießen" },
          ].map(({ icon: Icon, text }) => (
            <div key={text}>
              <Icon
                size={44}
                className="mx-auto mb-6"
                style={{ color: theme.primary }}
              />
              <p className="text-gray-300">{text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ================= FINAL CTA ================= */}
      <section className="py-32 px-6 text-center bg-[var(--surface)]">
        <h2 className="text-4xl md:text-5xl font-bold text-white mb-8">
          Bereit für den richtigen Sound?
        </h2>
        <p className="text-xl text-gray-300 mb-12">
          Schreib uns jetzt – wir kümmern uns um den Rest.
        </p>
        <a
          href="/contact"
          className="px-14 py-6 rounded-full font-semibold text-lg transition hover:scale-105"
          style={{ backgroundColor: theme.primary }}
        >
          Anfrage starten
        </a>
      </section>
    </main>
  );
}
