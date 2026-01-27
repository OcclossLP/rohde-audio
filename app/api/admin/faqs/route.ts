import { NextResponse } from "next/server";
import crypto from "crypto";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { requireCsrf } from "@/lib/csrf";

type FaqRow = {
  id: string;
  question: string;
  answer: string;
  sortOrder: number;
  isActive: number;
  createdAt: string;
};

export async function GET() {
  const user = await requireAdmin();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const faqs = (db
    .prepare(
      `
        SELECT id,
               question,
               answer,
               sort_order as sortOrder,
               is_active as isActive,
               created_at as createdAt
        FROM faqs
        ORDER BY sort_order ASC, created_at ASC
      `
    )
    .all() as FaqRow[])
    .map((row) => ({ ...row, isActive: Boolean(row.isActive) }));

  return NextResponse.json(faqs);
}

export async function POST(request: Request) {
  if (!(await requireCsrf(request))) {
    return NextResponse.json({ error: "Ungültige Anfrage." }, { status: 403 });
  }
  const user = await requireAdmin();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const question = String(body?.question ?? "").trim();
  const answer = String(body?.answer ?? "").trim();
  const sortOrder = Number.isFinite(Number(body?.sortOrder))
    ? Number(body.sortOrder)
    : 0;
  const isActive = Boolean(body?.isActive ?? true);

  if (!question || !answer) {
    return NextResponse.json(
      { error: "Frage und Antwort sind erforderlich." },
      { status: 400 }
    );
  }

  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  db.prepare(
    `
      INSERT INTO faqs (id, question, answer, sort_order, is_active, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `
  ).run(id, question, answer, sortOrder, isActive ? 1 : 0, now, now);

  const created = db
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
    .get(id) as FaqRow | undefined;

  if (!created) {
    return NextResponse.json({ error: "FAQ nicht gefunden." }, { status: 404 });
  }

  return NextResponse.json(
    { ...created, isActive: Boolean(created.isActive) },
    { status: 201 }
  );
}
