import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { requireCsrf } from "@/lib/csrf";
import { reserveOrderNumber } from "@/lib/ids";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function DELETE(request: NextRequest, context: RouteContext) {
  if (!(await requireCsrf(request))) {
    return NextResponse.json({ error: "Ungültige Anfrage." }, { status: 403 });
  }
  const user = await getCurrentUser();
  if (!user || user.role !== "CUSTOMER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const inquiry = db
    .prepare(
      `
        SELECT id, status, order_number as orderNumber
        FROM inquiries
        WHERE id = ? AND user_id = ?
      `
    )
    .get(id, user.id) as { id: string; status: string; orderNumber: string | null } | undefined;

  if (!inquiry) {
    return NextResponse.json({ error: "Anfrage nicht gefunden." }, { status: 404 });
  }

  if (inquiry.status !== "open") {
    return NextResponse.json({ error: "Nur offene Anfragen können gelöscht werden." }, { status: 400 });
  }

  reserveOrderNumber(inquiry.orderNumber);
  db.prepare("DELETE FROM inquiries WHERE id = ?").run(id);
  return NextResponse.json({ success: true });
}
