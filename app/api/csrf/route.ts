import { NextResponse } from "next/server";
import crypto from "crypto";
import { CSRF_COOKIE } from "@/lib/csrf";

export async function GET() {
  const token = crypto.randomUUID().replace(/-/g, "");
  const response = NextResponse.json({ token });
  response.cookies.set(CSRF_COOKIE, token, {
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
  return response;
}
