import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { sendInquiryStatusEmail } from "@/lib/email";
import { requireCsrf } from "@/lib/csrf";
import { getSettingBool } from "@/lib/settings";
import { isValidOrderNumber, reserveOrderNumber } from "@/lib/ids";

type RouteContext = {
  params: Promise<{ id: string }>;
};

const normalizeStatus = (value: string) => {
  const normalized = value.trim().toLowerCase();
  if (
    normalized === "open" ||
    normalized === "in_progress" ||
    normalized === "planning" ||
    normalized === "confirmed" ||
    normalized === "done" ||
    normalized === "rejected"
  ) {
    return normalized;
  }
  return null;
};

export async function PATCH(request: NextRequest, context: RouteContext) {
  if (!(await requireCsrf(request))) {
    return NextResponse.json({ error: "Ungültige Anfrage." }, { status: 403 });
  }
  const user = await requireAdmin();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const existingOrder = db
    .prepare("SELECT order_number as orderNumber FROM inquiries WHERE id = ?")
    .get(id) as { orderNumber: string | null } | undefined;
  const body = await request.json();
  const status =
    typeof body?.status === "string" ? normalizeStatus(body.status) : null;
  const adminMessage =
    typeof body?.message === "string" ? body.message.trim() : "";
  const orderNumberInput =
    typeof body?.orderNumber === "string" ? body.orderNumber.trim() : "";

  if (!status) {
    return NextResponse.json({ error: "Ungültiger Status." }, { status: 400 });
  }

  if (orderNumberInput && !isValidOrderNumber(orderNumberInput)) {
    return NextResponse.json(
      { error: "Auftragsnummer muss im Format 260001 sein." },
      { status: 400 }
    );
  }

  if (orderNumberInput) {
    const existing = db
      .prepare("SELECT id FROM inquiries WHERE order_number = ? AND id <> ?")
      .get(orderNumberInput, id) as { id: string } | undefined;
    if (existing) {
      return NextResponse.json(
        { error: "Diese Auftragsnummer ist bereits vergeben." },
        { status: 409 }
      );
    }
    const reserved = db
      .prepare("SELECT order_number FROM reserved_order_numbers WHERE order_number = ?")
      .get(orderNumberInput) as { order_number: string } | undefined;
    if (reserved) {
      return NextResponse.json(
        { error: "Diese Auftragsnummer ist bereits vergeben." },
        { status: 409 }
      );
    }
  }

  if (orderNumberInput) {
    db.prepare("UPDATE inquiries SET status = ?, order_number = ? WHERE id = ?").run(
      status,
      orderNumberInput,
      id
    );
  } else {
    db.prepare("UPDATE inquiries SET status = ? WHERE id = ?").run(status, id);
  }

  if (
    orderNumberInput &&
    existingOrder?.orderNumber &&
    existingOrder.orderNumber !== orderNumberInput
  ) {
    reserveOrderNumber(existingOrder.orderNumber);
  }
  const updated = db
    .prepare(
      `
        SELECT i.id,
               i.order_number as orderNumber,
               event_type as eventType,
               participants,
               event_date as eventDate,
               message,
               status,
               i.created_at as createdAt,
               contact_name as contactName,
        contact_email as contactEmail,
        u.email as userEmail,
        u.first_name as firstName,
        u.last_name as lastName,
        u.customer_number as customerNumber
        FROM inquiries i
        JOIN users u ON u.id = i.user_id
        WHERE i.id = ?
      `
    )
    .get(id) as
    | {
        id: string;
        orderNumber: string | null;
        eventType: string | null;
        participants: string | null;
        eventDate: string | null;
        message: string;
        status: string;
        createdAt: string;
        contactName: string | null;
        contactEmail: string | null;
        userEmail: string;
        firstName: string | null;
        lastName: string | null;
        customerNumber: string | null;
      }
    | undefined;

  if (!updated) {
    return NextResponse.json({ error: "Anfrage nicht gefunden." }, { status: 404 });
  }

  const statusLabels: Record<string, string> = {
    open: "Offen",
    in_progress: "In Bearbeitung",
    planning: "In Planung",
    confirmed: "Bestätigt",
    done: "Abgeschlossen",
    rejected: "Abgelehnt",
  };

  const displayName =
    updated.contactName ||
    `${updated.firstName ?? ""} ${updated.lastName ?? ""}`.trim() ||
    updated.userEmail;
  const recipientEmail = updated.contactEmail ?? updated.userEmail;

  const statusMailEnabled = getSettingBool("inquiry_status_email_enabled", true);
  let mailSent = false;
  let mailError: string | null = null;
  if (statusMailEnabled) {
    try {
      const result = await sendInquiryStatusEmail({
        name: displayName,
        email: recipientEmail,
        statusLabel: statusLabels[updated.status] ?? updated.status,
        message: adminMessage || null,
        orderNumber: updated.orderNumber ?? null,
        customerNumber: updated.customerNumber ?? null,
      });
      mailSent = Boolean(result?.sent);
      if (!mailSent) {
        mailError = "Status-Mail konnte nicht gesendet werden.";
      }
    } catch (error) {
      console.error("Status-Mail fehlgeschlagen:", error);
      mailError = "Status-Mail konnte nicht gesendet werden.";
    }
  } else {
    mailError = "Status-Mail ist deaktiviert.";
  }

  return NextResponse.json({ ...updated, mailSent, mailError });
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  if (!(await requireCsrf(_request))) {
    return NextResponse.json({ error: "Ungültige Anfrage." }, { status: 403 });
  }
  const user = await requireAdmin();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const existing = db
    .prepare("SELECT id, order_number as orderNumber FROM inquiries WHERE id = ?")
    .get(id) as { id: string; orderNumber: string | null } | undefined;

  if (!existing) {
    return NextResponse.json({ error: "Anfrage nicht gefunden." }, { status: 404 });
  }

  reserveOrderNumber(existing.orderNumber);
  db.prepare("DELETE FROM inquiries WHERE id = ?").run(id);
  return NextResponse.json({ success: true });
}
