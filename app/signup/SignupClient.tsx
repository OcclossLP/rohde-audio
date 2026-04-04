"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { theme } from "@/app/components/Theme";
import { csrfFetch } from "@/app/components/csrfFetch";
import { getPortalHref } from "@/lib/subdomains";

type InquiryDraft = {
  eventType: string;
  participants: string;
  eventDate: string;
  message: string;
};

export default function SignupClient() {
  const searchParams = useSearchParams();
  const prefills = useMemo(() => {
    const inquiry = {
      eventType: searchParams?.get("eventType") ?? "",
      participants: searchParams?.get("participants") ?? "",
      eventDate: searchParams?.get("date") ?? "",
      message: searchParams?.get("message") ?? "",
    };

    return {
      firstName: searchParams?.get("firstName") ?? "",
      lastName: searchParams?.get("lastName") ?? "",
      email: searchParams?.get("email") ?? "",
      phone: searchParams?.get("phone") ?? "",
      inquiry: inquiry.message ? inquiry : null,
    };
  }, [searchParams]);
  const [firstName, setFirstName] = useState(() => prefills.firstName);
  const [lastName, setLastName] = useState(() => prefills.lastName);
  const [email, setEmail] = useState(() => prefills.email);
  const [phone, setPhone] = useState(() => prefills.phone);
  const inquiryDraft = prefills.inquiry as InquiryDraft | null;
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [createKeycloakAccount, setCreateKeycloakAccount] = useState(true); // Default: aktiviert
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Die Passwörter stimmen nicht überein.");
      return;
    }

    if (password.length < 8) {
      setError("Das Passwort muss mindestens 8 Zeichen lang sein.");
      return;
    }

    if (!acceptTerms) {
      setError("Bitte akzeptiere die AGB, um fortzufahren.");
      return;
    }

    setLoading(true);
    const activeInquiry = inquiryDraft?.message ? inquiryDraft : null;

    const response = await csrfFetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        firstName,
        lastName,
        email,
        phone,
        password,
        inquiry: activeInquiry,
        createKeycloakAccount,
      }),
    });

    setLoading(false);

    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      setError(payload?.error ?? "Registrierung fehlgeschlagen.");
      return;
    }

    window.location.assign(getPortalHref("account", "/verify"));
  };

  return (
    <main className="min-h-screen pt-32 px-6 text-gray-200">
      <div className="max-w-md mx-auto bg-(--surface-2) rounded-3xl p-10 shadow-xl border border-white/10">
        <h1 className="text-3xl font-bold text-white mb-4">
          Konto erstellen
        </h1>
        <p className="text-gray-400 mb-4">
          Erstelle deinen Zugang für künftige Buchungen.
        </p>
        {inquiryDraft?.message && (
          <div className="mb-6 rounded-xl border border-purple-500/30 bg-purple-500/10 px-4 py-3 text-sm text-purple-100">
            Deine Anfrage wird nach der Registrierung automatisch gesendet.
          </div>
        )}

        {error && (
          <div className="mb-6 rounded-xl bg-red-500/10 border border-red-500/30 px-4 py-3 text-red-200">
            {error}
          </div>
        )}

        <form className="space-y-5" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm text-gray-400 mb-2" htmlFor="first-name">
              Vorname
            </label>
            <input
              id="first-name"
              type="text"
              value={firstName}
              onChange={(event) => setFirstName(event.target.value)}
              required
              className="w-full rounded-xl bg-(--surface-3) border border-white/10 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2" htmlFor="last-name">
              Nachname
            </label>
            <input
              id="last-name"
              type="text"
              value={lastName}
              onChange={(event) => setLastName(event.target.value)}
              required
              className="w-full rounded-xl bg-(--surface-3) border border-white/10 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2" htmlFor="email">
              E-Mail
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-xl bg-(--surface-3) border border-white/10 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2" htmlFor="phone">
              Telefonnummer (optional)
            </label>
            <input
              id="phone"
              type="tel"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              className="w-full rounded-xl bg-(--surface-3) border border-white/10 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2" htmlFor="password">
              Passwort
            </label>
            <input
              id="password"
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-xl bg-(--surface-3) border border-white/10 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2" htmlFor="confirm-password">
              Passwort bestätigen
            </label>
            <input
              id="confirm-password"
              type="password"
              required
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              className="w-full rounded-xl bg-(--surface-3) border border-white/10 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <label className="flex items-start gap-3 text-sm text-gray-300">
            <input
              type="checkbox"
              checked={createKeycloakAccount}
              onChange={(event) => setCreateKeycloakAccount(event.target.checked)}
              className="mt-1 rounded border-white/20 bg-(--surface-3) text-purple-500 focus:ring-purple-500"
            />
            <span>
              SSO-Account bei <strong>Rohde-Keycloak</strong> erstellen
              <br />
              <span className="text-xs text-gray-400">
                Ermöglicht zentrales Login für alle Dienste (optional)
              </span>
            </span>
          </label>

          <label className="flex items-start gap-3 text-sm text-gray-300">
            <input
              type="checkbox"
              checked={acceptTerms}
              onChange={(event) => setAcceptTerms(event.target.checked)}
              className="mt-1 h-4 w-4 rounded border-white/20 bg-(--surface-3) text-purple-500 focus:ring-purple-500"
            />
            <span>
              Ich akzeptiere die{" "}
              <a href="/agb" className="text-purple-400 hover:text-purple-300">
                AGB
              </a>
              .
            </span>
          </label>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full rounded-full px-6 py-3 font-semibold text-white transition hover:scale-[1.02]"
            style={{ backgroundColor: theme.primary }}
          >
            {loading ? "Bitte warten..." : "Registrieren"}
          </button>
        </form>
      </div>
    </main>
  );
}
