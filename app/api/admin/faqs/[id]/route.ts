import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { requireCsrf } from "@/lib/csrf";

type RouteContext = {
  params: Promise<{ id: string }>;
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
  const body = await request.json();
  const question = typeof body?.question === "string" ? body.question.trim() : undefined;
  const answer = typeof body?.answer === "string" ? body.answer.trim() : undefined;
  const sortOrder = Number.isFinite(Number(body?.sortOrder))
    ? Number(body.sortOrder)
    : undefined;
  const isActive = typeof body?.isActive === "boolean" ? body.isActive : undefined;

  const fields: string[] = [];
  const values: Array<string | number | null> = [];

  if (typeof question !== "undefined") {
    fields.push("question = ?");
    values.push(question);
  }
  if (typeof answer !== "undefined") {
    fields.push("answer = ?");
    values.push(answer);
  }
  if (typeof sortOrder !== "undefined") {
    fields.push("sort_order = ?");
    values.push(sortOrder);
  }
  if (typeof isActive !== "undefined") {
    fields.push("is_active = ?");
    values.push(isActive ? 1 : 0);
  }

  fields.push("updated_at = ?");
  values.push(new Date().toISOString());
  values.push(id);

  if (fields.length === 1) {
    return NextResponse.json({ error: "Keine Daten zum Aktualisieren." }, { status: 400 });
  }

  db.prepare(`UPDATE faqs SET ${fields.join(", ")} WHERE id = ?`).run(...values);

  const updated = db
    .prepare(
      `
        SELECT id,
               question,
               answer,
               sort_order as sortOrder,
               is_active as isActive,
               created_at as createdAt
        FROM faqs
        WHERE id = ?
      `
    )
    .get(id) as
    | {
        id: string;
        question: string;
        answer: string;
        sortOrder: number;
        isActive: number;
        createdAt: string;
      }
    | undefined;

  if (!updated) {
    return NextResponse.json({ error: "FAQ nicht gefunden." }, { status: 404 });
  }

  return NextResponse.json({ ...updated, isActive: Boolean(updated.isActive) });
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  if (!(await requireCsrf(request))) {
    return NextResponse.json({ error: "Ungültige Anfrage." }, { status: 403 });
  }
  const user = await requireAdmin();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  db.prepare("DELETE FROM faqs WHERE id = ?").run(id);
  return NextResponse.json({ success: true });
}
