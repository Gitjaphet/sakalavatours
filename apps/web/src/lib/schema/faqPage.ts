// src/lib/schema/faqPage.ts
// FAQPage — permet l'affichage des questions en accordéon sous le résultat.
//
// ⚠ Google exige que chaque question/réponse balisée soit VISIBLE sur la page.
// Ne jamais baliser une FAQ masquée ou absente du rendu : c'est un motif
// documenté d'action manuelle.

export type FaqEntry = {
  question: string;
  answer: string;
};

export function buildFaqSchema(entries: FaqEntry[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: entries.map((entry) => ({
      "@type": "Question",
      name: entry.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: entry.answer,
      },
    })),
  };
}
