import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { exchangeKeycloakCode, fetchKeycloakUserinfo, findOrCreateKeycloakUser } from "@/lib/keycloak";
import { createSession, getSessionCookieOptions, SESSION_COOKIE } from "@/lib/auth";

const STATE_COOKIE = "keycloak_state";

function redirectWithStateCleanup(request: Request, pathname: string) {
  const response = NextResponse.redirect(new URL(pathname, request.url));
  response.cookies.set(STATE_COOKIE, "", { path: "/", maxAge: 0 });
  return response;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const cookieStore = await cookies();
  const storedState = cookieStore.get(STATE_COOKIE)?.value;

  if (!code || !state || !storedState || state !== storedState) {
    return redirectWithStateCleanup(request, "/admin/login?error=oauth_state_mismatch");
  }

  let tokenResponse;
  try {
    tokenResponse = await exchangeKeycloakCode(code, request);
  } catch (error) {
    console.error("Keycloak token exchange failed:", error);
    return redirectWithStateCleanup(request, "/admin/login?error=oauth_token_failed");
  }

  let profile;
  try {
    profile = await fetchKeycloakUserinfo(tokenResponse.access_token);
  } catch (error) {
    console.error("Keycloak userinfo failed:", error);
    return redirectWithStateCleanup(request, "/admin/login?error=oauth_userinfo_failed");
  }

  if (!profile?.email) {
    return redirectWithStateCleanup(request, "/admin/login?error=oauth_no_email");
  }

  const user = await findOrCreateKeycloakUser({
    email: profile.email,
    given_name: profile.given_name,
    family_name: profile.family_name,
    name: profile.name,
    phone_number: profile.phone_number,
    email_verified: profile.email_verified,
  });

  const { token, expiresAt } = await createSession(user.id);
  const target = user.role === "ADMIN" ? "/admin" : "/account";
  const response = redirectWithStateCleanup(request, target);
  response.cookies.set(SESSION_COOKIE, token, getSessionCookieOptions(expiresAt));
  return response;
}
