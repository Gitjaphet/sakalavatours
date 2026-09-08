// src/components/home/HomeIntro.tsx
// Section 1 — presentation de l'agence.
//
// Role SEO : c'est le premier bloc de texte reel de la page d'accueil.
// Composant serveur, aucun JavaScript envoye au navigateur.

import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Squiggle } from "@/components/ui/Doodles";

export async function HomeIntro({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: "home.intro" });

  return (
    <section className="bg-[#FDFAF6] py-16 sm:py-20 lg:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl">
          <h2 className="font-[family-name:var(--font-courgette)] text-3xl text-stone-900 sm:text-4xl">
            {t("title")}
          </h2>
          <Squiggle className="mt-2 h-2 w-24 opacity-50" color="#F4A261" />

          <div className="mt-6 space-y-4 text-base leading-relaxed text-stone-600">
            <p>{t("p1")}</p>
            <p>{t("p2")}</p>
            <p>{t("p3")}</p>
          </div>

          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              href="/excursions"
              className="rounded-full bg-[#E76F51] px-5 py-2.5 text-sm font-medium text-white transition-transform duration-300 hover:scale-[1.03]"
            >
              {t("ctaExcursions")}
            </Link>
            <Link
              href="/circuits"
              className="rounded-full border border-stone-300 px-5 py-2.5 text-sm font-medium text-stone-700 transition-colors duration-300 hover:border-[#E76F51] hover:text-[#E76F51]"
            >
              {t("ctaCircuits")}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
