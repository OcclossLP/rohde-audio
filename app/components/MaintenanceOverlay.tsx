"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function MaintenanceOverlay({
  enabled,
  message,
}: {
  enabled: boolean;
  message?: string;
}) {
  const pathname = usePathname();

  if (!enabled) return null;
  if (pathname?.startsWith("/admin")) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 px-6 py-10 backdrop-blur">
      <div className="w-full max-w-xl rounded-3xl border border-white/10 bg-(--surface-2) p-8 text-center text-white shadow-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-purple-300">
          Wartungsmodus
        </p>
        <h2 className="mt-3 text-3xl font-bold">Wir sind bald zurück</h2>
        <p className="mt-4 text-sm text-gray-300">
          {message || "Diese Seite wird gerade aktualisiert. Bitte schaue später noch einmal vorbei."}
        </p>
        <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="inline-flex items-center justify-center rounded-full border border-white/20 px-5 py-2 text-xs font-semibold uppercase tracking-wide text-white transition hover:-translate-y-0.5 hover:border-purple-300/70 hover:text-purple-200"
          >
            Neu laden
          </button>
          <Link
            href="/admin/login"
            className="inline-flex items-center justify-center rounded-full border border-white/20 bg-white/10 px-5 py-2 text-xs font-semibold uppercase tracking-wide text-white transition hover:-translate-y-0.5 hover:border-purple-300/70 hover:text-purple-200"
          >
            Admin Login
          </Link>
        </div>
      </div>
    </div>
  );
}
