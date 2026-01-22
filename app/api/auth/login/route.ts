import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { createSession, SESSION_COOKIE } from "@/lib/auth";
import { verifyPassword } from "@/lib/password";

export async function POST(request: Request) {
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
    .get(email);

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
