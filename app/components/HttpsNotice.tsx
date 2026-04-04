"use client";

import { useState, useSyncExternalStore } from "react";

const subscribe = () => () => undefined;
const shouldShowNotice = () => {
  if (typeof window === "undefined") return false;
  return (
    window.location.protocol !== "https:" &&
    window.location.hostname !== "localhost" &&
    window.location.hostname !== "127.0.0.1"
  );
};

export default function HttpsNotice() {
  const hydrated = useSyncExternalStore(subscribe, () => true, () => false);
  const [dismissed, setDismissed] = useState(false);

  const show = hydrated && !dismissed && shouldShowNotice();

  if (!show) return null;

  return (
    <div className="https-notice" role="status">
      <div className="https-notice__content">
        <span>Hinweis: Diese Seite nutzt kein HTTPS. Logins funktionieren dann nicht.</span>
        <button
          type="button"
          className="https-notice__close"
          onClick={() => setDismissed(true)}
          aria-label="Hinweis schließen"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
