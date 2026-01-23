import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

type RouteContext = {
  params?: { id?: string | string[] };
};

const getPackageId = (request: NextRequest, context: RouteContext) => {
  const rawId =
    (Array.isArray(context.params?.id)
      ? context.params?.id[0]
      : context.params?.id) ??
    new URL(request.url).pathname.split("/").pop();
  const id = typeof rawId === "string" ? rawId.trim() : "";
  return id;
};

export async function PATCH(request: NextRequest, context: RouteContext) {
  const id = getPackageId(request, context);
  const user = await requireAdmin();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!id) {
    return NextResponse.json({ error: "Paket-ID fehlt." }, { status: 400 });
  }

  const body = await request.json();
  const title = typeof body?.title === "string" ? body.title.trim() : undefined;
  const description =
    typeof body?.description === "string" ? body.description.trim() : undefined;
  const price = typeof body?.price === "string" ? body.price.trim() : undefined;
  const salePriceRaw =
    typeof body?.salePrice === "string" ? body.salePrice.trim() : undefined;
  const salePrice =
    typeof salePriceRaw === "string" ? (salePriceRaw ? salePriceRaw : null) : undefined;
  const highlight =
    typeof body?.highlight === "boolean" ? body.highlight : undefined;
  const sortOrder = Number.isFinite(Number(body?.sortOrder))
    ? Number(body.sortOrder)
    : undefined;

  const fields = [];
  const values: Array<string | number | null> = [];

  if (typeof title !== "undefined") {
    fields.push("title = ?");
    values.push(title);
  }
  if (typeof description !== "undefined") {
    fields.push("description = ?");
    values.push(description);
  }
  if (typeof price !== "undefined") {
    fields.push("price = ?");
    values.push(price);
  }
  if (typeof salePrice !== "undefined") {
    fields.push("sale_price = ?");
    values.push(salePrice);
  }
  if (typeof highlight !== "undefined") {
    fields.push("highlight = ?");
    values.push(highlight ? 1 : 0);
  }
  if (typeof sortOrder !== "undefined") {
    fields.push("sort_order = ?");
    values.push(sortOrder);
  }

  fields.push("updated_at = ?");
  values.push(new Date().toISOString());
  values.push(id);

  if (fields.length === 1) {
    return NextResponse.json({ error: "Keine Daten zum Aktualisieren." }, { status: 400 });
  }

  db.prepare(`UPDATE packages SET ${fields.join(", ")} WHERE id = ?`).run(...values);

  const updated = db
    .prepare(
      `
        SELECT id, title, description, price, sale_price as salePrice, highlight, sort_order as sortOrder
        FROM packages
        WHERE id = ?
      `
    )
    .get(id) as {
    id: string;
    title: string;
    description: string;
    price: string;
    salePrice: string | null;
    highlight: number;
    sortOrder: number;
  } | undefined;

  if (!updated) {
    return NextResponse.json({ error: "Paket nicht gefunden." }, { status: 404 });
  }

  return NextResponse.json({ ...updated, highlight: Boolean(updated.highlight) });
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const user = await requireAdmin();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const id = getPackageId(request, context);
  if (!id) {
    return NextResponse.json({ error: "Paket-ID fehlt." }, { status: 400 });
  }
  db.prepare("DELETE FROM packages WHERE id = ?").run(id);
  return NextResponse.json({ success: true });
}
