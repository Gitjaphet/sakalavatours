// src/components/home/HomeHighlights.tsx
// Section — nos activites phares.
//
// Les donnees viennent de l'API par leur slug : titre, sous-titre, resume,
// prix et couverture. Aucune duplication dans les JSON i18n — si le prix
// change dans l'admin, la section suit. Seuls les libelles d'interface
// (boutons, surtitres) sont traduits.
//
// ⚠ Les slugs sont codes en dur : ce sont les deux produits mis en avant.
// Pour en changer, modifier SLUGS_PHARES ci-dessous.

import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { IconArrowRight } from "@tabler/icons-react";
import { getProduct } from "@/lib/api/products";
import { SectionDivider } from "@/components/ui/SectionDivider";

/** Un produit par type d'offre, pour que les deux formules soient montrees. */
const SLUGS_PHARES = [
  "bivouac-nosy-iranja",
  "les-circuits-nord-de-madagascar-11jours-10-nuits",
] as const;



function productHref(type: string, slug: string): string {
  return `/${type === "circuit" ? "circuits" : "excursions"}/${slug}`;
}

export async function HomeHighlights({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: "home.highlights" });

  const produits = (
    await Promise.all(SLUGS_PHARES.map((slug) => getProduct(slug, locale)))
  ).filter((p): p is NonNullable<typeof p> => Boolean(p));

  // Section muette plutot que cassee si un slug a change ou a ete depublie.
  if (produits.length === 0) return null;

  return (
    <section className="bg-[#1d4e5f]">
      <SectionDivider forme="wave" color="#FDFAF6" className="h-12 sm:h-16 lg:h-20" />

      <div className="mx-auto max-w-6xl px-4 pb-16 sm:px-6 sm:pb-20 lg:px-8">
        <div className="max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#F4A261]">
            {t("eyebrow")}
          </p>
          <h2 className="mt-2 font-[family-name:var(--font-courgette)] text-3xl text-white sm:text-4xl">
            {t("title")}
          </h2>
        </div>

        <div className="mt-10 space-y-12 sm:mt-12 sm:space-y-16">
          {produits.map((p, i) => {
            const href = productHref(p.product_type, p.slug);
            const imageADroite = i % 2 === 0;

            return (
              <article
                key={p.id}
                className="grid items-center gap-6 sm:grid-cols-2 sm:gap-10 lg:gap-14"
              >
                <div className={imageADroite ? "sm:order-1" : "sm:order-2"}>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#F4A261]">
                    {p.duration_days && p.duration_nights
                      ? t("days", {
                          days: p.duration_days,
                          nights: p.duration_nights,
                        })
                      : t("dayTrip")}
                  </p>

                  <h3 className="mt-2 font-[family-name:var(--font-courgette)] text-3xl text-white sm:text-4xl">
                    {p.title}
                  </h3>

                  {p.subtitle && (
                    <p className="mt-1.5 text-base leading-relaxed text-white/70">
                      {p.subtitle}
                    </p>
                  )}

                  {p.summary && (
                    <p className="mt-4 text-base leading-relaxed text-white/80">
                      {p.summary}
                    </p>
                  )}

                  <p className="mt-5 flex items-baseline gap-2 text-white">
                    <span className="text-xs uppercase tracking-[0.14em] text-white/50">
                      {t("from")}
                    </span>
                    <span className="font-[family-name:var(--font-baloo2)] text-2xl font-semibold">
                      {Number(p.price_from).toLocaleString(locale, {
                        style: "currency",
                        currency: p.currency,
                        maximumFractionDigits: 0,
                      })}
                    </span>
                    <span className="text-xs text-white/50">
                      {t("perPerson")}
                    </span>
                  </p>

                  <Link
                    href={href}
                    className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#E76F51] px-6 py-3 text-sm font-medium text-white transition-transform duration-300 hover:scale-[1.03]"
                  >
                    {t("discover")}
                    <IconArrowRight size={16} className="shrink-0" />
                  </Link>
                </div>

                <Link
                  href={href}
                  className={`group relative block aspect-[4/3] overflow-hidden rounded-2xl bg-[#0d2b32] ${
                    imageADroite ? "sm:order-2" : "sm:order-1"
                  }`}
                >
                  {p.cover && (
                    <Image
                      src={p.cover.url}
                      alt={p.cover.alt_text || p.title}
                      fill
                      sizes="(max-width: 639px) 92vw, 46vw"
                      className="object-cover transition-transform duration-[900ms] ease-out group-hover:scale-[1.04]"
                    />
                  )}
                </Link>
              </article>
            );
          })}
        </div>

        <div className="mt-12 flex flex-wrap justify-center gap-3">
          <Link
            href="/excursions"
            className="rounded-full border border-white/30 px-6 py-3 text-sm font-medium text-white transition-colors duration-300 hover:bg-white/10"
          >
            {t("allExcursions")}
          </Link>
          <Link
            href="/circuits"
            className="rounded-full border border-white/30 px-6 py-3 text-sm font-medium text-white transition-colors duration-300 hover:bg-white/10"
          >
            {t("allCircuits")}
          </Link>
        </div>
      </div>
    </section>
  );
}
