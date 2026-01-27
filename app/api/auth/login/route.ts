import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import crypto from "crypto";
import { db } from "@/lib/db";
import { createSession, SESSION_COOKIE } from "@/lib/auth";
import { hashPassword, verifyPassword } from "@/lib/password";
import { requireCsrf } from "@/lib/csrf";
import { getClientIp, rateLimit } from "@/lib/rateLimit";
import { getSettingNumber } from "@/lib/settings";
import { generateCustomerNumber } from "@/lib/ids";

const normalizePhone = (value: string) => value.replace(/\s+/g, "");

async function ensureAdminFromEnv() {
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminEmail || !adminPassword) return;

  const normalizedEmail = adminEmail.toLowerCase();
  const existingByEmail = db
    .prepare(
      "SELECT id, customer_number as customerNumber, deleted_at as deletedAt FROM users WHERE email = ?"
    )
    .get(normalizedEmail) as
    | { id: string; customerNumber: string | null; deletedAt: string | null }
    | undefined;

  if (existingByEmail) {
    const { passwordHash, passwordSalt } = hashPassword(adminPassword);
    if (!existingByEmail.customerNumber) {
      const customerNumber = generateCustomerNumber();
      db.prepare("UPDATE users SET customer_number = ? WHERE id = ?").run(
        customerNumber,
        existingByEmail.id
      );
    }
    db.prepare(
      `
        UPDATE users
        SET role = 'ADMIN',
            password_hash = ?,
            password_salt = ?,
            deleted_at = NULL,
            is_guest = 0,
            updated_at = ?
        WHERE id = ?
      `
    ).run(passwordHash, passwordSalt, new Date().toISOString(), existingByEmail.id);
    return;
  }

  const existingAdmin = db
    .prepare(
      "SELECT id, customer_number as customerNumber FROM users WHERE role = 'ADMIN' AND deleted_at IS NULL LIMIT 1"
    )
    .get() as { id: string; customerNumber: string | null } | undefined;
  if (existingAdmin) {
    if (!existingAdmin.customerNumber) {
      const customerNumber = generateCustomerNumber();
      db.prepare("UPDATE users SET customer_number = ? WHERE id = ?").run(
        customerNumber,
        existingAdmin.id
      );
    }
    return;
  }

  const { passwordHash, passwordSalt } = hashPassword(adminPassword);
  const now = new Date().toISOString();
  const customerNumber = generateCustomerNumber();
  db.prepare(
    `
      INSERT INTO users (id, email, name, customer_number, role, password_hash, password_salt, email_verified_at, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `
  ).run(
    crypto.randomUUID(),
    normalizedEmail,
    process.env.ADMIN_NAME || "Admin",
    customerNumber,
    "ADMIN",
    passwordHash,
    passwordSalt,
    now,
    now,
    now
  );
}

export async function POST(request: Request) {
  if (!(await requireCsrf(request))) {
    return NextResponse.json({ error: "Ungültige Anfrage." }, { status: 403 });
  }
  const ip = getClientIp(request);
  const loginLimit = getSettingNumber("security_login_limit", 8);
  const loginWindowSeconds = getSettingNumber("security_login_window_seconds", 60);
  const limit = rateLimit(`login:${ip}`, loginLimit, loginWindowSeconds * 1000);
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Zu viele Loginversuche. Bitte später erneut versuchen." },
      { status: 429 }
    );
  }
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
               email_verified_at as emailVerifiedAt, deleted_at as deletedAt, is_guest as isGuest
        FROM users
        WHERE (email = ? OR phone = ?) AND deleted_at IS NULL
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
    deletedAt: string | null;
    isGuest: number;
  } | undefined;

  if (!user || user.isGuest) {
    return NextResponse.json(
      { error: "Ungültige Zugangsdaten." },
      { status: 401 }
    );
  }

  if (!verifyPassword(password, user.passwordHash, user.passwordSalt)) {
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
