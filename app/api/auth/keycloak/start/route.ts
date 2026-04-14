import crypto from "crypto";
import { NextResponse } from "next/server";
import {
  getKeycloakAuthUrl,
  getPublicAppBaseUrl,
  isKeycloakAuthConfigured,
} from "@/lib/keycloak";
import { shouldUseSecureCookies } from "@/lib/subdomains";

const STATE_COOKIE = "keycloak_state";
const STATE_EXPIRY_SECONDS = 300;

export async function GET(request: Request) {
  if (!isKeycloakAuthConfigured()) {
    const appBaseUrl = getPublicAppBaseUrl(request);
    return NextResponse.redirect(new URL("/admin/login?error=oauth_not_configured", appBaseUrl));
  }

  const state = crypto.randomBytes(16).toString("hex");
  const redirectUrl = getKeycloakAuthUrl(state, request);

  const response = NextResponse.redirect(redirectUrl);
  response.cookies.set(STATE_COOKIE, state, {
    httpOnly: true,
    secure: shouldUseSecureCookies(),
    sameSite: "lax",
    path: "/",
    maxAge: STATE_EXPIRY_SECONDS,
  });

  return response;
}
