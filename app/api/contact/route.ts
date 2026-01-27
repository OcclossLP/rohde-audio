import crypto from "crypto";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/password";
import { sendInquiryEmails } from "@/lib/email";
import { requireCsrf } from "@/lib/csrf";
import { getClientIp, rateLimit } from "@/lib/rateLimit";
import {
  getSettingNumber,
  getSettingValue,
  normalizeInquiryStatus,
} from "@/lib/settings";
import { generateCustomerNumber, generateOrderNumber } from "@/lib/ids";

export async function POST(request: Request) {
  try {
    if (!(await requireCsrf(request))) {
      return NextResponse.json({ success: false, error: "Ungültige Anfrage." }, { status: 403 });
    }
    const ip = getClientIp(request);
    const contactLimit = getSettingNumber("security_contact_limit", 6);
    const contactWindowSeconds = getSettingNumber("security_contact_window_seconds", 60);
    const limit = rateLimit(`contact:${ip}`, contactLimit, contactWindowSeconds * 1000);
    if (!limit.ok) {
      return NextResponse.json(
        { success: false, error: "Zu viele Anfragen. Bitte später erneut versuchen." },
        { status: 429 }
      );
    }
    const body = await request.json();
    const firstName =
      typeof body?.firstName === "string" ? body.firstName.trim() : "";
    const lastName =
      typeof body?.lastName === "string" ? body.lastName.trim() : "";
    const legacyName = typeof body?.name === "string" ? body.name.trim() : "";
    const name = legacyName || `${firstName} ${lastName}`.trim();
    const email =
      typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
    const phone = typeof body?.phone === "string" ? body.phone.trim() : "";
    const eventType =
      typeof body?.eventType === "string" ? body.eventType.trim() : "";
    const participants =
      typeof body?.participants === "string" ? body.participants.trim() : "";
    const date = typeof body?.date === "string" ? body.date.trim() : "";
    const message =
      typeof body?.message === "string" ? body.message.trim() : "";

    if (!name || !email || !message) {
      return NextResponse.json(
        { success: false, error: "Name, E-Mail und Nachricht sind erforderlich." },
        { status: 400 }
      );
    }

    const existingUser = db
      .prepare(
        `
          SELECT id,
                 customer_number as customerNumber,
                 first_name as firstName,
                 last_name as lastName,
                 name,
                 role,
                 is_guest as isGuest,
                 deleted_at as deletedAt
          FROM users
          WHERE email = ?
        `
      )
      .get(email) as
      | {
          id: string;
          customerNumber: string | null;
          firstName: string | null;
          lastName: string | null;
          name: string | null;
          role: string;
          isGuest: number;
          deletedAt: string | null;
        }
      | undefined;

    let guestUserId = existingUser?.id ?? null;
    let guestCustomerNumber = existingUser?.customerNumber ?? null;

    if (!guestUserId) {
      const id = crypto.randomUUID();
      const now = new Date().toISOString();
      const customerNumber = generateCustomerNumber();
      const { passwordHash, passwordSalt } = hashPassword(
        crypto.randomBytes(32).toString("hex")
      );
      db.prepare(
        `
          INSERT INTO users (
            id,
            email,
            name,
            first_name,
            last_name,
            customer_number,
            role,
            password_hash,
            password_salt,
            created_at,
            updated_at,
            is_guest
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
        `
      ).run(
        id,
        email,
        name || null,
        firstName || null,
        lastName || null,
        customerNumber,
        "CUSTOMER",
        passwordHash,
        passwordSalt,
        now,
        now
      );
      guestUserId = id;
      guestCustomerNumber = customerNumber;
    } else {
      if (!guestCustomerNumber) {
        const customerNumber = generateCustomerNumber();
        db.prepare("UPDATE users SET customer_number = ? WHERE id = ?").run(
          customerNumber,
          guestUserId
        );
        guestCustomerNumber = customerNumber;
      }
      if (existingUser?.isGuest && name) {
        db.prepare(
          "UPDATE users SET name = ?, first_name = ?, last_name = ?, updated_at = ? WHERE id = ?"
        ).run(
          name || existingUser.name,
          firstName || existingUser.firstName,
          lastName || existingUser.lastName,
          new Date().toISOString(),
          guestUserId
        );
      }
    }

    const inquiryId = crypto.randomUUID();
    const orderNumber = generateOrderNumber();
    const createdAt = new Date().toISOString();
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
      guestUserId,
      name,
      email,
      phone || null,
      eventType || null,
      participants || null,
      date || null,
      message,
      orderNumber,
      defaultStatus,
      createdAt
    );

    try {
      await sendInquiryEmails({
        name,
        email,
        phone,
        eventType,
        participants,
        eventDate: date,
        message,
        orderNumber,
        customerNumber: guestCustomerNumber,
      });
    } catch (error) {
      console.error("Anfrage-E-Mail fehlgeschlagen:", error);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("E‑Mail senden fehlgeschlagen:", error);
    return NextResponse.json({ success: false, error }, { status: 500 });
  }
}
