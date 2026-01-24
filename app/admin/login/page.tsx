"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { theme } from "@/app/components/Theme";

export default function AdminLoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setLoading(true);

    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier, password }),
    });

    setLoading(false);

    const payload = await response.json().catch(() => null);

    if (!response.ok) {
      setError(payload?.error ?? "Login fehlgeschlagen.");
      return;
    }

    if (payload?.role === "CUSTOMER") {
      if (payload?.verified) {
        router.push("/account");
      } else {
        router.push("/verify");
      }
    } else {
      router.push("/admin");
    }
  };

  return (
    <main className="min-h-screen pt-32 px-6 text-gray-200">
      <div className="max-w-md mx-auto bg-(--surface-2) rounded-3xl p-10 shadow-xl border border-white/10">
        <h1 className="text-3xl font-bold text-white mb-4">
          Login
        </h1>
        <p className="text-gray-400 mb-8">
          Melde dich an, um dein Konto zu verwalten.
        </p>

        {error && (
          <div className="mb-6 rounded-xl bg-red-500/10 border border-red-500/30 px-4 py-3 text-red-200">
            {error}
          </div>
        )}

        <form className="space-y-5" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm text-gray-400 mb-2" htmlFor="identifier">
              E-Mail oder Telefonnummer
            </label>
            <input
              id="identifier"
              type="text"
              required
              value={identifier}
              onChange={(event) => setIdentifier(event.target.value)}
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
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-xl bg-(--surface-3) border border-white/10 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full rounded-full px-6 py-3 font-semibold text-white transition hover:scale-[1.02]"
            style={{ backgroundColor: theme.primary }}
          >
            {loading ? "Bitte warten..." : "Login"}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-400">
          Noch kein Konto?{" "}
          <a
            href="/signup"
            className="ml-4 inline-flex items-center justify-center rounded-full border border-white/30 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white transition hover:-translate-y-0.5 hover:border-purple-300/70 hover:text-purple-200"
          >
            Jetzt registrieren
          </a>
        </div>
      </div>
    </main>
  );
}
