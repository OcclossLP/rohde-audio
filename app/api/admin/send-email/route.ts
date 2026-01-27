import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { sendCustomCustomerEmail } from "@/lib/email";
import { requireCsrf } from "@/lib/csrf";
import { getClientIp, rateLimit } from "@/lib/rateLimit";

export async function POST(request: Request) {
  if (!(await requireCsrf(request))) {
    return NextResponse.json({ error: "Ungültige Anfrage." }, { status: 403 });
  }
  const ip = getClientIp(request);
  const limit = rateLimit(`admin-mail:${ip}`, 20, 60_000);
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Zu viele Anfragen. Bitte später erneut versuchen." },
      { status: 429 }
    );
  }
  const user = await requireAdmin();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const userId = typeof body?.userId === "string" ? body.userId.trim() : "";
  const toEmail =
    typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const subject = typeof body?.subject === "string" ? body.subject.trim() : "";
  const message = typeof body?.message === "string" ? body.message.trim() : "";
  const orderNumber =
    typeof body?.orderNumber === "string" ? body.orderNumber.trim() : "";
  const customerNumber =
    typeof body?.customerNumber === "string" ? body.customerNumber.trim() : "";

  if ((!userId && !toEmail) || !subject || !message) {
    return NextResponse.json(
      { error: "Empfänger, Betreff und Nachricht sind erforderlich." },
      { status: 400 }
    );
  }

  let recipient: {
    email: string;
    firstName: string | null;
    lastName: string | null;
    customerNumber: string | null;
  } | null = null;
  if (userId) {
    recipient = (db
      .prepare(
        `
          SELECT email, first_name as firstName, last_name as lastName, customer_number as customerNumber
          FROM users
          WHERE id = ? AND role = 'CUSTOMER' AND deleted_at IS NULL
        `
      )
      .get(userId) as
        | {
            email: string;
            firstName: string | null;
            lastName: string | null;
            customerNumber: string | null;
          }
        | undefined) ?? null;
  }

  if (!recipient && !toEmail) {
    return NextResponse.json({ error: "Empfänger nicht gefunden." }, { status: 404 });
  }

  const targetEmail = recipient?.email ?? toEmail;
  const name =
    `${recipient?.firstName ?? ""} ${recipient?.lastName ?? ""}`.trim() ||
    targetEmail;
  const resolvedCustomerNumber = customerNumber || recipient?.customerNumber || "";

  try {
    await sendCustomCustomerEmail({
      name,
      email: targetEmail,
      subject,
      message,
      orderNumber,
      customerNumber: resolvedCustomerNumber,
    });
    if (process.env.FOUNDER_EMAIL) {
      await sendCustomCustomerEmail({
        name: "Admin",
        email: process.env.FOUNDER_EMAIL,
        subject: `Kopie gesendet: ${subject}`,
        message: `Empfänger: ${targetEmail}\nAuftragsnummer: ${orderNumber || "—"}\nKundennummer: ${resolvedCustomerNumber || "—"}\n\n${message}`,
        orderNumber,
        customerNumber: resolvedCustomerNumber,
      });
    }
  } catch (error) {
    console.error("Custom-Mail fehlgeschlagen:", error);
  }

  return NextResponse.json({ success: true });
}
