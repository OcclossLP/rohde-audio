import crypto from "crypto";
import { cookies } from "next/headers";
import { db } from "./db";
import { getSettingNumber } from "./settings";

export const SESSION_COOKIE = "session_token";
export const SESSION_DAYS = 14;

export async function createSession(userId: string) {
  const sessionDays = getSettingNumber("security_session_days", SESSION_DAYS);
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + sessionDays * 24 * 60 * 60 * 1000);
  db.prepare(
    `
      INSERT INTO sessions (id, token, user_id, expires_at, created_at)
      VALUES (?, ?, ?, ?, ?)
    `
  ).run(crypto.randomUUID(), token, userId, expiresAt.toISOString(), new Date().toISOString());
  return { token, expiresAt };
}

export async function deleteSession(token: string | null) {
  if (!token) return;
  db.prepare("DELETE FROM sessions WHERE token = ?").run(token);
}

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const session = db
    .prepare(
      `
        SELECT s.token, s.expires_at as expiresAt, u.id, u.email, u.name, u.role,
               u.password_hash as passwordHash, u.password_salt as passwordSalt,
               u.email_verified_at as emailVerifiedAt,
               u.deleted_at as deletedAt,
               u.is_guest as isGuest
        FROM sessions s
        JOIN users u ON u.id = s.user_id
        WHERE s.token = ?
      `
    )
    .get(token) as {
    token: string;
    expiresAt: string;
    id: string;
    email: string;
    name: string | null;
    role: string;
    passwordHash: string;
    passwordSalt: string;
    emailVerifiedAt: string | null;
    deletedAt: string | null;
    isGuest: number;
  } | undefined;

  if (!session) return null;

  const expiresAt = new Date(session.expiresAt);
  if (expiresAt < new Date()) {
    await deleteSession(token);
    return null;
  }
  if (session.deletedAt || session.isGuest) {
    await deleteSession(token);
    return null;
  }

  return {
    id: session.id,
    email: session.email,
    name: session.name,
    role: session.role,
    passwordHash: session.passwordHash,
    passwordSalt: session.passwordSalt,
    emailVerifiedAt: session.emailVerifiedAt,
  };
}

export async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") return null;
  return user;
}
