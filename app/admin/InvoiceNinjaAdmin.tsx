"use client";

import { useEffect, useMemo, useState } from "react";
import { theme } from "@/app/components/Theme";
import { csrfFetch } from "@/app/components/csrfFetch";

interface InvoiceNinjaSettings {
  configured: boolean;
  connection: boolean;
  message?: string;
  settings?: {
    api_url: string;
    has_token: boolean;
    company_key?: string;
    created_at: string;
    updated_at: string;
  };
}

type AdminUser = {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  name: string | null;
};

type AdminPackage = {
  id: string;
  title: string;
  price: string;
};

type Notice = {
  type: "success" | "error" | "info";
  text: string;
} | null;

function NoticeBox({ notice }: { notice: Notice }) {
  if (!notice) return null;

  if (notice.type === "success") {
    return (
      <div className="rounded-2xl border border-emerald-400/35 bg-emerald-500/15 px-4 py-3 text-sm text-emerald-200">
        {notice.text}
      </div>
    );
  }

  if (notice.type === "error") {
    return (
      <div className="rounded-2xl border border-red-400/35 bg-red-500/15 px-4 py-3 text-sm text-red-200">
        {notice.text}
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-blue-400/35 bg-blue-500/15 px-4 py-3 text-sm text-blue-200">
      {notice.text}
    </div>
  );
}

export default function InvoiceNinjaAdmin() {
  const [settings, setSettings] = useState<InvoiceNinjaSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [syncingClients, setSyncingClients] = useState(false);
  const [creatingInvoice, setCreatingInvoice] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedPackageId, setSelectedPackageId] = useState("");
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [packages, setPackages] = useState<AdminPackage[]>([]);
  const [notice, setNotice] = useState<Notice>(null);

  const [apiUrl, setApiUrl] = useState("");
  const [apiToken, setApiToken] = useState("");
  const [companyKey, setCompanyKey] = useState("");

  const selectedPackage = useMemo(
    () => packages.find((pkg) => pkg.id === selectedPackageId) ?? null,
    [packages, selectedPackageId]
  );

  const loadSettings = async () => {
    const response = await csrfFetch("/api/admin/invoice-ninja");
    if (!response.ok) {
      throw new Error("Einstellungen konnten nicht geladen werden.");
    }

    const data = (await response.json()) as InvoiceNinjaSettings;
    setSettings(data);

    if (data.settings) {
      setApiUrl(data.settings.api_url || "");
      setCompanyKey(data.settings.company_key || "");
    }
  };

  const loadUsers = async () => {
    const response = await csrfFetch("/api/admin/users");
    if (!response.ok) {
      throw new Error("Benutzer konnten nicht geladen werden.");
    }

    const data = (await response.json().catch(() => [])) as Array<{
      id: string;
      email: string;
      firstName?: string | null;
      lastName?: string | null;
      name?: string | null;
    }>;

    setUsers(
      data.map((user) => ({
        id: user.id,
        email: user.email,
        firstName: user.firstName ?? null,
        lastName: user.lastName ?? null,
        name: user.name ?? null,
      }))
    );
  };

  const loadPackages = async () => {
    const response = await csrfFetch("/api/admin/packages");
    if (!response.ok) {
      throw new Error("Pakete konnten nicht geladen werden.");
    }

    const data = (await response.json().catch(() => [])) as Array<{
      id: string;
      title: string;
      price: string;
    }>;

    setPackages(
      data.map((pkg) => ({
        id: pkg.id,
        title: pkg.title,
        price: pkg.price,
      }))
    );
  };

  const loadAll = async () => {
    setLoading(true);
    setNotice(null);
    try {
      await Promise.all([loadSettings(), loadUsers(), loadPackages()]);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Daten konnten nicht geladen werden.";
      setNotice({ type: "error", text: message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const saveSettings = async () => {
    setSaving(true);
    setNotice(null);
    try {
      const response = await csrfFetch("/api/admin/invoice-ninja", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiUrl, apiToken, companyKey }),
      });

      const data = (await response.json().catch(() => null)) as
        | (InvoiceNinjaSettings & { error?: string; message?: string })
        | null;

      if (!response.ok) {
        setNotice({
          type: "error",
          text: data?.error ?? "Einstellungen konnten nicht gespeichert werden.",
        });
        return;
      }

      setSettings({
        configured: Boolean(data?.configured),
        connection: Boolean(data?.connection),
        message: data?.message,
        settings: data?.settings ?? settings?.settings,
      });
      setApiToken("");
      setNotice({
        type: "success",
        text: data?.message ?? "Einstellungen erfolgreich gespeichert.",
      });
      await loadSettings();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Speichern fehlgeschlagen.";
      setNotice({ type: "error", text: message });
    } finally {
      setSaving(false);
    }
  };

  const syncClients = async () => {
    setSyncingClients(true);
    setNotice(null);
    try {
      const response = await csrfFetch("/api/admin/invoice-ninja/sync-clients", {
        method: "POST",
      });

      const data = (await response.json().catch(() => null)) as
        | { syncedClients?: number; errors?: string[]; error?: string; message?: string }
        | null;

      if (!response.ok) {
        setNotice({
          type: "error",
          text: data?.error ?? "Kunden-Synchronisation fehlgeschlagen.",
        });
        return;
      }

      const syncedClients = data?.syncedClients ?? 0;
      const errorCount = Array.isArray(data?.errors) ? data.errors.length : 0;
      setNotice({
        type: errorCount > 0 ? "info" : "success",
        text:
          errorCount > 0
            ? `Sync abgeschlossen: ${syncedClients} Kunden synchronisiert, ${errorCount} Fehler.`
            : `Sync abgeschlossen: ${syncedClients} Kunden synchronisiert.`,
      });
      await loadSettings();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Kunden-Synchronisation fehlgeschlagen.";
      setNotice({ type: "error", text: message });
    } finally {
      setSyncingClients(false);
    }
  };

  const createInvoice = async () => {
    if (!selectedUserId || !selectedPackageId) {
      setNotice({
        type: "error",
        text: "Bitte Benutzer und Paket auswählen.",
      });
      return;
    }

    setCreatingInvoice(true);
    setNotice(null);
    try {
      const response = await csrfFetch("/api/admin/invoice-ninja/create-invoice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: selectedUserId,
          packageId: selectedPackageId,
        }),
      });

      const data = (await response.json().catch(() => null)) as
        | { invoice?: { number?: string }; error?: string }
        | null;

      if (!response.ok) {
        setNotice({
          type: "error",
          text: data?.error ?? "Rechnung konnte nicht erstellt werden.",
        });
        return;
      }

      setNotice({
        type: "success",
        text: `Rechnung erstellt${data?.invoice?.number ? `: ${data.invoice.number}` : "."}`,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Rechnungserstellung fehlgeschlagen.";
      setNotice({ type: "error", text: message });
    } finally {
      setCreatingInvoice(false);
    }
  };

  const configured = Boolean(settings?.configured);
  const connected = Boolean(settings?.connection);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Invoice Ninja</h2>
        <p className="text-sm text-gray-400">
          Verwalte API-Anbindung, Kundensync und Rechnungserstellung direkt im Admin-Bereich.
        </p>
      </div>

      <NoticeBox notice={notice} />

      {loading ? (
        <div className="rounded-3xl border border-white/10 bg-(--surface-2) p-10 text-center text-sm text-gray-400">
          Lade Invoice-Ninja-Daten...
        </div>
      ) : (
        <>
          <section className="rounded-3xl border border-white/10 bg-(--surface-2) p-8 shadow-xl">
            <div className="mb-6 flex flex-wrap items-center gap-3">
              <span
                className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                  configured
                    ? "border border-emerald-400/30 bg-emerald-500/15 text-emerald-200"
                    : "border border-red-400/30 bg-red-500/15 text-red-200"
                }`}
              >
                {configured ? "Konfiguriert" : "Nicht konfiguriert"}
              </span>
              <span
                className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                  connected
                    ? "border border-emerald-400/30 bg-emerald-500/15 text-emerald-200"
                    : "border border-amber-400/30 bg-amber-500/15 text-amber-200"
                }`}
              >
                {connected ? "Verbindung aktiv" : "Keine Verbindung"}
              </span>
            </div>

            <h3 className="text-lg font-semibold text-white mb-5">API-Einstellungen</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-400">
                  API URL
                </label>
                <input
                  type="url"
                  value={apiUrl}
                  onChange={(event) => setApiUrl(event.target.value)}
                  className="w-full rounded-xl bg-(--surface-3) border border-white/10 px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="https://invoice.rohde-audio.com"
                />
              </div>
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-400">
                  API Token
                </label>
                <input
                  type="password"
                  value={apiToken}
                  onChange={(event) => setApiToken(event.target.value)}
                  className="w-full rounded-xl bg-(--surface-3) border border-white/10 px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder={settings?.settings?.has_token ? "Neuen Token setzen (optional)" : "Token eingeben"}
                />
              </div>
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-400">
                  Company Key (optional)
                </label>
                <input
                  type="text"
                  value={companyKey}
                  onChange={(event) => setCompanyKey(event.target.value)}
                  className="w-full rounded-xl bg-(--surface-3) border border-white/10 px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="company-key"
                />
              </div>
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={saveSettings}
                disabled={saving || !apiUrl || (!settings?.settings?.has_token && !apiToken)}
                className="btn-primary rounded-full px-5 py-2 text-xs font-semibold uppercase tracking-wide text-white transition hover:scale-[1.02] disabled:opacity-60"
                style={{ backgroundColor: theme.primary }}
              >
                {saving ? "Speichern..." : "Einstellungen speichern"}
              </button>
              {settings?.settings?.updated_at && (
                <span className="text-xs text-gray-400">
                  Zuletzt aktualisiert: {new Date(settings.settings.updated_at).toLocaleString("de-DE")}
                </span>
              )}
            </div>
          </section>

          <section className="rounded-3xl border border-white/10 bg-(--surface-2) p-8 shadow-xl">
            <h3 className="text-lg font-semibold text-white mb-2">Kunden synchronisieren</h3>
            <p className="text-sm text-gray-400 mb-5">
              Erstellt oder aktualisiert Kunden aus der lokalen Datenbank in Invoice Ninja.
            </p>
            <button
              type="button"
              onClick={syncClients}
              disabled={syncingClients || !configured}
              className="rounded-full border border-white/20 px-5 py-2 text-xs font-semibold uppercase tracking-wide text-white transition hover:-translate-y-0.5 hover:border-purple-300/70 hover:text-purple-200 disabled:opacity-60"
            >
              {syncingClients ? "Synchronisiere..." : "Kunden-Sync starten"}
            </button>
          </section>

          <section className="rounded-3xl border border-white/10 bg-(--surface-2) p-8 shadow-xl">
            <h3 className="text-lg font-semibold text-white mb-2">Rechnung erstellen</h3>
            <p className="text-sm text-gray-400 mb-5">
              Wähle Benutzer und Paket aus, um eine Rechnung als Entwurf zu erzeugen.
            </p>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-400">
                  Benutzer
                </label>
                <select
                  value={selectedUserId}
                  onChange={(event) => setSelectedUserId(event.target.value)}
                  className="w-full rounded-xl bg-(--surface-3) border border-white/10 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">Benutzer auswählen...</option>
                  {users.map((user) => {
                    const fullName = `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim();
                    const name = fullName || user.name || "Unbekannt";
                    return (
                      <option key={user.id} value={user.id}>
                        {name} ({user.email})
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-400">
                  Paket
                </label>
                <select
                  value={selectedPackageId}
                  onChange={(event) => setSelectedPackageId(event.target.value)}
                  className="w-full rounded-xl bg-(--surface-3) border border-white/10 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">Paket auswählen...</option>
                  {packages.map((pkg) => (
                    <option key={pkg.id} value={pkg.id}>
                      {pkg.title} - {pkg.price}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {selectedPackage && (
              <p className="mt-4 text-xs text-gray-400">
                Ausgewähltes Paket: <span className="text-white">{selectedPackage.title}</span> ({selectedPackage.price})
              </p>
            )}

            <div className="mt-6">
              <button
                type="button"
                onClick={createInvoice}
                disabled={creatingInvoice || !selectedUserId || !selectedPackageId || !configured}
                className="rounded-full border border-white/20 px-5 py-2 text-xs font-semibold uppercase tracking-wide text-white transition hover:-translate-y-0.5 hover:border-purple-300/70 hover:text-purple-200 disabled:opacity-60"
              >
                {creatingInvoice ? "Erstelle Rechnung..." : "Rechnung erstellen"}
              </button>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
