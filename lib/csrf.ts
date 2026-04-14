import { cookies } from "next/headers";

export const CSRF_COOKIE = "csrf_token";
export const CSRF_HEADER = "x-csrf-token";

function firstHeaderValue(value: string | null | undefined) {
  return (value ?? "")
    .split(",")
    .map((item) => item.trim())
    .find(Boolean) ?? "";
}

function parseOrigin(value: string) {
  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}

function getExpectedOrigins(request: Request) {
  const expected = new Set<string>();
  const requestUrl = new URL(request.url);
  expected.add(requestUrl.origin);

  const forwardedHost = firstHeaderValue(request.headers.get("x-forwarded-host"));
  const host = forwardedHost || firstHeaderValue(request.headers.get("host"));
  const forwardedProto = firstHeaderValue(request.headers.get("x-forwarded-proto"));
  const protocol = (forwardedProto || requestUrl.protocol.replace(":", "")).toLowerCase();

  if (host) {
    expected.add(`${protocol}://${host}`);
    expected.add(`https://${host}`);
    expected.add(`http://${host}`);
  }

  return expected;
}

function hasTrustedOrigin(request: Request) {
  const expectedOrigins = getExpectedOrigins(request);
  const origin = request.headers.get("origin");

  if (origin) {
    const parsedOrigin = parseOrigin(origin);
    return parsedOrigin ? expectedOrigins.has(parsedOrigin) : false;
  }

  const referer = request.headers.get("referer");
  if (!referer) {
    return true;
  }

  const refererOrigin = parseOrigin(referer);
  return refererOrigin ? expectedOrigins.has(refererOrigin) : false;
}

export async function requireCsrf(request: Request) {
  const method = request.method.toUpperCase();
  if (method === "GET" || method === "HEAD" || method === "OPTIONS") {
    return true;
  }

  if (!hasTrustedOrigin(request)) {
    return false;
  }

  const header = request.headers.get(CSRF_HEADER);
  if (!header) {
    return false;
  }

  const cookieStore = await cookies();
  const token = cookieStore.get(CSRF_COOKIE)?.value;
  if (!token) {
    return false;
  }

  return header === token;
}
