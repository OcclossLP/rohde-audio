import { NextResponse } from "next/server";
import crypto from "crypto";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { hashPassword } from "@/lib/password";

export async function GET() {
  const user = await requireAdmin();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const users = db
    .prepare(
      `
        SELECT id, email, name, role, created_at as createdAt
        FROM users
        ORDER BY created_at DESC
      `
    )
    .all();
  return NextResponse.json(users);
}

export async function POST(request: Request) {
  const user = await requireAdmin();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const email = String(body?.email ?? "").trim().toLowerCase();
  const name = typeof body?.name === "string" ? body.name.trim() : null;
  const role = body?.role === "CUSTOMER" ? "CUSTOMER" : "ADMIN";
  const password = String(body?.password ?? "");

  if (!email || !password) {
    return NextResponse.json(
      { error: "E-Mail und Passwort sind erforderlich." },
      { status: 400 }
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
  ).run(id, email, name, role, passwordHash, passwordSalt, now, now);

  const created = db
    .prepare(
      `
        SELECT id, email, name, role, created_at as createdAt
        FROM users
        WHERE id = ?
      `
    )
    .get(id);

  return NextResponse.json(created, { status: 201 });
}
