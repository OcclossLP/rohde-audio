"use client";

import { theme } from "../components/Theme";

export default function AGB() {
  return (
    <main className="min-h-screen pt-32 px-6 text-gray-200 pb-24">

      <div className="max-w-4xl mx-auto space-y-6 text-gray-300 text-lg">
        <h1 className="text-5xl font-bold text-white mb-6" style={{ color: theme.primary }}>
          AGB – Rohde Audio (Vermietung Veranstaltungstechnik)
        </h1>
        <p>Allgemeine Geschäftsbedingungen (AGB) – Vermietung von Veranstaltungstechnik</p>
        <p>Stand: Januar 2026</p>

        <h2 className="text-2xl font-semibold text-white mt-8 mb-4" style={{ color: theme.primary }}>
          1. Geltungsbereich
        </h2>
        <ol className="list-decimal pl-6 space-y-2">
          <li>
            Diese AGB gelten für alle Verträge über die Vermietung sowie ggf. Lieferung, Aufbau/Abbau und Einweisung von
            Veranstaltungstechnik zwischen Rohde Audio (Benjamin Rohde Audiotechnik) ("Vermieter") und dem Kunden
            ("Mieter").
          </li>
          <li>
            Abweichende Bedingungen des Mieters gelten nur, wenn sie vom Vermieter ausdrücklich bestätigt wurden.
          </li>
        </ol>

        <h2 className="text-2xl font-semibold text-white mt-8 mb-4" style={{ color: theme.primary }}>
          2. Angebot und Vertragsschluss
        </h2>
        <ol className="list-decimal pl-6 space-y-2">
          <li>Angebote sind freibleibend.</li>
          <li>
            Ein Vertrag kommt zustande, sobald der Vermieter die Buchung in Textform (z. B. E-Mail, Messenger) bestätigt
            oder die vereinbarte Leistung ausführt.
          </li>
        </ol>

        <h2 className="text-2xl font-semibold text-white mt-8 mb-4" style={{ color: theme.primary }}>
          3. Preise, Kleinunternehmerregelung, Zahlung
        </h2>
        <ol className="list-decimal pl-6 space-y-2">
          <li>
            Alle Preise sind Endpreise. Gemäß § 19 UStG (Kleinunternehmerregelung) wird keine Umsatzsteuer ausgewiesen.
          </li>
          <li>
            Die Zahlung erfolgt nach Vereinbarung, spätestens jedoch zu dem in der Auftragsbestätigung genannten Zeitpunkt.
          </li>
          <li>
            Gerät der Mieter in Zahlungsverzug, kann der Vermieter die Leistung bis zum Zahlungseingang zurückhalten.
          </li>
        </ol>

        <h2 className="text-2xl font-semibold text-white mt-8 mb-4" style={{ color: theme.primary }}>
          4. Kaution
        </h2>
        <ol className="list-decimal pl-6 space-y-2">
          <li>
            Der Vermieter kann eine angemessene Kaution verlangen. Höhe und Fälligkeit werden in der Auftragsbestätigung
            genannt.
          </li>
          <li>
            Die Kaution wird nach ordnungsgemäßer Rückgabe verrechnet bzw. zurückerstattet, sofern keine Ansprüche (z. B.
            Schäden, Fehlteile, Sonderreinigung) bestehen.
          </li>
        </ol>

        <h2 className="text-2xl font-semibold text-white mt-8 mb-4" style={{ color: theme.primary }}>
          5. Übergabe, Nutzung und Pflichten des Mieters
        </h2>
        <ol className="list-decimal pl-6 space-y-2">
          <li>
            Der Mieter verpflichtet sich, die Mietsache pfleglich zu behandeln, vor Feuchtigkeit, Regen und unsachgemäßer
            Nutzung zu schützen und ausschließlich gemäß Einweisung/Bedienhinweisen zu verwenden.
          </li>
          <li>
            Der Mieter darf die Mietsache nicht an Dritte überlassen (Untervermietung), außer der Vermieter stimmt zu.
          </li>
          <li>
            Der Mieter stellt am Einsatzort eine geeignete Stromversorgung und sichere Aufstellflächen bereit.
          </li>
          <li>
            Outdoor-Nutzung ist nur zulässig, wenn dies ausdrücklich vereinbart ist. Schäden durch Witterungseinflüsse trägt
            der Mieter, soweit diese durch Schutzmaßnahmen vermeidbar gewesen wären.
          </li>
        </ol>

        <h2 className="text-2xl font-semibold text-white mt-8 mb-4" style={{ color: theme.primary }}>
          6. Lieferung, Aufbau/Abbau, Abholung
        </h2>
        <ol className="list-decimal pl-6 space-y-2">
          <li>Liefer-, Aufbau- und Abbauleistungen erfolgen nur, wenn sie ausdrücklich vereinbart wurden.</li>
          <li>
            Wartezeiten, die der Mieter verursacht (z. B. fehlender Zugang, verspätete Einlassmöglichkeit), können
            angemessen berechnet werden.
          </li>
          <li>Der Mieter sorgt für freien Zugang zum Veranstaltungsort sowie zumutbare Ladewege.</li>
        </ol>

        <h2 className="text-2xl font-semibold text-white mt-8 mb-4" style={{ color: theme.primary }}>
          7. Rückgabe, Fehlteile, Reinigung
        </h2>
        <ol className="list-decimal pl-6 space-y-2">
          <li>
            Die Rückgabe erfolgt zum vereinbarten Zeitpunkt in dem Zustand, in dem die Geräte übergeben wurden, abgesehen
            von normaler Abnutzung.
          </li>
          <li>
            Fehlende Teile, Beschädigungen oder außergewöhnliche Verschmutzungen werden dem Mieter in Rechnung gestellt.
          </li>
          <li>Datenträger/USB-Medien des Mieters sind vor Rückgabe zu entfernen.</li>
        </ol>

        <h2 className="text-2xl font-semibold text-white mt-8 mb-4" style={{ color: theme.primary }}>
          8. Mängel und Störungen
        </h2>
        <ol className="list-decimal pl-6 space-y-2">
          <li>Der Mieter hat offensichtliche Mängel bei Übergabe unverzüglich anzuzeigen.</li>
          <li>
            Treten während der Mietzeit Störungen auf, ist der Mieter verpflichtet, den Vermieter unverzüglich zu
            informieren und angemessene Maßnahmen zur Schadensminderung zu treffen.
          </li>
          <li>
            Bei berechtigten Mängeln leistet der Vermieter nach eigener Wahl Nachbesserung oder Ersatz. Weitergehende
            Ansprüche bestehen nur nach Maßgabe von Ziffer 9.
          </li>
        </ol>

        <h2 className="text-2xl font-semibold text-white mt-8 mb-4" style={{ color: theme.primary }}>
          9. Haftung
        </h2>
        <ol className="list-decimal pl-6 space-y-2">
          <li>
            Der Vermieter haftet unbeschränkt bei Vorsatz und grober Fahrlässigkeit sowie bei Schäden aus der Verletzung
            des Lebens, des Körpers oder der Gesundheit.
          </li>
          <li>
            Bei leichter Fahrlässigkeit haftet der Vermieter nur bei Verletzung wesentlicher Vertragspflichten
            (Kardinalpflichten) und beschränkt auf den vertragstypischen, vorhersehbaren Schaden.
          </li>
          <li>
            Eine Haftung für Ausfälle, die auf Umständen außerhalb des Einflussbereichs des Vermieters beruhen (z. B.
            Stromausfall am Veranstaltungsort, unsachgemäße Bedienung, Überlastung, Drittgeräte), ist ausgeschlossen.
          </li>
        </ol>

        <h2 className="text-2xl font-semibold text-white mt-8 mb-4" style={{ color: theme.primary }}>
          10. Schäden, Verlust, Diebstahl
        </h2>
        <ol className="list-decimal pl-6 space-y-2">
          <li>
            Der Mieter haftet für Schäden, Verlust oder Diebstahl der Mietsache ab Übergabe bis Rückgabe, sofern er diese zu
            vertreten hat.
          </li>
          <li>
            Bei Diebstahl ist unverzüglich Anzeige bei der Polizei zu erstatten und dem Vermieter vorzulegen.
          </li>
        </ol>

        <h2 className="text-2xl font-semibold text-white mt-8 mb-4" style={{ color: theme.primary }}>
          11. Rücktritt / Stornierung durch den Mieter
        </h2>
        <ol className="list-decimal pl-6 space-y-2">
          <li>Stornierungen bedürfen der Textform.</li>
          <li>
            Bei Stornierung gelten folgende Pauschalen (sofern kein geringerer Schaden nachgewiesen wird):
            <ul className="list-disc pl-6 space-y-1 mt-2">
              <li>bis 14 Tage vor Mietbeginn: kostenfrei</li>
              <li>13 bis 7 Tage vor Mietbeginn: 30% des vereinbarten Gesamtpreises</li>
              <li>6 bis 2 Tage vor Mietbeginn: 60%</li>
              <li>ab 48 Stunden vor Mietbeginn oder bei Nichtabholung/Nichtannahme: 90%</li>
            </ul>
          </li>
          <li>
            Bereits entstandene Fremdkosten (z. B. Zusatzmiete bei Drittanbietern) sind in voller Höhe zu ersetzen.
          </li>
        </ol>

        <h2 className="text-2xl font-semibold text-white mt-8 mb-4" style={{ color: theme.primary }}>
          12. Rücktritt durch den Vermieter
        </h2>
        <p>
          Der Vermieter kann vom Vertrag zurücktreten, wenn die Durchführung aus wichtigen Gründen unmöglich oder
          unzumutbar wird (z. B. höhere Gewalt, Krankheit, Sicherheitsrisiken). Bereits geleistete Zahlungen werden
          erstattet; weitergehende Ansprüche sind ausgeschlossen, soweit gesetzlich zulässig.
        </p>

        <h2 className="text-2xl font-semibold text-white mt-8 mb-4" style={{ color: theme.primary }}>
          13. Schlussbestimmungen
        </h2>
        <ol className="list-decimal pl-6 space-y-2">
          <li>Es gilt deutsches Recht.</li>
          <li>Sofern der Mieter Unternehmer ist, ist Gerichtsstand der Sitz des Vermieters.</li>
          <li>Sollten einzelne Bestimmungen unwirksam sein, bleibt der Vertrag im Übrigen wirksam.</li>
        </ol>
      </div>
    </main>
  );
}
