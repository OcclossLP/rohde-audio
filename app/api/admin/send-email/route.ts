import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { sendCustomCustomerEmail } from "@/lib/email";

export async function POST(request: Request) {
  const user = await requireAdmin();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const userId = typeof body?.userId === "string" ? body.userId.trim() : "";
  const subject = typeof body?.subject === "string" ? body.subject.trim() : "";
  const message = typeof body?.message === "string" ? body.message.trim() : "";

  if (!userId || !subject || !message) {
    return NextResponse.json(
      { error: "Empfänger, Betreff und Nachricht sind erforderlich." },
      { status: 400 }
    );
  }

  const recipient = db
    .prepare(
      `
        SELECT email, first_name as firstName, last_name as lastName
        FROM users
        WHERE id = ? AND role = 'CUSTOMER'
      `
    )
    .get(userId) as { email: string; firstName: string | null; lastName: string | null } | undefined;

  if (!recipient) {
    return NextResponse.json({ error: "Empfänger nicht gefunden." }, { status: 404 });
  }

  const name =
    `${recipient.firstName ?? ""} ${recipient.lastName ?? ""}`.trim() ||
    recipient.email;

  try {
    await sendCustomCustomerEmail({
      name,
      email: recipient.email,
      subject,
      message,
    });
  } catch (error) {
    console.error("Custom-Mail fehlgeschlagen:", error);
  }

  return NextResponse.json({ success: true });
}
