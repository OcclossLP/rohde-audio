import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  deleteSession,
  getExpiredSessionCookieOptions,
  SESSION_COOKIE,
} from "@/lib/auth";
import { requireCsrf } from "@/lib/csrf";

export async function POST(request: Request) {
  if (!(await requireCsrf(request))) {
    return NextResponse.json({ error: "Ungültige Anfrage." }, { status: 403 });
  }
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value ?? null;
  await deleteSession(token);
  cookieStore.set(SESSION_COOKIE, "", getExpiredSessionCookieOptions());
  return NextResponse.json({ success: true });
}
