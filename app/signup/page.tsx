"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { theme } from "@/app/components/Theme";

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Die Passwörter stimmen nicht überein.");
      return;
    }

    if (!acceptTerms) {
      setError("Bitte akzeptiere die AGB, um fortzufahren.");
      return;
    }

    setLoading(true);

    const response = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });

    setLoading(false);

    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      setError(payload?.error ?? "Registrierung fehlgeschlagen.");
      return;
    }

    router.push("/admin/login");
  };

  return (
    <main className="min-h-screen pt-32 px-6 text-gray-200">
      <div className="max-w-md mx-auto bg-[#1f2024] rounded-3xl p-10 shadow-xl border border-white/10">
        <h1 className="text-3xl font-bold text-white mb-4">
          Konto erstellen
        </h1>
        <p className="text-gray-400 mb-8">
          Erstelle deinen Zugang für künftige Buchungen.
        </p>

        {error && (
          <div className="mb-6 rounded-xl bg-red-500/10 border border-red-500/30 px-4 py-3 text-red-200">
            {error}
          </div>
        )}

        <form className="space-y-5" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm text-gray-400 mb-2" htmlFor="name">
              Name (optional)
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="w-full rounded-xl bg-[#2a2b30] border border-white/10 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
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
              className="w-full rounded-xl bg-[#2a2b30] border border-white/10 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
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
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-xl bg-[#2a2b30] border border-white/10 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
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
              className="w-full rounded-xl bg-[#2a2b30] border border-white/10 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <label className="flex items-start gap-3 text-sm text-gray-300">
            <input
              type="checkbox"
              checked={acceptTerms}
              onChange={(event) => setAcceptTerms(event.target.checked)}
              className="mt-1 h-4 w-4 rounded border-white/20 bg-[#2a2b30] text-purple-500 focus:ring-purple-500"
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
            className="w-full rounded-full px-6 py-3 font-semibold text-white transition hover:scale-[1.02]"
            style={{ backgroundColor: theme.primary }}
          >
            {loading ? "Bitte warten..." : "Registrieren"}
          </button>
        </form>
      </div>
    </main>
  );
}
