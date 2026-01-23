"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { theme } from "@/app/components/Theme";

type PackageCard = {
  id: string;
  title: string;
  description: string;
  price: string;
  salePrice: string | null;
  highlight: boolean;
  sortOrder: number;
};

type AdminUser = {
  id: string;
  email: string;
  phone: string | null;
  name: string | null;
  firstName: string | null;
  lastName: string | null;
  notes: string | null;
  street: string | null;
  houseNumber: string | null;
  addressExtra: string | null;
  postalCode: string | null;
  city: string | null;
  role: "ADMIN" | "CUSTOMER";
  createdAt: string;
};

type UserPatch = Partial<AdminUser> & { password?: string };

type AdminDashboardProps = {
  userName: string;
};

type AnalyticsBucket = {
  label: string;
  count: number;
};

type AnalyticsRange = {
  buckets: AnalyticsBucket[];
  total: number;
};

type AnalyticsData = {
  last24Hours: AnalyticsRange;
  last7Days: AnalyticsRange;
  last30Days: AnalyticsRange;
  last365Days: AnalyticsRange;
};

type Inquiry = {
  id: string;
  eventType: string | null;
  participants: string | null;
  eventDate: string | null;
  message: string;
  status: string;
  createdAt: string;
  userId: string;
  email: string;
  phone: string | null;
  firstName: string | null;
  lastName: string | null;
};

export default function AdminDashboard({ userName }: AdminDashboardProps) {
  const router = useRouter();
  const [packages, setPackages] = useState<PackageCard[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [inquiriesLoading, setInquiriesLoading] = useState(false);
  const [activeInquiry, setActiveInquiry] = useState<Inquiry | null>(null);
  const [activeInquiryStatus, setActiveInquiryStatus] = useState("open");
  const [inquiryFilter, setInquiryFilter] = useState<
    "all" | "open" | "in_progress" | "planning" | "confirmed" | "done" | "rejected"
  >("all");
  const [deleteInquiryId, setDeleteInquiryId] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [userMessage, setUserMessage] = useState<string | null>(null);
  const [confirmUser, setConfirmUser] = useState<AdminUser | null>(null);
  const [activeTab, setActiveTab] = useState<
    "views" | "packages" | "users" | "usersList" | "inquiries" | "settings"
  >("views");
  const [newUser, setNewUser] = useState<{
    email: string;
    phone: string;
    firstName: string;
    lastName: string;
    notes: string;
    role: "ADMIN" | "CUSTOMER";
    password: string;
  }>({
    email: "",
    phone: "",
    firstName: "",
    lastName: "",
    notes: "",
    role: "ADMIN",
    password: "",
  });
  const [editUserId, setEditUserId] = useState("");
  const [editUser, setEditUser] = useState<{
    firstName: string;
    lastName: string;
    role: "ADMIN" | "CUSTOMER";
    phone: string;
    notes: string;
    street: string;
    houseNumber: string;
    addressExtra: string;
    postalCode: string;
    city: string;
    password: string;
  }>({
    firstName: "",
    lastName: "",
    role: "ADMIN",
    phone: "",
    notes: "",
    street: "",
    houseNumber: "",
    addressExtra: "",
    postalCode: "",
    city: "",
    password: "",
  });
  const [deleteUserId, setDeleteUserId] = useState("");
  const [userSearch, setUserSearch] = useState("");
  const [noteEditorUser, setNoteEditorUser] = useState<AdminUser | null>(null);
  const [noteDraft, setNoteDraft] = useState("");
  const [addressViewerUser, setAddressViewerUser] = useState<AdminUser | null>(null);

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

  const loadAnalytics = async () => {
    const response = await fetch("/api/admin/analytics", {
      credentials: "include",
    });
    if (response.ok) {
      const data = (await response.json()) as AnalyticsData;
      setAnalytics(data);
    }
  };

  const loadInquiries = async () => {
    setInquiriesLoading(true);
    const response = await fetch("/api/admin/inquiries", {
      credentials: "include",
    });
    if (response.ok) {
      const data = (await response.json()) as Inquiry[];
      setInquiries(data);
    }
    setInquiriesLoading(false);
  };

  const openInquiry = (inquiry: Inquiry) => {
    setActiveInquiry(inquiry);
    setActiveInquiryStatus(inquiry.status);
  };

  const saveInquiryStatus = async () => {
    if (!activeInquiry) return;
    const response = await fetch(`/api/admin/inquiries/${activeInquiry.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ status: activeInquiryStatus }),
    });
    if (!response.ok) {
      return;
    }
    setInquiries((prev) =>
      prev.map((item) =>
        item.id === activeInquiry.id
          ? { ...item, status: activeInquiryStatus }
          : item
      )
    );
    setActiveInquiry((prev) =>
      prev ? { ...prev, status: activeInquiryStatus } : prev
    );
  };

  const handleDeleteInquiry = async (id: string) => {
    const response = await fetch(`/api/admin/inquiries/${id}`, {
      method: "DELETE",
      credentials: "include",
    });
    if (!response.ok) {
      return;
    }
    setInquiries((prev) => prev.filter((entry) => entry.id !== id));
    setActiveInquiry(null);
  };

  const filteredInquiries =
    inquiryFilter === "all"
      ? inquiries
      : inquiries.filter((inquiry) => inquiry.status === inquiryFilter);

  useEffect(() => {
    loadPackages();
    loadUsers();
    loadAnalytics();
    loadInquiries();
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
        salePrice: pkg.salePrice ?? "",
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
        salePrice: "",
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
    if (!newUser.firstName.trim() || !newUser.lastName.trim()) {
      setUserMessage("Vorname und Nachname sind erforderlich.");
      return;
    }
    const response = await fetch("/api/admin/users", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newUser),
    });

    if (response.ok) {
      setNewUser({
        email: "",
        phone: "",
        firstName: "",
        lastName: "",
        notes: "",
        role: "ADMIN",
        password: "",
      });
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

  const selectUserForEdit = (userId: string) => {
    setEditUserId(userId);
    const user = users.find((entry) => entry.id === userId);
    if (!user) {
      setEditUser({
        firstName: "",
        lastName: "",
        role: "ADMIN",
        phone: "",
        notes: "",
        street: "",
        houseNumber: "",
        addressExtra: "",
        postalCode: "",
        city: "",
        password: "",
      });
      return;
    }
    const nameParts = getNameParts(user);
    setEditUser({
      firstName: nameParts.firstName,
      lastName: nameParts.lastName,
      role: user.role,
      phone: user.phone ?? "",
      notes: user.notes ?? "",
      street: user.street ?? "",
      houseNumber: user.houseNumber ?? "",
      addressExtra: user.addressExtra ?? "",
      postalCode: user.postalCode ?? "",
      city: user.city ?? "",
      password: "",
    });
  };

  const selectUserForDelete = (userId: string) => {
    setDeleteUserId(userId);
  };

  const formatUserDate = (value: string) => {
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return value;
    return parsed.toLocaleString("de-DE", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getNameParts = (user: AdminUser) => {
    if (user.firstName || user.lastName) {
      return {
        firstName: user.firstName ?? "",
        lastName: user.lastName ?? "",
      };
    }
    const fallback = (user.name ?? "").trim();
    if (!fallback) {
      return { firstName: "", lastName: "" };
    }
    const parts = fallback.split(" ");
    return {
      firstName: parts[0] ?? "",
      lastName: parts.slice(1).join(" "),
    };
  };

  const openNoteEditor = (user: AdminUser) => {
    setNoteEditorUser(user);
    setNoteDraft(user.notes ?? "");
  };

  const searchTerm = userSearch.trim().toLowerCase();
  const filteredUsers = searchTerm
    ? users.filter((user) => {
      const values = [
        user.email,
        user.phone ?? "",
        user.name ?? "",
        user.firstName ?? "",
        user.lastName ?? "",
        user.notes ?? "",
        user.street ?? "",
        user.houseNumber ?? "",
        user.addressExtra ?? "",
        user.postalCode ?? "",
        user.city ?? "",
        user.role,
        user.createdAt,
      ]
        .join(" ")
        .toLowerCase();
      return values.includes(searchTerm);
    })
    : users;

  const renderChart = (range: AnalyticsRange) => {
    const max = Math.max(1, ...range.buckets.map((bucket) => bucket.count));
    return (
      <div className="mt-4">
        <div className="flex h-28 items-end gap-1">
          {range.buckets.map((bucket, index) => (
            <div
              key={`${bucket.label}-${index}`}
              title={`${bucket.label}: ${bucket.count}`}
              className="flex-1 rounded-sm bg-purple-500/70"
              style={{ height: `${Math.round((bucket.count / max) * 100)}%` }}
            />
          ))}
        </div>
        <div className="mt-2 flex justify-between text-xs text-gray-500">
          <span>{range.buckets[0]?.label}</span>
          <span>{range.buckets[range.buckets.length - 1]?.label}</span>
        </div>
      </div>
    );
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
            {activeTab === "packages" && (
              <button
                onClick={handleCreate}
                className="btn-primary rounded-full px-5 py-2 text-sm font-semibold text-white transition hover:scale-[1.02]"
                style={{ backgroundColor: theme.primary }}
              >
                Paket anlegen
              </button>
            )}
            <button
              onClick={handleLogout}
              className="rounded-full px-5 py-2 text-sm font-semibold text-white border border-white/20 hover:bg-white/10 transition"
            >
              Logout
            </button>
          </div>
        </div>

        <div className="mb-10 flex flex-wrap gap-3 text-sm">
          {[
            { id: "views", label: "Views" },
            { id: "packages", label: "Pakete" },
            { id: "users", label: "Benutzerverwaltung" },
            { id: "usersList", label: "Benutzerliste" },
            { id: "inquiries", label: "Anfragen" },
            { id: "settings", label: "Settings" },
          ].map(({ id, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => {
                const nextTab = id as typeof activeTab;
                setActiveTab(nextTab);
                if (nextTab === "inquiries") {
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

        {message && (
          <div className="mb-6 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-gray-200">
            {message}
          </div>
        )}

        {activeTab === "packages" && (
          <>
            {loading ? (
              <div className="text-gray-400">Lade Pakete...</div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2">
                {packages.map((pkg) => (
                  <div
                    key={pkg.id}
                    className="rounded-3xl border border-white/10 bg-(--surface-2) p-6 shadow-lg"
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
                          className="w-full rounded-xl bg-(--surface-3) border border-white/10 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
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
                          className="w-full rounded-xl bg-(--surface-3) border border-white/10 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
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
                            className="w-full rounded-xl bg-(--surface-3) border border-white/10 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
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
                            className="w-full rounded-xl bg-(--surface-3) border border-white/10 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm text-gray-400 mb-2">
                          Angebotspreis (optional)
                        </label>
                        <input
                          value={pkg.salePrice ?? ""}
                          onChange={(event) =>
                            updatePackage(pkg.id, { salePrice: event.target.value })
                          }
                          className="w-full rounded-xl bg-(--surface-3) border border-white/10 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                          placeholder="z.B. ab 69 €"
                        />
                      </div>

                      <label className="flex items-center gap-3 text-sm text-gray-300">
                        <input
                          type="checkbox"
                          checked={pkg.highlight}
                          onChange={(event) =>
                            updatePackage(pkg.id, { highlight: event.target.checked })
                          }
                          className="h-4 w-4 rounded border-white/20 bg-(--surface-3) text-purple-500 focus:ring-purple-500"
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
                        className="btn-primary rounded-full px-5 py-2 text-sm font-semibold text-white transition hover:scale-[1.02]"
                        style={{ backgroundColor: theme.primary }}
                      >
                        {savingId === pkg.id ? "Speichern..." : "Speichern"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {activeTab === "views" && (
          <div className="mt-16 border-t border-white/10 pt-12">
            <h2 className="text-3xl font-bold text-white mb-3">
              Seitenaufrufe
            </h2>
            <p className="text-gray-400 mb-8">
              Aufrufe deiner Webseite in verschiedenen Zeiträumen.
            </p>

            {!analytics ? (
              <div className="text-gray-400">Lade Statistik...</div>
            ) : (
              <div className="grid gap-6 lg:grid-cols-2">
                {[
                  { title: "Letzte 24 Stunden", range: analytics.last24Hours },
                  { title: "Letzte 7 Tage", range: analytics.last7Days },
                  { title: "Letzte 30 Tage", range: analytics.last30Days },
                  { title: "Letzte 365 Tage", range: analytics.last365Days },
                ].map(({ title, range }) => (
                  <div
                    key={title}
                    className="rounded-3xl border border-white/10 bg-(--surface-2) p-6 shadow-lg"
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-white">
                        {title}
                      </h3>
                      <span className="text-sm text-gray-400">
                        {range.total} Aufrufe
                      </span>
                    </div>
                    {renderChart(range)}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "users" && (
          <div className="mt-16 border-t border-white/10 pt-12">
            <h2 className="text-3xl font-bold text-white mb-3">
              Benutzerverwaltung
            </h2>
            <p className="text-gray-400 mb-8">
              Benutzer anlegen, ändern oder löschen.
            </p>

            {userMessage && (
              <div className="mb-6 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-gray-200">
                {userMessage}
              </div>
            )}

            <div className="grid gap-6 lg:grid-cols-2">
              <div className="rounded-3xl border border-white/10 bg-(--surface-2) p-6 shadow-lg">
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
                      className="w-full rounded-xl bg-(--surface-3) border border-white/10 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">
                      Telefonnummer (optional)
                    </label>
                    <input
                      value={newUser.phone}
                      onChange={(event) =>
                        setNewUser((prev) => ({ ...prev, phone: event.target.value }))
                      }
                      className="w-full rounded-xl bg-(--surface-3) border border-white/10 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">
                      Vorname
                    </label>
                    <input
                      value={newUser.firstName}
                      onChange={(event) =>
                        setNewUser((prev) => ({ ...prev, firstName: event.target.value }))
                      }
                      required
                      className="w-full rounded-xl bg-(--surface-3) border border-white/10 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">
                      Nachname
                    </label>
                    <input
                      value={newUser.lastName}
                      onChange={(event) =>
                        setNewUser((prev) => ({ ...prev, lastName: event.target.value }))
                      }
                      required
                      className="w-full rounded-xl bg-(--surface-3) border border-white/10 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">
                      Notizen (intern)
                    </label>
                    <textarea
                      rows={3}
                      value={newUser.notes}
                      onChange={(event) =>
                        setNewUser((prev) => ({ ...prev, notes: event.target.value }))
                      }
                      className="w-full rounded-xl bg-(--surface-3) border border-white/10 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
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
                        className="w-full rounded-xl bg-(--surface-3) border border-white/10 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
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
                        className="w-full rounded-xl bg-(--surface-3) border border-white/10 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                  </div>
                </div>
                <button
                  onClick={handleCreateUser}
                  className="btn-primary mt-6 rounded-full px-5 py-2 text-sm font-semibold text-white transition hover:scale-[1.02]"
                  style={{ backgroundColor: theme.primary }}
                >
                  Benutzer speichern
                </button>
              </div>

              <div className="rounded-3xl border border-white/10 bg-(--surface-2) p-6 shadow-lg">
                <h3 className="text-xl font-semibold text-white mb-4">
                  Benutzer ändern
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">
                      Benutzer auswählen
                    </label>
                    <select
                      value={editUserId}
                      onChange={(event) => selectUserForEdit(event.target.value)}
                      className="w-full rounded-xl bg-(--surface-3) border border-white/10 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="">Bitte auswählen</option>
                      {users.map((user) => (
                        <option key={user.id} value={user.id}>
                          {user.email}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">
                      Telefonnummer
                    </label>
                    <input
                      value={editUser.phone}
                      onChange={(event) =>
                        setEditUser((prev) => ({ ...prev, phone: event.target.value }))
                      }
                      className="w-full rounded-xl bg-(--surface-3) border border-white/10 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                      disabled={!editUserId}
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">
                      Vorname
                    </label>
                    <input
                      value={editUser.firstName}
                      onChange={(event) =>
                        setEditUser((prev) => ({ ...prev, firstName: event.target.value }))
                      }
                      className="w-full rounded-xl bg-(--surface-3) border border-white/10 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                      disabled={!editUserId}
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">
                      Nachname
                    </label>
                    <input
                      value={editUser.lastName}
                      onChange={(event) =>
                        setEditUser((prev) => ({ ...prev, lastName: event.target.value }))
                      }
                      className="w-full rounded-xl bg-(--surface-3) border border-white/10 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                      disabled={!editUserId}
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">
                      Notizen (intern)
                    </label>
                    <textarea
                      rows={3}
                      value={editUser.notes}
                      onChange={(event) =>
                        setEditUser((prev) => ({ ...prev, notes: event.target.value }))
                      }
                      className="w-full rounded-xl bg-(--surface-3) border border-white/10 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                      disabled={!editUserId}
                    />
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-(--surface-3)/40 p-4">
                    <h4 className="text-sm font-semibold text-white mb-3">
                      Adresse
                    </h4>
                    <div className="grid gap-4 md:grid-cols-[1.5fr_1fr]">
                      <div>
                        <label className="block text-sm text-gray-400 mb-2">
                          Straße
                        </label>
                        <input
                          value={editUser.street}
                          onChange={(event) =>
                            setEditUser((prev) => ({ ...prev, street: event.target.value }))
                          }
                          className="w-full rounded-xl bg-(--surface-3) border border-white/10 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                          disabled={!editUserId}
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-400 mb-2">
                          Hausnummer
                        </label>
                        <input
                          value={editUser.houseNumber}
                          onChange={(event) =>
                            setEditUser((prev) => ({ ...prev, houseNumber: event.target.value }))
                          }
                          className="w-full rounded-xl bg-(--surface-3) border border-white/10 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                          disabled={!editUserId}
                        />
                      </div>
                    </div>
                    <div className="mt-4">
                      <label className="block text-sm text-gray-400 mb-2">
                        Zusatz (optional)
                      </label>
                      <input
                        value={editUser.addressExtra}
                        onChange={(event) =>
                          setEditUser((prev) => ({ ...prev, addressExtra: event.target.value }))
                        }
                        className="w-full rounded-xl bg-(--surface-3) border border-white/10 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                        disabled={!editUserId}
                      />
                    </div>
                    <div className="mt-4 grid gap-4 md:grid-cols-[1fr_1.5fr]">
                      <div>
                        <label className="block text-sm text-gray-400 mb-2">
                          PLZ
                        </label>
                        <input
                          value={editUser.postalCode}
                          onChange={(event) =>
                            setEditUser((prev) => ({ ...prev, postalCode: event.target.value }))
                          }
                          className="w-full rounded-xl bg-(--surface-3) border border-white/10 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                          disabled={!editUserId}
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-400 mb-2">
                          Ort
                        </label>
                        <input
                          value={editUser.city}
                          onChange={(event) =>
                            setEditUser((prev) => ({ ...prev, city: event.target.value }))
                          }
                          className="w-full rounded-xl bg-(--surface-3) border border-white/10 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                          disabled={!editUserId}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">
                        Rolle
                      </label>
                      <select
                        value={editUser.role}
                        onChange={(event) =>
                          setEditUser((prev) => ({
                            ...prev,
                            role: event.target.value as "ADMIN" | "CUSTOMER",
                          }))
                        }
                        className="w-full rounded-xl bg-(--surface-3) border border-white/10 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                        disabled={!editUserId}
                      >
                        <option value="ADMIN">Admin</option>
                        <option value="CUSTOMER">Kunde</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">
                        Neues Passwort
                      </label>
                      <input
                        type="password"
                        value={editUser.password}
                        onChange={(event) =>
                          setEditUser((prev) => ({ ...prev, password: event.target.value }))
                        }
                        className="w-full rounded-xl bg-(--surface-3) border border-white/10 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                        disabled={!editUserId}
                      />
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => {
                    if (!editUserId) return;
                    if (!editUser.firstName.trim() || !editUser.lastName.trim()) {
                      setUserMessage("Vorname und Nachname sind erforderlich.");
                      return;
                    }
                    const patch: UserPatch = {
                      firstName: editUser.firstName,
                      lastName: editUser.lastName,
                      role: editUser.role,
                      phone: editUser.phone,
                      notes: editUser.notes,
                      street: editUser.street,
                      houseNumber: editUser.houseNumber,
                      addressExtra: editUser.addressExtra,
                      postalCode: editUser.postalCode,
                      city: editUser.city,
                    };
                    if (editUser.password.trim()) {
                      patch.password = editUser.password;
                    }
                    handleUpdateUser(editUserId, patch);
                    setEditUser((prev) => ({ ...prev, password: "" }));
                  }}
                  disabled={!editUserId}
                  className="btn-primary mt-6 rounded-full px-5 py-2 text-sm font-semibold text-white transition hover:scale-[1.02] disabled:opacity-60"
                  style={{ backgroundColor: theme.primary }}
                >
                  Änderungen speichern
                </button>
              </div>
            </div>

            <div className="mt-6 rounded-3xl border border-white/10 bg-(--surface-2) p-6 shadow-lg">
              <h3 className="text-xl font-semibold text-white mb-4">
                Benutzer löschen
              </h3>
              <div className="flex flex-col gap-4 md:flex-row md:items-end">
                <div className="flex-1">
                  <label className="block text-sm text-gray-400 mb-2">
                    Benutzer auswählen
                  </label>
                  <select
                    value={deleteUserId}
                    onChange={(event) => selectUserForDelete(event.target.value)}
                    className="w-full rounded-xl bg-(--surface-3) border border-white/10 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="">Bitte auswählen</option>
                    {users.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.email}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={() => {
                    const user = users.find((entry) => entry.id === deleteUserId);
                    if (user) setConfirmUser(user);
                  }}
                  disabled={!deleteUserId}
                  className="rounded-full px-5 py-2 text-sm font-semibold text-white bg-red-500/80 hover:bg-red-500 transition disabled:opacity-60"
                >
                  Löschen
                </button>
              </div>
            </div>
          </div>
        )}
        {activeTab === "usersList" && (
          <div className="mt-16 border-t border-white/10 pt-12">
            <h2 className="text-3xl font-bold text-white mb-3">
              Benutzerliste
            </h2>
            <p className="text-gray-400 mb-8">
              Alle Benutzerkonten mit Kontaktdaten und Status.
            </p>

            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <input
                type="text"
                value={userSearch}
                onChange={(event) => setUserSearch(event.target.value)}
                placeholder="Suche nach E-Mail, Telefon, Vorname, Nachname oder Rolle"
                className="w-full sm:max-w-md rounded-full bg-(--surface-3) border border-white/10 px-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <span className="text-sm text-gray-400">
                {filteredUsers.length} Einträge
              </span>
            </div>

            <div className="overflow-x-auto rounded-3xl border border-white/10 bg-(--surface-2) shadow-lg">
              <table className="w-full text-sm">
                <thead className="border-b border-white/10 text-gray-400">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold">E-Mail</th>
                    <th className="px-4 py-3 text-left font-semibold">Telefon</th>
                    <th className="px-4 py-3 text-left font-semibold">Vorname</th>
                    <th className="px-4 py-3 text-left font-semibold">Nachname</th>
                    <th className="px-4 py-3 text-left font-semibold">Notizen</th>
                    <th className="px-4 py-3 text-left font-semibold">Adresse</th>
                    <th className="px-4 py-3 text-left font-semibold">Rolle</th>
                    <th className="px-4 py-3 text-left font-semibold">Erstellt</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.length ? (
                    filteredUsers.map((user) => {
                      const nameParts = getNameParts(user);
                      return (
                        <tr
                          key={user.id}
                          className="border-b border-white/5 text-gray-200 last:border-b-0"
                        >
                          <td className="px-4 py-3">{user.email}</td>
                          <td className="px-4 py-3">{user.phone ?? "—"}</td>
                          <td className="px-4 py-3">{nameParts.firstName || "—"}</td>
                          <td className="px-4 py-3">{nameParts.lastName || "—"}</td>
                          <td className="px-4 py-3">
                            {user.notes ? (
                              <button
                                type="button"
                                onClick={() => openNoteEditor(user)}
                                className="max-w-55 truncate text-left text-gray-200 underline decoration-white/20 underline-offset-4 hover:text-white"
                                title="Notiz bearbeiten"
                              >
                                {user.notes}
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => openNoteEditor(user)}
                                className="text-gray-400 underline decoration-white/10 underline-offset-4 hover:text-gray-200"
                              >
                                Notiz hinzufügen
                              </button>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {user.street || user.postalCode || user.city ? (
                              <button
                                type="button"
                                onClick={() => setAddressViewerUser(user)}
                                className="text-left text-gray-200 underline decoration-white/20 underline-offset-4 hover:text-white"
                              >
                                Adresse anzeigen
                              </button>
                            ) : (
                              <span className="text-gray-400">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3">{user.role}</td>
                          <td className="px-4 py-3">{formatUserDate(user.createdAt)}</td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td className="px-4 py-6 text-center text-gray-400" colSpan={9}>
                        Keine Treffer.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
        {activeTab === "usersList" && noteEditorUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-6">
            <div className="w-full max-w-2xl rounded-3xl border border-white/10 bg-(--surface-2) p-8 shadow-2xl">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h3 className="text-xl font-semibold text-white">
                    Notiz bearbeiten
                  </h3>
                  <p className="text-sm text-gray-400">
                    {noteEditorUser.email}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setNoteEditorUser(null)}
                  className="rounded-full px-3 py-1 text-xs font-semibold text-white border border-white/20 hover:bg-white/10 transition"
                >
                  Schließen
                </button>
              </div>

              <textarea
                rows={6}
                value={noteDraft}
                onChange={(event) => setNoteDraft(event.target.value)}
                className="mt-6 w-full rounded-2xl bg-(--surface-3) border border-white/10 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Interne Notiz..."
              />

              <div className="mt-6 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setNoteEditorUser(null)}
                  className="rounded-full px-4 py-2 text-sm font-semibold text-white border border-white/20 hover:bg-white/10 transition"
                >
                  Abbrechen
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!noteEditorUser) return;
                    handleUpdateUser(noteEditorUser.id, { notes: noteDraft });
                    setNoteEditorUser(null);
                  }}
                  className="btn-primary rounded-full px-4 py-2 text-sm font-semibold text-white transition hover:scale-[1.02]"
                  style={{ backgroundColor: theme.primary }}
                >
                  Speichern
                </button>
              </div>
            </div>
          </div>
        )}
        {activeTab === "usersList" && addressViewerUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-6">
            <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-(--surface-2) p-8 shadow-2xl">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h3 className="text-xl font-semibold text-white">
                    Adresse
                  </h3>
                  <p className="text-sm text-gray-400">
                    {addressViewerUser.email}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setAddressViewerUser(null)}
                  className="rounded-full px-3 py-1 text-xs font-semibold text-white border border-white/20 hover:bg-white/10 transition"
                >
                  Schließen
                </button>
              </div>
              <div className="mt-6 space-y-2 text-sm text-gray-200">
                <div>
                  {addressViewerUser.street ?? ""} {addressViewerUser.houseNumber ?? ""}
                </div>
                {addressViewerUser.addressExtra && (
                  <div>{addressViewerUser.addressExtra}</div>
                )}
                <div>
                  {addressViewerUser.postalCode ?? ""} {addressViewerUser.city ?? ""}
                </div>
              </div>
            </div>
          </div>
        )}
        {activeTab === "users" && confirmUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-6">
            <div className="w-full max-w-md rounded-3xl border border-white/10 bg-(--surface-2) p-8 shadow-2xl">
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
        {activeTab === "inquiries" && (
          <div className="mt-16 border-t border-white/10 pt-12">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
              <div>
                <h2 className="text-3xl font-bold text-white mb-2">
                  Anfragen
                </h2>
                <p className="text-gray-400">
                  Eingegangene Anfragen aus dem Kundenportal.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <select
                  value={inquiryFilter}
                  onChange={(event) =>
                    setInquiryFilter(event.target.value as typeof inquiryFilter)
                  }
                  className="rounded-full bg-(--surface-3) border border-white/10 px-4 py-2 text-xs font-semibold text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="all">Alle</option>
                  <option value="open">Offen</option>
                  <option value="in_progress">In Bearbeitung</option>
                  <option value="planning">In Planung</option>
                  <option value="confirmed">Bestätigt</option>
                  <option value="done">Abgeschlossen</option>
                  <option value="rejected">Abgelehnt</option>
                </select>
                <button
                  type="button"
                  onClick={loadInquiries}
                  className="rounded-full px-4 py-2 text-xs font-semibold text-white border border-white/20 hover:bg-white/10 transition"
                >
                  Aktualisieren
                </button>
              </div>
            </div>

            {inquiriesLoading ? (
              <div className="text-gray-400">Lade Anfragen...</div>
            ) : filteredInquiries.length ? (
              <div className="overflow-x-auto rounded-3xl border border-white/10 bg-(--surface-2) shadow-lg">
                <table className="w-full text-sm">
                  <thead className="border-b border-white/10 text-gray-400">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold">Eingang</th>
                      <th className="px-4 py-3 text-left font-semibold">Kunde</th>
                      <th className="px-4 py-3 text-left font-semibold">E-Mail</th>
                      <th className="px-4 py-3 text-left font-semibold">Telefon</th>
                      <th className="px-4 py-3 text-left font-semibold">Event</th>
                      <th className="px-4 py-3 text-left font-semibold">Teilnehmer</th>
                      <th className="px-4 py-3 text-left font-semibold">Datum</th>
                      <th className="px-4 py-3 text-left font-semibold">Status</th>
                      <th className="px-4 py-3 text-left font-semibold">Nachricht</th>
                      <th className="px-4 py-3 text-left font-semibold">Aktion</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredInquiries.map((inquiry) => {
                      const nameParts = getNameParts({
                        id: inquiry.userId,
                        email: inquiry.email,
                        phone: inquiry.phone,
                        name: null,
                        firstName: inquiry.firstName,
                        lastName: inquiry.lastName,
                        notes: null,
                        street: null,
                        houseNumber: null,
                        addressExtra: null,
                        postalCode: null,
                        city: null,
                        role: "CUSTOMER",
                        createdAt: inquiry.createdAt,
                      });
                      return (
                        <tr
                          key={inquiry.id}
                          className="border-b border-white/5 text-gray-200 last:border-b-0"
                        >
                          <td className="px-4 py-3">
                            {formatUserDate(inquiry.createdAt)}
                          </td>
                          <td className="px-4 py-3">
                            {`${nameParts.firstName} ${nameParts.lastName}`.trim() || "—"}
                          </td>
                          <td className="px-4 py-3">{inquiry.email}</td>
                          <td className="px-4 py-3">{inquiry.phone ?? "—"}</td>
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
                          <td className="px-4 py-3 max-w-65">
                            <button
                              type="button"
                              onClick={() => openInquiry(inquiry)}
                              className="w-full text-left text-gray-200 underline decoration-white/20 underline-offset-4 hover:text-white truncate"
                            >
                              {inquiry.message}
                            </button>
                          </td>
                          <td className="px-4 py-3">
                            <button
                              type="button"
                              onClick={() => openInquiry(inquiry)}
                              className="rounded-full px-3 py-1 text-xs font-semibold text-white border border-white/20 hover:bg-white/10 transition"
                            >
                              Details
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-gray-400">Keine Anfragen im Filter.</div>
            )}
          </div>
        )}
        {activeTab === "inquiries" && activeInquiry && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-6">
            <div className="w-full max-w-2xl rounded-3xl border border-white/10 bg-(--surface-2) p-8 shadow-2xl">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h3 className="text-xl font-semibold text-white">
                    Anfrage
                  </h3>
                  <p className="text-sm text-gray-400">
                    {formatUserDate(activeInquiry.createdAt)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveInquiry(null)}
                  className="rounded-full px-3 py-1 text-xs font-semibold text-white border border-white/20 hover:bg-white/10 transition"
                >
                  Schließen
                </button>
              </div>

              <div className="mt-6 space-y-4 text-sm text-gray-200">
                <div>
                  <span className="text-gray-400">Kunde:</span>{" "}
                  {activeInquiry.firstName || activeInquiry.lastName
                    ? `${activeInquiry.firstName ?? ""} ${activeInquiry.lastName ?? ""}`.trim()
                    : "—"}
                </div>
                <div>
                  <span className="text-gray-400">E-Mail:</span> {activeInquiry.email}
                </div>
                <div>
                  <span className="text-gray-400">Telefon:</span> {activeInquiry.phone ?? "—"}
                </div>
                <div className="grid gap-4 md:grid-cols-3">
                  <div>
                    <span className="text-gray-400">Event:</span>{" "}
                    {activeInquiry.eventType ?? "—"}
                  </div>
                  <div>
                    <span className="text-gray-400">Teilnehmer:</span>{" "}
                    {activeInquiry.participants ?? "—"}
                  </div>
                  <div>
                    <span className="text-gray-400">Datum:</span>{" "}
                    {activeInquiry.eventDate ?? "—"}
                  </div>
                </div>
                <div>
                  <span className="text-gray-400">Nachricht:</span>
                  <p className="mt-2 whitespace-pre-wrap rounded-2xl border border-white/10 bg-(--surface-3) px-4 py-3 text-gray-100">
                    {activeInquiry.message}
                  </p>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">
                    Status
                  </label>
                  <select
                    value={activeInquiryStatus}
                    onChange={(event) => setActiveInquiryStatus(event.target.value)}
                    className="w-full rounded-xl bg-(--surface-3) border border-white/10 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="open">Offen</option>
                    <option value="in_progress">In Bearbeitung</option>
                    <option value="planning">In Planung</option>
                    <option value="confirmed">Bestätigt</option>
                    <option value="done">Abgeschlossen</option>
                    <option value="rejected">Abgelehnt</option>
                  </select>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setActiveInquiry(null)}
                  className="rounded-full px-4 py-2 text-sm font-semibold text-white border border-white/20 hover:bg-white/10 transition"
                >
                  Abbrechen
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (activeInquiry) {
                      setDeleteInquiryId(activeInquiry.id);
                    }
                  }}
                  className="rounded-full px-4 py-2 text-sm font-semibold text-white bg-red-500/80 hover:bg-red-500 transition"
                >
                  Anfrage löschen
                </button>
                <button
                  type="button"
                  onClick={saveInquiryStatus}
                  className="btn-primary rounded-full px-4 py-2 text-sm font-semibold text-white transition hover:scale-[1.02]"
                  style={{ backgroundColor: theme.primary }}
                >
                  Speichern
                </button>
              </div>
            </div>
          </div>
        )}
        {activeTab === "inquiries" && deleteInquiryId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-6">
            <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-(--surface-2) p-8 shadow-2xl">
              <h3 className="text-xl font-semibold text-white mb-3">
                Anfrage löschen?
              </h3>
              <p className="text-sm text-gray-400 mb-6">
                Diese Anfrage wird dauerhaft entfernt.
              </p>
              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setDeleteInquiryId(null)}
                  className="rounded-full px-4 py-2 text-sm font-semibold text-white border border-white/20 hover:bg-white/10 transition"
                >
                  Abbrechen
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const id = deleteInquiryId;
                    setDeleteInquiryId(null);
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
        {activeTab === "settings" && (
          <div className="mt-16 border-t border-white/10 pt-12">
            <h2 className="text-3xl font-bold text-white mb-3">
              Settings
            </h2>
            <p className="text-gray-400">
              Platzhalter für spätere Einstellungen.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
