"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { theme } from "@/app/components/Theme";

type PackageCard = {
  id: string;
  title: string;
  description: string;
  price: string;
  highlight: boolean;
  sortOrder: number;
};

type AdminUser = {
  id: string;
  email: string;
  name: string | null;
  role: "ADMIN" | "CUSTOMER";
  createdAt: string;
};

type UserPatch = Partial<AdminUser> & { password?: string };

type AdminDashboardProps = {
  userName: string;
};

export default function AdminDashboard({ userName }: AdminDashboardProps) {
  const router = useRouter();
  const [packages, setPackages] = useState<PackageCard[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [userMessage, setUserMessage] = useState<string | null>(null);
  const [confirmUser, setConfirmUser] = useState<AdminUser | null>(null);
  const [newUser, setNewUser] = useState<{
    email: string;
    name: string;
    role: "ADMIN" | "CUSTOMER";
    password: string;
  }>({
    email: "",
    name: "",
    role: "ADMIN",
    password: "",
  });

  const loadPackages = async () => {
    setLoading(true);
    const response = await fetch("/api/admin/packages", {
      credentials: "include",
    });
    if (response.ok) {
      const data = (await response.json()) as PackageCard[];
      setPackages(data);
    }
    setLoading(false);
  };

  const loadUsers = async () => {
    const response = await fetch("/api/admin/users", {
      credentials: "include",
    });
    if (response.ok) {
      const data = (await response.json()) as AdminUser[];
      setUsers(data);
    }
  };

  useEffect(() => {
    loadPackages();
    loadUsers();
  }, []);

  const updatePackage = (id: string, patch: Partial<PackageCard>) => {
    setPackages((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...patch } : item))
    );
  };

  const handleSave = async (pkg: PackageCard) => {
    setSavingId(pkg.id);
    setMessage(null);
    const response = await fetch(`/api/admin/packages/${pkg.id}`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: pkg.title,
        description: pkg.description,
        price: pkg.price,
        highlight: pkg.highlight,
        sortOrder: pkg.sortOrder,
      }),
    });
    setSavingId(null);
    if (response.ok) {
      setMessage("Änderungen gespeichert.");
      await loadPackages();
    } else {
      const payload = await response.json().catch(() => null);
      setMessage(payload?.error ?? "Speichern fehlgeschlagen.");
    }
  };

  const handleCreate = async () => {
    setMessage(null);
    const response = await fetch("/api/admin/packages", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "Neues Paket",
        description: "Kurzbeschreibung",
        price: "ab 0 €",
        highlight: false,
        sortOrder: packages.length + 1,
      }),
    });
    if (response.ok) {
      await loadPackages();
      setMessage("Neues Paket erstellt.");
    } else {
      const payload = await response.json().catch(() => null);
      setMessage(payload?.error ?? "Anlegen fehlgeschlagen.");
    }
  };

  const handleDelete = async (id: string) => {
    setMessage(null);
    const response = await fetch(`/api/admin/packages/${id}`, {
      method: "DELETE",
      credentials: "include",
    });
    if (response.ok) {
      await loadPackages();
      setMessage("Paket gelöscht.");
    } else {
      const payload = await response.json().catch(() => null);
      setMessage(payload?.error ?? "Löschen fehlgeschlagen.");
    }
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    router.push("/admin/login");
  };

  const handleCreateUser = async () => {
    setUserMessage(null);
    const response = await fetch("/api/admin/users", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newUser),
    });

    if (response.ok) {
      setNewUser({ email: "", name: "", role: "ADMIN", password: "" });
      await loadUsers();
      setUserMessage("Benutzer erstellt.");
    } else {
      const payload = await response.json().catch(() => null);
      setUserMessage(payload?.error ?? "Benutzer konnte nicht erstellt werden.");
    }
  };

  const handleUpdateUser = async (userId: string, patch: UserPatch) => {
    setUserMessage(null);
    const response = await fetch(`/api/admin/users/${userId}`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    if (response.ok) {
      await loadUsers();
      setUserMessage("Benutzer aktualisiert.");
    } else {
      const payload = await response.json().catch(() => null);
      setUserMessage(payload?.error ?? "Update fehlgeschlagen.");
    }
  };

  const handleDeleteUser = async (userId: string) => {
    setUserMessage(null);
    const response = await fetch(`/api/admin/users/${userId}`, {
      method: "DELETE",
      credentials: "include",
    });
    if (response.ok) {
      await loadUsers();
      setUserMessage("Benutzer gelöscht.");
    } else {
      const payload = await response.json().catch(() => null);
      setUserMessage(payload?.error ?? "Löschen fehlgeschlagen.");
    }
  };

  const handleConfirmDelete = async () => {
    if (!confirmUser) return;
    const userId = confirmUser.id;
    setConfirmUser(null);
    await handleDeleteUser(userId);
  };

  return (
    <main className="min-h-screen pt-28 pb-24 px-6 text-gray-200">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-10">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">
              Admin Dashboard
            </h1>
            <p className="text-gray-400">
              Eingeloggt als {userName}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleCreate}
              className="rounded-full px-5 py-2 text-sm font-semibold text-white transition hover:scale-[1.02]"
              style={{ backgroundColor: theme.primary }}
            >
              Paket anlegen
            </button>
            <button
              onClick={handleLogout}
              className="rounded-full px-5 py-2 text-sm font-semibold text-white border border-white/20 hover:bg-white/10 transition"
            >
              Logout
            </button>
          </div>
        </div>

        {message && (
          <div className="mb-6 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-gray-200">
            {message}
          </div>
        )}

        {loading ? (
          <div className="text-gray-400">Lade Pakete...</div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {packages.map((pkg) => (
              <div
                key={pkg.id}
                className="rounded-3xl border border-white/10 bg-[#1f2024] p-6 shadow-lg"
              >
                <div className="flex items-start justify-between gap-4 mb-5">
                  <div>
                    <h2 className="text-xl font-semibold text-white">
                      Paket bearbeiten
                    </h2>
                    <p className="text-sm text-gray-400">
                      ID: {pkg.id.slice(0, 8)}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDelete(pkg.id)}
                    className="text-xs text-red-300 hover:text-red-200 transition"
                  >
                    Löschen
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">
                      Titel
                    </label>
                    <input
                      value={pkg.title}
                      onChange={(event) =>
                        updatePackage(pkg.id, { title: event.target.value })
                      }
                      className="w-full rounded-xl bg-[#2a2b30] border border-white/10 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-400 mb-2">
                      Beschreibung
                    </label>
                    <textarea
                      rows={3}
                      value={pkg.description}
                      onChange={(event) =>
                        updatePackage(pkg.id, { description: event.target.value })
                      }
                      className="w-full rounded-xl bg-[#2a2b30] border border-white/10 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">
                        Preis
                      </label>
                      <input
                        value={pkg.price}
                        onChange={(event) =>
                          updatePackage(pkg.id, { price: event.target.value })
                        }
                        className="w-full rounded-xl bg-[#2a2b30] border border-white/10 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm text-gray-400 mb-2">
                        Sortierung
                      </label>
                      <input
                        type="number"
                        value={pkg.sortOrder}
                        onChange={(event) =>
                          updatePackage(pkg.id, {
                            sortOrder: Number(event.target.value),
                          })
                        }
                        className="w-full rounded-xl bg-[#2a2b30] border border-white/10 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                  </div>

                  <label className="flex items-center gap-3 text-sm text-gray-300">
                    <input
                      type="checkbox"
                      checked={pkg.highlight}
                      onChange={(event) =>
                        updatePackage(pkg.id, { highlight: event.target.checked })
                      }
                      className="h-4 w-4 rounded border-white/20 bg-[#2a2b30] text-purple-500 focus:ring-purple-500"
                    />
                    Highlight-Paket hervorheben
                  </label>
                </div>

                <div className="mt-6 flex items-center justify-between">
                  <span className="text-xs text-gray-500">
                    Sortierung: {pkg.sortOrder}
                  </span>
                  <button
                    onClick={() => handleSave(pkg)}
                    disabled={savingId === pkg.id}
                    className="rounded-full px-5 py-2 text-sm font-semibold text-white transition hover:scale-[1.02]"
                    style={{ backgroundColor: theme.primary }}
                  >
                    {savingId === pkg.id ? "Speichern..." : "Speichern"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-16 border-t border-white/10 pt-12">
          <h2 className="text-3xl font-bold text-white mb-3">
            Benutzerverwaltung
          </h2>
          <p className="text-gray-400 mb-8">
            Admin- und Kunden-Accounts vorbereiten und verwalten.
          </p>

          {userMessage && (
            <div className="mb-6 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-gray-200">
              {userMessage}
            </div>
          )}

          <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
            <div className="rounded-3xl border border-white/10 bg-[#1f2024] p-6 shadow-lg">
              <h3 className="text-xl font-semibold text-white mb-4">
                Benutzer anlegen
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">
                    E-Mail
                  </label>
                  <input
                    value={newUser.email}
                    onChange={(event) =>
                      setNewUser((prev) => ({ ...prev, email: event.target.value }))
                    }
                    className="w-full rounded-xl bg-[#2a2b30] border border-white/10 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">
                    Name (optional)
                  </label>
                  <input
                    value={newUser.name}
                    onChange={(event) =>
                      setNewUser((prev) => ({ ...prev, name: event.target.value }))
                    }
                    className="w-full rounded-xl bg-[#2a2b30] border border-white/10 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">
                      Rolle
                    </label>
                    <select
                      value={newUser.role}
                      onChange={(event) =>
                        setNewUser((prev) => ({
                          ...prev,
                          role: event.target.value as "ADMIN" | "CUSTOMER",
                        }))
                      }
                      className="w-full rounded-xl bg-[#2a2b30] border border-white/10 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="ADMIN">Admin</option>
                      <option value="CUSTOMER">Kunde</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">
                      Passwort
                    </label>
                    <input
                      type="password"
                      value={newUser.password}
                      onChange={(event) =>
                        setNewUser((prev) => ({ ...prev, password: event.target.value }))
                      }
                      className="w-full rounded-xl bg-[#2a2b30] border border-white/10 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>
              </div>
              <button
                onClick={handleCreateUser}
                className="mt-6 rounded-full px-5 py-2 text-sm font-semibold text-white transition hover:scale-[1.02]"
                style={{ backgroundColor: theme.primary }}
              >
                Benutzer speichern
              </button>
            </div>

            <div className="space-y-4">
              {users.map((user) => (
                <div
                  key={user.id}
                  className="rounded-3xl border border-white/10 bg-[#1f2024] p-6 shadow-lg"
                >
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div>
                      <h4 className="text-lg font-semibold text-white">
                        {user.name || "Ohne Namen"}
                      </h4>
                      <p className="text-sm text-gray-400">{user.email}</p>
                    </div>
                    <button
                      onClick={() => setConfirmUser(user)}
                      className="text-xs text-red-300 hover:text-red-200 transition"
                    >
                      Löschen
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">
                        Rolle
                      </label>
                      <select
                        value={user.role}
                        onChange={(event) => {
                          const role = event.target.value as "ADMIN" | "CUSTOMER";
                          setUsers((prev) =>
                            prev.map((entry) =>
                              entry.id === user.id ? { ...entry, role } : entry
                            )
                          );
                          handleUpdateUser(user.id, { role });
                        }}
                        className="w-full rounded-xl bg-[#2a2b30] border border-white/10 px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                      >
                        <option value="ADMIN">Admin</option>
                        <option value="CUSTOMER">Kunde</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">
                        Name
                      </label>
                      <input
                        value={user.name ?? ""}
                        onChange={(event) =>
                          setUsers((prev) =>
                            prev.map((entry) =>
                              entry.id === user.id
                                ? { ...entry, name: event.target.value }
                                : entry
                            )
                          )
                        }
                        onBlur={(event) =>
                          handleUpdateUser(user.id, { name: event.target.value })
                        }
                        className="w-full rounded-xl bg-[#2a2b30] border border-white/10 px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm text-gray-400 mb-2">
                      Neues Passwort
                    </label>
                    <input
                      type="password"
                      placeholder="Optional"
                      onBlur={(event) => {
                        const value = event.target.value.trim();
                        if (value) {
                          handleUpdateUser(user.id, { password: value });
                          event.target.value = "";
                        }
                      }}
                      className="w-full rounded-xl bg-[#2a2b30] border border-white/10 px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>
              ))}
              {!users.length && (
                <div className="text-sm text-gray-400">
                  Keine Benutzer gefunden.
                </div>
              )}
            </div>
          </div>
        </div>
        {confirmUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-6">
            <div className="w-full max-w-md rounded-3xl border border-white/10 bg-[#1f2024] p-8 shadow-2xl">
              <h3 className="text-xl font-semibold text-white mb-3">
                Konto wirklich löschen?
              </h3>
              <p className="text-sm text-gray-400 mb-6">
                Du bist dabei, das Konto von{" "}
                <span className="text-white">{confirmUser.email}</span> zu löschen.
                Dieser Vorgang kann nicht rückgängig gemacht werden.
              </p>
              <div className="flex items-center justify-end gap-3">
                <button
                  onClick={() => setConfirmUser(null)}
                  className="rounded-full px-4 py-2 text-sm font-semibold text-white border border-white/20 hover:bg-white/10 transition"
                >
                  Abbrechen
                </button>
                <button
                  onClick={handleConfirmDelete}
                  className="rounded-full px-4 py-2 text-sm font-semibold text-white bg-red-500/80 hover:bg-red-500 transition"
                >
                  Löschen
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
