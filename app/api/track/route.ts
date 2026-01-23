import crypto from "crypto";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

const toDbTimestamp = (date: Date) => {
  const pad = (value: number) => String(value).padStart(2, "0");
  return [
    date.getUTCFullYear(),
    pad(date.getUTCMonth() + 1),
    pad(date.getUTCDate()),
  ].join("-")
    + " "
    + [pad(date.getUTCHours()), pad(date.getUTCMinutes()), pad(date.getUTCSeconds())].join(":");
};

export async function POST(request: Request) {
  let path = "";
  try {
    const body = await request.json();
    path = typeof body?.path === "string" ? body.path.trim() : "";
  } catch {
    path = "";
  }

  if (!path || path.startsWith("/admin") || path.startsWith("/api")) {
    return NextResponse.json({ ok: true });
  }

  const createdAt = toDbTimestamp(new Date());
  db.prepare(
    `
      INSERT INTO pageviews (id, path, created_at)
      VALUES (?, ?, ?)
    `
  ).run(crypto.randomUUID(), path, createdAt);

  return NextResponse.json({ ok: true });
}
