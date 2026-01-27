import { NextResponse } from "next/server";
import { db } from "@/lib/db";

type FaqRow = {
  id: string;
  question: string;
  answer: string;
  sortOrder: number;
};

export async function GET() {
  const settings = db
    .prepare("SELECT value FROM settings WHERE key = ?")
    .get("faq_limit") as { value: string } | undefined;
  const limit = settings?.value ? Number(settings.value) : 6;
  const safeLimit = Number.isFinite(limit) && limit > 0 ? Math.min(limit, 12) : 6;
  const faqs = (db
    .prepare(
      `
        SELECT id,
               question,
               answer,
               sort_order as sortOrder
        FROM faqs
        WHERE is_active = 1
        ORDER BY sort_order ASC, created_at ASC
        LIMIT ?
      `
    )
    .all(safeLimit) as FaqRow[]);

  return NextResponse.json(faqs);
}
