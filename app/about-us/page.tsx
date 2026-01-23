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
      image: "https://images.unsplash.com/photo-1516873240891-4bf014598ab4?q=80&w=1470&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", // Stockbild: Porträt / Person
    },
    {
      year: "2015",
      title: "Vinyl & Tontechnik",
      text: "Beginn meiner Auseinandersetzung mit professioneller Tontechnik und Schallplatten-Sammlung.",
      icon: Star,
      image: "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=800&q=80", // Stockbild: Vinyl / Audio
    },
    {
      year: "2025",
      title: "Gründung Rohde Audio",
      text: "Aus Leidenschaft wurde ein Unternehmen – hochwertige Musikanlagen mit Rundum-Service.",
      icon: User,
      image: "https://images.unsplash.com/photo-1507874457470-272b3c8d8ee2?auto=format&fit=crop&w=800&q=80", // Stockbild: Event Setup / PA Anlage
    },
    {
      year: "Heute",
      title: "Deine Feier, unser Sound",
      text: "Wir bieten PA-Systeme, Beratung, Hol- & Bringservice für unvergessliche Events.",
      icon: Heart,
      image: "https://images.unsplash.com/photo-1686477014401-3f0b3164db49?q=80&w=1924&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", // Stockbild: Party / Feier
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

          <div className="flex justify-center gap-6 flex-wrap">
            <a
              href="#pakete"
              className="btn-primary inline-block px-14 py-6 rounded-full font-semibold text-lg text-white transition hover:scale-105"
              style={{ backgroundColor: theme.primary }}
            >
              Mehr erfahren
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

      {/* ================= STORY TREE ================= */}
      <section className="py-32 px-6 max-w-6xl mx-auto">
        <h2 className="text-4xl md:text-5xl font-bold text-white text-center mb-20">
          Unsere <span style={{ color: theme.primary }}>Reise</span>
        </h2>

        <div className="relative">
          {/* Vertikale Linie */}
          <div className="absolute left-1/2 top-0 w-1 bg-purple-600/50 h-full -translate-x-1/2" />

          <div className="space-y-24">
            {story.map((item, idx) => (
              <div key={idx} className="relative flex flex-col md:flex-row items-center justify-between">
                {/* Linke Box (immer links, auch wenn Bild rechts) */}
                <div className="md:w-5/12 p-6 rounded-3xl bg-(--surface-2) transition hover:-translate-y-2 hover:shadow-xl hover:shadow-purple-600/30 md:mr-auto text-right md:pr-12">
                  <h3 className="text-2xl font-semibold text-white mb-2 flex items-center justify-end gap-3">
                    <item.icon size={28} style={{ color: theme.primary }} />
                    {item.title}
                  </h3>
                  <p className="text-gray-400">{item.text}</p>
                  <span className="text-purple-500 font-bold mt-2 block">{item.year}</span>
                </div>

                {/* Icon / Node in Mitte */}
                <div className="absolute left-1/2 -translate-x-1/2 w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center shadow-lg z-10">
                  <item.icon size={24} className="text-white" />
                </div>

                {/* Rechte Box: Bild immer rechts */}
                <div className="mt-6 md:mt-0 md:w-5/12 md:ml-auto">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="rounded-2xl shadow-lg object-cover w-full h-48 transition-transform duration-300 hover:scale-105"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= VALUES / WHY US ================= */}
      <section className="py-32 px-6 bg-(--surface)">
        <h2 className="text-4xl md:text-5xl font-bold text-white text-center mb-20">
          Warum <span style={{ color: theme.primary }}>uns wählen?</span>
        </h2>

        <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-12">
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

      {/* ================= CTA ================= */}
      <section className="py-32 px-6 text-center" style={{ background: theme.bgTo }}>
        <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-6">
          Bereit für den perfekten Sound?
        </h2>
        <p className="text-gray-300 mb-12 max-w-2xl mx-auto">
          Kontaktiere uns und wir sorgen dafür, dass dein Event unvergesslich wird!
        </p>
        <a
          href="/contact"
          className="btn-primary inline-block px-14 py-6 rounded-full font-semibold text-lg text-white transition hover:scale-105 hover:shadow-xl"
          style={{ backgroundColor: theme.primary }}
        >
          Jetzt anfragen
        </a>
      </section>
    </main>
  );
}
