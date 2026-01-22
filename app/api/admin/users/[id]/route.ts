import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { hashPassword } from "@/lib/password";

type UserRow = {
  id: string;
  email: string;
  name: string | null;
  role: string;
  createdAt: string;
};

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: NextRequest, context: RouteContext) {
  const user = await requireAdmin();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const body = await request.json();
  const name = typeof body?.name === "string" ? body.name.trim() : undefined;
  const role = body?.role === "CUSTOMER" ? "CUSTOMER" : body?.role === "ADMIN" ? "ADMIN" : undefined;
  const password = typeof body?.password === "string" ? body.password : undefined;

  const data: {
    name?: string | null;
    role?: "ADMIN" | "CUSTOMER";
    passwordHash?: string;
    passwordSalt?: string;
  } = {};

  if (typeof name !== "undefined") data.name = name || null;
  if (typeof role !== "undefined") data.role = role;
  if (typeof password !== "undefined" && password) {
    const { passwordHash, passwordSalt } = hashPassword(password);
    data.passwordHash = passwordHash;
    data.passwordSalt = passwordSalt;
  }

  const fields = [];
  const values: Array<string | null> = [];

  if (typeof data.name !== "undefined") {
    fields.push("name = ?");
    values.push(data.name);
  }
  if (typeof data.role !== "undefined") {
    fields.push("role = ?");
    values.push(data.role);
  }
  if (typeof data.passwordHash !== "undefined" && typeof data.passwordSalt !== "undefined") {
    fields.push("password_hash = ?");
    fields.push("password_salt = ?");
    values.push(data.passwordHash);
    values.push(data.passwordSalt);
  }

  fields.push("updated_at = ?");
  values.push(new Date().toISOString());
  values.push(id);

  if (fields.length === 1) {
    return NextResponse.json({ error: "Keine Daten zum Aktualisieren." }, { status: 400 });
  }

  db.prepare(`UPDATE users SET ${fields.join(", ")} WHERE id = ?`).run(...values);

  const updated = db
    .prepare(
      `
        SELECT id, email, name, role, created_at as createdAt
        FROM users
        WHERE id = ?
      `
    )
    .get(id) as UserRow | undefined;

  if (!updated) {
    return NextResponse.json({ error: "Benutzer nicht gefunden." }, { status: 404 });
  }

  return NextResponse.json(updated);
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const user = await requireAdmin();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  db.prepare("DELETE FROM users WHERE id = ?").run(id);
  return NextResponse.json({ success: true });
}
