import { NextResponse } from "next/server";
import crypto from "crypto";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/password";

const normalizePhone = (value: string) => value.replace(/\s+/g, "");

export async function POST(request: Request) {
  const body = await request.json();
  const email = String(body?.email ?? "").trim().toLowerCase();
  const phoneInput = typeof body?.phone === "string" ? body.phone.trim() : "";
  const phone = phoneInput ? normalizePhone(phoneInput) : null;
  const firstName = typeof body?.firstName === "string" ? body.firstName.trim() : "";
  const lastName = typeof body?.lastName === "string" ? body.lastName.trim() : "";
  const password = String(body?.password ?? "");

  if (!firstName || !lastName || !email || !password) {
    return NextResponse.json(
      { error: "Vorname, Nachname, E-Mail und Passwort sind erforderlich." },
      { status: 400 }
    );
  }

  const existing = db
    .prepare("SELECT id FROM users WHERE email = ?")
    .get(email) as { id: string } | undefined;
  if (existing) {
    return NextResponse.json(
      { error: "Diese E-Mail ist bereits registriert." },
      { status: 409 }
    );
  }
  if (phone) {
    const phoneExists = db
      .prepare("SELECT id FROM users WHERE phone = ?")
      .get(phone) as { id: string } | undefined;
    if (phoneExists) {
      return NextResponse.json(
        { error: "Diese Telefonnummer ist bereits registriert." },
        { status: 409 }
      );
    }
  }

  const { passwordHash, passwordSalt } = hashPassword(password);
  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  db.prepare(
    `
      INSERT INTO users (id, email, phone, name, first_name, last_name, role, password_hash, password_salt, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `
  ).run(
    id,
    email,
    phone,
    `${firstName} ${lastName}`.trim(),
    firstName,
    lastName,
    "CUSTOMER",
    passwordHash,
    passwordSalt,
    now,
    now
  );

  return NextResponse.json({ success: true });
}
