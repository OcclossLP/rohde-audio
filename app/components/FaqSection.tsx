"use client";

import { useEffect, useState } from "react";
import type { PublicFaq } from "@/lib/faqs";
import { theme } from "./Theme";

type FaqSectionProps = {
  initialFaqs?: PublicFaq[];
};

const EMPTY_FAQS: PublicFaq[] = [];

export default function FaqSection({ initialFaqs = EMPTY_FAQS }: FaqSectionProps) {
  const [faqs, setFaqs] = useState<PublicFaq[]>(initialFaqs);
  const hasInitialFaqs = initialFaqs.length > 0;

  useEffect(() => {
    if (hasInitialFaqs) return;

    const controller = new AbortController();
    fetch("/api/faqs", { signal: controller.signal })
      .then((response) => (response.ok ? response.json() : []))
      .then((data) => setFaqs(Array.isArray(data) ? data : []))
      .catch(() => null);

    return () => controller.abort();
  }, [hasInitialFaqs]);

  if (!faqs.length) return null;

  return (
    <section className="faq-section py-20 px-6" aria-label="FAQ">
      <div className="faq-card max-w-6xl mx-auto rounded-3xl border border-white/10 bg-(--surface-2) p-8 shadow-lg">
        <div className="mb-6 flex items-center justify-between">
          <h3 className="text-2xl font-bold text-white">Häufige Fragen</h3>
          <span className="text-xs text-gray-400">Kurz &amp; knapp</span>
        </div>
        <div className="space-y-4">
          {faqs.map((faq) => (
            <details
              key={faq.id}
              className="group rounded-2xl border border-white/10 bg-(--surface-3) px-5 py-4 transition hover:bg-white/5"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4">
                <span className="font-semibold text-white">{faq.question}</span>
                <span
                  className="text-lg font-semibold transition-transform group-open:rotate-45"
                  style={{ color: theme.primary }}
                >
                  +
                </span>
              </summary>
              <p className="mt-3 whitespace-pre-wrap text-sm text-gray-300">{faq.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
