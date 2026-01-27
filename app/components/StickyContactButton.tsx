"use client";

import { usePathname } from "next/navigation";

export default function StickyContactButton() {
  const pathname = usePathname();
  if (!pathname || pathname.startsWith("/admin") || pathname.startsWith("/account")) {
    return null;
  }

  return (
    <a href="/contact#form" className="sticky-cta" data-cta="cta_contact">
      Jetzt anfragen
      <span className="sticky-cta__glow" aria-hidden="true" />
    </a>
  );
}
