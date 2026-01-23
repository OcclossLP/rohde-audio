import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { getCurrentUser, SESSION_COOKIE } from "@/lib/auth";
import { hashPassword } from "@/lib/password";

const normalizePhone = (value: string) => value.replace(/\s+/g, "");

export async function PATCH(request: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== "CUSTOMER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const firstName =
    typeof body?.firstName === "string" ? body.firstName.trim() : "";
  const lastName =
    typeof body?.lastName === "string" ? body.lastName.trim() : "";
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const phoneInput = typeof body?.phone === "string" ? body.phone.trim() : "";
  const phone = phoneInput ? normalizePhone(phoneInput) : null;
  const street = typeof body?.street === "string" ? body.street.trim() : "";
  const houseNumber =
    typeof body?.houseNumber === "string" ? body.houseNumber.trim() : "";
  const addressExtra =
    typeof body?.addressExtra === "string" ? body.addressExtra.trim() : "";
  const postalCode =
    typeof body?.postalCode === "string" ? body.postalCode.trim() : "";
  const city = typeof body?.city === "string" ? body.city.trim() : "";
  const password = typeof body?.password === "string" ? body.password.trim() : "";

  if (!firstName || !lastName || !email) {
    return NextResponse.json(
      { error: "Vorname, Nachname und E-Mail sind erforderlich." },
      { status: 400 }
    );
  }

  const emailExists = db
    .prepare("SELECT id FROM users WHERE email = ? AND id != ?")
    .get(email, user.id) as { id: string } | undefined;
  if (emailExists) {
    return NextResponse.json(
      { error: "Diese E-Mail ist bereits vergeben." },
      { status: 409 }
    );
  }

  if (phone) {
    const phoneExists = db
      .prepare("SELECT id FROM users WHERE phone = ? AND id != ?")
      .get(phone, user.id) as { id: string } | undefined;
    if (phoneExists) {
      return NextResponse.json(
        { error: "Diese Telefonnummer ist bereits vergeben." },
        { status: 409 }
      );
    }
  }

  const fields = [
    "name = ?",
    "first_name = ?",
    "last_name = ?",
    "email = ?",
    "phone = ?",
    "street = ?",
    "house_number = ?",
    "address_extra = ?",
    "postal_code = ?",
    "city = ?",
    "updated_at = ?",
  ];
  const values: Array<string | null> = [
    `${firstName} ${lastName}`.trim(),
    firstName,
    lastName,
    email,
    phone,
    street || null,
    houseNumber || null,
    addressExtra || null,
    postalCode || null,
    city || null,
    new Date().toISOString(),
  ];

  if (password) {
    const { passwordHash, passwordSalt } = hashPassword(password);
    fields.push("password_hash = ?");
    fields.push("password_salt = ?");
    values.push(passwordHash, passwordSalt);
  }

  values.push(user.id);

  db.prepare(`UPDATE users SET ${fields.join(", ")} WHERE id = ?`).run(...values);

  const updated = db
    .prepare(
      `
        SELECT first_name as firstName,
               last_name as lastName,
               email,
               phone,
               street,
               house_number as houseNumber,
               address_extra as addressExtra,
               postal_code as postalCode,
               city
        FROM users
        WHERE id = ?
      `
    )
    .get(user.id) as {
    firstName: string | null;
    lastName: string | null;
    email: string;
    phone: string | null;
    street: string | null;
    houseNumber: string | null;
    addressExtra: string | null;
    postalCode: string | null;
    city: string | null;
  } | undefined;

  return NextResponse.json(
    updated ?? {
      firstName,
      lastName,
      email,
      phone,
      street: street || null,
      houseNumber: houseNumber || null,
      addressExtra: addressExtra || null,
      postalCode: postalCode || null,
      city: city || null,
    }
  );
}

export async function DELETE() {
  const user = await getCurrentUser();
  if (!user || user.role !== "CUSTOMER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  db.prepare("DELETE FROM sessions WHERE user_id = ?").run(user.id);
  db.prepare("DELETE FROM users WHERE id = ?").run(user.id);

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    expires: new Date(0),
    path: "/",
  });

  return NextResponse.json({ success: true });
}
