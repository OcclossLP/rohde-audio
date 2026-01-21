"use client";

import { theme } from "../components/Theme";

export default function Datenschutz() {
  return (
    <main className="min-h-screen pt-32 px-6 text-gray-200">

      <div className="max-w-4xl mx-auto space-y-6 text-gray-300 text-lg">
        <h1 className="text-5xl font-bold text-white mb-12" style={{ color: theme.primary }}>
            Datenschutzerklärung
        </h1>

        <p>
          Wir nehmen den Schutz deiner Daten sehr ernst. Personenbezogene Daten, die über diese Website erhoben werden,
          werden vertraulich behandelt und nicht an Dritte weitergegeben, soweit dies nicht gesetzlich vorgeschrieben ist.
        </p>

        <h2 className="text-2xl font-semibold text-white mt-8 mb-4" style={{ color: theme.primary }}>Erhebung und Verarbeitung von Daten</h2>
        <p>
          Personenbezogene Daten werden nur erhoben, wenn du uns diese freiwillig zur Verfügung stellst (z.B. über das Kontaktformular oder E-Mail). 
          Wir verwenden diese Daten ausschließlich zur Bearbeitung deiner Anfrage und für die Durchführung von Verträgen.
        </p>

        <h2 className="text-2xl font-semibold text-white mt-8 mb-4" style={{ color: theme.primary }}>Cookies</h2>
        <p>
          Unsere Website verwendet keine Cookies für Tracking oder Werbung. Nur technisch notwendige Cookies werden verwendet,
          um die Funktionalität der Seite zu gewährleisten.
        </p>

        <h2 className="text-2xl font-semibold text-white mt-8 mb-4" style={{ color: theme.primary }}>Externe Dienste</h2>
        <p>
          Wir binden keine Drittanbieter-Tools ein, die personenbezogene Daten sammeln. Falls externe Dienste wie Google Maps oder Social Media Links eingebunden werden,
          informieren wir darüber gesondert und holen ggf. deine Einwilligung ein.
        </p>

        <h2 className="text-2xl font-semibold text-white mt-8 mb-4" style={{ color: theme.primary }}>Rechte der Nutzer</h2>
        <p>
          Du hast das Recht auf Auskunft, Berichtigung, Löschung oder Sperrung deiner gespeicherten Daten. Kontaktiere uns dazu unter <a href="mailto:info@rohde-audio.de" className="text-purple-500">info@rohde-audio.de</a>.
        </p>

        <p className="mt-8 mb-16">
          Letzte Aktualisierung: Januar 2026
        </p>
      </div>
    </main>
  );
}
