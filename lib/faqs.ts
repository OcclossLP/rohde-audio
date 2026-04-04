import { unstable_cache } from "next/cache";
import { db } from "./db";

export type PublicFaq = {
  id: string;
  question: string;
  answer: string;
  sortOrder: number;
};

const loadPublicFaqs = unstable_cache(
  async () => {
    const settings = db
      .prepare("SELECT value FROM settings WHERE key = ?")
      .get("faq_limit") as { value: string } | undefined;

    const limit = settings?.value ? Number(settings.value) : 6;
    const safeLimit = Number.isFinite(limit) && limit > 0 ? Math.min(limit, 12) : 6;

    return db
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
      .all(safeLimit) as PublicFaq[];
  },
  ["public-faqs"],
  {
    revalidate: 300,
    tags: ["faqs"],
  }
);

export async function getPublicFaqs() {
  return loadPublicFaqs();
}
