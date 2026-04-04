"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

type Theme = "light" | "dark";
type Consent = "accepted" | "declined" | "necessary" | null;

const getConsent = (): Consent => {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/(?:^|; )cookie_consent=([^;]*)/);
  return match ? (decodeURIComponent(match[1]) as Consent) : null;
};

const getInitialTheme = (): Theme => {
  if (typeof document === "undefined") return "dark";
  const consent = getConsent();
  const stored =
    consent && consent !== "declined"
      ? (localStorage.getItem("theme") as Theme | null)
      : null;
  const current = document.documentElement.dataset.theme === "light" ? "light" : "dark";
  return stored || current;
};

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("dark");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const initial = getInitialTheme();
    setTheme(initial);
    document.documentElement.dataset.theme = initial;
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    document.documentElement.dataset.theme = theme;
  }, [theme, mounted]);

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

  const isDark = theme === "dark";
  const label = isDark ? "Zum Light-Mode wechseln" : "Zum Dark-Mode wechseln";
  const Icon = isDark ? Sun : Moon;

  return (
    <button
      onClick={toggle}
      className={`theme-toggle ${isDark ? "theme-toggle--dark" : ""}`}
      aria-label={label}
      aria-pressed={isDark}
      title={label}
      type="button"
      data-mounted={mounted ? "true" : "false"}
    >
      <Icon size={18} strokeWidth={2.1} />
    </button>
  );
}
