import { NextResponse } from "next/server";
import crypto from "crypto";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { requireCsrf } from "@/lib/csrf";
import { generateCustomerNumber, generateOrderNumber, isValidOrderNumber } from "@/lib/ids";
import { getSettingValue, normalizeInquiryStatus } from "@/lib/settings";
import { hashPassword } from "@/lib/password";

type InquiryRow = {
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

export async function GET() {
  const user = await requireAdmin();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const inquiries = (db
    .prepare(
      `
        SELECT i.id,
               i.order_number as orderNumber,
               i.contact_name as contactName,
               i.contact_email as contactEmail,
               i.contact_phone as contactPhone,
               i.event_type as eventType,
               i.participants,
               i.event_date as eventDate,
               i.message,
               i.status,
               i.created_at as createdAt,
               u.id as userId,
               u.email,
               u.phone,
               u.customer_number as customerNumber,
               u.first_name as firstName,
               u.last_name as lastName
        FROM inquiries i
        JOIN users u ON u.id = i.user_id
        ORDER BY i.created_at DESC
      `
    )
    .all() as InquiryRow[]);

  return NextResponse.json(inquiries);
}

export async function POST(request: Request) {
  if (!(await requireCsrf(request))) {
    return NextResponse.json({ error: "Ungültige Anfrage." }, { status: 403 });
  }
  const user = await requireAdmin();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const userId = typeof body?.userId === "string" ? body.userId.trim() : "";
  const contactName =
    typeof body?.contactName === "string" ? body.contactName.trim() : "";
  const contactEmail =
    typeof body?.contactEmail === "string"
      ? body.contactEmail.trim().toLowerCase()
      : "";
  const contactPhone =
    typeof body?.contactPhone === "string" ? body.contactPhone.trim() : "";
  const eventType =
    typeof body?.eventType === "string" ? body.eventType.trim() : "";
  const participants =
    typeof body?.participants === "string" ? body.participants.trim() : "";
  const eventDate =
    typeof body?.eventDate === "string" ? body.eventDate.trim() : "";
  const message =
    typeof body?.message === "string" ? body.message.trim() : "";
  const status =
    typeof body?.status === "string" ? normalizeInquiryStatus(body.status) : null;
  const orderNumberInput =
    typeof body?.orderNumber === "string" ? body.orderNumber.trim() : "";

  if (!message) {
    return NextResponse.json(
      { error: "Nachricht ist erforderlich." },
      { status: 400 }
    );
  }

  let assignedUserId = userId;
  if (!assignedUserId) {
    if (!contactEmail) {
      return NextResponse.json(
        { error: "Für eine neue Anfrage ist eine E-Mail erforderlich." },
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
                 is_guest as isGuest
          FROM users
          WHERE email = ?
        `
      )
      .get(contactEmail) as
      | {
          id: string;
          customerNumber: string | null;
          firstName: string | null;
          lastName: string | null;
          name: string | null;
          isGuest: number;
        }
      | undefined;

    if (!existingUser) {
      const now = new Date().toISOString();
      const { passwordHash, passwordSalt } = hashPassword(
        crypto.randomBytes(32).toString("hex")
      );
      const guestId = crypto.randomUUID();
      const customerNumber = generateCustomerNumber();
      const [firstName, ...rest] = contactName ? contactName.split(/\s+/) : [];
      const lastName = rest.join(" ");
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
        guestId,
        contactEmail,
        contactName || null,
        firstName || null,
        lastName || null,
        customerNumber,
        "CUSTOMER",
        passwordHash,
        passwordSalt,
        now,
        now
      );
      assignedUserId = guestId;
    } else {
      assignedUserId = existingUser.id;
      if (!existingUser.customerNumber) {
        db.prepare("UPDATE users SET customer_number = ? WHERE id = ?").run(
          generateCustomerNumber(),
          assignedUserId
        );
      }
      if (existingUser.isGuest && contactName) {
        const [firstName, ...rest] = contactName.split(/\s+/);
        const lastName = rest.join(" ");
        db.prepare(
          "UPDATE users SET name = ?, first_name = ?, last_name = ?, updated_at = ? WHERE id = ?"
        ).run(
          contactName || existingUser.name,
          firstName || existingUser.firstName,
          lastName || existingUser.lastName,
          new Date().toISOString(),
          assignedUserId
        );
      }
    }
  } else {
    const exists = db
      .prepare("SELECT id FROM users WHERE id = ?")
      .get(assignedUserId) as { id: string } | undefined;
    if (!exists) {
      return NextResponse.json(
        { error: "Kunde nicht gefunden." },
        { status: 404 }
      );
    }
  }

  let orderNumber = orderNumberInput;
  if (orderNumber && !isValidOrderNumber(orderNumber)) {
    return NextResponse.json(
      { error: "Auftragsnummer muss im Format 260001 sein." },
      { status: 400 }
    );
  }
  if (orderNumber) {
    const existing = db
      .prepare("SELECT id FROM inquiries WHERE order_number = ?")
      .get(orderNumber) as { id: string } | undefined;
    if (existing) {
      return NextResponse.json(
        { error: "Diese Auftragsnummer ist bereits vergeben." },
        { status: 409 }
      );
    }
    const reserved = db
      .prepare("SELECT order_number FROM reserved_order_numbers WHERE order_number = ?")
      .get(orderNumber) as { order_number: string } | undefined;
    if (reserved) {
      return NextResponse.json(
        { error: "Diese Auftragsnummer ist bereits vergeben." },
        { status: 409 }
      );
    }
  } else {
    orderNumber = generateOrderNumber();
  }

  const finalStatus =
    status || normalizeInquiryStatus(getSettingValue("inquiry_default_status")) || "open";

  const id = crypto.randomUUID();
  const createdAt = new Date().toISOString();
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
    assignedUserId,
    contactName || null,
    contactEmail || null,
    contactPhone || null,
    eventType || null,
    participants || null,
    eventDate || null,
    message,
    orderNumber,
    finalStatus,
    createdAt
  );

  const created = (db
    .prepare(
      `
        SELECT i.id,
               i.order_number as orderNumber,
               i.contact_name as contactName,
               i.contact_email as contactEmail,
               i.contact_phone as contactPhone,
               i.event_type as eventType,
               i.participants,
               i.event_date as eventDate,
               i.message,
               i.status,
               i.created_at as createdAt,
               u.id as userId,
               u.email,
               u.phone,
               u.customer_number as customerNumber,
               u.first_name as firstName,
               u.last_name as lastName
        FROM inquiries i
        JOIN users u ON u.id = i.user_id
        WHERE i.id = ?
      `
    )
    .get(id) as InquiryRow | undefined);

  return NextResponse.json(created, { status: 201 });
}
