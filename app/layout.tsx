import "./globals.css";
import type { Metadata } from "next";
import type { ReactNode, CSSProperties } from "react";
import { headers } from "next/headers";
import { Geist, Geist_Mono } from "next/font/google";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import PageViewTracker from "./components/PageViewTracker";
import CookieBanner from "./components/CookieBanner";
import HttpsNotice from "./components/HttpsNotice";
import StickyContactButton from "./components/StickyContactButton";
import CtaTracker from "./components/CtaTracker";
import MaintenanceOverlay from "./components/MaintenanceOverlay";
import { getSettings } from "@/lib/settings";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://www.rohde-audio.de"),
  title: "Rohde Audio",
  description: "Rohde Audio – Musikanlagen & Eventtechnik aus Warburg.",
};

const hexToRgb = (hex: string) => {
  const normalized = hex.replace("#", "").trim();
  if (![3, 6].includes(normalized.length)) return null;
  const value =
    normalized.length === 3
      ? normalized
          .split("")
          .map((char) => char + char)
          .join("")
      : normalized;
  const int = Number.parseInt(value, 16);
  if (Number.isNaN(int)) return null;
  return {
    r: (int >> 16) & 255,
    g: (int >> 8) & 255,
    b: int & 255,
  };
};

const toRgba = (hex: string, alpha: number, fallback: string) => {
  const rgb = hexToRgb(hex);
  if (!rgb) return fallback;
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
};

const getClientIp = async () => {
  const headerList = await headers();
  const forwarded = headerList.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  return headerList.get("x-real-ip") || "";
};

const parseBypassIps = (value: string) =>
  value
    .split(/[,\\n]/)
    .map((item) => item.trim())
    .filter(Boolean);

export default async function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  const settings = getSettings();
  const analyticsEnabled = settings.analytics_enabled !== "0";
  const uiPrimary = settings.ui_primary || "#a855f7";
  const uiSecondary = settings.ui_secondary || "#2563eb";
  const accentSoft = toRgba(uiPrimary, 0.35, "rgba(168, 85, 247, 0.35)");
  const maintenanceEnabled = settings.maintenance_enabled === "1";
  const maintenanceMessage = settings.maintenance_message;
  const bypassList = parseBypassIps(settings.maintenance_bypass_ips || "");
  const ip = await getClientIp();
  const shouldShowMaintenance =
    maintenanceEnabled && !(ip && bypassList.includes(ip));
  return (
    <html
      lang="de"
      data-theme="dark"
      suppressHydrationWarning
      style={
        {
          "--accent": uiPrimary,
          "--accent-soft": accentSoft,
          "--accent-secondary": uiSecondary,
        } as CSSProperties
      }
    >
      <head>
        <link rel="icon" href="/favicon.ico" />
        <meta name="description" content="Deine Website-Beschreibung" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (() => {
                try {
                  const match = document.cookie.match(/(?:^|; )cookie_consent=([^;]*)/);
                  const consent = match ? decodeURIComponent(match[1]) : null;
                  const stored = consent && consent !== "declined" ? localStorage.getItem("theme") : null;
                  const theme = stored || "dark";
                  document.documentElement.dataset.theme = theme;
                } catch {}
              })();
            `,
          }}
        />
      </head>
      <body className="bg-(--page-bg) text-[var(--page-text)]">
        <PageViewTracker enabled={analyticsEnabled} />
        <CtaTracker enabled={analyticsEnabled} />
        <MaintenanceOverlay
          enabled={shouldShowMaintenance}
          message={maintenanceMessage}
        />
        <HttpsNotice />
        <Navbar />
        {children}
        <Footer />
        <CookieBanner />
        <StickyContactButton />
      </body>
    </html>
  );
}
