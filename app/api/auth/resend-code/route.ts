import crypto from "crypto";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { sendVerificationEmail } from "@/lib/email";
import { requireCsrf } from "@/lib/csrf";
import { getClientIp, rateLimit } from "@/lib/rateLimit";

const COOLDOWN_SECONDS = 120;

export async function POST(request: Request) {
  if (!(await requireCsrf(request))) {
    return NextResponse.json({ error: "Ungültige Anfrage." }, { status: 403 });
  }
  const ip = getClientIp(request);
  const limit = rateLimit(`resend:${ip}`, 4, 60_000);
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Zu viele Anfragen. Bitte später erneut versuchen." },
      { status: 429 }
    );
  }
  const user = await getCurrentUser();
  if (!user || user.role !== "CUSTOMER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (user.emailVerifiedAt) {
    return NextResponse.json({ error: "Account ist bereits bestätigt." }, { status: 400 });
  }

  const record = db
    .prepare(
      `
        SELECT verification_sent_at as verificationSentAt,
               first_name as firstName,
               last_name as lastName,
               email
        FROM users
        WHERE id = ?
      `
    )
    .get(user.id) as
    | { verificationSentAt: string | null; firstName: string | null; lastName: string | null; email: string }
    | undefined;

  if (!record) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  if (record.verificationSentAt) {
    const lastSentAt = new Date(record.verificationSentAt).getTime();
    const secondsSince = Math.floor((Date.now() - lastSentAt) / 1000);
    if (secondsSince < COOLDOWN_SECONDS) {
      return NextResponse.json(
        { error: "Bitte warte, bevor du einen neuen Code anforderst.", remaining: COOLDOWN_SECONDS - secondsSince },
        { status: 429 }
      );
    }
  }

  const code = crypto.randomInt(100000, 999999).toString();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 10 * 60 * 1000).toISOString();
  db.prepare(
    `
      UPDATE users
      SET verification_code = ?,
          verification_expires_at = ?,
          verification_sent_at = ?
      WHERE id = ?
    `
  ).run(code, expiresAt, now.toISOString(), user.id);

  try {
    await sendVerificationEmail({
      name: `${record.firstName ?? ""} ${record.lastName ?? ""}`.trim() || record.email,
      email: record.email,
      code,
    });
  } catch (error) {
    console.error("Verifikations-E-Mail fehlgeschlagen:", error);
  }

  return NextResponse.json({ success: true, cooldown: COOLDOWN_SECONDS });
}
