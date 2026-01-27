"use client";

import { useEffect, useState } from "react";

type FaqItem = {
  id: string;
  question: string;
  answer: string;
};

export default function FaqSection() {
  const [faqs, setFaqs] = useState<FaqItem[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/faqs")
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setFaqs(Array.isArray(data) ? data : []))
      .catch(() => null);
  }, []);

  if (!faqs.length) return null;

  return (
    <section className="faq-section py-20 px-6" aria-label="FAQ">
      <div className="faq-card max-w-6xl mx-auto rounded-3xl border border-white/10 bg-(--surface-2) p-8 shadow-lg">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-white">
            Häufige Fragen
          </h3>
          <span className="text-xs text-gray-400">Kurz &amp; knapp</span>
        </div>
        <div className="space-y-4">
          {faqs.map((faq) => {
            const isOpen = openId === faq.id;
            return (
              <button
                key={faq.id}
                type="button"
                onClick={() => setOpenId(isOpen ? null : faq.id)}
                className="w-full text-left rounded-2xl border border-white/10 bg-(--surface-3) px-5 py-4 transition hover:bg-white/5"
              >
                <div className="flex items-center justify-between gap-4">
                  <span className="text-white font-semibold">{faq.question}</span>
                  <span className="text-purple-400 text-lg">
                    {isOpen ? "−" : "+"}
                  </span>
                </div>
                {isOpen && (
                  <p className="mt-3 text-sm text-gray-300 whitespace-pre-wrap">
                    {faq.answer}
                  </p>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
