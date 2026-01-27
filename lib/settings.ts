import { db } from "./db";

export const DEFAULT_SETTINGS: Record<string, string> = {
  faq_limit: "6",
  ui_primary: "#a855f7",
  ui_secondary: "#2563eb",
  email_from_name: "Rohde Audio",
  email_reply_to: "",
  email_bcc_enabled: "1",
  email_bcc_address: "",
  email_subject_inquiry_owner: "Neue Anfrage von {name}",
  email_subject_inquiry_customer: "Danke für deine Anfrage!",
  email_subject_new_account: "Neuer Account registriert",
  email_subject_verification: "Bestätigungscode für deinen Account",
  email_subject_status: "Update zu deiner Anfrage",
  email_subject_custom_default: "Nachricht von Rohde Audio",
  inquiry_default_status: "open",
  inquiry_status_email_enabled: "1",
  brand_name: "Rohde Audio",
  brand_primary: "#7c3aed",
  brand_secondary: "#2563eb",
  brand_logo_url: "",
  brand_email_footer: "",
  maintenance_enabled: "0",
  maintenance_message: "Wir sind bald zurück.",
  maintenance_bypass_ips: "",
  analytics_enabled: "1",
  security_session_days: "14",
  security_login_limit: "8",
  security_login_window_seconds: "60",
  security_contact_limit: "6",
  security_contact_window_seconds: "60",
  backup_last_note: "",
};

export const INQUIRY_STATUSES = [
  "open",
  "in_progress",
  "planning",
  "confirmed",
  "done",
  "rejected",
] as const;

export function getSettings() {
  const rows = db
    .prepare("SELECT key, value FROM settings")
    .all() as Array<{ key: string; value: string }>;
  const map = rows.reduce<Record<string, string>>((acc, row) => {
    acc[row.key] = row.value;
    return acc;
  }, {});
  return { ...DEFAULT_SETTINGS, ...map };
}

export function getSettingValue(key: string, fallback?: string) {
  const row = db
    .prepare("SELECT value FROM settings WHERE key = ?")
    .get(key) as { value: string } | undefined;
  if (row?.value !== undefined) return row.value;
  if (fallback !== undefined) return fallback;
  return DEFAULT_SETTINGS[key] ?? "";
}

export function getSettingBool(key: string, fallback = false) {
  const raw = getSettingValue(key, fallback ? "1" : "0");
  return ["1", "true", "yes", "on"].includes(raw.toLowerCase());
}

export function getSettingNumber(key: string, fallback: number) {
  const raw = getSettingValue(key, String(fallback));
  const value = Number(raw);
  return Number.isFinite(value) ? value : fallback;
}

export function normalizeInquiryStatus(value: string | null | undefined) {
  if (!value) return null;
  const normalized = value.trim().toLowerCase();
  if ((INQUIRY_STATUSES as readonly string[]).includes(normalized)) {
    return normalized;
  }
  return null;
}
