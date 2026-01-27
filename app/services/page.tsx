"use client";

import { Speaker, Truck, CalendarCheck } from "lucide-react";
import Wave from "react-wavify";
import { theme } from "../components/Theme";
import FaqSection from "../components/FaqSection";
import { useEffect, useState } from "react";

export default function Leistungen() {
  type PackageCard = {
    id: string;
    title: string;
    description: string;
    price: string;
    salePrice?: string | null;
    highlight: boolean;
  };

  const services = [
    {
      icon: Speaker,
      title: "Musikanlagen",
      text: "Kraftvolle PA-Systeme mit sattem Bass, klaren Höhen und vollem Sound für dein Event.",
    },
    {
      icon: Truck,
      title: "Hol- & Bringservice",
      text: "Wir liefern deine Anlage direkt zur Location und holen sie nach dem Event wieder ab – stressfrei.",
    },
    {
      icon: CalendarCheck,
      title: "Beratung & Planung",
      text: "Wir helfen dir bei der Auswahl der passenden Technik und unterstützen dich bei der Eventplanung.",
    },
  ];

  const fallbackPackages: PackageCard[] = [
    {
      id: "fallback-1",
      title: "Paket S",
      description: "Ideal für Geburtstage & kleine Feiern.",
      price: "ab 49 €",
      salePrice: null,
      highlight: false,
    },
    {
      id: "fallback-2",
      title: "Paket M",
      description: "Mehr Leistung & Bass für größere Partys.",
      price: "ab 75 €",
      salePrice: null,
      highlight: true,
    },
    {
      id: "fallback-3",
      title: "Paket L",
      description: "Maximaler Sound für große Events.",
      price: "ab 119 €",
      salePrice: null,
      highlight: false,
    },
  ];

  const [packages, setPackages] = useState<PackageCard[]>(fallbackPackages);

  useEffect(() => {
    let active = true;
    const loadPackages = async () => {
      try {
        const response = await fetch("/api/packages");
        if (!response.ok) return;
        const data = (await response.json()) as PackageCard[];
        if (active && data.length) {
          setPackages(data);
        }
      } catch {
        // keep fallback
      }
    };
    loadPackages();
    return () => {
      active = false;
    };
  }, []);

  return (
    <main className="text-gray-200">
      {/* ================= HERO ================= */}
      <section
        className="hero-area relative min-h-screen flex items-center bg-cover bg-center"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?q=80&w=1470&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D')",
        }}
      >
        {/* Gradient Overlay */}
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(to bottom, ${theme.heroFrom}cc, ${theme.heroTo}66)`,
          }}
        />

        <div className="relative z-10 max-w-6xl mx-auto px-6 text-center">
          <h1 className="text-6xl md:text-7xl font-extrabold text-white mb-6 leading-tight">
            Unsere <span style={{ color: theme.primary }}>Leistungen</span>
          </h1>

          <p className="text-xl md:text-2xl max-w-3xl mx-auto text-gray-300 mb-12">
            Alles, was du für dein Event brauchst – Musikanlagen, Service und Beratung aus einer Hand.
          </p>

          <div className="flex justify-center gap-6 flex-wrap">
            <a
              href="#pakete"
              className="btn-primary inline-block px-14 py-6 rounded-full font-semibold text-lg text-white transition hover:scale-105"
              style={{ backgroundColor: theme.primary }}
            >
              Direkt zu den Paketen
            </a>
          </div>

          {/* TRUST BADGES
          <div className="mt-16 flex justify-center gap-10 text-sm text-gray-300 flex-wrap">
            <span>✔ Zuverlässig</span>
            <span>✔ Faire Preise</span>
            <span>✔ Einfache Abwicklung</span>
          </div> */}
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

      {/* ================= SERVICES ================= */}
      <section className="py-32 px-6" style={{ background: theme.bgTo }}>
        <h2 className="text-4xl md:text-5xl font-bold text-white text-center mb-20">
          Was wir <span style={{ color: theme.primary }}>bieten</span>
        </h2>

        <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-12">
          {services.map(({ icon: Icon, title, text }) => (
            <div
              key={title}
              className="group relative rounded-3xl p-10 bg-(--surface-2) transition hover:-translate-y-2 hover:shadow-xl hover:shadow-purple-600/30"
            >
              <div className="mx-auto w-20 h-20 flex items-center justify-center rounded-full mb-6 bg-gradient-to-tr from-purple-500/40 to-purple-700/30 transition-transform duration-300 group-hover:scale-110">
                <Icon size={40} style={{ color: theme.primary }} />
              </div>
              <h3 className="text-2xl font-semibold text-white mb-4 relative inline-block group-hover:after:content-[''] after:block after:w-0 after:h-0.75 after:bg-purple-500 after:rounded-full after:transition-all after:duration-300 group-hover:after:w-full">
                {title}
              </h3>
              <p className="text-gray-400 leading-relaxed">{text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ================= PACKAGES ================= */}
      <section id="pakete" className="py-32 px-6" style={{ background: theme.bgFrom }}>
        <h2 className="text-4xl md:text-5xl font-bold text-center text-white mb-16">
          Unsere <span style={{ color: theme.primary }}>Pakete</span>
        </h2>

        <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-10">
          {packages.map(({ id, title, description, price, salePrice, highlight }) => (
            <div
              key={id}
              className={`rounded-3xl p-10 text-center transition hover:-translate-y-2 hover:shadow-xl hover:shadow-purple-600/20 shadow-lg ${
                highlight
                  ? "ring-2 ring-purple-600 bg-(--surface-2)"
                  : "bg-(--surface-2)"
              }`}
            >
              <h3 className="text-2xl font-bold text-white mb-4">{title}</h3>
              <p className="text-gray-400 mb-6">{description}</p>
              {salePrice ? (
                <div className="space-y-1">
                  <p className="text-sm text-gray-400 line-through">
                    {price}
                  </p>
                  <p className="text-3xl font-extrabold" style={{ color: theme.primary }}>
                    {salePrice}
                    <sup className="ml-1 text-sm text-gray-400">*</sup>
                  </p>
                </div>
              ) : (
                <p className="text-3xl font-extrabold" style={{ color: theme.primary }}>
                  {price}
                  <sup className="ml-1 text-sm text-gray-400">*</sup>
                </p>
              )}
            </div>
          ))}
        </div>

        <p className="mt-10 text-center text-xs text-gray-400">
          <sup className="mr-1">*</sup>
          Hinweis: Preise sind abhängig von Mietdauer, Ort und gewünschtem Setup
          (Lieferung/ Aufbau optional).
        </p>
      </section>

      {/* ================= FINAL CTA ================= */}
      <section className="text-center py-32 px-6" style={{ background: theme.bgTo }}>
        <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-6">
          Bereit für deine Party?
        </h2>
        <p className="text-gray-300 mb-12 max-w-2xl mx-auto">
          Hol dir noch heute dein Setup und lass deine Feier unvergesslich werden!
        </p>
        <a
          href="/contact"
          className="btn-primary inline-block px-14 py-6 rounded-full font-semibold text-lg text-white transition hover:scale-105 hover:shadow-xl"
          style={{ backgroundColor: theme.primary }}
          data-cta="cta_contact"
        >
          Jetzt anfragen
        </a>
      </section>

      <FaqSection />
    </main>
  );
}
