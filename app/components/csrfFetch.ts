"use client";

const getCsrfToken = () => {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/(?:^|; )csrf_token=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : null;
};

export async function csrfFetch(
  input: RequestInfo | URL,
  init: RequestInit = {}
) {
  let token = getCsrfToken();
  if (!token) {
    await fetch("/api/csrf", { credentials: "include" }).catch(() => null);
    token = getCsrfToken();
  }

  const headers = new Headers(init.headers || {});
  if (token && !headers.has("x-csrf-token")) {
    headers.set("x-csrf-token", token);
  }
  return fetch(input, { credentials: "include", ...init, headers });
}
