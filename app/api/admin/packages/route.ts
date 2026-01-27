import { NextResponse } from "next/server";
import crypto from "crypto";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { requireCsrf } from "@/lib/csrf";

type PackageRow = {
  id: string;
  title: string;
  description: string;
  price: string;
  salePrice: string | null;
  highlight: number;
  sortOrder: number;
};

export async function GET() {
  const user = await requireAdmin();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const packages = (db
    .prepare(
      `
        SELECT id, title, description, price, sale_price as salePrice, highlight, sort_order as sortOrder
        FROM packages
        ORDER BY sort_order ASC, created_at ASC
      `
    )
    .all() as PackageRow[])
    .map((row) => ({ ...row, highlight: Boolean(row.highlight) }));
  return NextResponse.json(packages);
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
  const title = String(body?.title ?? "").trim();
  const description = String(body?.description ?? "").trim();
  const price = String(body?.price ?? "").trim();
  const salePriceRaw =
    typeof body?.salePrice === "string" ? body.salePrice.trim() : "";
  const salePrice = salePriceRaw ? salePriceRaw : null;
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
      INSERT INTO packages (id, title, description, price, sale_price, highlight, sort_order, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `
  ).run(
    id,
    title,
    description,
    price,
    salePrice,
    highlight ? 1 : 0,
    sortOrder,
    now,
    now
  );

  const created = db
    .prepare(
      `
        SELECT id, title, description, price, sale_price as salePrice, highlight, sort_order as sortOrder
        FROM packages
        WHERE id = ?
      `
    )
    .get(id) as PackageRow | undefined;

  if (!created) {
    return NextResponse.json({ error: "Paket nicht gefunden." }, { status: 404 });
  }

  return NextResponse.json(
    { ...created, highlight: Boolean(created.highlight) },
    { status: 201 }
  );
}
