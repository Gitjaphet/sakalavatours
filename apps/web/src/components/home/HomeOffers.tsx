// src/components/home/HomeOffers.tsx
// Section 2 — excursions et circuits, expliques separement.
//
// Role SEO : capte deux familles de requetes distinctes ("excursion Nosy Be"
// et "circuit Madagascar") et cree du maillage interne contextuel, bien plus
// fort qu'un lien de menu.

import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { IconArrowRight } from "@tabler/icons-react";

export async function HomeOffers({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: "home.offers" });

  const blocs = [
    {
      key: "excursions",
      href: "/excursions" as const,
      title: t("excursions.title"),
      text: t("excursions.text"),
      meta: t("excursions.meta"),
    },
    {
      key: "circuits",
      href: "/circuits" as const,
      title: t("circuits.title"),
      text: t("circuits.text"),
      meta: t("circuits.meta"),
    },
  ];

  return (
    <section className="bg-white py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-6 sm:grid-cols-2 sm:gap-8">
          {blocs.map((bloc) => (
            <article
              key={bloc.key}
              className="flex flex-col rounded-2xl border border-stone-200 bg-[#FDFAF6] p-6 sm:p-8"
            >
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#E76F51]">
                {bloc.meta}
              </p>
              <h2 className="mt-2 font-[family-name:var(--font-courgette)] text-3xl text-stone-900 sm:text-4xl">
                {bloc.title}
              </h2>
              <p className="mt-3 flex-1 text-base leading-relaxed text-stone-600">
                {bloc.text}
              </p>
              <Link
                href={bloc.href}
                className="mt-5 inline-flex w-fit items-center gap-2 text-sm font-medium text-[#E76F51] transition-colors duration-300 hover:text-[#c2451f]"
              >
                {t("seeAll")}
                <IconArrowRight size={16} className="shrink-0" />
              </Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
