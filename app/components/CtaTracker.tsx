"use client";

import { useEffect } from "react";
const hasAnalyticsConsent = () => {
  const match = document.cookie.match(/(?:^|; )cookie_consent=([^;]*)/);
  return match ? decodeURIComponent(match[1]) === "accepted" : false;
};

export default function CtaTracker({ enabled = true }: { enabled?: boolean }) {
  useEffect(() => {
    if (!enabled) return;
    const handler = (event: MouseEvent) => {
      if (!hasAnalyticsConsent()) return;
      const target = event.target as HTMLElement | null;
      const cta = target?.closest<HTMLElement>("[data-cta]");
      if (!cta) return;
      const name = cta.getAttribute("data-cta");
      if (!name) return;
      const path = window.location.pathname;
      const payload = JSON.stringify({ name, path });
      if (navigator.sendBeacon) {
        const blob = new Blob([payload], { type: "application/json" });
        navigator.sendBeacon("/api/event", blob);
        return;
      }
      fetch("/api/event", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: payload,
        keepalive: true,
        credentials: "include",
      }).catch(() => null);
    };

    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, [enabled]);

  return null;
}
