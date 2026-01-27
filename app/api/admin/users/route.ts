import { NextResponse } from "next/server";
import crypto from "crypto";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { hashPassword } from "@/lib/password";
import { requireCsrf } from "@/lib/csrf";
import { generateCustomerNumber } from "@/lib/ids";

type UserRow = {
  id: string;
  email: string;
  phone: string | null;
  customerNumber: string | null;
  name: string | null;
  notes: string | null;
  firstName: string | null;
  lastName: string | null;
  street: string | null;
  houseNumber: string | null;
  addressExtra: string | null;
  postalCode: string | null;
  city: string | null;
  role: string;
  createdAt: string;
};

const normalizePhone = (value: string) => value.replace(/\s+/g, "");

export async function GET() {
  const user = await requireAdmin();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const users = (db
    .prepare(
      `
        SELECT id,
               email,
               phone,
               customer_number as customerNumber,
               name,
               notes,
               first_name as firstName,
               last_name as lastName,
               street,
               house_number as houseNumber,
               address_extra as addressExtra,
               postal_code as postalCode,
               city,
               role,
               created_at as createdAt
        FROM users
        WHERE deleted_at IS NULL
        ORDER BY created_at DESC
      `
    )
    .all() as UserRow[]);
  return NextResponse.json(users);
}

export async function POST(request: Request) {
  if (!(await requireCsrf(request))) {
    return NextResponse.json({ error: "Ungültige Anfrage." }, { status: 403 });
  }
  const user = await requireAdmin();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const email = String(body?.email ?? "").trim().toLowerCase();
  const phoneInput = typeof body?.phone === "string" ? body.phone.trim() : "";
  const phone = phoneInput ? normalizePhone(phoneInput) : null;
  const firstName = typeof body?.firstName === "string" ? body.firstName.trim() : "";
  const lastName = typeof body?.lastName === "string" ? body.lastName.trim() : "";
  const notes = typeof body?.notes === "string" ? body.notes.trim() : null;
  const role = body?.role === "CUSTOMER" ? "CUSTOMER" : "ADMIN";
  const password = String(body?.password ?? "");

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

  const { passwordHash, passwordSalt } = hashPassword(password);
  const now = new Date().toISOString();
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
            notes = ?,
            role = ?,
            password_hash = ?,
            password_salt = ?,
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
      notes,
      role,
      passwordHash,
      passwordSalt,
      now,
      id
    );
  } else {
    id = crypto.randomUUID();
    db.prepare(
      `
        INSERT INTO users (id, email, phone, customer_number, name, first_name, last_name, notes, role, password_hash, password_salt, created_at, updated_at, is_guest)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
      `
    ).run(
      id,
      email,
      phone,
      customerNumber,
      `${firstName} ${lastName}`.trim(),
      firstName,
      lastName,
      notes,
      role,
      passwordHash,
      passwordSalt,
      now,
      now
    );
  }

  const created = db
    .prepare(
      `
        SELECT id,
               email,
               phone,
               customer_number as customerNumber,
               name,
               notes,
               first_name as firstName,
               last_name as lastName,
               street,
               house_number as houseNumber,
               address_extra as addressExtra,
               postal_code as postalCode,
               city,
               role,
               created_at as createdAt
        FROM users
        WHERE id = ?
      `
    )
    .get(id) as UserRow | undefined;

  if (!created) {
    return NextResponse.json({ error: "Benutzer nicht gefunden." }, { status: 404 });
  }

  return NextResponse.json(created, { status: 201 });
}
