// src/components/home/HomeFaq.tsx
// Section 5 — questions frequentes.
//
// ⚠ REGLE GOOGLE : chaque question/reponse balisee en FAQPage doit etre
// VISIBLE sur la page. On utilise <details> natif, jamais un accordeon
// JavaScript qui retirerait le contenu du DOM — c'est un motif documente
// d'action manuelle.
//
// Les memes cles alimentent le JSON-LD depuis page.tsx : voir FAQ_KEYS.

import { getTranslations } from "next-intl/server";

/** Cles des questions, partagees entre le rendu et le balisage JSON-LD. */
export const FAQ_KEYS = ["q1", "q2", "q3", "q4", "q5"] as const;

export async function HomeFaq({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: "home.faq" });

  return (
    <section className="bg-[#FDFAF6] py-16 sm:py-20">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <h2 className="font-[family-name:var(--font-courgette)] text-3xl text-stone-900 sm:text-4xl">
          {t("title")}
        </h2>

        <div className="mt-7 divide-y divide-stone-200 border-y border-stone-200">
          {FAQ_KEYS.map((cle) => (
            <details key={cle} className="group py-4">
              <summary className="flex cursor-pointer items-center justify-between gap-4 text-lg font-semibold text-stone-900 marker:content-none [&::-webkit-details-marker]:hidden">
                {t(`${cle}.question`)}
                <span
                  aria-hidden="true"
                  className="shrink-0 text-xl leading-none text-[#E76F51] transition-transform duration-300 group-open:rotate-45"
                >
                  +
                </span>
              </summary>
              <p className="mt-3 text-base leading-relaxed text-stone-600">
                {t(`${cle}.answer`)}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
