import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

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
  const user = await requireAdmin();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const body = await request.json();
  const status =
    typeof body?.status === "string" ? normalizeStatus(body.status) : null;

  if (!status) {
    return NextResponse.json({ error: "Ungültiger Status." }, { status: 400 });
  }

  db.prepare("UPDATE inquiries SET status = ? WHERE id = ?").run(status, id);
  const updated = db
    .prepare(
      `
        SELECT id,
               event_type as eventType,
               participants,
               event_date as eventDate,
               message,
               status,
               created_at as createdAt
        FROM inquiries
        WHERE id = ?
      `
    )
    .get(id) as
    | {
        id: string;
        eventType: string | null;
        participants: string | null;
        eventDate: string | null;
        message: string;
        status: string;
        createdAt: string;
      }
    | undefined;

  if (!updated) {
    return NextResponse.json({ error: "Anfrage nicht gefunden." }, { status: 404 });
  }

  return NextResponse.json(updated);
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  const user = await requireAdmin();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const existing = db
    .prepare("SELECT id FROM inquiries WHERE id = ?")
    .get(id) as { id: string } | undefined;

  if (!existing) {
    return NextResponse.json({ error: "Anfrage nicht gefunden." }, { status: 404 });
  }

  db.prepare("DELETE FROM inquiries WHERE id = ?").run(id);
  return NextResponse.json({ success: true });
}
