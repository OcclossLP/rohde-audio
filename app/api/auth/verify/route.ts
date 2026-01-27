import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { requireCsrf } from "@/lib/csrf";
import { getClientIp, rateLimit } from "@/lib/rateLimit";

export async function POST(request: Request) {
  if (!(await requireCsrf(request))) {
    return NextResponse.json({ error: "Ungültige Anfrage." }, { status: 403 });
  }
  const ip = getClientIp(request);
  const limit = rateLimit(`verify:${ip}`, 6, 60_000);
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Zu viele Versuche. Bitte später erneut versuchen." },
      { status: 429 }
    );
  }
  const user = await getCurrentUser();
  if (!user || user.role !== "CUSTOMER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (user.emailVerifiedAt) {
    return NextResponse.json({ success: true });
  }

  const body = await request.json();
  const code = typeof body?.code === "string" ? body.code.trim() : "";
  if (!code) {
    return NextResponse.json({ error: "Bitte gib den Code ein." }, { status: 400 });
  }

  const record = db
    .prepare(
      `
        SELECT verification_code as verificationCode,
               verification_expires_at as verificationExpiresAt
        FROM users
        WHERE id = ?
      `
    )
    .get(user.id) as { verificationCode: string | null; verificationExpiresAt: string | null } | undefined;

  if (!record?.verificationCode) {
    return NextResponse.json({ error: "Kein Code vorhanden. Bitte neuen Code anfordern." }, { status: 400 });
  }

  if (record.verificationExpiresAt) {
    const expiresAt = new Date(record.verificationExpiresAt);
    if (expiresAt < new Date()) {
      return NextResponse.json({ error: "Der Code ist abgelaufen." }, { status: 400 });
    }
  }

  if (record.verificationCode !== code) {
    return NextResponse.json({ error: "Der Code ist ungültig." }, { status: 400 });
  }

  const now = new Date().toISOString();
  db.prepare(
    `
      UPDATE users
      SET email_verified_at = ?,
          verification_code = NULL,
          verification_expires_at = NULL,
          verification_sent_at = NULL
      WHERE id = ?
    `
  ).run(now, user.id);

  return NextResponse.json({ success: true });
}
