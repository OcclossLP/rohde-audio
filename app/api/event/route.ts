import crypto from "crypto";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSettingBool } from "@/lib/settings";

export async function POST(request: Request) {
  if (!getSettingBool("analytics_enabled", true)) {
    return NextResponse.json({ ok: true });
  }
  const body = await request.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const path = typeof body?.path === "string" ? body.path.trim() : "";

  if (!name || !path || path.startsWith("/admin") || path.startsWith("/api")) {
    return NextResponse.json({ ok: true });
  }

  db.prepare(
    `
      INSERT INTO events (id, name, path, created_at)
      VALUES (?, ?, ?, ?)
    `
  ).run(crypto.randomUUID(), name, path || null, new Date().toISOString());

  return NextResponse.json({ ok: true });
}
