import { NextResponse } from "next/server";
import crypto from "crypto";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { hashPassword } from "@/lib/password";

type UserRow = {
  id: string;
  email: string;
  phone: string | null;
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
        ORDER BY created_at DESC
      `
    )
    .all() as UserRow[]);
  return NextResponse.json(users);
}

export async function POST(request: Request) {
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

  const { passwordHash, passwordSalt } = hashPassword(password);
  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  db.prepare(
    `
      INSERT INTO users (id, email, phone, name, first_name, last_name, notes, role, password_hash, password_salt, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `
  ).run(
    id,
    email,
    phone,
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

  const created = db
    .prepare(
      `
        SELECT id,
               email,
               phone,
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
