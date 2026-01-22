import { NextResponse } from "next/server";
import crypto from "crypto";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export async function GET() {
  const user = await requireAdmin();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const packages = db
    .prepare(
      `
        SELECT id, title, description, price, highlight, sort_order as sortOrder
        FROM packages
        ORDER BY sort_order ASC, created_at ASC
      `
    )
    .all()
    .map((row: {
      id: string;
      title: string;
      description: string;
      price: string;
      highlight: number;
      sortOrder: number;
    }) => ({ ...row, highlight: Boolean(row.highlight) }));
  return NextResponse.json(packages);
}

export async function POST(request: Request) {
  const user = await requireAdmin();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const title = String(body?.title ?? "").trim();
  const description = String(body?.description ?? "").trim();
  const price = String(body?.price ?? "").trim();
  const highlight = Boolean(body?.highlight ?? false);
  const sortOrder = Number.isFinite(Number(body?.sortOrder))
    ? Number(body.sortOrder)
    : 0;

  if (!title || !description || !price) {
    return NextResponse.json(
      { error: "Titel, Beschreibung und Preis sind erforderlich." },
      { status: 400 }
    );
  }

  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  db.prepare(
    `
      INSERT INTO packages (id, title, description, price, highlight, sort_order, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `
  ).run(id, title, description, price, highlight ? 1 : 0, sortOrder, now, now);

  const created = db
    .prepare(
      `
        SELECT id, title, description, price, highlight, sort_order as sortOrder
        FROM packages
        WHERE id = ?
      `
    )
    .get(id);

  return NextResponse.json(
    { ...created, highlight: Boolean(created.highlight) },
    { status: 201 }
  );
}
