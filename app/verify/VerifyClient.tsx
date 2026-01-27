"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { theme } from "@/app/components/Theme";
import { csrfFetch } from "@/app/components/csrfFetch";

type VerifyClientProps = {
  initialCooldown: number;
  email: string;
};

export default function VerifyClient({ initialCooldown, email }: VerifyClientProps) {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(initialCooldown);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = window.setInterval(() => {
      setCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [cooldown]);

  const handleVerify = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setMessage(null);
    if (!code.trim()) {
      setError("Bitte gib den Code ein.");
      return;
    }
    setLoading(true);
    const response = await csrfFetch("/api/auth/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });
    setLoading(false);

    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      setError(payload?.error ?? "Bestätigung fehlgeschlagen.");
      return;
    }

    setMessage("Account bestätigt.");
    router.push("/account");
  };

  const handleResend = async () => {
    if (cooldown > 0) return;
    setResending(true);
    setError(null);
    setMessage(null);
    const response = await csrfFetch("/api/auth/resend-code", { method: "POST" });
    setResending(false);

    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      if (response.status === 429 && typeof payload?.remaining === "number") {
        setCooldown(payload.remaining);
        setError(payload?.error ?? "Bitte warte, bevor du erneut sendest.");
        return;
      }
      setError(payload?.error ?? "Code konnte nicht gesendet werden.");
      return;
    }
    setCooldown(payload?.cooldown ?? 120);
    setMessage("Neuer Code wurde gesendet.");
  };

  return (
    <main className="min-h-screen pt-32 px-6 text-gray-200">
      <div className="max-w-md mx-auto bg-(--surface-2) rounded-3xl p-10 shadow-xl border border-white/10">
        <h1 className="text-3xl font-bold text-white mb-4">
          Account bestätigen
        </h1>
        <p className="text-gray-400 mb-6">
          Wir haben einen 6‑stelligen Code an <span className="text-white">{email}</span> gesendet.
        </p>

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

        <form className="space-y-5" onSubmit={handleVerify}>
          <div>
            <label className="block text-sm text-gray-400 mb-2" htmlFor="code">
              Bestätigungscode
            </label>
            <input
              id="code"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              value={code}
              onChange={(event) => setCode(event.target.value.replace(/\D/g, ""))}
              className="w-full rounded-xl bg-(--surface-3) border border-white/10 px-4 py-3 text-white tracking-[0.3em] text-center text-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full rounded-full px-6 py-3 font-semibold text-white transition hover:scale-[1.02]"
            style={{ backgroundColor: theme.primary }}
          >
            {loading ? "Bitte warten..." : "Bestätigen"}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-400">
          <button
            type="button"
            onClick={handleResend}
            disabled={resending || cooldown > 0}
            className="rounded-full border border-white/30 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white transition hover:-translate-y-0.5 hover:border-purple-300/70 hover:text-purple-200 disabled:opacity-50"
          >
            {resending
              ? "Sende..."
              : cooldown > 0
              ? `Neuen Code in ${cooldown}s`
              : "Code erneut senden"}
          </button>
        </div>
      </div>
    </main>
  );
}
