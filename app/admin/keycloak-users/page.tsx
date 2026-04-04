"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { theme } from "@/app/components/Theme";
import { csrfFetch } from "@/app/components/csrfFetch";

type LocalUser = {
  id: string;
  email: string;
  name: string | null;
  firstName: string | null;
  lastName: string | null;
  customerNumber: string | null;
  role: "ADMIN" | "CUSTOMER";
  createdAt: string;
  keycloakId?: string;
  keycloakStatus?: "none" | "imported" | "synced" | "error";
  lastKeycloakSync?: string;
};

function getStatusLabel(status?: LocalUser["keycloakStatus"]) {
  if (status === "synced") return "Synchronisiert";
  if (status === "imported") return "Importiert";
  if (status === "error") return "Fehler";
  return "Nicht importiert";
}

function getStatusClassName(status?: LocalUser["keycloakStatus"]) {
  if (status === "synced") {
    return "border border-emerald-400/30 bg-emerald-500/15 text-emerald-200";
  }
  if (status === "imported") {
    return "border border-blue-400/30 bg-blue-500/15 text-blue-200";
  }
  if (status === "error") {
    return "border border-red-400/30 bg-red-500/15 text-red-200";
  }
  return "border border-white/10 bg-white/5 text-gray-300";
}

export default function KeycloakUserManagement() {
  const [users, setUsers] = useState<LocalUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState<string | null>(null);
  const [bulkImporting, setBulkImporting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const syncedCount = useMemo(
    () => users.filter((user) => user.keycloakStatus === "synced").length,
    [users]
  );
  const errorCount = useMemo(
    () => users.filter((user) => user.keycloakStatus === "error").length,
    [users]
  );
  const pendingCount = useMemo(
    () =>
      users.filter(
        (user) => !user.keycloakStatus || user.keycloakStatus === "none"
      ).length,
    [users]
  );

  const loadUsers = async () => {
    try {
      const response = await csrfFetch("/api/admin/keycloak/users");
      if (!response.ok) {
        if (response.status === 401) {
          window.location.assign("/admin/login");
          return;
        }
        setError("Fehler beim Laden der Benutzer.");
        return;
      }
      const data = (await response.json().catch(() => null)) as
        | { users?: LocalUser[] }
        | null;
      setUsers(Array.isArray(data?.users) ? data.users : []);
    } catch {
      setError("Netzwerkfehler beim Laden der Benutzer.");
    } finally {
      setLoading(false);
    }
  };

  const importUser = async (userId: string) => {
    setImporting(userId);
    setMessage(null);
    setError(null);

    try {
      const response = await csrfFetch(`/api/admin/keycloak/sync-user/${userId}`, {
        method: "POST",
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as
          | { error?: string }
          | null;
        setError(data?.error ?? "Fehler beim Import.");
        return;
      }

      setMessage("Benutzer erfolgreich mit Keycloak synchronisiert.");
      await loadUsers();
    } catch {
      setError("Netzwerkfehler beim Import.");
    } finally {
      setImporting(null);
    }
  };

  const bulkImport = async () => {
    setBulkImporting(true);
    setMessage(null);
    setError(null);

    try {
      const response = await csrfFetch("/api/admin/keycloak/import-users", {
        method: "POST",
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as
          | { error?: string }
          | null;
        setError(data?.error ?? "Fehler beim Bulk-Import.");
        return;
      }

      const data = (await response.json().catch(() => null)) as
        | { total?: number; successful?: number; failed?: number }
        | null;
      const successful = data?.successful ?? 0;
      const failed = data?.failed ?? 0;
      setMessage(
        `Bulk-Import abgeschlossen: ${successful} erfolgreich, ${failed} fehlgeschlagen.`
      );
      await loadUsers();
    } catch {
      setError("Netzwerkfehler beim Bulk-Import.");
    } finally {
      setBulkImporting(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  return (
    <main className="min-h-screen bg-(--page-bg) pt-32 px-6 text-gray-200">
      <div className="mx-auto max-w-7xl">
        <section className="rounded-3xl border border-white/10 bg-(--surface-2) p-8 shadow-xl">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white">Keycloak User Management</h1>
              <p className="mt-2 text-sm text-gray-400">
                Verwalte die Synchronisation zwischen lokalen Benutzern und Keycloak SSO.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/admin"
                className="rounded-full border border-white/20 px-5 py-2 text-xs font-semibold uppercase tracking-wide text-white transition hover:-translate-y-0.5 hover:border-purple-300/70 hover:text-purple-200"
              >
                Zurück zum Dashboard
              </Link>
              <button
                type="button"
                onClick={bulkImport}
                disabled={loading || bulkImporting}
                className="btn-primary rounded-full px-5 py-2 text-xs font-semibold uppercase tracking-wide text-white transition hover:scale-[1.02] disabled:opacity-60"
                style={{ backgroundColor: theme.primary }}
              >
                {bulkImporting ? "Import läuft..." : "Alle importieren"}
              </button>
            </div>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-(--surface-3) px-5 py-4">
              <p className="text-xs uppercase tracking-wide text-gray-400">Gesamt</p>
              <p className="mt-1 text-2xl font-bold text-white">{users.length}</p>
            </div>
            <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-5 py-4">
              <p className="text-xs uppercase tracking-wide text-emerald-200">Synchronisiert</p>
              <p className="mt-1 text-2xl font-bold text-white">{syncedCount}</p>
            </div>
            <div className="rounded-2xl border border-amber-400/20 bg-amber-500/10 px-5 py-4">
              <p className="text-xs uppercase tracking-wide text-amber-200">Offen / Fehler</p>
              <p className="mt-1 text-2xl font-bold text-white">{pendingCount + errorCount}</p>
            </div>
          </div>

          {message && (
            <div className="mt-6 rounded-2xl border border-emerald-400/35 bg-emerald-500/15 px-4 py-3 text-sm text-emerald-200">
              {message}
            </div>
          )}

          {error && (
            <div className="mt-6 rounded-2xl border border-red-400/35 bg-red-500/15 px-4 py-3 text-sm text-red-200">
              {error}
            </div>
          )}

          <div className="mt-8 overflow-hidden rounded-2xl border border-white/10">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-white/10">
                <thead className="bg-(--surface-3)">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">
                      Benutzer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">
                      Rolle
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">
                      Kundennummer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">
                      Keycloak Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">
                      Letzte Sync
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-400">
                      Aktion
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10 bg-(--surface-2)">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-10 text-center text-sm text-gray-400">
                        Lade Benutzer...
                      </td>
                    </tr>
                  ) : users.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-10 text-center text-sm text-gray-400">
                        Keine Benutzer gefunden.
                      </td>
                    </tr>
                  ) : (
                    users.map((user) => (
                      <tr key={user.id} className="transition hover:bg-white/5">
                        <td className="px-6 py-4">
                          <div className="text-sm font-semibold text-white">
                            {user.firstName && user.lastName
                              ? `${user.firstName} ${user.lastName}`
                              : user.name || "Unbekannt"}
                          </div>
                          <div className="mt-1 text-xs text-gray-400">{user.email}</div>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${
                              user.role === "ADMIN"
                                ? "border-red-400/30 bg-red-500/15 text-red-200"
                                : "border-blue-400/30 bg-blue-500/15 text-blue-200"
                            }`}
                          >
                            {user.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-white">
                          {user.customerNumber || "-"}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getStatusClassName(user.keycloakStatus)}`}
                          >
                            {getStatusLabel(user.keycloakStatus)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-400">
                          {user.lastKeycloakSync
                            ? new Date(user.lastKeycloakSync).toLocaleString("de-DE")
                            : "-"}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            type="button"
                            onClick={() => importUser(user.id)}
                            disabled={importing === user.id || user.keycloakStatus === "synced"}
                            className="rounded-full border border-white/20 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white transition hover:-translate-y-0.5 hover:border-purple-300/70 hover:text-purple-200 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {importing === user.id
                              ? "Importiere..."
                              : user.keycloakStatus === "synced"
                              ? "Synchronisiert"
                              : "Importieren"}
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
