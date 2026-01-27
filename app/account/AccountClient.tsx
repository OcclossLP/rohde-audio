"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { theme } from "@/app/components/Theme";
import { csrfFetch } from "@/app/components/csrfFetch";
import { Trash2 } from "lucide-react";

type Profile = {
  firstName: string | null;
  lastName: string | null;
  email: string;
  phone: string | null;
  customerNumber: string | null;
  street: string | null;
  houseNumber: string | null;
  addressExtra: string | null;
  postalCode: string | null;
  city: string | null;
};

type Inquiry = {
  id: string;
  orderNumber: string | null;
  eventType: string | null;
  participants: string | null;
  eventDate: string | null;
  message: string;
  status: string;
  createdAt: string;
};

export default function AccountClient({ profile }: { profile: Profile }) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"profile" | "inquiries">("profile");
  const [firstName, setFirstName] = useState(profile.firstName ?? "");
  const [lastName, setLastName] = useState(profile.lastName ?? "");
  const [email, setEmail] = useState(profile.email ?? "");
  const [phone, setPhone] = useState(profile.phone ?? "");
  const [street, setStreet] = useState(profile.street ?? "");
  const [houseNumber, setHouseNumber] = useState(profile.houseNumber ?? "");
  const [addressExtra, setAddressExtra] = useState(profile.addressExtra ?? "");
  const [postalCode, setPostalCode] = useState(profile.postalCode ?? "");
  const [city, setCity] = useState(profile.city ?? "");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [inquiriesLoading, setInquiriesLoading] = useState(false);
  const [inquiryForm, setInquiryForm] = useState({
    eventType: "",
    participants: "",
    eventDate: "",
    message: "",
  });
  const [inquiryMessage, setInquiryMessage] = useState<string | null>(null);
  const [inquiryError, setInquiryError] = useState<string | null>(null);
  const [deletingInquiryId, setDeletingInquiryId] = useState<string | null>(null);
  const [confirmInquiryId, setConfirmInquiryId] = useState<string | null>(null);

  const canSubmit = useMemo(() => {
    if (!firstName.trim() || !lastName.trim() || !email.trim()) return false;
    if (password && password !== confirmPassword) return false;
    return true;
  }, [firstName, lastName, email, password, confirmPassword]);

  const handleSave = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setMessage(null);

    if (!firstName.trim() || !lastName.trim() || !email.trim()) {
      setError("Vorname, Nachname und E-Mail sind erforderlich.");
      return;
    }
    if (password && password !== confirmPassword) {
      setError("Die Passwörter stimmen nicht überein.");
      return;
    }

    setSaving(true);
    const response = await csrfFetch("/api/account", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        street: street.trim(),
        houseNumber: houseNumber.trim(),
        addressExtra: addressExtra.trim(),
        postalCode: postalCode.trim(),
        city: city.trim(),
        password: password.trim(),
      }),
    });
    setSaving(false);

    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      setError(payload?.error ?? "Speichern fehlgeschlagen.");
      return;
    }

    setMessage("Profil gespeichert.");
    setPassword("");
    setConfirmPassword("");
  };

  const handleDeleteAccount = async () => {
    const response = await csrfFetch("/api/account", {
      method: "DELETE",
    });

    if (response.ok) {
      router.push("/admin/login");
      return;
    }
    const payload = await response.json().catch(() => null);
    setError(payload?.error ?? "Account konnte nicht gelöscht werden.");
  };

  const loadInquiries = async () => {
    setInquiriesLoading(true);
    const response = await fetch("/api/account/inquiries");
    if (response.ok) {
      const data = (await response.json()) as Inquiry[];
      setInquiries(data);
    }
    setInquiriesLoading(false);
  };

  const handleInquiryChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = event.target;
    setInquiryForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleInquirySubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setInquiryError(null);
    setInquiryMessage(null);

    if (!inquiryForm.message.trim()) {
      setInquiryError("Bitte gib eine Nachricht ein.");
      return;
    }

    const response = await csrfFetch("/api/account/inquiries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        eventType: inquiryForm.eventType,
        participants: inquiryForm.participants,
        eventDate: inquiryForm.eventDate,
        message: inquiryForm.message,
      }),
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      setInquiryError(payload?.error ?? "Anfrage konnte nicht gesendet werden.");
      return;
    }

    setInquiryForm({ eventType: "", participants: "", eventDate: "", message: "" });
    setInquiryMessage("Anfrage wurde gesendet.");
    await loadInquiries();
  };

  const handleDeleteInquiry = async (id: string) => {
    setDeletingInquiryId(id);
    const response = await csrfFetch(`/api/account/inquiries/${id}`, {
      method: "DELETE",
    });
    setDeletingInquiryId(null);

    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      setInquiryError(payload?.error ?? "Anfrage konnte nicht gelöscht werden.");
      return;
    }

    setInquiries((prev) => prev.filter((entry) => entry.id !== id));
  };

  return (
    <main className="min-h-screen pt-32 px-6 text-gray-200">
      <div className="max-w-4xl mx-auto">
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-white mb-2">
            Kundenprofil
          </h1>
          <p className="text-gray-400">
            Verwalte deine Kontaktdaten und Sicherheitseinstellungen.
          </p>
          <div className="mt-4 inline-flex items-center gap-3 rounded-full border border-white/10 bg-(--surface-2) px-4 py-2 text-xs text-gray-300">
            <span className="text-gray-500">Kundennummer:</span>
            <span className="font-semibold text-white">
              {profile.customerNumber ?? "—"}
            </span>
          </div>
        </div>

        <div className="mb-8 flex flex-wrap gap-3 text-sm">
          {[
            { id: "inquiries", label: "Anfragen" },
            { id: "profile", label: "Profil" },
          ].map(({ id, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => {
                const next = id as "profile" | "inquiries";
                setActiveTab(next);
                if (next === "inquiries" && !inquiries.length) {
                  loadInquiries();
                }
              }}
              className={`rounded-full px-5 py-2 font-semibold transition ${
                activeTab === id
                  ? "bg-purple-500 text-white shadow-lg shadow-purple-500/30"
                  : "border border-white/10 text-gray-300 hover:bg-white/5"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {activeTab === "profile" && (
          <div className="rounded-3xl border border-white/10 bg-(--surface-2) p-10 shadow-xl">
            <h2 className="text-2xl font-semibold text-white mb-6">
              Profileinstellungen
            </h2>

            {(error || message) && (
              <div
                className={`mb-6 rounded-xl border px-4 py-3 text-sm ${
                  error
                    ? "border-red-500/30 bg-red-500/10 text-red-200"
                    : "border-white/10 bg-white/5 text-gray-200"
                }`}
              >
                {error ?? message}
              </div>
            )}

            <form className="space-y-5" onSubmit={handleSave}>
              <div>
                <label className="block text-sm text-gray-400 mb-2" htmlFor="profile-first-name">
                  Vorname
                </label>
                <input
                  id="profile-first-name"
                  type="text"
                  required
                  value={firstName}
                  onChange={(event) => setFirstName(event.target.value)}
                  className="w-full rounded-xl bg-(--surface-3) border border-white/10 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2" htmlFor="profile-last-name">
                  Nachname
                </label>
                <input
                  id="profile-last-name"
                  type="text"
                  required
                  value={lastName}
                  onChange={(event) => setLastName(event.target.value)}
                  className="w-full rounded-xl bg-(--surface-3) border border-white/10 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2" htmlFor="profile-email">
                  E-Mail
                </label>
                <input
                  id="profile-email"
                  type="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="w-full rounded-xl bg-(--surface-3) border border-white/10 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2" htmlFor="profile-phone">
                  Telefonnummer (optional)
                </label>
                <input
                  id="profile-phone"
                  type="tel"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  className="w-full rounded-xl bg-(--surface-3) border border-white/10 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="rounded-2xl border border-white/10 bg-(--surface-3)/40 p-4">
                <h3 className="text-sm font-semibold text-white mb-3">
                  Adresse (optional)
                </h3>
                <div className="grid gap-4 md:grid-cols-[1.5fr_1fr]">
                  <div>
                    <label className="block text-sm text-gray-400 mb-2" htmlFor="profile-street">
                      Straße
                    </label>
                    <input
                      id="profile-street"
                      type="text"
                      value={street}
                      onChange={(event) => setStreet(event.target.value)}
                      className="w-full rounded-xl bg-(--surface-3) border border-white/10 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2" htmlFor="profile-house-number">
                      Hausnummer
                    </label>
                    <input
                      id="profile-house-number"
                      type="text"
                      value={houseNumber}
                      onChange={(event) => setHouseNumber(event.target.value)}
                      className="w-full rounded-xl bg-(--surface-3) border border-white/10 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>
                <div className="mt-4">
                  <label className="block text-sm text-gray-400 mb-2" htmlFor="profile-address-extra">
                    Zusatz (optional)
                  </label>
                  <input
                    id="profile-address-extra"
                    type="text"
                    value={addressExtra}
                    onChange={(event) => setAddressExtra(event.target.value)}
                    className="w-full rounded-xl bg-(--surface-3) border border-white/10 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div className="mt-4 grid gap-4 md:grid-cols-[1fr_1.5fr]">
                  <div>
                    <label className="block text-sm text-gray-400 mb-2" htmlFor="profile-postal-code">
                      PLZ
                    </label>
                    <input
                      id="profile-postal-code"
                      type="text"
                      value={postalCode}
                      onChange={(event) => setPostalCode(event.target.value)}
                      className="w-full rounded-xl bg-(--surface-3) border border-white/10 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2" htmlFor="profile-city">
                      Ort
                    </label>
                    <input
                      id="profile-city"
                      type="text"
                      value={city}
                      onChange={(event) => setCity(event.target.value)}
                      className="w-full rounded-xl bg-(--surface-3) border border-white/10 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm text-gray-400 mb-2" htmlFor="profile-password">
                    Neues Passwort
                  </label>
                  <input
                    id="profile-password"
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="w-full rounded-xl bg-(--surface-3) border border-white/10 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2" htmlFor="profile-confirm">
                    Passwort bestätigen
                  </label>
                  <input
                    id="profile-confirm"
                    type="password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    className="w-full rounded-xl bg-(--surface-3) border border-white/10 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={saving || !canSubmit}
                className="btn-primary rounded-full px-6 py-3 text-sm font-semibold text-white transition hover:scale-[1.02] disabled:opacity-60"
                style={{ backgroundColor: theme.primary }}
              >
                {saving ? "Speichern..." : "Änderungen speichern"}
              </button>
            </form>

            <div className="mt-10 border-t border-white/10 pt-8">
              <h3 className="text-lg font-semibold text-white mb-2">
                Account schließen
              </h3>
              <p className="text-sm text-gray-400 mb-4">
                Dein Konto wird dauerhaft entfernt. Dieser Vorgang kann nicht rückgängig gemacht werden.
              </p>
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className="rounded-full px-6 py-3 text-sm font-semibold text-white bg-red-500/80 hover:bg-red-500 transition"
              >
                Account schließen
              </button>
            </div>
          </div>
        )}

        {activeTab === "bookings" && (
          <div className="rounded-3xl border border-white/10 bg-(--surface-2) p-10 shadow-xl">
            <h2 className="text-2xl font-semibold text-white mb-4">
              Buchungen
            </h2>
            <p className="text-gray-400">
              Dieser Bereich ist in Vorbereitung.
            </p>
          </div>
        )}
        {activeTab === "inquiries" && (
          <div className="space-y-8">
            <div className="rounded-3xl border border-white/10 bg-(--surface-2) p-10 shadow-xl">
              <h2 className="text-2xl font-semibold text-white mb-6">
                Anfrage senden
              </h2>

              {(inquiryError || inquiryMessage) && (
                <div
                  className={`mb-6 rounded-xl border px-4 py-3 text-sm ${
                    inquiryError
                      ? "border-red-500/30 bg-red-500/10 text-red-200"
                      : "border-white/10 bg-white/5 text-gray-200"
                  }`}
                >
                  {inquiryError ?? inquiryMessage}
                </div>
              )}

              <form className="space-y-6" onSubmit={handleInquirySubmit}>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">
                      Event-Typ
                    </label>
                    <select
                      name="eventType"
                      value={inquiryForm.eventType}
                      onChange={handleInquiryChange}
                      className="w-full rounded-xl bg-(--surface-3) border border-white/10 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="">Bitte auswählen</option>
                      <option value="Geburtstag">Geburtstag</option>
                      <option value="Hochzeit">Hochzeit</option>
                      <option value="Firmenfeier">Firmenfeier</option>
                      <option value="Andere">Andere</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">
                      Teilnehmerzahl
                    </label>
                    <input
                      type="number"
                      name="participants"
                      value={inquiryForm.participants}
                      onChange={handleInquiryChange}
                      className="w-full rounded-xl bg-(--surface-3) border border-white/10 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">
                    Wunschtermin
                  </label>
                  <input
                    type="date"
                    name="eventDate"
                    value={inquiryForm.eventDate}
                    onChange={handleInquiryChange}
                    className="w-full rounded-xl bg-(--surface-3) border border-white/10 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">
                    Nachricht
                  </label>
                  <textarea
                    name="message"
                    rows={5}
                    value={inquiryForm.message}
                    onChange={handleInquiryChange}
                    className="w-full rounded-xl bg-(--surface-3) border border-white/10 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Deine Anfrage an Rohde Audio"
                  />
                </div>
                <button
                  type="submit"
                  className="btn-primary rounded-full px-6 py-3 text-sm font-semibold text-white transition hover:scale-[1.02]"
                  style={{ backgroundColor: theme.primary }}
                >
                  Anfrage senden
                </button>
              </form>
            </div>

            <div className="rounded-3xl border border-white/10 bg-(--surface-2) p-10 shadow-xl">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-white">
                  Deine Anfragen
                </h3>
                <button
                  type="button"
                  onClick={loadInquiries}
                  className="rounded-full px-4 py-2 text-xs font-semibold text-white border border-white/20 hover:bg-white/10 transition"
                >
                  Aktualisieren
                </button>
              </div>

              {inquiriesLoading ? (
                <div className="text-gray-400">Lade Anfragen...</div>
              ) : inquiries.length ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="border-b border-white/10 text-gray-400">
                      <tr>
                        <th className="px-4 py-3 text-left font-semibold">Erstellt</th>
                        <th className="px-4 py-3 text-left font-semibold">Auftragsnr.</th>
                        <th className="px-4 py-3 text-left font-semibold">Event</th>
                        <th className="px-4 py-3 text-left font-semibold">Teilnehmer</th>
                        <th className="px-4 py-3 text-left font-semibold">Datum</th>
                        <th className="px-4 py-3 text-left font-semibold">Status</th>
                      <th className="px-4 py-3 text-left font-semibold">Nachricht</th>
                      <th className="px-4 py-3 text-left font-semibold">Aktion</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inquiries.map((inquiry) => (
                        <tr
                          key={inquiry.id}
                          className="border-b border-white/5 text-gray-200 last:border-b-0"
                        >
                          <td className="px-4 py-3">
                            {new Date(inquiry.createdAt).toLocaleString("de-DE")}
                          </td>
                          <td className="px-4 py-3">{inquiry.orderNumber ?? "—"}</td>
                          <td className="px-4 py-3">{inquiry.eventType ?? "—"}</td>
                          <td className="px-4 py-3">{inquiry.participants ?? "—"}</td>
                          <td className="px-4 py-3">{inquiry.eventDate ?? "—"}</td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                                inquiry.status === "done"
                                  ? "bg-emerald-500/20 text-emerald-200"
                                  : inquiry.status === "confirmed"
                                  ? "bg-teal-500/20 text-teal-200"
                                  : inquiry.status === "planning"
                                  ? "bg-amber-500/20 text-amber-200"
                                  : inquiry.status === "in_progress"
                                  ? "bg-purple-500/20 text-purple-200"
                                  : inquiry.status === "rejected"
                                  ? "bg-red-500/20 text-red-200"
                                  : "bg-blue-500/20 text-blue-200"
                              }`}
                            >
                              {inquiry.status === "done"
                                ? "Abgeschlossen"
                                : inquiry.status === "confirmed"
                                ? "Bestätigt"
                                : inquiry.status === "planning"
                                ? "In Planung"
                                : inquiry.status === "in_progress"
                                ? "In Bearbeitung"
                                : inquiry.status === "rejected"
                                ? "Abgelehnt"
                                : "Offen"}
                            </span>
                          </td>
                          <td className="px-4 py-3 max-w-65 truncate">
                            {inquiry.message}
                          </td>
                          <td className="px-4 py-3">
                            {inquiry.status === "open" ? (
                              <button
                                type="button"
                                onClick={() => setConfirmInquiryId(inquiry.id)}
                                disabled={deletingInquiryId === inquiry.id}
                                className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/10 text-red-200 transition hover:bg-red-500/10 disabled:opacity-60"
                                title="Anfrage löschen"
                              >
                                <Trash2 size={16} />
                              </button>
                            ) : (
                              <span className="text-gray-500">—</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-gray-400">Noch keine Anfragen vorhanden.</div>
              )}
            </div>
          </div>
        )}
      </div>

      {confirmInquiryId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-6">
          <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-(--surface-2) p-8 shadow-2xl">
            <h3 className="text-xl font-semibold text-white mb-3">
              Anfrage löschen?
            </h3>
            <p className="text-sm text-gray-400 mb-6">
              Deine offene Anfrage wird endgültig entfernt.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfirmInquiryId(null)}
                className="rounded-full px-4 py-2 text-sm font-semibold text-white border border-white/20 hover:bg-white/10 transition"
              >
                Abbrechen
              </button>
              <button
                type="button"
                onClick={() => {
                  const id = confirmInquiryId;
                  setConfirmInquiryId(null);
                  handleDeleteInquiry(id);
                }}
                className="rounded-full px-4 py-2 text-sm font-semibold text-white bg-red-500/80 hover:bg-red-500 transition"
              >
                Löschen
              </button>
            </div>
          </div>
        </div>
      )}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-6">
          <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-(--surface-2) p-8 shadow-2xl">
            <h3 className="text-xl font-semibold text-white mb-3">
              Konto wirklich löschen?
            </h3>
            <p className="text-sm text-gray-400 mb-6">
              Dein Konto und alle gespeicherten Daten werden dauerhaft gelöscht.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                className="rounded-full px-4 py-2 text-sm font-semibold text-white border border-white/20 hover:bg-white/10 transition"
              >
                Abbrechen
              </button>
              <button
                type="button"
                onClick={handleDeleteAccount}
                className="rounded-full px-4 py-2 text-sm font-semibold text-white bg-red-500/80 hover:bg-red-500 transition"
              >
                Konto löschen
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
