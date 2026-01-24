import crypto from "crypto";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/password";
import { sendInquiryEmails } from "@/lib/email";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const firstName =
      typeof body?.firstName === "string" ? body.firstName.trim() : "";
    const lastName =
      typeof body?.lastName === "string" ? body.lastName.trim() : "";
    const legacyName = typeof body?.name === "string" ? body.name.trim() : "";
    const name = legacyName || `${firstName} ${lastName}`.trim();
    const email =
      typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
    const phone = typeof body?.phone === "string" ? body.phone.trim() : "";
    const eventType =
      typeof body?.eventType === "string" ? body.eventType.trim() : "";
    const participants =
      typeof body?.participants === "string" ? body.participants.trim() : "";
    const date = typeof body?.date === "string" ? body.date.trim() : "";
    const message =
      typeof body?.message === "string" ? body.message.trim() : "";

    if (!name || !email || !message) {
      return NextResponse.json(
        { success: false, error: "Name, E-Mail und Nachricht sind erforderlich." },
        { status: 400 }
      );
    }

    const guestEmail = "gast@rohde-audio.local";
    const guestUser =
      (db
        .prepare("SELECT id FROM users WHERE email = ?")
        .get(guestEmail) as { id: string } | undefined) ?? null;

    let guestUserId = guestUser?.id;
    if (!guestUserId) {
      const id = crypto.randomUUID();
      const now = new Date().toISOString();
      const { passwordHash, passwordSalt } = hashPassword(
        crypto.randomBytes(32).toString("hex")
      );
      db.prepare(
        `
          INSERT INTO users (id, email, name, first_name, last_name, role, password_hash, password_salt, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `
      ).run(
        id,
        guestEmail,
        "Gast",
        "Gast",
        "",
        "CUSTOMER",
        passwordHash,
        passwordSalt,
        now,
        now
      );
      guestUserId = id;
    }

    const inquiryId = crypto.randomUUID();
    const createdAt = new Date().toISOString();
    db.prepare(
      `
        INSERT INTO inquiries (
          id,
          user_id,
          contact_name,
          contact_email,
          contact_phone,
          event_type,
          participants,
          event_date,
          message,
          status,
          created_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `
    ).run(
      inquiryId,
      guestUserId,
      name,
      email,
      phone || null,
      eventType || null,
      participants || null,
      date || null,
      message,
      "open",
      createdAt
    );

    try {
      await sendInquiryEmails({
        name,
        email,
        phone,
        eventType,
        participants,
        eventDate: date,
        message,
      });
    } catch (error) {
      console.error("Anfrage-E-Mail fehlgeschlagen:", error);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("E‑Mail senden fehlgeschlagen:", error);
    return NextResponse.json({ success: false, error }, { status: 500 });
  }
}
