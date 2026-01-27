"use client";

import { useEffect, useState } from "react";

type Theme = "light" | "dark";
type Consent = "accepted" | "declined" | "necessary" | null;

const getConsent = (): Consent => {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/(?:^|; )cookie_consent=([^;]*)/);
  return match ? (decodeURIComponent(match[1]) as Consent) : null;
};

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("dark");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const consent = getConsent();
    const stored =
      consent && consent !== "declined"
        ? (localStorage.getItem("theme") as Theme | null)
        : null;
    const initial = stored || "dark";
    setTheme(initial);
    document.documentElement.dataset.theme = initial;
    setMounted(true);
  }, []);

  const toggle = () => {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    const consent = getConsent();
    if (consent && consent !== "declined") {
      localStorage.setItem("theme", next);
    } else {
      localStorage.removeItem("theme");
    }
    document.documentElement.classList.add("theme-transition");
    document.documentElement.dataset.theme = next;
    window.setTimeout(() => {
      document.documentElement.classList.remove("theme-transition");
    }, 620);
  };

  if (!mounted) {
    return (
      <button
        className="theme-toggle theme-toggle--placeholder"
        aria-label="Theme umschalten"
        type="button"
      />
    );
  }

  return (
    <button
      onClick={toggle}
      className="theme-toggle"
      aria-label="Theme umschalten"
      aria-pressed={theme === "dark"}
      type="button"
      data-theme={theme}
    >
      <span className="theme-toggle__track" />
      <span className="theme-toggle__thumb" />
      <span className="theme-toggle__icon theme-toggle__icon--sun">☀</span>
      <span className="theme-toggle__icon theme-toggle__icon--moon">☾</span>
    </button>
  );
}
