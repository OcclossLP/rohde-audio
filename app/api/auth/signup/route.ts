import { NextResponse } from "next/server";
import crypto from "crypto";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/password";

export async function POST(request: Request) {
  const body = await request.json();
  const email = String(body?.email ?? "").trim().toLowerCase();
  const name = typeof body?.name === "string" ? body.name.trim() : null;
  const password = String(body?.password ?? "");

  if (!email || !password) {
    return NextResponse.json(
      { error: "E-Mail und Passwort sind erforderlich." },
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

  const { passwordHash, passwordSalt } = hashPassword(password);
  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  db.prepare(
    `
      INSERT INTO users (id, email, name, role, password_hash, password_salt, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `
  ).run(id, email, name, "CUSTOMER", passwordHash, passwordSalt, now, now);

  return NextResponse.json({ success: true });
}
