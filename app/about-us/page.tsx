"use client";

import { User, Music, Heart, Star } from "lucide-react";
import { theme } from "../components/Theme";
import Wave from "react-wavify";

export default function About() {
  const story = [
    {
      year: "Hey, ich bin Benjamin",
      title: "Gründer von Rohde Audio",
      text: "Musik und Sound begleiten mich schon mein ganzes Leben. Angefangen hat alles mit kleinen Partys im Freundeskreis, bei denen ich für die Musikanlage verantwortlich war.",
      icon: User,
    },
    {
      year: "2020",
      title: "Vinyl & Tontechnik",
      text: "Beginn meiner Auseinandersetzung mit professioneller Tontechnik und Schallplatten-Sammlung.",
      icon: Star,
    },
    {
      year: "2025",
      title: "Gründung Rohde Audio",
      text: "Aus Leidenschaft wurde ein Unternehmen – hochwertige Musikanlagen mit Rundum-Service.",
      icon: User,
    },
    {
      year: "Heute",
      title: "Deine Feier, unser Sound",
      text: "Wir bieten PA-Systeme, Beratung, Hol- & Bringservice für unvergessliche Events.",
      icon: Heart,
    },
  ];

  return (
    <main className="text-gray-200">
      {/* ================= HERO ================= */}
      <section
        className="hero-area relative min-h-screen flex items-center bg-cover bg-center"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1618609377864-68609b857e90?q=80&w=1828&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D')",
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
            Über <span style={{ color: theme.primary }}>Rohde Audio</span>
          </h1>

          <p className="text-xl md:text-2xl max-w-3xl mx-auto text-gray-300 mb-12">
            Leidenschaftlicher Sound, perfekte Technik und Service, der dich entlastet – alles für unvergessliche Feiern.
          </p>

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

      {/* ================= STORY TREE ================= */}
      <section className="py-24 sm:py-28 md:py-32 px-5 sm:px-6 max-w-6xl mx-auto">
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white text-center mb-12 sm:mb-16 md:mb-20">
          Unsere <span style={{ color: theme.primary }}>Reise</span>
        </h2>

        <div className="relative">
          {/* Vertikale Linie */}
          <div className="absolute left-4 top-0 w-1 bg-purple-600/40 h-full" />

          <div className="space-y-10 sm:space-y-12 md:space-y-16">
            {story.map((item, idx) => (
              <div key={idx} className="relative pl-12 sm:pl-14">
                <div className="absolute left-4 top-7 -translate-x-1/2 w-9 h-9 sm:w-10 sm:h-10 bg-purple-500 rounded-full flex items-center justify-center shadow-lg">
                  <item.icon size={20} className="text-white" />
                </div>

                <div className="rounded-3xl bg-(--surface-2) p-6 sm:p-8 transition hover:-translate-y-2 hover:shadow-xl hover:shadow-purple-600/30">
                  <span className="text-purple-300 text-sm sm:text-base font-semibold tracking-wide block mb-2">
                    {item.year}
                  </span>
                  <h3 className="text-xl sm:text-2xl font-semibold text-white mb-3">{item.title}</h3>
                  <p className="text-gray-400 leading-relaxed">{item.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= VALUES / WHY US ================= */}
      <section className="py-24 sm:py-28 md:py-32 px-5 sm:px-6 bg-(--surface)">
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white text-center mb-12 sm:mb-16 md:mb-20">
          Warum <span style={{ color: theme.primary }}>uns wählen?</span>
        </h2>

        <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-8 sm:gap-10 md:gap-12">
          {[
            {
              icon: Music,
              title: "Satter Sound",
              text: "Unsere Anlagen liefern kraftvollen Bass, klare Höhen und vollen Raumklang für jedes Event.",
            },
            {
              icon: Heart,
              title: "Leidenschaftlich",
              text: "Wir lieben, was wir tun – und das hört man in jeder Feier.",
            },
            {
              icon: Star,
              title: "Zuverlässig",
              text: "Pünktlich, sauber aufgebaut und einsatzbereit – ohne Stress für dich.",
            },
          ].map(({ icon: Icon, title, text }) => (
            <div
              key={title}
              className="group relative rounded-3xl p-8 sm:p-10 bg-(--surface-2) transition hover:-translate-y-2 hover:shadow-xl hover:shadow-purple-600/30"
            >
              <div className="mx-auto w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center rounded-full mb-5 sm:mb-6 bg-gradient-to-tr from-purple-500/40 to-purple-700/30 transition-transform duration-300 group-hover:scale-110">
                <Icon size={40} style={{ color: theme.primary }} />
              </div>
              <h3 className="text-xl sm:text-2xl font-semibold text-white mb-4 relative inline-block group-hover:after:content-[''] after:block after:w-0 after:h-0.75 after:bg-purple-500 after:rounded-full after:transition-all after:duration-300 group-hover:after:w-full">
                {title}
              </h3>
              <p className="text-gray-400 leading-relaxed">{text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ================= CTA ================= */}
      <section className="py-24 sm:py-28 md:py-32 px-5 sm:px-6 text-center" style={{ background: theme.bgTo }}>
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white mb-5 sm:mb-6">
          Bereit für den perfekten Sound?
        </h2>
        <p className="text-base sm:text-lg text-gray-300 mb-10 sm:mb-12 max-w-2xl mx-auto leading-relaxed">
          Kontaktiere uns und wir sorgen dafür, dass dein Event unvergesslich wird!
        </p>
        <a
          href="/contact"
          className="btn-primary inline-block px-10 sm:px-14 py-5 sm:py-6 rounded-full font-semibold text-base sm:text-lg text-white transition hover:scale-105 hover:shadow-xl"
          style={{ backgroundColor: theme.primary }}
          data-cta="cta_contact"
        >
          Jetzt anfragen
        </a>
      </section>
    </main>
  );
}
