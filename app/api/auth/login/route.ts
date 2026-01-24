import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import crypto from "crypto";
import { db } from "@/lib/db";
import { createSession, SESSION_COOKIE } from "@/lib/auth";
import { hashPassword, verifyPassword } from "@/lib/password";

const normalizePhone = (value: string) => value.replace(/\s+/g, "");

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
      INSERT INTO users (id, email, name, role, password_hash, password_salt, email_verified_at, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `
  ).run(
    crypto.randomUUID(),
    adminEmail.toLowerCase(),
    process.env.ADMIN_NAME || "Admin",
    "ADMIN",
    passwordHash,
    passwordSalt,
    now,
    now,
    now
  );
}

export async function POST(request: Request) {
  await ensureAdminFromEnv();
  const body = await request.json();
  const identifier = String(body?.identifier ?? body?.email ?? "").trim();
  const email = identifier.toLowerCase();
  const phone = identifier ? normalizePhone(identifier) : "";
  const password = String(body?.password ?? "");

  if (!identifier || !password) {
    return NextResponse.json(
      { error: "E-Mail oder Telefonnummer und Passwort sind erforderlich." },
      { status: 400 }
    );
  }

  const user = db
    .prepare(
      `
        SELECT id, email, phone, name, role, password_hash as passwordHash, password_salt as passwordSalt,
               email_verified_at as emailVerifiedAt
        FROM users
        WHERE email = ? OR phone = ?
      `
    )
    .get(email, phone) as {
    id: string;
    email: string;
    phone: string | null;
    name: string | null;
    role: string;
    passwordHash: string;
    passwordSalt: string;
    emailVerifiedAt: string | null;
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

  const verified = user.role === "ADMIN" || Boolean(user.emailVerifiedAt);
  return NextResponse.json({ success: true, role: user.role, verified });
}
