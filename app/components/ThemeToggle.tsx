"use client";

import { useEffect, useState } from "react";

type Theme = "light" | "dark";

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("dark");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("theme") as Theme | null;
    const system: Theme = window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
    const initial = stored || system;
    setTheme(initial);
    document.documentElement.dataset.theme = initial;
    setMounted(true);
  }, []);

  const toggle = () => {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem("theme", next);
    document.documentElement.classList.add("theme-transition");
    document.documentElement.dataset.theme = next;
    window.setTimeout(() => {
      document.documentElement.classList.remove("theme-transition");
    }, 620);
  };

  if (!mounted) {
    return (
      <button
        className="h-9 w-16 rounded-full border border-white/15 bg-white/5"
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
