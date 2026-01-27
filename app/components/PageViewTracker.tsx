"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { csrfFetch } from "./csrfFetch";

export default function PageViewTracker({ enabled = true }: { enabled?: boolean }) {
  const pathname = usePathname();
  const lastTracked = useRef<string | null>(null);

  useEffect(() => {
    if (!enabled) return;
    if (!pathname || pathname.startsWith("/admin")) return;
    const consentMatch = document.cookie.match(
      /(?:^|; )cookie_consent=([^;]*)/
    );
    const consent = consentMatch ? decodeURIComponent(consentMatch[1]) : null;
    if (consent !== "accepted") return;
    if (lastTracked.current === pathname) return;
    lastTracked.current = pathname;

    csrfFetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: pathname }),
    }).catch(() => null);
  }, [pathname, enabled]);

  return null;
}
