"use client";

import { useEffect, useState } from "react";

type Consent = "accepted" | "declined" | "necessary";

const COOKIE_NAME = "cookie_consent";
const MAX_AGE = 60 * 60 * 24 * 365; // 1 year

const getConsent = () => {
  const match = document.cookie.match(new RegExp(`(?:^|; )${COOKIE_NAME}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
};

const setConsent = (value: Consent) => {
  document.cookie = `${COOKIE_NAME}=${encodeURIComponent(value)}; Path=/; Max-Age=${MAX_AGE}; SameSite=Lax`;
};

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const existing = getConsent();
    if (!existing) {
      setVisible(true);
    }
  }, []);

  if (!visible) return null;

  return (
    <div className="cookie-banner">
      <div className="cookie-banner__content">
        <div className="cookie-banner__text">
          <h3>Cookies & Datenschutz</h3>
          <p>
            Wir verwenden Cookies, um dir ein besseres Erlebnis zu bieten (z. B. Login & Theme).
            Optional helfen sie uns, unsere Website zu verbessern. Du kannst frei entscheiden.
            <a className="cookie-banner__link" href="/datenschutz">
              Mehr erfahren
            </a>
          </p>
        </div>
        <div className="cookie-banner__actions">
          <button
            type="button"
            className="cookie-btn cookie-btn--ghost"
            onClick={() => {
              setConsent("declined");
              setVisible(false);
            }}
          >
            Ablehnen
          </button>
          <button
            type="button"
            className="cookie-btn cookie-btn--ghost"
            onClick={() => {
              setConsent("necessary");
              setVisible(false);
            }}
          >
            Nur notwendige
          </button>
          <button
            type="button"
            className="cookie-btn cookie-btn--primary"
            onClick={() => {
              setConsent("accepted");
              setVisible(false);
            }}
          >
            Akzeptieren
          </button>
        </div>
      </div>
    </div>
  );
}
