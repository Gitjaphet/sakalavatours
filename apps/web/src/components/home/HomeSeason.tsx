// src/components/home/HomeSeason.tsx
// Section 4 — quand venir a Nosy Be.
//
// Role SEO : "meilleure periode Nosy Be" est une requete informationnelle a
// fort volume que les concurrents locaux ne traitent pas. Le bloc y repond
// directement, en texte indexable.
//
// ⚠ Les periodes et le contenu meteo sont a valider avec l'agence : une
// information saisonniere fausse fait rater un voyage.
//
// Cartes photo : titre visible au repos, texte revele au survol (desktop).
// Mobile/tablette : texte toujours visible (pas de survol au doigt).
// Le texte reste dans le HTML (repli en hauteur, pas display:none) : SEO intact.

import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Squiggle } from "@/components/ui/Doodles";
import { SectionDivider } from "@/components/ui/SectionDivider";

const PERIODES = ["dry", "green", "whales"] as const;

// TODO : remplacer "whales" par une vraie photo de baleine a bosse.
const IMAGES: Record<(typeof PERIODES)[number], string> = {
  dry: "https://media.medevstack.com/divers/2026/09/e198a63e-nosy-iranja-plage.jpeg",
  green: "https://media.medevstack.com/divers/2026/09/230292fe-montagne-d-ambre.jpeg",
  whales: "https://media.medevstack.com/divers/2026/09/a5f73d1f-mer-d-emeraude.jpeg",
};

export async function HomeSeason({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: "home.season" });

  return (
    <section className="bg-[#F3E9DD] pb-16 sm:pb-20">
      <SectionDivider forme="organic" color="#F3E9DD" className="h-10 sm:h-14" />
      <div className="mx-auto max-w-6xl px-4 pt-10 sm:px-6 sm:pt-12 lg:px-8">
        <div className="max-w-3xl">
          <h2 className="font-[family-name:var(--font-courgette)] text-3xl text-stone-900 sm:text-4xl">
            {t("title")}
          </h2>
          <Squiggle className="mt-2 h-2 w-20 opacity-50" color="#F4A261" />
          <p className="mt-5 text-base leading-relaxed text-stone-600">{t("intro")}</p>
        </div>

        <div className="mt-10 grid gap-5 sm:grid-cols-3 sm:gap-6">
          {PERIODES.map((cle) => (
            <article
              key={cle}
              className="group relative flex min-h-[380px] flex-col justify-end overflow-hidden rounded-2xl shadow-lg shadow-stone-900/10 sm:min-h-[440px]"
            >
              <Image
                src={IMAGES[cle]}
                alt=""
                fill
                sizes="(min-width: 640px) 33vw, 100vw"
                className="object-cover transition-transform duration-700 ease-out group-hover:scale-110"
              />
              {/* Degrade de lisibilite + voile lagon au survol */}
              <span aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-[#0d2b32]/95 via-[#0d2b32]/40 to-transparent" />
              <span aria-hidden="true" className="absolute inset-0 bg-[#1d4e5f]/0 transition-colors duration-500 group-hover:bg-[#1d4e5f]/45" />

              <div className="relative p-6">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#F4A261]">
                  {t(`${cle}.months`)}
                </p>
                <h3 className="mt-2 text-xl font-semibold text-white sm:text-2xl">{t(`${cle}.title`)}</h3>

                {/* Repli en hauteur : ouvert par defaut, ferme en desktop jusqu'au survol */}
                <div className="grid grid-rows-[1fr] transition-all duration-500 ease-out lg:grid-rows-[0fr] lg:group-hover:grid-rows-[1fr]">
                  <div className="overflow-hidden">
                    <p className="pt-3 text-sm leading-relaxed text-white/90 transition-opacity duration-500 lg:opacity-0 lg:group-hover:opacity-100">
                      {t(`${cle}.text`)}
                    </p>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
