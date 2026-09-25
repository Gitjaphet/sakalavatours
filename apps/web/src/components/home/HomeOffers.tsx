// src/components/home/HomeOffers.tsx
// Section 2 — excursions et circuits : cartes de tarification.
//
// Role SEO : capte "excursion Nosy Be" et "circuit Madagascar", maillage
// interne contextuel. Le paragraphe descriptif est conserve pour ca.
// Prix "Des" = minimum reel des produits en base (aucun prix invente).
// Effet : plateau colore derriere la carte, qui glisse au survol.

import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { IconArrowRight, IconCheck } from "@tabler/icons-react";
import { getProducts } from "@/lib/api/products";
import { formatPrice } from "@/lib/format-price";

async function prixMin(locale: string, type: "excursion" | "circuit"): Promise<string | null> {
  try {
    const { items } = await getProducts(locale, { type, limit: 50 });
    let min: { v: number; cur: string } | null = null;
    for (const p of items) {
      const v = Number(p.price_from);
      if (Number.isFinite(v) && v > 0 && (!min || v < min.v)) min = { v, cur: p.currency };
    }
    return min ? formatPrice(min.v, min.cur, locale) : null;
  } catch {
    // API injoignable pendant la generation : on masque le prix, la carte reste.
    return null;
  }
}

export async function HomeOffers({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: "home.offers" });
  const [prixEx, prixCi] = await Promise.all([prixMin(locale, "excursion"), prixMin(locale, "circuit")]);

  // Classes ecrites en entier : Tailwind ne detecte pas les classes construites dynamiquement.
  const blocs = [
    {
      key: "excursions", href: "/excursions" as const, prix: prixEx,
      meta: "text-[#E76F51]",
      check: "bg-[#E76F51]/10 text-[#E76F51]",
      plate: "group-hover:bg-[#E76F51] group-hover:shadow-[#E76F51]/40",
      cta: "text-[#E76F51]",
    },
    {
      key: "circuits", href: "/circuits" as const, prix: prixCi,
      meta: "text-[#1d4e5f]",
      check: "bg-[#1d4e5f]/10 text-[#1d4e5f]",
      plate: "group-hover:bg-[#1d4e5f] group-hover:shadow-[#1d4e5f]/40",
      cta: "text-[#1d4e5f]",
    },
  ] as const;

  return (
    <section className="bg-[#FDFAF6] pb-16 pt-14 sm:pb-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-10 sm:grid-cols-2 sm:gap-8">
          {blocs.map((b) => (
            <article key={b.key} className="group relative flex flex-col pb-16">
              {/* Plateau : gris au repos, couleur pleine + glissement au survol */}
              <div
                aria-hidden="true"
                className={`absolute inset-x-3 top-6 bottom-0 rounded-2xl bg-stone-200/80 shadow-none transition-all duration-500 ease-out group-hover:translate-x-2 group-hover:translate-y-2 group-hover:shadow-2xl ${b.plate}`}
              />

              {/* Carte blanche */}
              <div className="relative flex flex-1 flex-col rounded-2xl border border-stone-200 bg-white p-6 shadow-sm transition-transform duration-500 ease-out group-hover:-translate-y-1 sm:p-8">
                <p className={`text-xs font-bold uppercase tracking-[0.18em] ${b.meta}`}>{t(`${b.key}.meta`)}</p>
                <h2 className="mt-2 font-[family-name:var(--font-courgette)] text-3xl leading-tight text-stone-900 sm:text-[2.1rem]">
                  {t(`${b.key}.title`)}
                </h2>

                {b.prix && (
                  <p className="mt-5 flex items-baseline gap-1.5">
                    <span className="sr-only">{t("priceAria", { price: b.prix })}</span>
                    <span aria-hidden="true" className="text-xs font-medium uppercase tracking-wider text-stone-500">{t("priceFrom")}</span>
                    <span aria-hidden="true" className="text-4xl font-bold tracking-tight text-stone-900">{b.prix}</span>
                    <span aria-hidden="true" className="text-sm text-stone-500">{t("perPerson")}</span>
                  </p>
                )}

                <div className="my-5 h-px w-12 bg-stone-200" />

                <p className="text-[15px] leading-relaxed text-stone-600">{t(`${b.key}.text`)}</p>

                <ul className="mt-5 space-y-2.5">
                  {(t.raw(`${b.key}.features`) as string[]).map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm text-stone-700">
                      <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${b.check}`}>
                        <IconCheck size={12} stroke={3} aria-hidden="true" />
                      </span>
                      {f}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Bouton sur la bande du plateau, glisse avec lui */}
              <Link
                href={b.href}
                className={`absolute inset-x-3 bottom-0 flex h-16 items-center gap-2 px-6 text-sm font-semibold transition-all duration-500 ease-out group-hover:translate-x-2 group-hover:translate-y-2 group-hover:text-white sm:px-8 ${b.cta}`}
              >
                {t(`${b.key}.cta`)}
                <IconArrowRight size={16} className="shrink-0 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
