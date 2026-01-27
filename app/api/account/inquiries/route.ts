import crypto from "crypto";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { sendInquiryEmails } from "@/lib/email";
import { requireCsrf } from "@/lib/csrf";
import { getSettingValue, normalizeInquiryStatus } from "@/lib/settings";
import { generateOrderNumber } from "@/lib/ids";

type InquiryRow = {
  id: string;
  orderNumber: string | null;
  eventType: string | null;
  participants: string | null;
  eventDate: string | null;
  message: string;
  status: string;
  createdAt: string;
};

export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role !== "CUSTOMER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const inquiries = (db
    .prepare(
      `
        SELECT id,
               order_number as orderNumber,
               event_type as eventType,
               participants,
               event_date as eventDate,
               message,
               status,
               created_at as createdAt
        FROM inquiries
        WHERE user_id = ?
        ORDER BY created_at DESC
      `
    )
    .all(user.id) as InquiryRow[]);

  return NextResponse.json(inquiries);
}

export async function POST(request: Request) {
  if (!(await requireCsrf(request))) {
    return NextResponse.json({ error: "Ungültige Anfrage." }, { status: 403 });
  }
  const user = await getCurrentUser();
  if (!user || user.role !== "CUSTOMER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const contact = db
    .prepare(
      `
        SELECT first_name as firstName,
               last_name as lastName,
               email,
               phone,
               customer_number as customerNumber
        FROM users
        WHERE id = ?
      `
    )
    .get(user.id) as
    | {
        firstName: string | null;
        lastName: string | null;
        email: string;
        phone: string | null;
        customerNumber: string | null;
      }
    | undefined;

  const body = await request.json();
  const eventType =
    typeof body?.eventType === "string" ? body.eventType.trim() : "";
  const participants =
    typeof body?.participants === "string" ? body.participants.trim() : "";
  const eventDate =
    typeof body?.eventDate === "string" ? body.eventDate.trim() : "";
  const message = typeof body?.message === "string" ? body.message.trim() : "";

  if (!message) {
    return NextResponse.json(
      { error: "Bitte gib eine Nachricht ein." },
      { status: 400 }
    );
  }

  const id = crypto.randomUUID();
  const orderNumber = generateOrderNumber();
  const createdAt = new Date().toISOString();
  const defaultStatus =
    normalizeInquiryStatus(getSettingValue("inquiry_default_status")) || "open";
  const contactName = contact
    ? `${contact.firstName ?? ""} ${contact.lastName ?? ""}`.trim()
    : "";

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
    id,
    user.id,
    contactName || null,
    contact?.email ?? null,
    contact?.phone ?? null,
    eventType || null,
    participants || null,
    eventDate || null,
    message,
    orderNumber,
    defaultStatus,
    createdAt
  );

  const created = db
    .prepare(
      `
        SELECT id,
               order_number as orderNumber,
               event_type as eventType,
               participants,
               event_date as eventDate,
               message,
               status,
               created_at as createdAt
        FROM inquiries
        WHERE id = ?
      `
    )
    .get(id) as InquiryRow | undefined;

  try {
    await sendInquiryEmails({
      name: contactName || user.email,
      email: contact?.email ?? user.email,
      phone: contact?.phone ?? null,
      eventType,
      participants,
      eventDate,
      message,
      orderNumber,
      customerNumber: contact?.customerNumber ?? null,
    });
  } catch (error) {
    console.error("Anfrage-E-Mail fehlgeschlagen:", error);
  }

  return NextResponse.json(created, { status: 201 });
}
