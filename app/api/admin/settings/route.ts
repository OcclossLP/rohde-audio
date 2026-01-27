import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { requireCsrf } from "@/lib/csrf";
import {
  DEFAULT_SETTINGS,
  INQUIRY_STATUSES,
  getSettings,
  normalizeInquiryStatus,
} from "@/lib/settings";

export async function GET() {
  const user = await requireAdmin();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const settings = getSettings();
  return NextResponse.json(settings);
}

export async function POST(request: Request) {
  if (!(await requireCsrf(request))) {
    return NextResponse.json({ error: "Ungültige Anfrage." }, { status: 403 });
  }
  const user = await requireAdmin();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) ?? {};
  const payload = (body?.settings ?? body) || {};

  const updates: Array<[string, string]> = [];
  const errors: string[] = [];
  const colorPattern = /^#([0-9a-fA-F]{3}){1,2}$/;

  const setIfDefined = (key: string, value: string | null | undefined) => {
    if (value === undefined || value === null) return;
    updates.push([key, value]);
  };

  const normalizeBool = (value: unknown) =>
    value === true || value === "true" || value === "1" ? "1" : "0";

  if (payload.faq_limit !== undefined) {
    const faqLimit = Number(payload.faq_limit);
    if (!Number.isFinite(faqLimit) || faqLimit < 1 || faqLimit > 12) {
      errors.push("FAQ-Limit muss zwischen 1 und 12 liegen.");
    } else {
      updates.push(["faq_limit", String(faqLimit)]);
    }
  }

  setIfDefined(
    "email_from_name",
    typeof payload.email_from_name === "string"
      ? payload.email_from_name.trim().slice(0, 80)
      : undefined
  );
  if (payload.ui_primary !== undefined) {
    const value = typeof payload.ui_primary === "string" ? payload.ui_primary.trim() : "";
    if (value && !colorPattern.test(value)) {
      errors.push("UI-Primärfarbe muss ein gültiger Hex-Wert sein (z. B. #a855f7).");
    } else {
      updates.push(["ui_primary", value || DEFAULT_SETTINGS.ui_primary]);
    }
  }
  if (payload.ui_secondary !== undefined) {
    const value = typeof payload.ui_secondary === "string" ? payload.ui_secondary.trim() : "";
    if (value && !colorPattern.test(value)) {
      errors.push("UI-Sekundärfarbe muss ein gültiger Hex-Wert sein (z. B. #2563eb).");
    } else {
      updates.push(["ui_secondary", value || DEFAULT_SETTINGS.ui_secondary]);
    }
  }
  setIfDefined(
    "email_reply_to",
    typeof payload.email_reply_to === "string"
      ? payload.email_reply_to.trim().slice(0, 120)
      : undefined
  );
  if (payload.email_bcc_enabled !== undefined) {
    updates.push(["email_bcc_enabled", normalizeBool(payload.email_bcc_enabled)]);
  }
  setIfDefined(
    "email_bcc_address",
    typeof payload.email_bcc_address === "string"
      ? payload.email_bcc_address.trim().slice(0, 120)
      : undefined
  );

  const subjectKeys = [
    "email_subject_inquiry_owner",
    "email_subject_inquiry_customer",
    "email_subject_new_account",
    "email_subject_verification",
    "email_subject_status",
    "email_subject_custom_default",
  ] as const;
  subjectKeys.forEach((key) => {
    const value = payload[key];
    if (typeof value === "string") {
      updates.push([key, value.trim().slice(0, 140)]);
    }
  });

  if (payload.inquiry_default_status !== undefined) {
    const normalized = normalizeInquiryStatus(payload.inquiry_default_status);
    if (!normalized) {
      errors.push(
        `Standard-Status muss einer der folgenden Werte sein: ${INQUIRY_STATUSES.join(
          ", "
        )}.`
      );
    } else {
      updates.push(["inquiry_default_status", normalized]);
    }
  }
  if (payload.inquiry_status_email_enabled !== undefined) {
    updates.push([
      "inquiry_status_email_enabled",
      normalizeBool(payload.inquiry_status_email_enabled),
    ]);
  }

  setIfDefined(
    "brand_name",
    typeof payload.brand_name === "string"
      ? payload.brand_name.trim().slice(0, 120)
      : undefined
  );
  if (payload.brand_primary !== undefined) {
    const value =
      typeof payload.brand_primary === "string"
        ? payload.brand_primary.trim()
        : "";
    if (value && !colorPattern.test(value)) {
      errors.push("Primärfarbe muss ein gültiger Hex-Wert sein (z. B. #7c3aed).");
    } else {
      updates.push(["brand_primary", value || DEFAULT_SETTINGS.brand_primary]);
    }
  }
  if (payload.brand_secondary !== undefined) {
    const value =
      typeof payload.brand_secondary === "string"
        ? payload.brand_secondary.trim()
        : "";
    if (value && !colorPattern.test(value)) {
      errors.push("Sekundärfarbe muss ein gültiger Hex-Wert sein (z. B. #2563eb).");
    } else {
      updates.push(["brand_secondary", value || DEFAULT_SETTINGS.brand_secondary]);
    }
  }
  setIfDefined(
    "brand_logo_url",
    typeof payload.brand_logo_url === "string"
      ? payload.brand_logo_url.trim().slice(0, 400)
      : undefined
  );
  setIfDefined(
    "brand_email_footer",
    typeof payload.brand_email_footer === "string"
      ? payload.brand_email_footer.trim().slice(0, 240)
      : undefined
  );

  if (payload.maintenance_enabled !== undefined) {
    updates.push(["maintenance_enabled", normalizeBool(payload.maintenance_enabled)]);
  }
  setIfDefined(
    "maintenance_message",
    typeof payload.maintenance_message === "string"
      ? payload.maintenance_message.trim().slice(0, 240)
      : undefined
  );
  setIfDefined(
    "maintenance_bypass_ips",
    typeof payload.maintenance_bypass_ips === "string"
      ? payload.maintenance_bypass_ips.trim().slice(0, 500)
      : undefined
  );

  if (payload.analytics_enabled !== undefined) {
    updates.push(["analytics_enabled", normalizeBool(payload.analytics_enabled)]);
  }

  if (payload.security_session_days !== undefined) {
    const days = Number(payload.security_session_days);
    if (!Number.isFinite(days) || days < 1 || days > 60) {
      errors.push("Session-Dauer muss zwischen 1 und 60 Tagen liegen.");
    } else {
      updates.push(["security_session_days", String(days)]);
    }
  }
  if (payload.security_login_limit !== undefined) {
    const limit = Number(payload.security_login_limit);
    if (!Number.isFinite(limit) || limit < 1 || limit > 50) {
      errors.push("Login-Limit muss zwischen 1 und 50 liegen.");
    } else {
      updates.push(["security_login_limit", String(limit)]);
    }
  }
  if (payload.security_login_window_seconds !== undefined) {
    const windowSeconds = Number(payload.security_login_window_seconds);
    if (!Number.isFinite(windowSeconds) || windowSeconds < 30 || windowSeconds > 3600) {
      errors.push("Login-Zeitfenster muss zwischen 30 und 3600 Sekunden liegen.");
    } else {
      updates.push(["security_login_window_seconds", String(windowSeconds)]);
    }
  }
  if (payload.security_contact_limit !== undefined) {
    const limit = Number(payload.security_contact_limit);
    if (!Number.isFinite(limit) || limit < 1 || limit > 50) {
      errors.push("Kontakt-Limit muss zwischen 1 und 50 liegen.");
    } else {
      updates.push(["security_contact_limit", String(limit)]);
    }
  }
  if (payload.security_contact_window_seconds !== undefined) {
    const windowSeconds = Number(payload.security_contact_window_seconds);
    if (!Number.isFinite(windowSeconds) || windowSeconds < 30 || windowSeconds > 3600) {
      errors.push("Kontakt-Zeitfenster muss zwischen 30 und 3600 Sekunden liegen.");
    } else {
      updates.push(["security_contact_window_seconds", String(windowSeconds)]);
    }
  }

  setIfDefined(
    "backup_last_note",
    typeof payload.backup_last_note === "string"
      ? payload.backup_last_note.trim().slice(0, 240)
      : undefined
  );

  if (errors.length) {
    return NextResponse.json({ error: errors.join(" ") }, { status: 400 });
  }

  const statement = db.prepare(
    `
      INSERT INTO settings (key, value)
      VALUES (?, ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value
    `
  );
  const transaction = db.transaction((items: Array<[string, string]>) => {
    items.forEach(([key, value]) => statement.run(key, value));
  });
  transaction(updates);

  const settings = getSettings();
  return NextResponse.json({ success: true, settings });
}
