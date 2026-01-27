"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { theme } from "@/app/components/Theme";
import { csrfFetch } from "@/app/components/csrfFetch";

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
  customerNumber: string | null;
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
  events?: {
    ctaTotal: number;
    ctaServicesTotal: number;
    ctaLast7Days: number;
    ctaLast30Days: number;
    ctaLast7Buckets: AnalyticsBucket[];
  };
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
  userId: string;
  email: string;
  phone: string | null;
  customerNumber: string | null;
  firstName: string | null;
  lastName: string | null;
  contactName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
};

type FaqItem = {
  id: string;
  question: string;
  answer: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
};

const SETTINGS_DEFAULTS = {
  emailFromName: "Rohde Audio",
  emailReplyTo: "",
  emailBccEnabled: true,
  emailBccAddress: "",
  emailSubjectInquiryOwner: "Neue Anfrage von {name}",
  emailSubjectInquiryCustomer: "Danke für deine Anfrage!",
  emailSubjectNewAccount: "Neuer Account registriert",
  emailSubjectVerification: "Bestätigungscode für deinen Account",
  emailSubjectStatus: "Update zu deiner Anfrage",
  emailSubjectCustomDefault: "Nachricht von Rohde Audio",
  inquiryDefaultStatus: "open",
  inquiryStatusEmailEnabled: true,
  brandName: "Rohde Audio",
  brandPrimary: "#7c3aed",
  brandSecondary: "#2563eb",
  brandLogoUrl: "",
  brandEmailFooter: "",
  uiPrimary: "#a855f7",
  uiSecondary: "#2563eb",
  maintenanceEnabled: false,
  maintenanceMessage: "Wir sind bald zurück.",
  maintenanceBypassIps: "",
  analyticsEnabled: true,
  securitySessionDays: 14,
  securityLoginLimit: 8,
  securityLoginWindowSeconds: 60,
  securityContactLimit: 6,
  securityContactWindowSeconds: 60,
  backupLastNote: "",
};

export default function AdminDashboard({ userName }: AdminDashboardProps) {
  const router = useRouter();
  const [packages, setPackages] = useState<PackageCard[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [inquiriesLoading, setInquiriesLoading] = useState(false);
  const [faqLoading, setFaqLoading] = useState(false);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsMessage, setSettingsMessage] = useState<string | null>(null);
  const [settingsError, setSettingsError] = useState<string | null>(null);
  const [backupMessage, setBackupMessage] = useState<string | null>(null);
  const [backupError, setBackupError] = useState<string | null>(null);
  const [backupUploading, setBackupUploading] = useState(false);
  const [backupFile, setBackupFile] = useState<File | null>(null);
  const [settings, setSettings] = useState({ ...SETTINGS_DEFAULTS });
  const [activeInquiry, setActiveInquiry] = useState<Inquiry | null>(null);
  const [activeInquiryStatus, setActiveInquiryStatus] = useState("open");
  const [activeInquiryNote, setActiveInquiryNote] = useState("");
  const [activeInquiryOrderNumber, setActiveInquiryOrderNumber] = useState("");
  const [createInquiryOpen, setCreateInquiryOpen] = useState(false);
  const [createInquirySaving, setCreateInquirySaving] = useState(false);
  const [createInquiryError, setCreateInquiryError] = useState<string | null>(null);
  const [inquiryStatusMessage, setInquiryStatusMessage] = useState<string | null>(null);
  const [inquiryStatusError, setInquiryStatusError] = useState<string | null>(null);
  const [createInquiryForm, setCreateInquiryForm] = useState({
    userId: "",
    contactName: "",
    contactEmail: "",
    contactPhone: "",
    eventType: "",
    participants: "",
    eventDate: "",
    message: "",
    status: "open",
    orderNumber: "",
  });
  const [inquiryFilter, setInquiryFilter] = useState<
    "all" | "open" | "in_progress" | "planning" | "confirmed" | "done" | "rejected"
  >("all");
  const [inquiryOrderSearch, setInquiryOrderSearch] = useState("");
  const [deleteInquiryId, setDeleteInquiryId] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [userMessage, setUserMessage] = useState<string | null>(null);
  const [confirmUser, setConfirmUser] = useState<AdminUser | null>(null);
  const [activeTab, setActiveTab] = useState<
    "views" | "packages" | "users" | "usersList" | "inquiries" | "emails" | "faqs" | "settings"
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
    customerNumber: string;
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
    customerNumber: "",
    notes: "",
    street: "",
    houseNumber: "",
    addressExtra: "",
    postalCode: "",
    city: "",
    password: "",
  });
  const [deleteUserId, setDeleteUserId] = useState("");
  const [deleteUserHard, setDeleteUserHard] = useState(false);
  const [userSearch, setUserSearch] = useState("");
  const [noteEditorUser, setNoteEditorUser] = useState<AdminUser | null>(null);
  const [noteDraft, setNoteDraft] = useState("");
  const [addressViewerUser, setAddressViewerUser] = useState<AdminUser | null>(null);
  const [mailUserId, setMailUserId] = useState("");
  const [mailToEmail, setMailToEmail] = useState("");
  const [mailSubject, setMailSubject] = useState("");
  const [mailBody, setMailBody] = useState("");
  const [mailOrderNumber, setMailOrderNumber] = useState("");
  const [mailCustomerNumber, setMailCustomerNumber] = useState("");
  const [mailOrderOptions, setMailOrderOptions] = useState<string[]>([]);
  const [mailMessage, setMailMessage] = useState<string | null>(null);
  const [mailError, setMailError] = useState<string | null>(null);
  const [mailSending, setMailSending] = useState(false);
  const [faqs, setFaqs] = useState<FaqItem[]>([]);
  const [faqDraft, setFaqDraft] = useState({
    question: "",
    answer: "",
    sortOrder: 0,
    isActive: true,
  });
  const [faqMessage, setFaqMessage] = useState<string | null>(null);
  const [faqError, setFaqError] = useState<string | null>(null);
  const [inquirySearch, setInquirySearch] = useState("");
  const [faqLimit, setFaqLimit] = useState(6);

  const loadPackages = async () => {
    setLoading(true);
    const response = await csrfFetch("/api/admin/packages", {
      credentials: "include",
    });
    if (response.ok) {
      const data = (await response.json()) as PackageCard[];
      setPackages(data);
    }
    setLoading(false);
  };

  const loadUsers = async () => {
    const response = await csrfFetch("/api/admin/users", {
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
    const response = await csrfFetch("/api/admin/inquiries", {
      credentials: "include",
    });
    if (response.ok) {
      const data = (await response.json()) as Inquiry[];
      setInquiries(data);
    }
    setInquiriesLoading(false);
  };

  const loadFaqs = async () => {
    setFaqLoading(true);
    const response = await csrfFetch("/api/admin/faqs", {
      credentials: "include",
    });
    if (response.ok) {
      const data = (await response.json()) as FaqItem[];
      setFaqs(data);
    }
    setFaqLoading(false);
  };

  const loadSettings = async () => {
    const response = await fetch("/api/admin/settings", {
      credentials: "include",
    });
    if (!response.ok) return;
    const data = (await response.json()) as Record<string, string>;
    const limit = data?.faq_limit ? Number(data.faq_limit) : 6;
    if (Number.isFinite(limit)) {
      setFaqLimit(limit);
    }
    const bool = (value: string | undefined, fallback: boolean) => {
      if (value === undefined) return fallback;
      return ["1", "true", "yes", "on"].includes(value.toLowerCase());
    };
    const numberValue = (value: string | undefined, fallback: number) => {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : fallback;
    };
    setSettings({
      emailFromName: data.email_from_name ?? SETTINGS_DEFAULTS.emailFromName,
      emailReplyTo: data.email_reply_to ?? SETTINGS_DEFAULTS.emailReplyTo,
      emailBccEnabled: bool(data.email_bcc_enabled, SETTINGS_DEFAULTS.emailBccEnabled),
      emailBccAddress: data.email_bcc_address ?? SETTINGS_DEFAULTS.emailBccAddress,
      emailSubjectInquiryOwner:
        data.email_subject_inquiry_owner ?? SETTINGS_DEFAULTS.emailSubjectInquiryOwner,
      emailSubjectInquiryCustomer:
        data.email_subject_inquiry_customer ?? SETTINGS_DEFAULTS.emailSubjectInquiryCustomer,
      emailSubjectNewAccount:
        data.email_subject_new_account ?? SETTINGS_DEFAULTS.emailSubjectNewAccount,
      emailSubjectVerification:
        data.email_subject_verification ?? SETTINGS_DEFAULTS.emailSubjectVerification,
      emailSubjectStatus: data.email_subject_status ?? SETTINGS_DEFAULTS.emailSubjectStatus,
      emailSubjectCustomDefault:
        data.email_subject_custom_default ?? SETTINGS_DEFAULTS.emailSubjectCustomDefault,
      inquiryDefaultStatus:
        data.inquiry_default_status ?? SETTINGS_DEFAULTS.inquiryDefaultStatus,
      inquiryStatusEmailEnabled: bool(
        data.inquiry_status_email_enabled,
        SETTINGS_DEFAULTS.inquiryStatusEmailEnabled
      ),
      brandName: data.brand_name ?? SETTINGS_DEFAULTS.brandName,
      brandPrimary: data.brand_primary ?? SETTINGS_DEFAULTS.brandPrimary,
      brandSecondary: data.brand_secondary ?? SETTINGS_DEFAULTS.brandSecondary,
      brandLogoUrl: data.brand_logo_url ?? SETTINGS_DEFAULTS.brandLogoUrl,
      brandEmailFooter: data.brand_email_footer ?? SETTINGS_DEFAULTS.brandEmailFooter,
      uiPrimary: data.ui_primary ?? SETTINGS_DEFAULTS.uiPrimary,
      uiSecondary: data.ui_secondary ?? SETTINGS_DEFAULTS.uiSecondary,
      maintenanceEnabled: bool(
        data.maintenance_enabled,
        SETTINGS_DEFAULTS.maintenanceEnabled
      ),
      maintenanceMessage: data.maintenance_message ?? SETTINGS_DEFAULTS.maintenanceMessage,
      maintenanceBypassIps: data.maintenance_bypass_ips ?? SETTINGS_DEFAULTS.maintenanceBypassIps,
      analyticsEnabled: bool(data.analytics_enabled, SETTINGS_DEFAULTS.analyticsEnabled),
      securitySessionDays: numberValue(
        data.security_session_days,
        SETTINGS_DEFAULTS.securitySessionDays
      ),
      securityLoginLimit: numberValue(
        data.security_login_limit,
        SETTINGS_DEFAULTS.securityLoginLimit
      ),
      securityLoginWindowSeconds: numberValue(
        data.security_login_window_seconds,
        SETTINGS_DEFAULTS.securityLoginWindowSeconds
      ),
      securityContactLimit: numberValue(
        data.security_contact_limit,
        SETTINGS_DEFAULTS.securityContactLimit
      ),
      securityContactWindowSeconds: numberValue(
        data.security_contact_window_seconds,
        SETTINGS_DEFAULTS.securityContactWindowSeconds
      ),
      backupLastNote: data.backup_last_note ?? SETTINGS_DEFAULTS.backupLastNote,
    });
  };

  const handleSaveSettings = async () => {
    setSettingsMessage(null);
    setSettingsError(null);
    setSettingsSaving(true);
    const response = await csrfFetch("/api/admin/settings", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        faq_limit: faqLimit,
        email_from_name: settings.emailFromName,
        email_reply_to: settings.emailReplyTo,
        email_bcc_enabled: settings.emailBccEnabled,
        email_bcc_address: settings.emailBccAddress,
        email_subject_inquiry_owner: settings.emailSubjectInquiryOwner,
        email_subject_inquiry_customer: settings.emailSubjectInquiryCustomer,
        email_subject_new_account: settings.emailSubjectNewAccount,
        email_subject_verification: settings.emailSubjectVerification,
        email_subject_status: settings.emailSubjectStatus,
        email_subject_custom_default: settings.emailSubjectCustomDefault,
        inquiry_default_status: settings.inquiryDefaultStatus,
        inquiry_status_email_enabled: settings.inquiryStatusEmailEnabled,
        brand_name: settings.brandName,
        brand_primary: settings.brandPrimary,
        brand_secondary: settings.brandSecondary,
        brand_logo_url: settings.brandLogoUrl,
        brand_email_footer: settings.brandEmailFooter,
        ui_primary: settings.uiPrimary,
        ui_secondary: settings.uiSecondary,
        maintenance_enabled: settings.maintenanceEnabled,
        maintenance_message: settings.maintenanceMessage,
        maintenance_bypass_ips: settings.maintenanceBypassIps,
        analytics_enabled: settings.analyticsEnabled,
        security_session_days: settings.securitySessionDays,
        security_login_limit: settings.securityLoginLimit,
        security_login_window_seconds: settings.securityLoginWindowSeconds,
        security_contact_limit: settings.securityContactLimit,
        security_contact_window_seconds: settings.securityContactWindowSeconds,
        backup_last_note: settings.backupLastNote,
      }),
    });
    setSettingsSaving(false);
    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      setSettingsError(payload?.error ?? "Settings konnten nicht gespeichert werden.");
      return;
    }
    setSettingsMessage("Settings gespeichert.");
    if (payload?.settings) {
      const data = payload.settings as Record<string, string>;
      const limit = data?.faq_limit ? Number(data.faq_limit) : faqLimit;
      if (Number.isFinite(limit)) {
        setFaqLimit(limit);
      }
    }
  };

  const handleSendMail = async () => {
    setMailMessage(null);
    setMailError(null);
    if ((!mailUserId && !mailToEmail.trim()) || !mailSubject.trim() || !mailBody.trim()) {
      setMailError("Bitte Empfänger, Betreff und Nachricht ausfüllen.");
      return;
    }
    setMailSending(true);
    const response = await csrfFetch("/api/admin/send-email", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: mailUserId,
        email: mailToEmail.trim(),
        subject: mailSubject.trim(),
        message: mailBody.trim(),
        orderNumber: mailOrderNumber.trim(),
        customerNumber: mailCustomerNumber.trim(),
      }),
    });
    setMailSending(false);
    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      setMailError(payload?.error ?? "E-Mail konnte nicht gesendet werden.");
      return;
    }
    setMailMessage("E-Mail wurde versendet.");
    setMailSubject("");
    setMailBody("");
    setMailToEmail("");
    setMailOrderNumber("");
    setMailCustomerNumber("");
  };

  const handleFaqCreate = async () => {
    setFaqMessage(null);
    setFaqError(null);
    if (!faqDraft.question.trim() || !faqDraft.answer.trim()) {
      setFaqError("Bitte Frage und Antwort ausfüllen.");
      return;
    }
    const response = await csrfFetch("/api/admin/faqs", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        question: faqDraft.question,
        answer: faqDraft.answer,
        sortOrder: faqDraft.sortOrder,
        isActive: faqDraft.isActive,
      }),
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      setFaqError(payload?.error ?? "FAQ konnte nicht erstellt werden.");
      return;
    }
    setFaqs((prev) => [...prev, payload as FaqItem]);
    setFaqDraft({ question: "", answer: "", sortOrder: 0, isActive: true });
    setFaqMessage("FAQ wurde erstellt.");
  };

  const handleFaqUpdate = async (id: string, patch: Partial<FaqItem>) => {
    const response = await csrfFetch(`/api/admin/faqs/${id}`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    if (!response.ok) {
      return;
    }
    const updated = (await response.json()) as FaqItem;
    setFaqs((prev) => prev.map((item) => (item.id === id ? updated : item)));
  };

  const handleFaqDelete = async (id: string) => {
    const response = await csrfFetch(`/api/admin/faqs/${id}`, {
      method: "DELETE",
      credentials: "include",
    });
    if (!response.ok) {
      return;
    }
    setFaqs((prev) => prev.filter((item) => item.id !== id));
  };

  const resetSetting = (key: keyof typeof settings) => {
    setSettings((prev) => ({
      ...prev,
      [key]: SETTINGS_DEFAULTS[key],
    }));
  };

  const resetSection = (keys: Array<keyof typeof settings>) => {
    setSettings((prev) => {
      const next = { ...prev };
      const defaults = SETTINGS_DEFAULTS as Record<string, (typeof settings)[keyof typeof settings]>;
      (keys as string[]).forEach((key) => {
        (next as Record<string, (typeof settings)[keyof typeof settings]>)[key] = defaults[key];
      });
      return next;
    });
  };

  const handleDownloadBackup = async () => {
    setBackupError(null);
    setBackupMessage(null);
    const response = await fetch("/api/admin/backup", {
      credentials: "include",
    });
    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      setBackupError(payload?.error ?? "Backup konnte nicht erstellt werden.");
      return;
    }
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `rohde-audio-backup-${new Date().toISOString().slice(0, 10)}.zip`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    setBackupMessage("Backup wurde heruntergeladen.");
  };

  const handleUploadBackup = async () => {
    setBackupError(null);
    setBackupMessage(null);
    if (!backupFile) {
      setBackupError("Bitte eine ZIP-Datei auswählen.");
      return;
    }
    const formData = new FormData();
    formData.append("file", backupFile);
    setBackupUploading(true);
    const response = await csrfFetch("/api/admin/backup", {
      method: "POST",
      credentials: "include",
      body: formData,
    });
    setBackupUploading(false);
    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      setBackupError(payload?.error ?? "Backup konnte nicht eingespielt werden.");
      return;
    }
    setBackupMessage(
      payload?.message ??
        "Backup eingespielt. Bitte den Server neu starten, um die DB zu laden."
    );
    setBackupFile(null);
  };

  const handleFaqLimitSave = async () => {
    setFaqMessage(null);
    setFaqError(null);
    const response = await csrfFetch("/api/admin/settings", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ faqLimit }),
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      setFaqError(payload?.error ?? "FAQ-Limit konnte nicht gespeichert werden.");
      return;
    }
    setFaqMessage("FAQ-Limit gespeichert.");
  };

  const openInquiry = (inquiry: Inquiry) => {
    setActiveInquiry(inquiry);
    setActiveInquiryStatus(inquiry.status);
    setActiveInquiryNote("");
    setActiveInquiryOrderNumber(inquiry.orderNumber ?? "");
    setInquiryStatusMessage(null);
    setInquiryStatusError(null);
  };

  const handleCreateInquiry = async () => {
    setCreateInquiryError(null);
    if (!createInquiryForm.message.trim()) {
      setCreateInquiryError("Nachricht ist erforderlich.");
      return;
    }
    setCreateInquirySaving(true);
    const response = await csrfFetch("/api/admin/inquiries", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: createInquiryForm.userId,
        contactName: createInquiryForm.contactName,
        contactEmail: createInquiryForm.contactEmail,
        contactPhone: createInquiryForm.contactPhone,
        eventType: createInquiryForm.eventType,
        participants: createInquiryForm.participants,
        eventDate: createInquiryForm.eventDate,
        message: createInquiryForm.message,
        status: createInquiryForm.status,
        orderNumber: createInquiryForm.orderNumber,
      }),
    });
    setCreateInquirySaving(false);
    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      setCreateInquiryError(payload?.error ?? "Anfrage konnte nicht erstellt werden.");
      return;
    }
    if (payload) {
      setInquiries((prev) => [payload as Inquiry, ...prev]);
    }
    setCreateInquiryOpen(false);
    setCreateInquiryForm({
      userId: "",
      contactName: "",
      contactEmail: "",
      contactPhone: "",
      eventType: "",
      participants: "",
      eventDate: "",
      message: "",
      status: "open",
      orderNumber: "",
    });
  };

  const saveInquiryStatus = async () => {
    if (!activeInquiry) return;
    setInquiryStatusMessage(null);
    setInquiryStatusError(null);
    const response = await csrfFetch(`/api/admin/inquiries/${activeInquiry.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        status: activeInquiryStatus,
        message: activeInquiryNote,
        orderNumber: activeInquiryOrderNumber.trim(),
      }),
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      setInquiryStatusError(payload?.error ?? "Status konnte nicht gespeichert werden.");
      return;
    }
    const nextOrderNumber =
      typeof payload?.orderNumber === "string"
        ? payload.orderNumber
        : activeInquiryOrderNumber;
    setInquiries((prev) =>
      prev.map((item) =>
        item.id === activeInquiry.id
          ? { ...item, status: activeInquiryStatus, orderNumber: nextOrderNumber }
          : item
      )
    );
    setActiveInquiry((prev) =>
      prev
        ? { ...prev, status: activeInquiryStatus, orderNumber: nextOrderNumber }
        : prev
    );
    if (payload?.mailSent) {
      setInquiryStatusMessage("Status gespeichert und Mail versendet.");
    } else {
      setInquiryStatusMessage("Status gespeichert.");
      if (payload?.mailError) {
        setInquiryStatusError(payload.mailError);
      }
    }
  };

  const handleDeleteInquiry = async (id: string) => {
    const response = await csrfFetch(`/api/admin/inquiries/${id}`, {
      method: "DELETE",
      credentials: "include",
    });
    if (!response.ok) {
      return;
    }
    setInquiries((prev) => prev.filter((entry) => entry.id !== id));
    setActiveInquiry(null);
  };

  const exportInquiriesCsv = () => {
    const rows = filteredInquiries.map((inquiry) => {
      const name =
        inquiry.contactName ||
        `${inquiry.firstName ?? ""} ${inquiry.lastName ?? ""}`.trim();
      return {
        Datum: inquiry.createdAt,
        Auftragsnummer: inquiry.orderNumber ?? "",
        Kundennummer: inquiry.customerNumber ?? "",
        Kunde: name || "Gast",
        Email: inquiry.contactEmail ?? inquiry.email,
        Telefon: inquiry.contactPhone ?? inquiry.phone ?? "",
        Event: inquiry.eventType ?? "",
        Teilnehmer: inquiry.participants ?? "",
        Datum_Event: inquiry.eventDate ?? "",
        Status: inquiry.status,
        Nachricht: (inquiry.message ?? "").replace(/\s+/g, " ").trim(),
      };
    });

    const headers = Object.keys(rows[0] ?? { Datum: "" });
    const escapeValue = (value: string) =>
      `"${value.replace(/"/g, '""')}"`;
    const csv = [
      headers.join(";"),
      ...rows.map((row) =>
        headers.map((key) => escapeValue(String((row as Record<string, string>)[key] ?? ""))).join(";")
      ),
    ].join("\n");

    const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `anfragen-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const searchValue = inquirySearch.trim().toLowerCase();
  const orderSearchValue = inquiryOrderSearch.trim();
  const filteredInquiries = inquiries
    .filter((inquiry) =>
      inquiryFilter === "all" ? true : inquiry.status === inquiryFilter
    )
    .filter((inquiry) => {
      if (!orderSearchValue) return true;
      return (inquiry.orderNumber ?? "").includes(orderSearchValue);
    })
    .filter((inquiry) => {
      if (!searchValue) return true;
      const name =
        inquiry.contactName ||
        `${inquiry.firstName ?? ""} ${inquiry.lastName ?? ""}`.trim();
      const haystack = [
        name,
        inquiry.contactEmail ?? inquiry.email,
        inquiry.contactPhone ?? inquiry.phone ?? "",
        inquiry.orderNumber ?? "",
        inquiry.customerNumber ?? "",
        inquiry.eventType ?? "",
        inquiry.message ?? "",
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(searchValue);
    });

  useEffect(() => {
    loadPackages();
    loadUsers();
    loadAnalytics();
    loadInquiries();
  }, []);

  useEffect(() => {
    if (!mailUserId) {
      setMailCustomerNumber("");
      setMailOrderOptions([]);
      if (!mailToEmail) {
        setMailOrderNumber("");
      }
      return;
    }
    const selectedUser = users.find((user) => user.id === mailUserId);
    setMailCustomerNumber(selectedUser?.customerNumber ?? "");
    const options = Array.from(
      new Set(
        inquiries
          .filter((inquiry) => inquiry.userId === mailUserId && inquiry.orderNumber)
          .map((inquiry) => inquiry.orderNumber as string)
      )
    ).sort();
    setMailOrderOptions(options);
    if (options.length > 0) {
      if (!mailOrderNumber || !options.includes(mailOrderNumber)) {
        setMailOrderNumber(options[0]);
      }
    } else {
      setMailOrderNumber("");
    }
  }, [mailUserId, mailToEmail, mailOrderNumber, inquiries, users]);

  const updatePackage = (id: string, patch: Partial<PackageCard>) => {
    setPackages((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...patch } : item))
    );
  };

  const handleSave = async (pkg: PackageCard) => {
    setSavingId(pkg.id);
    setMessage(null);
    const response = await csrfFetch(`/api/admin/packages/${pkg.id}`, {
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
    const response = await csrfFetch("/api/admin/packages", {
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
    const response = await csrfFetch(`/api/admin/packages/${id}`, {
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
    await csrfFetch("/api/auth/logout", { method: "POST", credentials: "include" });
    router.push("/admin/login");
  };

  const handleCreateUser = async () => {
    setUserMessage(null);
    if (!newUser.firstName.trim() || !newUser.lastName.trim()) {
      setUserMessage("Vorname und Nachname sind erforderlich.");
      return;
    }
    const response = await csrfFetch("/api/admin/users", {
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
    const response = await csrfFetch(`/api/admin/users/${userId}`, {
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

  const handleDeleteUser = async (userId: string, hardDelete: boolean) => {
    setUserMessage(null);
    const response = await csrfFetch(
      `/api/admin/users/${userId}${hardDelete ? "?hard=1" : ""}`,
      {
      method: "DELETE",
      credentials: "include",
      }
    );
    if (response.ok) {
      await loadUsers();
      setUserMessage(hardDelete ? "Benutzer endgültig gelöscht." : "Benutzer gelöscht.");
    } else {
      const payload = await response.json().catch(() => null);
      setUserMessage(payload?.error ?? "Löschen fehlgeschlagen.");
    }
  };

  const handleConfirmDelete = async () => {
    if (!confirmUser) return;
    const userId = confirmUser.id;
    setConfirmUser(null);
    const hardDelete = deleteUserHard;
    setDeleteUserHard(false);
    await handleDeleteUser(userId, hardDelete);
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
      customerNumber: "",
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
      customerNumber: user.customerNumber ?? "",
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
    setDeleteUserHard(false);
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
        user.customerNumber ?? "",
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
            { id: "emails", label: "Mails" },
            { id: "faqs", label: "FAQ" },
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
                if (nextTab === "faqs") {
                  loadFaqs();
                  loadSettings();
                }
                if (nextTab === "settings") {
                  loadSettings();
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
              <div className="space-y-6">
                {analytics.events && (
                  <div className="grid gap-4 lg:grid-cols-4">
                    <div className="rounded-2xl border border-white/10 bg-(--surface-2) p-4">
                      <p className="text-xs text-gray-400">CTA Kontakt (gesamt)</p>
                      <p className="text-2xl font-semibold text-white mt-1">
                        {analytics.events.ctaTotal}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-(--surface-2) p-4">
                      <p className="text-xs text-gray-400">CTA Leistungen (gesamt)</p>
                      <p className="text-2xl font-semibold text-white mt-1">
                        {analytics.events.ctaServicesTotal}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-(--surface-2) p-4">
                      <p className="text-xs text-gray-400">Kontakt CTA (7 Tage)</p>
                      <p className="text-2xl font-semibold text-white mt-1">
                        {analytics.events.ctaLast7Days}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-(--surface-2) p-4">
                      <p className="text-xs text-gray-400">Kontakt CTA (30 Tage)</p>
                      <p className="text-2xl font-semibold text-white mt-1">
                        {analytics.events.ctaLast30Days}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-(--surface-2) p-4 lg:col-span-4">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-xs text-gray-400">CTA Klicks (7 Tage Verlauf)</p>
                        <span className="text-xs text-gray-500">
                          {analytics.events.ctaLast7Days} in 7 Tagen
                        </span>
                      </div>
                      {renderChart({
                        buckets: analytics.events.ctaLast7Buckets,
                        total: analytics.events.ctaLast7Days,
                      })}
                    </div>
                  </div>
                )}
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
                      Kundennummer
                    </label>
                    <input
                      value={editUser.customerNumber}
                      onChange={(event) =>
                        setEditUser((prev) => ({
                          ...prev,
                          customerNumber: event.target.value,
                        }))
                      }
                      className="w-full rounded-xl bg-(--surface-3) border border-white/10 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                      disabled={!editUserId}
                      placeholder="z. B. 10100"
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
                      customerNumber: editUser.customerNumber,
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
                  <label className="mt-3 flex items-center gap-2 text-xs text-gray-400">
                    <input
                      type="checkbox"
                      checked={deleteUserHard}
                      onChange={(event) => setDeleteUserHard(event.target.checked)}
                      className="h-4 w-4 rounded border-white/20 bg-(--surface-3) text-red-500 focus:ring-2 focus:ring-red-500"
                    />
                    Endgültig löschen (inkl. Anfragen entfernen)
                  </label>
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
                    <th className="px-4 py-3 text-left font-semibold">Kundennr.</th>
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
                          <td className="px-4 py-3">
                            {user.customerNumber ?? "—"}
                          </td>
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
                      <td className="px-4 py-6 text-center text-gray-400" colSpan={10}>
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
                {deleteUserHard
                  ? " Alle Anfragen werden ebenfalls entfernt."
                  : " Das Konto wird deaktiviert und kann wiederhergestellt werden."}
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
                  {deleteUserHard ? "Endgültig löschen" : "Löschen"}
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
              <div className="flex flex-wrap items-center gap-3">
                <input
                  value={inquirySearch}
                  onChange={(event) => setInquirySearch(event.target.value)}
                  className="rounded-full bg-(--surface-3) border border-white/10 px-4 py-2 text-xs font-semibold text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Suche…"
                />
                <input
                  value={inquiryOrderSearch}
                  onChange={(event) => setInquiryOrderSearch(event.target.value)}
                  className="rounded-full bg-(--surface-3) border border-white/10 px-4 py-2 text-xs font-semibold text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Auftragsnr."
                />
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
                <button
                  type="button"
                  onClick={exportInquiriesCsv}
                  className="rounded-full px-4 py-2 text-xs font-semibold text-white border border-white/20 hover:bg-white/10 transition"
                >
                  CSV Export
                </button>
                <button
                  type="button"
                  onClick={() => setCreateInquiryOpen(true)}
                  className="rounded-full px-4 py-2 text-xs font-semibold text-white border border-white/20 hover:bg-white/10 transition"
                >
                  Anfrage hinzufügen
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
                      <th className="px-4 py-3 text-left font-semibold">Auftragsnr.</th>
                      <th className="px-4 py-3 text-left font-semibold">Kundennr.</th>
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
                        email: inquiry.contactEmail ?? inquiry.email,
                        phone: inquiry.contactPhone ?? inquiry.phone,
                        customerNumber: inquiry.customerNumber ?? null,
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
                      const displayName =
                        inquiry.contactName ||
                        `${nameParts.firstName} ${nameParts.lastName}`.trim() ||
                        "Gast";
                      const displayEmail = inquiry.contactEmail ?? inquiry.email;
                      const displayPhone = inquiry.contactPhone ?? inquiry.phone;
                      return (
                        <tr
                          key={inquiry.id}
                          className="border-b border-white/5 text-gray-200 last:border-b-0"
                        >
                          <td className="px-4 py-3">
                            {formatUserDate(inquiry.createdAt)}
                          </td>
                          <td className="px-4 py-3">
                            {inquiry.orderNumber ?? "—"}
                          </td>
                          <td className="px-4 py-3">
                            {inquiry.customerNumber ?? "—"}
                          </td>
                          <td className="px-4 py-3">
                            {displayName || "—"}
                          </td>
                          <td className="px-4 py-3">{displayEmail}</td>
                          <td className="px-4 py-3">{displayPhone ?? "—"}</td>
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
        {activeTab === "inquiries" && createInquiryOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-6">
            <div className="w-full max-w-3xl rounded-3xl border border-white/10 bg-(--surface-2) p-8 shadow-2xl">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h3 className="text-xl font-semibold text-white">
                    Anfrage hinzufügen
                  </h3>
                  <p className="text-sm text-gray-400">
                    Manuell erstellte Anfrage für persönliche Absprachen.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setCreateInquiryOpen(false)}
                  className="rounded-full px-3 py-1 text-xs font-semibold text-white border border-white/20 hover:bg-white/10 transition"
                >
                  Schließen
                </button>
              </div>

              {createInquiryError && (
                <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                  {createInquiryError}
                </div>
              )}

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <label className="text-sm text-gray-300 md:col-span-2">
                  Kunde (optional)
                  <select
                    value={createInquiryForm.userId}
                    onChange={(event) =>
                      setCreateInquiryForm((prev) => ({
                        ...prev,
                        userId: event.target.value,
                      }))
                    }
                    className="mt-2 w-full rounded-xl bg-(--surface-3) border border-white/10 px-4 py-2 text-white"
                  >
                    <option value="">Gast / kein Konto</option>
                    {users
                      .filter((entry) => entry.role === "CUSTOMER")
                      .map((entry) => (
                        <option key={entry.id} value={entry.id}>
                          {`${entry.firstName ?? ""} ${entry.lastName ?? ""}`.trim() ||
                            entry.email}
                        </option>
                      ))}
                  </select>
                </label>
                <label className="text-sm text-gray-300">
                  Kontaktname
                  <input
                    value={createInquiryForm.contactName}
                    onChange={(event) =>
                      setCreateInquiryForm((prev) => ({
                        ...prev,
                        contactName: event.target.value,
                      }))
                    }
                    className="mt-2 w-full rounded-xl bg-(--surface-3) border border-white/10 px-4 py-2 text-white"
                  />
                </label>
                <label className="text-sm text-gray-300">
                  Kontakt E-Mail
                  <input
                    value={createInquiryForm.contactEmail}
                    onChange={(event) =>
                      setCreateInquiryForm((prev) => ({
                        ...prev,
                        contactEmail: event.target.value,
                      }))
                    }
                    className="mt-2 w-full rounded-xl bg-(--surface-3) border border-white/10 px-4 py-2 text-white"
                  />
                </label>
                <label className="text-sm text-gray-300">
                  Telefon
                  <input
                    value={createInquiryForm.contactPhone}
                    onChange={(event) =>
                      setCreateInquiryForm((prev) => ({
                        ...prev,
                        contactPhone: event.target.value,
                      }))
                    }
                    className="mt-2 w-full rounded-xl bg-(--surface-3) border border-white/10 px-4 py-2 text-white"
                  />
                </label>
                <label className="text-sm text-gray-300">
                  Auftragsnummer (optional)
                  <input
                    value={createInquiryForm.orderNumber}
                    onChange={(event) =>
                      setCreateInquiryForm((prev) => ({
                        ...prev,
                        orderNumber: event.target.value,
                      }))
                    }
                    className="mt-2 w-full rounded-xl bg-(--surface-3) border border-white/10 px-4 py-2 text-white"
                    placeholder="z. B. 260001"
                  />
                </label>
                <label className="text-sm text-gray-300">
                  Status
                  <select
                    value={createInquiryForm.status}
                    onChange={(event) =>
                      setCreateInquiryForm((prev) => ({
                        ...prev,
                        status: event.target.value,
                      }))
                    }
                    className="mt-2 w-full rounded-xl bg-(--surface-3) border border-white/10 px-4 py-2 text-white"
                  >
                    <option value="open">Offen</option>
                    <option value="in_progress">In Bearbeitung</option>
                    <option value="planning">In Planung</option>
                    <option value="confirmed">Bestätigt</option>
                    <option value="done">Abgeschlossen</option>
                    <option value="rejected">Abgelehnt</option>
                  </select>
                </label>
                <label className="text-sm text-gray-300">
                  Event-Typ
                  <input
                    value={createInquiryForm.eventType}
                    onChange={(event) =>
                      setCreateInquiryForm((prev) => ({
                        ...prev,
                        eventType: event.target.value,
                      }))
                    }
                    className="mt-2 w-full rounded-xl bg-(--surface-3) border border-white/10 px-4 py-2 text-white"
                  />
                </label>
                <label className="text-sm text-gray-300">
                  Teilnehmer
                  <input
                    value={createInquiryForm.participants}
                    onChange={(event) =>
                      setCreateInquiryForm((prev) => ({
                        ...prev,
                        participants: event.target.value,
                      }))
                    }
                    className="mt-2 w-full rounded-xl bg-(--surface-3) border border-white/10 px-4 py-2 text-white"
                  />
                </label>
                <label className="text-sm text-gray-300">
                  Datum
                  <input
                    type="date"
                    value={createInquiryForm.eventDate}
                    onChange={(event) =>
                      setCreateInquiryForm((prev) => ({
                        ...prev,
                        eventDate: event.target.value,
                      }))
                    }
                    className="mt-2 w-full rounded-xl bg-(--surface-3) border border-white/10 px-4 py-2 text-white"
                  />
                </label>
                <label className="text-sm text-gray-300 md:col-span-2">
                  Nachricht
                  <textarea
                    rows={4}
                    value={createInquiryForm.message}
                    onChange={(event) =>
                      setCreateInquiryForm((prev) => ({
                        ...prev,
                        message: event.target.value,
                      }))
                    }
                    className="mt-2 w-full rounded-xl bg-(--surface-3) border border-white/10 px-4 py-2 text-white"
                  />
                </label>
              </div>

              {(inquiryStatusError || inquiryStatusMessage) && (
                <div
                  className={`mt-6 rounded-xl border px-4 py-3 text-sm ${
                    inquiryStatusError
                      ? "border-red-500/30 bg-red-500/10 text-red-200"
                      : "border-white/10 bg-white/5 text-gray-200"
                  }`}
                >
                  {inquiryStatusError ?? inquiryStatusMessage}
                </div>
              )}

              <div className="mt-6 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setCreateInquiryOpen(false)}
                  className="rounded-full px-4 py-2 text-sm font-semibold text-white border border-white/20 hover:bg-white/10 transition"
                >
                  Abbrechen
                </button>
                <button
                  type="button"
                  onClick={handleCreateInquiry}
                  disabled={createInquirySaving}
                  className="btn-primary rounded-full px-4 py-2 text-sm font-semibold text-white transition hover:scale-[1.02] disabled:opacity-60"
                  style={{ backgroundColor: theme.primary }}
                >
                  {createInquirySaving ? "Speichern..." : "Anfrage speichern"}
                </button>
              </div>
            </div>
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
                  {activeInquiry.contactName ||
                    (activeInquiry.firstName || activeInquiry.lastName
                      ? `${activeInquiry.firstName ?? ""} ${activeInquiry.lastName ?? ""}`.trim()
                      : "Gast")}
                </div>
                <div>
                  <span className="text-gray-400">Kundennummer:</span>{" "}
                  {activeInquiry.customerNumber ?? "—"}
                </div>
                <div>
                  <span className="text-gray-400">E-Mail:</span>{" "}
                  {activeInquiry.contactEmail ?? activeInquiry.email}
                </div>
                <div>
                  <span className="text-gray-400">Telefon:</span>{" "}
                  {activeInquiry.contactPhone ?? activeInquiry.phone ?? "—"}
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
                    Auftragsnummer
                  </label>
                  <input
                    value={activeInquiryOrderNumber}
                    onChange={(event) =>
                      setActiveInquiryOrderNumber(event.target.value)
                    }
                    className="w-full rounded-xl bg-(--surface-3) border border-white/10 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="z. B. 260001"
                  />
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
                <div>
                  <label className="block text-sm text-gray-400 mb-2">
                    Nachricht an den Kunden (optional)
                  </label>
                  <textarea
                    value={activeInquiryNote}
                    onChange={(event) => setActiveInquiryNote(event.target.value)}
                    rows={4}
                    className="w-full rounded-xl bg-(--surface-3) border border-white/10 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Zusätzliche Info zur Statusänderung…"
                  />
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
        {activeTab === "emails" && (
          <div className="mt-16 border-t border-white/10 pt-12">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-6">
              <div>
                <h2 className="text-3xl font-bold text-white mb-2">
                  Kunden-Mails
                </h2>
                <p className="text-gray-400">
                  Schreibe eine Mail im Rohde-Audio-Design an einen Kunden.
                </p>
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-(--surface-2) p-8 shadow-lg max-w-3xl">
              {(mailError || mailMessage) && (
                <div
                  className={`mb-6 rounded-xl border px-4 py-3 text-sm ${
                    mailError
                      ? "border-red-500/30 bg-red-500/10 text-red-200"
                      : "border-white/10 bg-white/5 text-gray-200"
                  }`}
                >
                  {mailError ?? mailMessage}
                </div>
              )}
              <div className="space-y-5">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">
                    Empfänger
                  </label>
                  <div className="grid gap-3 md:grid-cols-2">
                    <select
                      value={mailUserId}
                      onChange={(event) => {
                        setMailUserId(event.target.value);
                        if (event.target.value) {
                          setMailToEmail("");
                        }
                      }}
                      className="w-full rounded-xl bg-(--surface-3) border border-white/10 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="">Kunde auswählen</option>
                      {users
                        .filter((user) => user.role === "CUSTOMER")
                        .map((user) => (
                          <option key={user.id} value={user.id}>
                            {`${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() || user.email}
                          </option>
                        ))}
                    </select>
                    <input
                      value={mailToEmail}
                      onChange={(event) => {
                        setMailToEmail(event.target.value);
                        if (event.target.value) {
                          setMailUserId("");
                          setMailCustomerNumber("");
                          setMailOrderNumber("");
                          setMailOrderOptions([]);
                        }
                      }}
                      className="w-full rounded-xl bg-(--surface-3) border border-white/10 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="oder freie E-Mail"
                      type="email"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">
                    Betreff
                  </label>
                  <input
                    value={mailSubject}
                    onChange={(event) => setMailSubject(event.target.value)}
                    className="w-full rounded-xl bg-(--surface-3) border border-white/10 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Betreff der Mail"
                  />
                  <div className="mt-2 flex flex-wrap gap-2 text-xs text-gray-400">
                    <button
                      type="button"
                      onClick={() => setMailSubject((prev) => `${prev} {orderNumber}`.trim())}
                      className="rounded-full border border-white/10 px-3 py-1 text-gray-300 hover:text-white"
                    >
                      {`{orderNumber}`}
                    </button>
                    <button
                      type="button"
                      onClick={() => setMailSubject((prev) => `${prev} {customerNumber}`.trim())}
                      className="rounded-full border border-white/10 px-3 py-1 text-gray-300 hover:text-white"
                    >
                      {`{customerNumber}`}
                    </button>
                  </div>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">
                      Auftragsnummer (optional)
                    </label>
                    {mailOrderOptions.length > 0 && (
                      <datalist id="mail-order-options">
                        {mailOrderOptions.map((orderNumber) => (
                          <option key={orderNumber} value={orderNumber} />
                        ))}
                      </datalist>
                    )}
                    <input
                      value={mailOrderNumber}
                      onChange={(event) => setMailOrderNumber(event.target.value)}
                      list={mailOrderOptions.length > 0 ? "mail-order-options" : undefined}
                      className="w-full rounded-xl bg-(--surface-3) border border-white/10 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="z. B. 260001"
                    />
                    {mailUserId && mailOrderOptions.length === 0 && (
                      <p className="mt-2 text-xs text-gray-500">
                        Für diesen Kunden gibt es noch keine Auftragsnummern.
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">
                      Kundennummer (optional)
                    </label>
                    <input
                      value={mailCustomerNumber}
                      onChange={(event) => setMailCustomerNumber(event.target.value)}
                      className="w-full rounded-xl bg-(--surface-3) border border-white/10 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="z. B. 10100"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">
                    Nachricht
                  </label>
                  <textarea
                    rows={8}
                    value={mailBody}
                    onChange={(event) => setMailBody(event.target.value)}
                    className="w-full rounded-xl bg-(--surface-3) border border-white/10 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Deine Nachricht an den Kunden…"
                  />
                  <div className="mt-2 flex flex-wrap gap-2 text-xs text-gray-400">
                    <button
                      type="button"
                      onClick={() => setMailBody((prev) => `${prev}\n{orderNumber}`.trim())}
                      className="rounded-full border border-white/10 px-3 py-1 text-gray-300 hover:text-white"
                    >
                      {`{orderNumber}`}
                    </button>
                    <button
                      type="button"
                      onClick={() => setMailBody((prev) => `${prev}\n{customerNumber}`.trim())}
                      className="rounded-full border border-white/10 px-3 py-1 text-gray-300 hover:text-white"
                    >
                      {`{customerNumber}`}
                    </button>
                  </div>
                </div>
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleSendMail}
                    disabled={mailSending}
                    className="btn-primary rounded-full px-5 py-3 text-sm font-semibold text-white transition hover:scale-[1.02]"
                    style={{ backgroundColor: theme.primary }}
                  >
                    {mailSending ? "Sende..." : "Mail senden"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        {activeTab === "faqs" && (
          <div className="mt-16 border-t border-white/10 pt-12">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-6">
              <div>
                <h2 className="text-3xl font-bold text-white mb-2">
                  Mini-FAQ
                </h2>
                <p className="text-gray-400">
                  Kurze Fragen & Antworten für die Kontaktseite.
                </p>
              </div>
              <button
                type="button"
                onClick={loadFaqs}
                className="rounded-full px-4 py-2 text-xs font-semibold text-white border border-white/20 hover:bg-white/10 transition"
              >
                Aktualisieren
              </button>
            </div>

            <div className="grid gap-6 lg:grid-cols-[1.2fr_2fr]">
              <div className="rounded-3xl border border-white/10 bg-(--surface-2) p-6 shadow-lg">
                {(faqError || faqMessage) && (
                  <div
                    className={`mb-4 rounded-xl border px-4 py-3 text-sm ${
                      faqError
                        ? "border-red-500/30 bg-red-500/10 text-red-200"
                        : "border-white/10 bg-white/5 text-gray-200"
                    }`}
                  >
                    {faqError ?? faqMessage}
                  </div>
                )}
                <div className="mb-6 rounded-2xl border border-white/10 bg-(--surface-3) p-4">
                  <label className="block text-xs text-gray-400 mb-2">
                    Anzeige-Limit (Kontakt/Start/Leistungen)
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      min={1}
                      max={12}
                      value={faqLimit}
                      onChange={(event) => setFaqLimit(Number(event.target.value))}
                      className="w-20 rounded-xl bg-(--surface-2) border border-white/10 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                    <button
                      type="button"
                      onClick={handleFaqLimitSave}
                      className="rounded-full px-4 py-2 text-xs font-semibold text-white border border-white/20 hover:bg-white/10 transition"
                    >
                      Speichern
                    </button>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">
                      Frage
                    </label>
                    <input
                      value={faqDraft.question}
                      onChange={(event) =>
                        setFaqDraft((prev) => ({ ...prev, question: event.target.value }))
                      }
                      className="w-full rounded-xl bg-(--surface-3) border border-white/10 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="z. B. Wie schnell antwortet ihr?"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">
                      Antwort
                    </label>
                    <textarea
                      rows={5}
                      value={faqDraft.answer}
                      onChange={(event) =>
                        setFaqDraft((prev) => ({ ...prev, answer: event.target.value }))
                      }
                      className="w-full rounded-xl bg-(--surface-3) border border-white/10 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="Kurze Antwort für Kunden."
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      value={faqDraft.sortOrder}
                      onChange={(event) =>
                        setFaqDraft((prev) => ({
                          ...prev,
                          sortOrder: Number(event.target.value),
                        }))
                      }
                      className="w-24 rounded-xl bg-(--surface-3) border border-white/10 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                    <label className="flex items-center gap-2 text-sm text-gray-300">
                      <input
                        type="checkbox"
                        checked={faqDraft.isActive}
                        onChange={(event) =>
                          setFaqDraft((prev) => ({ ...prev, isActive: event.target.checked }))
                        }
                        className="h-4 w-4 rounded border-white/20 bg-(--surface-3) text-purple-500 focus:ring-purple-500"
                      />
                      Aktiv
                    </label>
                  </div>
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={handleFaqCreate}
                      className="btn-primary rounded-full px-5 py-3 text-sm font-semibold text-white transition hover:scale-[1.02]"
                      style={{ backgroundColor: theme.primary }}
                    >
                      FAQ hinzufügen
                    </button>
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-white/10 bg-(--surface-2) p-6 shadow-lg">
                {faqLoading ? (
                  <div className="text-gray-400">Lade FAQs...</div>
                ) : faqs.length ? (
                  <div className="space-y-4">
                    {faqs.map((faq) => (
                      <div
                        key={faq.id}
                        className="rounded-2xl border border-white/10 bg-(--surface-3) p-4 space-y-3"
                      >
                        <div className="flex flex-col gap-3 md:flex-row md:items-center">
                          <input
                            value={faq.question}
                            onChange={(event) =>
                              handleFaqUpdate(faq.id, { question: event.target.value })
                            }
                            className="flex-1 rounded-xl bg-(--surface-2) border border-white/10 px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                          />
                          <input
                            type="number"
                            value={faq.sortOrder}
                            onChange={(event) =>
                              handleFaqUpdate(faq.id, { sortOrder: Number(event.target.value) })
                            }
                            className="w-20 rounded-xl bg-(--surface-2) border border-white/10 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                          />
                          <label className="flex items-center gap-2 text-xs text-gray-300">
                            <input
                              type="checkbox"
                              checked={faq.isActive}
                              onChange={(event) =>
                                handleFaqUpdate(faq.id, { isActive: event.target.checked })
                              }
                              className="h-4 w-4 rounded border-white/20 bg-(--surface-2) text-purple-500 focus:ring-purple-500"
                            />
                            Aktiv
                          </label>
                          <button
                            type="button"
                            onClick={() => handleFaqDelete(faq.id)}
                            className="text-xs text-red-300 hover:text-red-200 transition"
                          >
                            Löschen
                          </button>
                        </div>
                        <textarea
                          rows={3}
                          value={faq.answer}
                          onChange={(event) =>
                            handleFaqUpdate(faq.id, { answer: event.target.value })
                          }
                          className="w-full rounded-xl bg-(--surface-2) border border-white/10 px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-gray-400">Noch keine FAQs hinterlegt.</div>
                )}
              </div>
            </div>
          </div>
        )}
        {activeTab === "settings" && (
          <div className="mt-16 border-t border-white/10 pt-12">
            <h2 className="text-3xl font-bold text-white mb-2">Settings</h2>
            <p className="text-gray-400 mb-8">
              Konfiguriere E-Mails, Branding, Defaults und Sicherheit zentral.
            </p>

            {(settingsMessage || settingsError) && (
              <div
                className={`mb-6 rounded-2xl border px-4 py-3 text-sm ${
                  settingsError
                    ? "border-red-500/30 bg-red-500/10 text-red-100"
                    : "border-emerald-500/30 bg-emerald-500/10 text-emerald-100"
                }`}
              >
                {settingsError || settingsMessage}
              </div>
            )}
            {(backupMessage || backupError) && (
              <div
                className={`mb-6 rounded-2xl border px-4 py-3 text-sm ${
                  backupError
                    ? "border-red-500/30 bg-red-500/10 text-red-100"
                    : "border-emerald-500/30 bg-emerald-500/10 text-emerald-100"
                }`}
              >
                {backupError || backupMessage}
              </div>
            )}

            <div className="grid gap-6">
              <section className="rounded-3xl border border-white/10 bg-(--surface-2) p-6">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-xl font-semibold text-white">
                    E-Mail Einstellungen
                  </h3>
                  <button
                    type="button"
                    onClick={() =>
                      resetSection([
                        "emailFromName",
                        "emailReplyTo",
                        "emailBccEnabled",
                        "emailBccAddress",
                        "emailSubjectInquiryOwner",
                        "emailSubjectInquiryCustomer",
                        "emailSubjectNewAccount",
                        "emailSubjectVerification",
                        "emailSubjectStatus",
                        "emailSubjectCustomDefault",
                      ])
                    }
                    className="text-xs text-purple-300 hover:text-purple-200"
                  >
                    Bereich zurücksetzen
                  </button>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="text-sm text-gray-300">
                    <span className="flex items-center justify-between">
                      <span>Absendername</span>
                      <button
                        type="button"
                        onClick={() => resetSetting("emailFromName")}
                        className="text-xs text-purple-300 hover:text-purple-200"
                      >
                        Standard
                      </button>
                    </span>
                    <input
                      value={settings.emailFromName}
                      onChange={(event) =>
                        setSettings((prev) => ({
                          ...prev,
                          emailFromName: event.target.value,
                        }))
                      }
                      className="mt-2 w-full rounded-xl bg-(--surface-3) border border-white/10 px-4 py-2 text-white"
                      placeholder="Rohde Audio"
                    />
                  </label>
                  <label className="text-sm text-gray-300">
                    <span className="flex items-center justify-between">
                      <span>Reply-To Adresse</span>
                      <button
                        type="button"
                        onClick={() => resetSetting("emailReplyTo")}
                        className="text-xs text-purple-300 hover:text-purple-200"
                      >
                        Standard
                      </button>
                    </span>
                    <input
                      value={settings.emailReplyTo}
                      onChange={(event) =>
                        setSettings((prev) => ({
                          ...prev,
                          emailReplyTo: event.target.value,
                        }))
                      }
                      className="mt-2 w-full rounded-xl bg-(--surface-3) border border-white/10 px-4 py-2 text-white"
                      placeholder="info@rohde-audio.com"
                    />
                  </label>
                  <label className="flex items-center gap-3 text-sm text-gray-300">
                    <input
                      type="checkbox"
                      checked={settings.emailBccEnabled}
                      onChange={(event) =>
                        setSettings((prev) => ({
                          ...prev,
                          emailBccEnabled: event.target.checked,
                        }))
                      }
                      className="h-4 w-4 rounded border-white/20 bg-(--surface-3) text-purple-500 focus:ring-purple-500"
                    />
                    <span className="flex flex-1 items-center justify-between">
                      <span>BCC an Admin senden</span>
                      <button
                        type="button"
                        onClick={() => resetSetting("emailBccEnabled")}
                        className="text-xs text-purple-300 hover:text-purple-200"
                      >
                        Standard
                      </button>
                    </span>
                  </label>
                  <label className="text-sm text-gray-300">
                    <span className="flex items-center justify-between">
                      <span>BCC-Adresse</span>
                      <button
                        type="button"
                        onClick={() => resetSetting("emailBccAddress")}
                        className="text-xs text-purple-300 hover:text-purple-200"
                      >
                        Standard
                      </button>
                    </span>
                    <input
                      value={settings.emailBccAddress}
                      onChange={(event) =>
                        setSettings((prev) => ({
                          ...prev,
                          emailBccAddress: event.target.value,
                        }))
                      }
                      className="mt-2 w-full rounded-xl bg-(--surface-3) border border-white/10 px-4 py-2 text-white"
                      placeholder="info@rohde-audio.com"
                    />
                  </label>
                </div>
                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  <label className="text-sm text-gray-300">
                    <span className="flex items-center justify-between">
                      <span>Betreff (Anfrage an Admin)</span>
                      <button
                        type="button"
                        onClick={() => resetSetting("emailSubjectInquiryOwner")}
                        className="text-xs text-purple-300 hover:text-purple-200"
                      >
                        Standard
                      </button>
                    </span>
                    <input
                      value={settings.emailSubjectInquiryOwner}
                      onChange={(event) =>
                        setSettings((prev) => ({
                          ...prev,
                          emailSubjectInquiryOwner: event.target.value,
                        }))
                      }
                      className="mt-2 w-full rounded-xl bg-(--surface-3) border border-white/10 px-4 py-2 text-white"
                      placeholder="Neue Anfrage von {name}"
                    />
                  </label>
                  <label className="text-sm text-gray-300">
                    <span className="flex items-center justify-between">
                      <span>Betreff (Bestätigung an Kunde)</span>
                      <button
                        type="button"
                        onClick={() => resetSetting("emailSubjectInquiryCustomer")}
                        className="text-xs text-purple-300 hover:text-purple-200"
                      >
                        Standard
                      </button>
                    </span>
                    <input
                      value={settings.emailSubjectInquiryCustomer}
                      onChange={(event) =>
                        setSettings((prev) => ({
                          ...prev,
                          emailSubjectInquiryCustomer: event.target.value,
                        }))
                      }
                      className="mt-2 w-full rounded-xl bg-(--surface-3) border border-white/10 px-4 py-2 text-white"
                      placeholder="Danke für deine Anfrage!"
                    />
                  </label>
                  <label className="text-sm text-gray-300">
                    <span className="flex items-center justify-between">
                      <span>Betreff (Neuer Account)</span>
                      <button
                        type="button"
                        onClick={() => resetSetting("emailSubjectNewAccount")}
                        className="text-xs text-purple-300 hover:text-purple-200"
                      >
                        Standard
                      </button>
                    </span>
                    <input
                      value={settings.emailSubjectNewAccount}
                      onChange={(event) =>
                        setSettings((prev) => ({
                          ...prev,
                          emailSubjectNewAccount: event.target.value,
                        }))
                      }
                      className="mt-2 w-full rounded-xl bg-(--surface-3) border border-white/10 px-4 py-2 text-white"
                      placeholder="Neuer Account registriert"
                    />
                  </label>
                  <label className="text-sm text-gray-300">
                    <span className="flex items-center justify-between">
                      <span>Betreff (Verifizierungscode)</span>
                      <button
                        type="button"
                        onClick={() => resetSetting("emailSubjectVerification")}
                        className="text-xs text-purple-300 hover:text-purple-200"
                      >
                        Standard
                      </button>
                    </span>
                    <input
                      value={settings.emailSubjectVerification}
                      onChange={(event) =>
                        setSettings((prev) => ({
                          ...prev,
                          emailSubjectVerification: event.target.value,
                        }))
                      }
                      className="mt-2 w-full rounded-xl bg-(--surface-3) border border-white/10 px-4 py-2 text-white"
                      placeholder="Bestätigungscode für deinen Account"
                    />
                  </label>
                  <label className="text-sm text-gray-300">
                    <span className="flex items-center justify-between">
                      <span>Betreff (Status-Update)</span>
                      <button
                        type="button"
                        onClick={() => resetSetting("emailSubjectStatus")}
                        className="text-xs text-purple-300 hover:text-purple-200"
                      >
                        Standard
                      </button>
                    </span>
                    <input
                      value={settings.emailSubjectStatus}
                      onChange={(event) =>
                        setSettings((prev) => ({
                          ...prev,
                          emailSubjectStatus: event.target.value,
                        }))
                      }
                      className="mt-2 w-full rounded-xl bg-(--surface-3) border border-white/10 px-4 py-2 text-white"
                      placeholder="Update zu deiner Anfrage"
                    />
                  </label>
                  <label className="text-sm text-gray-300">
                    <span className="flex items-center justify-between">
                      <span>Betreff (Admin Mail Standard)</span>
                      <button
                        type="button"
                        onClick={() => resetSetting("emailSubjectCustomDefault")}
                        className="text-xs text-purple-300 hover:text-purple-200"
                      >
                        Standard
                      </button>
                    </span>
                    <input
                      value={settings.emailSubjectCustomDefault}
                      onChange={(event) =>
                        setSettings((prev) => ({
                          ...prev,
                          emailSubjectCustomDefault: event.target.value,
                        }))
                      }
                      className="mt-2 w-full rounded-xl bg-(--surface-3) border border-white/10 px-4 py-2 text-white"
                      placeholder="Nachricht von Rohde Audio"
                    />
                  </label>
                </div>
                <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-[0.3em] text-purple-300 mb-3">
                    E-Mail Vorschau
                  </p>
                  <div className="overflow-hidden rounded-2xl border border-white/10 bg-white">
                    <div
                      style={{
                        background: `linear-gradient(135deg, ${settings.brandPrimary}, ${settings.brandSecondary})`,
                      }}
                      className="px-5 py-4 text-white"
                    >
                      {settings.brandLogoUrl ? (
                        <img
                          src={settings.brandLogoUrl}
                          alt={settings.brandName || "Logo"}
                          className="h-7 mb-3 object-contain"
                        />
                      ) : null}
                      <div className="text-xs uppercase tracking-[0.3em] opacity-80">
                        {settings.brandName || SETTINGS_DEFAULTS.brandName}
                      </div>
                      <div className="text-lg font-semibold">
                        {settings.emailSubjectInquiryCustomer || SETTINGS_DEFAULTS.emailSubjectInquiryCustomer}
                      </div>
                    </div>
                    <div className="px-5 py-4 text-sm text-gray-700">
                      <p className="mb-3">Hallo Max,</p>
                      <p className="mb-4">
                        danke fuer deine Anfrage. Wir melden uns schnellstmoeglich.
                      </p>
                      <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 text-gray-700">
                        Anfrage Beispieltext …
                      </div>
                      {settings.brandEmailFooter ? (
                        <div className="mt-4 text-xs text-gray-500">
                          {settings.brandEmailFooter}
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
              </section>

              <section className="rounded-3xl border border-white/10 bg-(--surface-2) p-6">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-xl font-semibold text-white">
                    Anfragen Defaults
                  </h3>
                  <button
                    type="button"
                    onClick={() =>
                      resetSection([
                        "inquiryDefaultStatus",
                        "inquiryStatusEmailEnabled",
                      ])
                    }
                    className="text-xs text-purple-300 hover:text-purple-200"
                  >
                    Bereich zurücksetzen
                  </button>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="text-sm text-gray-300">
                    <span className="flex items-center justify-between">
                      <span>Standard-Status</span>
                      <button
                        type="button"
                        onClick={() => resetSetting("inquiryDefaultStatus")}
                        className="text-xs text-purple-300 hover:text-purple-200"
                      >
                        Standard
                      </button>
                    </span>
                    <select
                      value={settings.inquiryDefaultStatus}
                      onChange={(event) =>
                        setSettings((prev) => ({
                          ...prev,
                          inquiryDefaultStatus: event.target.value,
                        }))
                      }
                      className="mt-2 w-full rounded-xl bg-(--surface-3) border border-white/10 px-4 py-2 text-white"
                    >
                      <option value="open">Offen</option>
                      <option value="in_progress">In Bearbeitung</option>
                      <option value="planning">In Planung</option>
                      <option value="confirmed">Bestätigt</option>
                      <option value="done">Abgeschlossen</option>
                      <option value="rejected">Abgelehnt</option>
                    </select>
                  </label>
                  <label className="flex items-center gap-3 text-sm text-gray-300">
                    <input
                      type="checkbox"
                      checked={settings.inquiryStatusEmailEnabled}
                      onChange={(event) =>
                        setSettings((prev) => ({
                          ...prev,
                          inquiryStatusEmailEnabled: event.target.checked,
                        }))
                      }
                      className="h-4 w-4 rounded border-white/20 bg-(--surface-3) text-purple-500 focus:ring-purple-500"
                    />
                    <span className="flex flex-1 items-center justify-between">
                      <span>Status-Updates per E-Mail senden</span>
                      <button
                        type="button"
                        onClick={() => resetSetting("inquiryStatusEmailEnabled")}
                        className="text-xs text-purple-300 hover:text-purple-200"
                      >
                        Standard
                      </button>
                    </span>
                  </label>
                </div>
              </section>

              <section className="rounded-3xl border border-white/10 bg-(--surface-2) p-6">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-xl font-semibold text-white">
                    E-Mail Branding
                  </h3>
                  <button
                    type="button"
                    onClick={() =>
                      resetSection([
                        "brandName",
                        "brandPrimary",
                        "brandSecondary",
                        "brandLogoUrl",
                        "brandEmailFooter",
                      ])
                    }
                    className="text-xs text-purple-300 hover:text-purple-200"
                  >
                    Bereich zurücksetzen
                  </button>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="text-sm text-gray-300">
                    <span className="flex items-center justify-between">
                      <span>Markenname</span>
                      <button
                        type="button"
                        onClick={() => resetSetting("brandName")}
                        className="text-xs text-purple-300 hover:text-purple-200"
                      >
                        Standard
                      </button>
                    </span>
                    <input
                      value={settings.brandName}
                      onChange={(event) =>
                        setSettings((prev) => ({
                          ...prev,
                          brandName: event.target.value,
                        }))
                      }
                      className="mt-2 w-full rounded-xl bg-(--surface-3) border border-white/10 px-4 py-2 text-white"
                      placeholder="Rohde Audio"
                    />
                  </label>
                  <label className="text-sm text-gray-300">
                    <span className="flex items-center justify-between">
                      <span>Logo URL (optional)</span>
                      <button
                        type="button"
                        onClick={() => resetSetting("brandLogoUrl")}
                        className="text-xs text-purple-300 hover:text-purple-200"
                      >
                        Standard
                      </button>
                    </span>
                    <input
                      value={settings.brandLogoUrl}
                      onChange={(event) =>
                        setSettings((prev) => ({
                          ...prev,
                          brandLogoUrl: event.target.value,
                        }))
                      }
                      className="mt-2 w-full rounded-xl bg-(--surface-3) border border-white/10 px-4 py-2 text-white"
                      placeholder="https://..."
                    />
                  </label>
                  <label className="text-sm text-gray-300">
                    <span className="flex items-center justify-between">
                      <span>Primärfarbe</span>
                      <button
                        type="button"
                        onClick={() => resetSetting("brandPrimary")}
                        className="text-xs text-purple-300 hover:text-purple-200"
                      >
                        Standard
                      </button>
                    </span>
                    <div className="mt-2 flex items-center gap-3">
                      <input
                        type="color"
                        value={settings.brandPrimary}
                        onChange={(event) =>
                          setSettings((prev) => ({
                            ...prev,
                            brandPrimary: event.target.value,
                          }))
                        }
                        className="h-10 w-12 rounded-lg border border-white/10 bg-(--surface-3)"
                      />
                      <input
                        value={settings.brandPrimary}
                        onChange={(event) =>
                          setSettings((prev) => ({
                            ...prev,
                            brandPrimary: event.target.value,
                          }))
                        }
                        className="w-full rounded-xl bg-(--surface-3) border border-white/10 px-4 py-2 text-white"
                        placeholder="#7c3aed"
                      />
                    </div>
                  </label>
                  <label className="text-sm text-gray-300">
                    <span className="flex items-center justify-between">
                      <span>Sekundärfarbe</span>
                      <button
                        type="button"
                        onClick={() => resetSetting("brandSecondary")}
                        className="text-xs text-purple-300 hover:text-purple-200"
                      >
                        Standard
                      </button>
                    </span>
                    <div className="mt-2 flex items-center gap-3">
                      <input
                        type="color"
                        value={settings.brandSecondary}
                        onChange={(event) =>
                          setSettings((prev) => ({
                            ...prev,
                            brandSecondary: event.target.value,
                          }))
                        }
                        className="h-10 w-12 rounded-lg border border-white/10 bg-(--surface-3)"
                      />
                      <input
                        value={settings.brandSecondary}
                        onChange={(event) =>
                          setSettings((prev) => ({
                            ...prev,
                            brandSecondary: event.target.value,
                          }))
                        }
                        className="w-full rounded-xl bg-(--surface-3) border border-white/10 px-4 py-2 text-white"
                        placeholder="#2563eb"
                      />
                    </div>
                  </label>
                  <label className="text-sm text-gray-300 md:col-span-2">
                    <span className="flex items-center justify-between">
                      <span>Footer-Text für E-Mails (optional)</span>
                      <button
                        type="button"
                        onClick={() => resetSetting("brandEmailFooter")}
                        className="text-xs text-purple-300 hover:text-purple-200"
                      >
                        Standard
                      </button>
                    </span>
                    <input
                      value={settings.brandEmailFooter}
                      onChange={(event) =>
                        setSettings((prev) => ({
                          ...prev,
                          brandEmailFooter: event.target.value,
                        }))
                      }
                      className="mt-2 w-full rounded-xl bg-(--surface-3) border border-white/10 px-4 py-2 text-white"
                      placeholder="Zum Beispiel: Rohde Audio · Warburg"
                    />
                  </label>
                </div>
              </section>

              <section className="rounded-3xl border border-white/10 bg-(--surface-2) p-6">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-xl font-semibold text-white">
                    Website UI Farben
                  </h3>
                  <button
                    type="button"
                    onClick={() => resetSection(["uiPrimary", "uiSecondary"])}
                    className="text-xs text-purple-300 hover:text-purple-200"
                  >
                    Bereich zurücksetzen
                  </button>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="text-sm text-gray-300">
                    <span className="flex items-center justify-between">
                      <span>Primärfarbe</span>
                      <button
                        type="button"
                        onClick={() => resetSetting("uiPrimary")}
                        className="text-xs text-purple-300 hover:text-purple-200"
                      >
                        Standard
                      </button>
                    </span>
                    <div className="mt-2 flex items-center gap-3">
                      <input
                        type="color"
                        value={settings.uiPrimary}
                        onChange={(event) =>
                          setSettings((prev) => ({
                            ...prev,
                            uiPrimary: event.target.value,
                          }))
                        }
                        className="h-10 w-12 rounded-lg border border-white/10 bg-(--surface-3)"
                      />
                      <input
                        value={settings.uiPrimary}
                        onChange={(event) =>
                          setSettings((prev) => ({
                            ...prev,
                            uiPrimary: event.target.value,
                          }))
                        }
                        className="w-full rounded-xl bg-(--surface-3) border border-white/10 px-4 py-2 text-white"
                        placeholder="#a855f7"
                      />
                    </div>
                  </label>
                  <label className="text-sm text-gray-300">
                    <span className="flex items-center justify-between">
                      <span>Sekundärfarbe</span>
                      <button
                        type="button"
                        onClick={() => resetSetting("uiSecondary")}
                        className="text-xs text-purple-300 hover:text-purple-200"
                      >
                        Standard
                      </button>
                    </span>
                    <div className="mt-2 flex items-center gap-3">
                      <input
                        type="color"
                        value={settings.uiSecondary}
                        onChange={(event) =>
                          setSettings((prev) => ({
                            ...prev,
                            uiSecondary: event.target.value,
                          }))
                        }
                        className="h-10 w-12 rounded-lg border border-white/10 bg-(--surface-3)"
                      />
                      <input
                        value={settings.uiSecondary}
                        onChange={(event) =>
                          setSettings((prev) => ({
                            ...prev,
                            uiSecondary: event.target.value,
                          }))
                        }
                        className="w-full rounded-xl bg-(--surface-3) border border-white/10 px-4 py-2 text-white"
                        placeholder="#2563eb"
                      />
                    </div>
                  </label>
                </div>
              </section>

              <section className="rounded-3xl border border-white/10 bg-(--surface-2) p-6">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-xl font-semibold text-white">
                    Wartungsmodus
                  </h3>
                  <button
                    type="button"
                    onClick={() =>
                      resetSection([
                        "maintenanceEnabled",
                        "maintenanceMessage",
                        "maintenanceBypassIps",
                      ])
                    }
                    className="text-xs text-purple-300 hover:text-purple-200"
                  >
                    Bereich zurücksetzen
                  </button>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="flex items-center gap-3 text-sm text-gray-300">
                    <input
                      type="checkbox"
                      checked={settings.maintenanceEnabled}
                      onChange={(event) =>
                        setSettings((prev) => ({
                          ...prev,
                          maintenanceEnabled: event.target.checked,
                        }))
                      }
                      className="h-4 w-4 rounded border-white/20 bg-(--surface-3) text-purple-500 focus:ring-purple-500"
                    />
                    <span className="flex flex-1 items-center justify-between">
                      <span>Wartungsmodus aktivieren</span>
                      <button
                        type="button"
                        onClick={() => resetSetting("maintenanceEnabled")}
                        className="text-xs text-purple-300 hover:text-purple-200"
                      >
                        Standard
                      </button>
                    </span>
                  </label>
                  <label className="text-sm text-gray-300 md:col-span-2">
                    <span className="flex items-center justify-between">
                      <span>Hinweistext</span>
                      <button
                        type="button"
                        onClick={() => resetSetting("maintenanceMessage")}
                        className="text-xs text-purple-300 hover:text-purple-200"
                      >
                        Standard
                      </button>
                    </span>
                    <input
                      value={settings.maintenanceMessage}
                      onChange={(event) =>
                        setSettings((prev) => ({
                          ...prev,
                          maintenanceMessage: event.target.value,
                        }))
                      }
                      className="mt-2 w-full rounded-xl bg-(--surface-3) border border-white/10 px-4 py-2 text-white"
                      placeholder="Wir sind bald zurück."
                    />
                  </label>
                  <label className="text-sm text-gray-300 md:col-span-2">
                    <span className="flex items-center justify-between">
                      <span>Bypass IPs (kommagetrennt)</span>
                      <button
                        type="button"
                        onClick={() => resetSetting("maintenanceBypassIps")}
                        className="text-xs text-purple-300 hover:text-purple-200"
                      >
                        Standard
                      </button>
                    </span>
                    <input
                      value={settings.maintenanceBypassIps}
                      onChange={(event) =>
                        setSettings((prev) => ({
                          ...prev,
                          maintenanceBypassIps: event.target.value,
                        }))
                      }
                      className="mt-2 w-full rounded-xl bg-(--surface-3) border border-white/10 px-4 py-2 text-white"
                      placeholder="127.0.0.1, 203.0.113.42"
                    />
                  </label>
                </div>
              </section>

              <section className="rounded-3xl border border-white/10 bg-(--surface-2) p-6">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-xl font-semibold text-white">
                    Analytics
                  </h3>
                  <button
                    type="button"
                    onClick={() => resetSection(["analyticsEnabled"])}
                    className="text-xs text-purple-300 hover:text-purple-200"
                  >
                    Bereich zurücksetzen
                  </button>
                </div>
                <label className="flex items-center gap-3 text-sm text-gray-300">
                  <input
                    type="checkbox"
                    checked={settings.analyticsEnabled}
                    onChange={(event) =>
                      setSettings((prev) => ({
                        ...prev,
                        analyticsEnabled: event.target.checked,
                      }))
                      }
                      className="h-4 w-4 rounded border-white/20 bg-(--surface-3) text-purple-500 focus:ring-purple-500"
                    />
                  <span className="flex flex-1 items-center justify-between">
                    <span>Tracking aktivieren (Pageviews & CTAs)</span>
                    <button
                      type="button"
                      onClick={() => resetSetting("analyticsEnabled")}
                      className="text-xs text-purple-300 hover:text-purple-200"
                    >
                      Standard
                    </button>
                  </span>
                </label>
              </section>

              <section className="rounded-3xl border border-white/10 bg-(--surface-2) p-6">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-xl font-semibold text-white">
                    Sicherheit
                  </h3>
                  <button
                    type="button"
                    onClick={() =>
                      resetSection([
                        "securitySessionDays",
                        "securityLoginLimit",
                        "securityLoginWindowSeconds",
                        "securityContactLimit",
                        "securityContactWindowSeconds",
                      ])
                    }
                    className="text-xs text-purple-300 hover:text-purple-200"
                  >
                    Bereich zurücksetzen
                  </button>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="text-sm text-gray-300">
                    <span className="flex items-center justify-between">
                      <span>Session-Dauer (Tage)</span>
                      <button
                        type="button"
                        onClick={() => resetSetting("securitySessionDays")}
                        className="text-xs text-purple-300 hover:text-purple-200"
                      >
                        Standard
                      </button>
                    </span>
                    <input
                      type="number"
                      min={1}
                      max={60}
                      value={settings.securitySessionDays}
                      onChange={(event) =>
                        setSettings((prev) => ({
                          ...prev,
                          securitySessionDays: Number(event.target.value),
                        }))
                      }
                      className="mt-2 w-full rounded-xl bg-(--surface-3) border border-white/10 px-4 py-2 text-white"
                    />
                  </label>
                  <label className="text-sm text-gray-300">
                    <span className="flex items-center justify-between">
                      <span>Login-Limit (Versuche)</span>
                      <button
                        type="button"
                        onClick={() => resetSetting("securityLoginLimit")}
                        className="text-xs text-purple-300 hover:text-purple-200"
                      >
                        Standard
                      </button>
                    </span>
                    <input
                      type="number"
                      min={1}
                      max={50}
                      value={settings.securityLoginLimit}
                      onChange={(event) =>
                        setSettings((prev) => ({
                          ...prev,
                          securityLoginLimit: Number(event.target.value),
                        }))
                      }
                      className="mt-2 w-full rounded-xl bg-(--surface-3) border border-white/10 px-4 py-2 text-white"
                    />
                  </label>
                  <label className="text-sm text-gray-300">
                    <span className="flex items-center justify-between">
                      <span>Login-Zeitfenster (Sekunden)</span>
                      <button
                        type="button"
                        onClick={() => resetSetting("securityLoginWindowSeconds")}
                        className="text-xs text-purple-300 hover:text-purple-200"
                      >
                        Standard
                      </button>
                    </span>
                    <input
                      type="number"
                      min={30}
                      max={3600}
                      value={settings.securityLoginWindowSeconds}
                      onChange={(event) =>
                        setSettings((prev) => ({
                          ...prev,
                          securityLoginWindowSeconds: Number(event.target.value),
                        }))
                      }
                      className="mt-2 w-full rounded-xl bg-(--surface-3) border border-white/10 px-4 py-2 text-white"
                    />
                  </label>
                  <label className="text-sm text-gray-300">
                    <span className="flex items-center justify-between">
                      <span>Kontakt-Limit (pro Minute)</span>
                      <button
                        type="button"
                        onClick={() => resetSetting("securityContactLimit")}
                        className="text-xs text-purple-300 hover:text-purple-200"
                      >
                        Standard
                      </button>
                    </span>
                    <input
                      type="number"
                      min={1}
                      max={50}
                      value={settings.securityContactLimit}
                      onChange={(event) =>
                        setSettings((prev) => ({
                          ...prev,
                          securityContactLimit: Number(event.target.value),
                        }))
                      }
                      className="mt-2 w-full rounded-xl bg-(--surface-3) border border-white/10 px-4 py-2 text-white"
                    />
                  </label>
                  <label className="text-sm text-gray-300">
                    <span className="flex items-center justify-between">
                      <span>Kontakt-Zeitfenster (Sekunden)</span>
                      <button
                        type="button"
                        onClick={() => resetSetting("securityContactWindowSeconds")}
                        className="text-xs text-purple-300 hover:text-purple-200"
                      >
                        Standard
                      </button>
                    </span>
                    <input
                      type="number"
                      min={30}
                      max={3600}
                      value={settings.securityContactWindowSeconds}
                      onChange={(event) =>
                        setSettings((prev) => ({
                          ...prev,
                          securityContactWindowSeconds: Number(event.target.value),
                        }))
                      }
                      className="mt-2 w-full rounded-xl bg-(--surface-3) border border-white/10 px-4 py-2 text-white"
                    />
                  </label>
                </div>
              </section>

              <section className="rounded-3xl border border-white/10 bg-(--surface-2) p-6">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-xl font-semibold text-white">
                    Backup-Hinweis
                  </h3>
                  <button
                    type="button"
                    onClick={() => resetSection(["backupLastNote"])}
                    className="text-xs text-purple-300 hover:text-purple-200"
                  >
                    Bereich zurücksetzen
                  </button>
                </div>
                <label className="text-sm text-gray-300">
                  <span className="flex items-center justify-between">
                    <span>Letztes Backup (Notiz)</span>
                    <button
                      type="button"
                      onClick={() => resetSetting("backupLastNote")}
                      className="text-xs text-purple-300 hover:text-purple-200"
                    >
                      Standard
                    </button>
                  </span>
                  <input
                    value={settings.backupLastNote}
                    onChange={(event) =>
                      setSettings((prev) => ({
                        ...prev,
                        backupLastNote: event.target.value,
                      }))
                    }
                    className="mt-2 w-full rounded-xl bg-(--surface-3) border border-white/10 px-4 py-2 text-white"
                    placeholder="z. B. 2026-01-27 22:00"
                  />
                </label>
              </section>

              <section className="rounded-3xl border border-white/10 bg-(--surface-2) p-6">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-xl font-semibold text-white">
                    Backup Download & Restore
                  </h3>
                </div>
                <p className="text-sm text-gray-400 mb-4">
                  Erstellt ein ZIP mit Datenbank, Settings und Uploads. Ein Restore
                  benötigt danach einen Server-Neustart.
                </p>
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={handleDownloadBackup}
                    className="rounded-full border border-white/20 px-5 py-2 text-xs font-semibold uppercase tracking-wide text-white transition hover:-translate-y-0.5 hover:border-purple-300/70 hover:text-purple-200"
                  >
                    Backup herunterladen
                  </button>
                  <label className="flex items-center gap-3 text-xs text-gray-300">
                    <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2">
                      {backupFile ? backupFile.name : "ZIP-Datei wählen"}
                    </span>
                    <input
                      type="file"
                      accept=".zip"
                      onChange={(event) =>
                        setBackupFile(event.target.files?.[0] ?? null)
                      }
                      className="hidden"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={handleUploadBackup}
                    disabled={backupUploading}
                    className="rounded-full border border-white/20 px-5 py-2 text-xs font-semibold uppercase tracking-wide text-white transition hover:-translate-y-0.5 hover:border-purple-300/70 hover:text-purple-200 disabled:opacity-60"
                  >
                    {backupUploading ? "Restore läuft..." : "Backup einspielen"}
                  </button>
                </div>
              </section>
            </div>

            <div className="mt-10 flex items-center gap-4">
              <button
                type="button"
                onClick={handleSaveSettings}
                disabled={settingsSaving}
                className="btn-primary rounded-full px-6 py-2 text-sm font-semibold text-white transition hover:scale-[1.02] disabled:opacity-60"
                style={{ backgroundColor: theme.primary }}
              >
                {settingsSaving ? "Speichern..." : "Settings speichern"}
              </button>
              <span className="text-xs text-gray-400">
                Änderungen gelten sofort nach dem Speichern.
              </span>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
