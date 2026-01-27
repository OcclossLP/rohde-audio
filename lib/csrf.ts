import { cookies } from "next/headers";

export const CSRF_COOKIE = "csrf_token";
export const CSRF_HEADER = "x-csrf-token";

export async function requireCsrf(request: Request) {
  const method = request.method.toUpperCase();
  if (method === "GET" || method === "HEAD" || method === "OPTIONS") {
    return true;
  }
  const header = request.headers.get(CSRF_HEADER);
  const cookieStore = await cookies();
  const token = cookieStore.get(CSRF_COOKIE)?.value;
  return Boolean(header && token && header === token);
}
