import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { CSRF_COOKIE } from "./lib/csrf";

function generateToken() {
  return crypto.randomUUID().replace(/-/g, "");
}

export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  const existing = request.cookies.get(CSRF_COOKIE)?.value;
  if (!existing) {
    response.cookies.set(CSRF_COOKIE, generateToken(), {
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });
  }
  return response;
}

export const config = {
  matcher: ["/((?!_next|favicon.ico|.*\\..*).*)"],
};
