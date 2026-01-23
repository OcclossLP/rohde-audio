import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import crypto from "crypto";
import { db } from "@/lib/db";
import { createSession, SESSION_COOKIE } from "@/lib/auth";
import { hashPassword, verifyPassword } from "@/lib/password";

async function ensureAdminFromEnv() {
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminEmail || !adminPassword) return;

  const existingAdmin = db
    .prepare("SELECT id FROM users WHERE role = 'ADMIN' LIMIT 1")
    .get() as { id: string } | undefined;
  if (existingAdmin) return;

  const { passwordHash, passwordSalt } = hashPassword(adminPassword);
  const now = new Date().toISOString();
  db.prepare(
    `
      INSERT INTO users (id, email, name, role, password_hash, password_salt, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `
  ).run(
    crypto.randomUUID(),
    adminEmail.toLowerCase(),
    process.env.ADMIN_NAME || "Admin",
    "ADMIN",
    passwordHash,
    passwordSalt,
    now,
    now
  );
}

export async function POST(request: Request) {
  await ensureAdminFromEnv();
  const body = await request.json();
  const email = String(body?.email ?? "").trim().toLowerCase();
  const password = String(body?.password ?? "");

  if (!email || !password) {
    return NextResponse.json(
      { error: "E-Mail und Passwort sind erforderlich." },
      { status: 400 }
    );
  }

  const user = db
    .prepare(
      `
        SELECT id, email, name, role, password_hash as passwordHash, password_salt as passwordSalt
        FROM users
        WHERE email = ?
      `
    )
    .get(email) as {
    id: string;
    email: string;
    name: string | null;
    role: string;
    passwordHash: string;
    passwordSalt: string;
  } | undefined;

  if (!user || !verifyPassword(password, user.passwordHash, user.passwordSalt)) {
    return NextResponse.json(
      { error: "Ungültige Zugangsdaten." },
      { status: 401 }
    );
  }

  const { token, expiresAt } = await createSession(user.id);

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    expires: expiresAt,
    path: "/",
  });

  return NextResponse.json({ success: true, role: user.role });
}
