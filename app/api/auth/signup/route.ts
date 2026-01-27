import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import crypto from "crypto";
import { db } from "@/lib/db";
import { createSession, SESSION_COOKIE } from "@/lib/auth";
import { hashPassword } from "@/lib/password";
import { sendInquiryEmails, sendNewAccountEmail, sendVerificationEmail } from "@/lib/email";
import { requireCsrf } from "@/lib/csrf";
import { getClientIp, rateLimit } from "@/lib/rateLimit";
import { getSettingValue, normalizeInquiryStatus } from "@/lib/settings";
import { generateCustomerNumber, generateOrderNumber } from "@/lib/ids";

const normalizePhone = (value: string) => value.replace(/\s+/g, "");

export async function POST(request: Request) {
  if (!(await requireCsrf(request))) {
    return NextResponse.json({ error: "Ungültige Anfrage." }, { status: 403 });
  }
  const ip = getClientIp(request);
  const limit = rateLimit(`signup:${ip}`, 5, 60_000);
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Zu viele Registrierungen. Bitte später erneut versuchen." },
      { status: 429 }
    );
  }
  const body = await request.json();
  const email = String(body?.email ?? "").trim().toLowerCase();
  const phoneInput = typeof body?.phone === "string" ? body.phone.trim() : "";
  const phone = phoneInput ? normalizePhone(phoneInput) : null;
  const firstName = typeof body?.firstName === "string" ? body.firstName.trim() : "";
  const lastName = typeof body?.lastName === "string" ? body.lastName.trim() : "";
  const password = String(body?.password ?? "");
  const inquiry =
    body?.inquiry && typeof body.inquiry === "object"
      ? {
          eventType:
            typeof body.inquiry.eventType === "string"
              ? body.inquiry.eventType.trim()
              : "",
          participants:
            typeof body.inquiry.participants === "string"
              ? body.inquiry.participants.trim()
              : "",
          eventDate:
            typeof body.inquiry.eventDate === "string"
              ? body.inquiry.eventDate.trim()
              : "",
          message:
            typeof body.inquiry.message === "string"
              ? body.inquiry.message.trim()
              : "",
        }
      : null;

  if (!firstName || !lastName || !email || !password) {
    return NextResponse.json(
      { error: "Vorname, Nachname, E-Mail und Passwort sind erforderlich." },
      { status: 400 }
    );
  }

  const existing = db
    .prepare(
      "SELECT id, deleted_at as deletedAt, is_guest as isGuest, customer_number as customerNumber FROM users WHERE email = ?"
    )
    .get(email) as
    | { id: string; deletedAt: string | null; isGuest: number; customerNumber: string | null }
    | undefined;

  if (phone) {
    const phoneExists = db
      .prepare("SELECT id FROM users WHERE phone = ? AND id <> ?")
      .get(phone, existing?.id ?? "") as { id: string } | undefined;
    if (phoneExists) {
      return NextResponse.json(
        { error: "Diese Telefonnummer ist bereits registriert." },
        { status: 409 }
      );
    }
  }

  const { passwordHash, passwordSalt } = hashPassword(password);
  const now = new Date().toISOString();
  const verificationCode = crypto.randomInt(100000, 999999).toString();
  const verificationExpiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

  let id = existing?.id ?? "";
  let customerNumber = existing?.customerNumber ?? null;

  if (existing && !existing.deletedAt && !existing.isGuest) {
    return NextResponse.json(
      { error: "Diese E-Mail ist bereits registriert." },
      { status: 409 }
    );
  }

  if (!customerNumber) {
    customerNumber = generateCustomerNumber();
  }

  if (existing) {
    db.prepare(
      `
        UPDATE users
        SET phone = ?,
            customer_number = ?,
            name = ?,
            first_name = ?,
            last_name = ?,
            role = ?,
            password_hash = ?,
            password_salt = ?,
            email_verified_at = ?,
            verification_code = ?,
            verification_expires_at = ?,
            verification_sent_at = ?,
            updated_at = ?,
            deleted_at = NULL,
            is_guest = 0
        WHERE id = ?
      `
    ).run(
      phone,
      customerNumber,
      `${firstName} ${lastName}`.trim(),
      firstName,
      lastName,
      "CUSTOMER",
      passwordHash,
      passwordSalt,
      null,
      verificationCode,
      verificationExpiresAt,
      now,
      now,
      id
    );
  } else {
    id = crypto.randomUUID();
    db.prepare(
      `
        INSERT INTO users (
          id,
          email,
          phone,
          customer_number,
          name,
          first_name,
          last_name,
          role,
          password_hash,
          password_salt,
          email_verified_at,
          verification_code,
          verification_expires_at,
          verification_sent_at,
          created_at,
          updated_at,
          is_guest
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
      `
    ).run(
      id,
      email,
      phone,
      customerNumber,
      `${firstName} ${lastName}`.trim(),
      firstName,
      lastName,
      "CUSTOMER",
      passwordHash,
      passwordSalt,
      null,
      verificationCode,
      verificationExpiresAt,
      now,
      now,
      now
    );
  }

  try {
    await sendVerificationEmail({
      name: `${firstName} ${lastName}`.trim(),
      email,
      code: verificationCode,
    });
    await sendNewAccountEmail({
      name: `${firstName} ${lastName}`.trim(),
      email,
    });
  } catch (error) {
    console.error("Registrierungs-E-Mail fehlgeschlagen:", error);
  }

  if (inquiry?.message) {
    const inquiryId = crypto.randomUUID();
    const orderNumber = generateOrderNumber();
    const defaultStatus =
      normalizeInquiryStatus(getSettingValue("inquiry_default_status")) || "open";
    db.prepare(
      `
        INSERT INTO inquiries (
          id,
          user_id,
          contact_name,
          contact_email,
          contact_phone,
          event_type,
          participants,
          event_date,
          message,
          order_number,
          status,
          created_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `
    ).run(
      inquiryId,
      id,
      `${firstName} ${lastName}`.trim(),
      email,
      phone,
      inquiry.eventType || null,
      inquiry.participants || null,
      inquiry.eventDate || null,
      inquiry.message,
      orderNumber,
      defaultStatus,
      now
    );

    try {
      await sendInquiryEmails({
        name: `${firstName} ${lastName}`.trim(),
        email,
        phone,
        eventType: inquiry.eventType,
        participants: inquiry.participants,
        eventDate: inquiry.eventDate,
        message: inquiry.message,
        orderNumber,
        customerNumber,
      });
    } catch (error) {
      console.error("Anfrage-E-Mail fehlgeschlagen:", error);
    }
  }

  const { token, expiresAt } = await createSession(id);
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    expires: expiresAt,
    path: "/",
  });

  return NextResponse.json({ success: true });
}
