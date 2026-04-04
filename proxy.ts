import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { CSRF_COOKIE } from "./lib/csrf";
import {
  getCookieOptions,
  getSubdomainFromHost,
  getSubdomainRewriteTarget,
} from "./lib/subdomains";

function generateToken() {
  return crypto.randomUUID().replace(/-/g, "");
}

function withCsrfCookie(response: NextResponse, request: NextRequest) {
  const existing = request.cookies.get(CSRF_COOKIE)?.value;
  if (!existing) {
    response.cookies.set(
      CSRF_COOKIE,
      generateToken(),
      getCookieOptions({
        httpOnly: false,
        sameSite: "strict",
        sharedDomain: false,
      })
    );
  }

  return response;
}

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (pathname === "/about-us" || pathname === "/about-us/") {
    const response = NextResponse.rewrite(new URL("/404", request.url));
    return withCsrfCookie(response, request);
  }

  const host = request.headers.get("host") ?? request.nextUrl.host;
  const subdomain = getSubdomainFromHost(host);
  const requestHeaders = new Headers(request.headers);

  if (subdomain) {
    requestHeaders.set("x-subdomain", subdomain);
  } else {
    requestHeaders.delete("x-subdomain");
  }

  const rewriteTarget = getSubdomainRewriteTarget(host, pathname);
  const response = rewriteTarget
    ? NextResponse.rewrite(new URL(`${rewriteTarget}${search}`, request.url), {
        request: { headers: requestHeaders },
      })
    : NextResponse.next({ request: { headers: requestHeaders } });

  return withCsrfCookie(response, request);
}

export const config = {
  matcher: ["/((?!_next|favicon.ico|.*\\..*).*)"],
};
