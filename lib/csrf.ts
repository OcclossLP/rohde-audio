import { cookies } from "next/headers";

export const CSRF_COOKIE = "csrf_token";
export const CSRF_HEADER = "x-csrf-token";

function hasTrustedOrigin(request: Request) {
  const expectedOrigin = new URL(request.url).origin;
  const origin = request.headers.get("origin");

  if (origin) {
    return origin === expectedOrigin;
  }

  const referer = request.headers.get("referer");
  if (!referer) {
    return true;
  }

  try {
    return new URL(referer).origin === expectedOrigin;
  } catch {
    return false;
  }
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
