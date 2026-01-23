import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { hashPassword } from "@/lib/password";

type UserRow = {
  id: string;
  email: string;
  phone: string | null;
  name: string | null;
  notes: string | null;
  firstName: string | null;
  lastName: string | null;
  street: string | null;
  houseNumber: string | null;
  addressExtra: string | null;
  postalCode: string | null;
  city: string | null;
  role: string;
  createdAt: string;
};

const normalizePhone = (value: string) => value.replace(/\s+/g, "");

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
  const firstName =
    typeof body?.firstName === "string" ? body.firstName.trim() : undefined;
  const lastName =
    typeof body?.lastName === "string" ? body.lastName.trim() : undefined;
  const phoneInput =
    typeof body?.phone === "string" ? body.phone.trim() : undefined;
  const phone =
    typeof phoneInput === "string"
      ? phoneInput
        ? normalizePhone(phoneInput)
        : null
      : undefined;
  const notes =
    typeof body?.notes === "string" ? body.notes.trim() : undefined;
  const street =
    typeof body?.street === "string" ? body.street.trim() : undefined;
  const houseNumber =
    typeof body?.houseNumber === "string" ? body.houseNumber.trim() : undefined;
  const addressExtra =
    typeof body?.addressExtra === "string" ? body.addressExtra.trim() : undefined;
  const postalCode =
    typeof body?.postalCode === "string" ? body.postalCode.trim() : undefined;
  const city = typeof body?.city === "string" ? body.city.trim() : undefined;
  const role = body?.role === "CUSTOMER" ? "CUSTOMER" : body?.role === "ADMIN" ? "ADMIN" : undefined;
  const password = typeof body?.password === "string" ? body.password : undefined;

  const data: {
    name?: string | null;
    firstName?: string | null;
    lastName?: string | null;
    role?: "ADMIN" | "CUSTOMER";
    phone?: string | null;
    notes?: string | null;
    street?: string | null;
    houseNumber?: string | null;
    addressExtra?: string | null;
    postalCode?: string | null;
    city?: string | null;
    passwordHash?: string;
    passwordSalt?: string;
  } = {};

  if (typeof firstName !== "undefined") data.firstName = firstName || null;
  if (typeof lastName !== "undefined") data.lastName = lastName || null;
  if (typeof firstName !== "undefined" || typeof lastName !== "undefined") {
    const safeFirst = firstName ?? "";
    const safeLast = lastName ?? "";
    data.name = `${safeFirst} ${safeLast}`.trim() || null;
  }
  if (typeof role !== "undefined") data.role = role;
  if (typeof phone !== "undefined") data.phone = phone;
  if (typeof notes !== "undefined") data.notes = notes || null;
  if (typeof street !== "undefined") data.street = street || null;
  if (typeof houseNumber !== "undefined") data.houseNumber = houseNumber || null;
  if (typeof addressExtra !== "undefined") data.addressExtra = addressExtra || null;
  if (typeof postalCode !== "undefined") data.postalCode = postalCode || null;
  if (typeof city !== "undefined") data.city = city || null;
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
  if (typeof data.firstName !== "undefined") {
    fields.push("first_name = ?");
    values.push(data.firstName);
  }
  if (typeof data.lastName !== "undefined") {
    fields.push("last_name = ?");
    values.push(data.lastName);
  }
  if (typeof data.role !== "undefined") {
    fields.push("role = ?");
    values.push(data.role);
  }
  if (typeof data.phone !== "undefined") {
    fields.push("phone = ?");
    values.push(data.phone);
  }
  if (typeof data.notes !== "undefined") {
    fields.push("notes = ?");
    values.push(data.notes);
  }
  if (typeof data.street !== "undefined") {
    fields.push("street = ?");
    values.push(data.street);
  }
  if (typeof data.houseNumber !== "undefined") {
    fields.push("house_number = ?");
    values.push(data.houseNumber);
  }
  if (typeof data.addressExtra !== "undefined") {
    fields.push("address_extra = ?");
    values.push(data.addressExtra);
  }
  if (typeof data.postalCode !== "undefined") {
    fields.push("postal_code = ?");
    values.push(data.postalCode);
  }
  if (typeof data.city !== "undefined") {
    fields.push("city = ?");
    values.push(data.city);
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
        SELECT id,
               email,
               phone,
               name,
               notes,
               first_name as firstName,
               last_name as lastName,
               street,
               house_number as houseNumber,
               address_extra as addressExtra,
               postal_code as postalCode,
               city,
               role,
               created_at as createdAt
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
