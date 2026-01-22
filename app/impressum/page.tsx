"use client";

import { theme } from "../components/Theme";

export default function Impressum() {
  return (
    <main className="min-h-screen pt-32 px-6 text-gray-200">

      <div className="max-w-4xl mx-auto space-y-6 text-gray-300 text-lg">
        <h1 className="text-5xl font-bold text-white mb-12" style={{ color: theme.primary }}>
            Impressum
        </h1>

        <p>
          <b>Angaben gemäß § 5 TMG</b>
        </p>

        <p>
          Benjamin Rohde Audiotechnik<br />
          Inhaber: Benjamin Rohde<br />
          Ulrich-Thater-Straße 7<br />
          34414 Warburg<br />
          Deutschland
        </p>

        <p>
          Telefon: <a href="tel:+491706480129" className="text-purple-500">+49 170 6480129</a><br />
          E-Mail: <a href="mailto:info@rohde-audio.com" className="text-purple-500">info@rohde-audio.com</a>
        </p>

        <p>
          Umsatzsteuer<br />
          Kleinunternehmer gemäß § 19 UStG – es wird keine Umsatzsteuer berechnet.
        </p>

        <p>
          Verantwortlich i.S.d. § 18 Abs. 2 MStV:<br />
          Benjamin Rohde, Ulrich-Thater-Straße 7, 34414 Warburg
        </p>
      </div>
    </main>
  );
}
