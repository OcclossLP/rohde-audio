import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function DELETE(_request: NextRequest, context: RouteContext) {
  const user = await getCurrentUser();
  if (!user || user.role !== "CUSTOMER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const inquiry = db
    .prepare(
      `
        SELECT id, status
        FROM inquiries
        WHERE id = ? AND user_id = ?
      `
    )
    .get(id, user.id) as { id: string; status: string } | undefined;

  if (!inquiry) {
    return NextResponse.json({ error: "Anfrage nicht gefunden." }, { status: 404 });
  }

  if (inquiry.status !== "open") {
    return NextResponse.json({ error: "Nur offene Anfragen können gelöscht werden." }, { status: 400 });
  }

  db.prepare("DELETE FROM inquiries WHERE id = ?").run(id);
  return NextResponse.json({ success: true });
}
