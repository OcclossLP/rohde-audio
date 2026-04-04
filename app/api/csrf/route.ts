import { NextResponse } from "next/server";
import crypto from "crypto";
import { CSRF_COOKIE } from "@/lib/csrf";
import { getCookieOptions } from "@/lib/subdomains";

export async function GET() {
  const token = crypto.randomUUID().replace(/-/g, "");
  const response = NextResponse.json({ token });
  response.cookies.set(
    CSRF_COOKIE,
    token,
    getCookieOptions({
      httpOnly: false,
      sameSite: "strict",
      sharedDomain: false,
    })
  );
  return response;
}
