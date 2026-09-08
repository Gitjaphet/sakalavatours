// src/components/home/HomeSeason.tsx
// Section 4 — quand venir a Nosy Be.
//
// Role SEO : "meilleure periode Nosy Be" est une requete informationnelle a
// fort volume que les concurrents locaux ne traitent pas. Le bloc y repond
// directement, en texte indexable.
//
// ⚠ Les periodes et le contenu meteo sont a valider avec l'agence : une
// information saisonniere fausse fait rater un voyage.

import { getTranslations } from "next-intl/server";
import { Squiggle } from "@/components/ui/Doodles";

const PERIODES = ["dry", "green", "whales"] as const;

export async function HomeSeason({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: "home.season" });

  return (
    <section className="bg-white py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl">
          <h2 className="font-[family-name:var(--font-courgette)] text-3xl text-stone-900 sm:text-4xl">
            {t("title")}
          </h2>
          <Squiggle className="mt-2 h-2 w-20 opacity-50" color="#F4A261" />
          <p className="mt-5 text-base leading-relaxed text-stone-600">
            {t("intro")}
          </p>
        </div>

        <div className="mt-8 grid gap-5 sm:grid-cols-3 sm:gap-6">
          {PERIODES.map((cle) => (
            <div
              key={cle}
              className="rounded-2xl border border-stone-200 p-5 sm:p-6"
            >
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#E76F51]">
                {t(`${cle}.months`)}
              </p>
              <h3 className="mt-2 text-lg font-semibold text-stone-900">
                {t(`${cle}.title`)}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-stone-600">
                {t(`${cle}.text`)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
