"use client";

import { useEffect, useState } from "react";

export default function HttpsNotice() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const isLocal =
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1";
    const isHttps = window.location.protocol === "https:";
    if (!isHttps && !isLocal) {
      setShow(true);
    }
  }, []);

  if (!show) return null;

  return (
    <div className="https-notice" role="status">
      <div className="https-notice__content">
        <span>Hinweis: Diese Seite nutzt kein HTTPS. Logins funktionieren dann nicht.</span>
        <button
          type="button"
          className="https-notice__close"
          onClick={() => setShow(false)}
          aria-label="Hinweis schließen"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
