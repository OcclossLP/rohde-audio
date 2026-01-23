import crypto from "crypto";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

type InquiryRow = {
  id: string;
  eventType: string | null;
  participants: string | null;
  eventDate: string | null;
  message: string;
  status: string;
  createdAt: string;
};

export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role !== "CUSTOMER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const inquiries = (db
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
        WHERE user_id = ?
        ORDER BY created_at DESC
      `
    )
    .all(user.id) as InquiryRow[]);

  return NextResponse.json(inquiries);
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== "CUSTOMER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const eventType =
    typeof body?.eventType === "string" ? body.eventType.trim() : "";
  const participants =
    typeof body?.participants === "string" ? body.participants.trim() : "";
  const eventDate =
    typeof body?.eventDate === "string" ? body.eventDate.trim() : "";
  const message = typeof body?.message === "string" ? body.message.trim() : "";

  if (!message) {
    return NextResponse.json(
      { error: "Bitte gib eine Nachricht ein." },
      { status: 400 }
    );
  }

  const id = crypto.randomUUID();
  const createdAt = new Date().toISOString();

  db.prepare(
    `
      INSERT INTO inquiries (id, user_id, event_type, participants, event_date, message, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `
  ).run(
    id,
    user.id,
    eventType || null,
    participants || null,
    eventDate || null,
    message,
    "open",
    createdAt
  );

  const created = db
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
    .get(id) as InquiryRow | undefined;

  return NextResponse.json(created, { status: 201 });
}
