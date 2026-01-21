"use client";

import { theme } from "../components/Theme";

export default function AGB() {
  return (
    <main className="min-h-screen pt-32 px-6 text-gray-200">

      <div className="max-w-4xl mx-auto space-y-6 text-gray-300 text-lg">
        <h1 className="text-5xl font-bold text-white mb-12" style={{ color: theme.primary }}>
            Allgemeine Geschäftsbedingungen (AGB)
        </h1>

        <h2 className="text-2xl font-semibold text-white mt-8 mb-4" style={{ color: theme.primary }}>1. Geltungsbereich</h2>
        <p>
          Diese AGB gelten für alle Verträge, Lieferungen und Leistungen zwischen Rohde Audio und seinen Kunden im Rahmen der Vermietung von Musikanlagen.
        </p>

        <h2 className="text-2xl font-semibold text-white mt-8 mb-4" style={{ color: theme.primary }}>2. Vertragsschluss</h2>
        <p>
          Der Vertrag kommt zustande, sobald Rohde Audio die Buchung oder Anfrage des Kunden schriftlich bestätigt. 
          Änderungen und Nebenabreden bedürfen der Schriftform.
        </p>

        <h2 className="text-2xl font-semibold text-white mt-8 mb-4" style={{ color: theme.primary }}>3. Preise und Zahlung</h2>
        <p>
          Die angegebenen Preise verstehen sich inklusive gesetzlicher Mehrwertsteuer. Zahlungen sind gemäß der in der Buchungsbestätigung genannten Frist zu leisten.
        </p>

        <h2 className="text-2xl font-semibold text-white mt-8 mb-4" style={{ color: theme.primary }}>4. Lieferung & Abholung</h2>
        <p>
          Rohde Audio liefert die Musikanlagen nach Absprache zum Veranstaltungsort und holt diese nach der Veranstaltung wieder ab. 
          Der Kunde verpflichtet sich, die Geräte pfleglich zu behandeln.
        </p>

        <h2 className="text-2xl font-semibold text-white mt-8 mb-4" style={{ color: theme.primary }}>5. Haftung</h2>
        <p>
          Rohde Audio haftet nur für Schäden, die durch vorsätzliches oder grob fahrlässiges Verhalten entstanden sind. 
          Für technische Störungen während der Veranstaltung wird keine Haftung übernommen.
        </p>

        <h2 className="text-2xl font-semibold text-white mt-8 mb-4" style={{ color: theme.primary }}>6. Rücktritt & Stornierung</h2>
        <p>
          Der Kunde kann bis 14 Tage vor Veranstaltungsbeginn kostenfrei stornieren. Bei späterer Stornierung behält sich Rohde Audio vor, eine angemessene Aufwandsentschädigung zu berechnen.
        </p>

        <h2 className="text-2xl font-semibold text-white mt-8 mb-4" style={{ color: theme.primary }}>7. Schlussbestimmungen</h2>
        <p>
          Es gilt deutsches Recht. Sollten einzelne Bestimmungen dieser AGB unwirksam sein, bleibt die Gültigkeit der übrigen Regelungen unberührt.
        </p>

        <p className="mt-8 mb-16">
          Letzte Aktualisierung: Januar 2026
        </p>
      </div>
    </main>
  );
}
