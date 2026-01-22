"use client";

import { theme } from "../components/Theme";

export default function Datenschutz() {
  return (
    <main className="min-h-screen pt-32 px-6 text-gray-200">

      <div className="max-w-4xl mx-auto space-y-6 text-gray-300 text-lg">
        <h1 className="text-5xl font-bold text-white mb-12" style={{ color: theme.primary }}>
            Datenschutzerklärung
        </h1>

        <h2 className="text-2xl font-semibold text-white mt-8 mb-4" style={{ color: theme.primary }}>
          1. Verantwortlicher
        </h2>
        <p>
          Benjamin Rohde Audiotechnik (Rohde Audio)<br />
          Inhaber: Benjamin Rohde<br />
          Ulrich-Thater-Straße 7<br />
          34414 Warburg<br />
          Deutschland<br />
          Telefon: <a href="tel:+491706480129" className="text-purple-500">+49 170 6480129</a><br />
          E-Mail: <a href="mailto:info@rohde-audio.com" className="text-purple-500">info@rohde-audio.com</a>
        </p>

        <h2 className="text-2xl font-semibold text-white mt-8 mb-4" style={{ color: theme.primary }}>
          2. Allgemeine Hinweise
        </h2>
        <p>
          Wir nehmen den Schutz Ihrer personenbezogenen Daten ernst. Personenbezogene Daten sind alle Daten, mit denen Sie
          persönlich identifiziert werden können. Nachfolgend informieren wir darüber, welche Daten beim Besuch dieser
          Website verarbeitet werden und zu welchen Zwecken.
        </p>

        <h2 className="text-2xl font-semibold text-white mt-8 mb-4" style={{ color: theme.primary }}>
          3. Zugriffsdaten / Server-Logfiles
        </h2>
        <p>
          Beim Aufruf unserer Website werden durch den Webserver automatisch Daten erfasst und in Server-Logfiles
          gespeichert. Dies sind insbesondere:
        </p>
        <ul className="list-disc pl-6 space-y-2">
          <li>IP-Adresse</li>
          <li>Datum und Uhrzeit der Anfrage</li>
          <li>aufgerufene Seite/Datei</li>
          <li>übertragene Datenmenge</li>
          <li>Statuscode (z. B. „200“)</li>
          <li>Browsertyp und Browserversion</li>
          <li>Betriebssystem</li>
          <li>Referrer-URL (zuvor besuchte Seite)</li>
        </ul>
        <p>
          <b>Zweck der Verarbeitung:</b> Sicherer und stabiler Betrieb der Website (z. B. Fehleranalyse, Missbrauchs- und
          Angriffserkennung).
        </p>
        <p>
          <b>Rechtsgrundlage:</b> Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse).
        </p>
        <p>
          <b>Speicherdauer:</b> Die Server-Logfiles werden <b>14 Tage</b> gespeichert und anschließend gelöscht, sofern
          keine sicherheitsrelevante längere Aufbewahrung erforderlich ist.
        </p>

        <h2 className="text-2xl font-semibold text-white mt-8 mb-4" style={{ color: theme.primary }}>
          4. Kontaktaufnahme (E-Mail und Telefon)
        </h2>
        <p>
          Wenn Sie uns per E-Mail oder telefonisch kontaktieren, verarbeiten wir die von Ihnen übermittelten Daten
          (z. B. Name, Kontaktdaten, Inhalt der Anfrage), um Ihre Anfrage zu bearbeiten.
        </p>
        <p><b>Rechtsgrundlage:</b></p>
        <ul className="list-disc pl-6 space-y-2">
          <li>Art. 6 Abs. 1 lit. b DSGVO (vorvertragliche Maßnahmen / Vertrag), sofern die Anfrage auf ein Angebot oder eine Leistung abzielt,</li>
          <li>ansonsten Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse an der Bearbeitung von Anfragen).</li>
        </ul>
        <p>
          <b>Speicherdauer:</b> Wir speichern Ihre Anfrage nur so lange, wie es zur Bearbeitung erforderlich ist, sowie
          ggf. im Rahmen gesetzlicher Aufbewahrungspflichten.
        </p>

        <h2 className="text-2xl font-semibold text-white mt-8 mb-4" style={{ color: theme.primary }}>
          5. Cookies / Tracking / Drittanbieter-Dienste
        </h2>
        <p>
          Wir setzen aktuell <b>keine</b> Tracking- oder Analyse-Tools ein und binden derzeit <b>keine</b> externen Dienste
          (z. B. Karten, Social-Media-Plugins, Video-Embeds) ein. Cookies zu Werbe- oder Analysezwecken werden nicht
          verwendet. Technisch notwendige Cookies können je nach eingesetzter Technik zum Betrieb der Website erforderlich
          sein.
        </p>

        <h2 className="text-2xl font-semibold text-white mt-8 mb-4" style={{ color: theme.primary }}>
          6. Empfänger und Weitergabe von Daten
        </h2>
        <p>
          Eine Weitergabe personenbezogener Daten an Dritte erfolgt grundsätzlich nicht, außer sie ist zur Vertragserfüllung
          erforderlich, gesetzlich vorgeschrieben oder Sie haben eingewilligt.
        </p>

        <h2 className="text-2xl font-semibold text-white mt-8 mb-4" style={{ color: theme.primary }}>
          7. Ihre Rechte
        </h2>
        <p>
          Sie haben das Recht auf Auskunft (Art. 15 DSGVO), Berichtigung (Art. 16 DSGVO), Löschung (Art. 17 DSGVO),
          Einschränkung der Verarbeitung (Art. 18 DSGVO), Datenübertragbarkeit (Art. 20 DSGVO) sowie Widerspruch gegen die
          Verarbeitung (Art. 21 DSGVO). Zudem haben Sie das Recht, sich bei einer Datenschutzaufsichtsbehörde zu beschweren
          (Art. 77 DSGVO).
        </p>

        <h2 className="text-2xl font-semibold text-white mt-8 mb-4" style={{ color: theme.primary }}>
          8. SSL-/TLS-Verschlüsselung
        </h2>
        <p>
          Diese Website nutzt aus Sicherheitsgründen eine SSL-/TLS-Verschlüsselung. Dadurch können Daten, die Sie an uns
          übermitteln, nicht von Dritten mitgelesen werden.
        </p>

        <h2 className="text-2xl font-semibold text-white mt-8 mb-4" style={{ color: theme.primary }}>
          9. Aktualität
        </h2>
        <p className="mt-8 mb-16">
          Diese Datenschutzerklärung hat den Stand: <b>22.01.2026</b>. Wir behalten uns vor, sie bei Bedarf anzupassen.
        </p>
      </div>
    </main>
  );
}
