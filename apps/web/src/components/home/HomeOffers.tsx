// src/components/home/HomeOffers.tsx
// Section 2 — cartes de tarification excursions / circuits.
// Prix "Des" = minimum reel des produits en base (aucun prix invente).
// Cadre lumineux (bordure + halo) ; au survol : ombre bas-droite uniquement.

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
    return null;
  }
}

export async function HomeOffers({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: "home.offers" });
  const [prixEx, prixCi] = await Promise.all([prixMin(locale, "excursion"), prixMin(locale, "circuit")]);

  // Ombre avec decalage positif (x, y) et etalement negatif :
  // elle n'apparait qu'en bas et a droite, jamais en haut ni a gauche.
  const blocs = [
    {
      key: "excursions", href: "/excursions" as const, prix: prixEx,
      meta: "text-[#E76F51]",
      check: "bg-[#E76F51]/10 text-[#E76F51]",
      frame: "border-[#E76F51]/50 ring-4 ring-[#E76F51]/10 hover:shadow-[14px_14px_28px_-10px_rgba(231,111,81,0.55)]",
      btn: "border-[#E76F51] text-[#E76F51] group-hover:bg-[#E76F51] group-hover:text-white",
    },
    {
      key: "circuits", href: "/circuits" as const, prix: prixCi,
      meta: "text-[#1d4e5f]",
      check: "bg-[#1d4e5f]/10 text-[#1d4e5f]",
      frame: "border-[#1d4e5f]/40 ring-4 ring-[#1d4e5f]/10 hover:shadow-[14px_14px_28px_-10px_rgba(29,78,95,0.5)]",
      btn: "border-[#1d4e5f] text-[#1d4e5f] group-hover:bg-[#1d4e5f] group-hover:text-white",
    },
  ] as const;

  return (
    <section className="bg-[#FDFAF6] pb-16 pt-14 sm:pb-24">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <header className="mx-auto mb-12 max-w-2xl text-center">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#E76F51]">{t("eyebrow")}</p>
          <h2 className="mt-2 font-[family-name:var(--font-courgette)] text-3xl text-stone-900 sm:text-4xl">{t("heading")}</h2>
          <p className="mt-4 text-base leading-relaxed text-stone-600">{t("intro")}</p>
        </header>
        <div className="grid gap-8 sm:grid-cols-2">
          {blocs.map((b) => (
            <article
              key={b.key}
              className={`group relative flex flex-col rounded-2xl border-2 bg-white p-6 transition-all duration-500 ease-out hover:-translate-x-1 hover:-translate-y-1 sm:p-8 ${b.frame}`}
            >
              <p className={`text-xs font-bold uppercase tracking-[0.18em] ${b.meta}`}>{t(`${b.key}.meta`)}</p>
              <h3 className="mt-2 font-[family-name:var(--font-courgette)] text-3xl text-stone-900 sm:text-4xl">
                {t(`${b.key}.title`)}
              </h3>

              {b.prix && (
                <p className="mt-5 flex items-baseline gap-1.5">
                  <span className="sr-only">{t("priceAria", { price: b.prix })}</span>
                  <span aria-hidden="true" className="text-xs font-medium uppercase tracking-wider text-stone-500">{t("priceFrom")}</span>
                  <span aria-hidden="true" className="text-4xl font-bold tracking-tight text-stone-900">{b.prix}</span>
                  <span aria-hidden="true" className="text-sm text-stone-500">{t("perPerson")}</span>
                </p>
              )}

              <div className="my-5 h-px w-full bg-stone-200" />

              <ul className="flex-1 space-y-3">
                {(t.raw(`${b.key}.features`) as string[]).map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm text-stone-700">
                    <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${b.check}`}>
                      <IconCheck size={12} stroke={3} aria-hidden="true" />
                    </span>
                    {f}
                  </li>
                ))}
              </ul>

              {/* after:inset-0 : toute la carte devient cliquable, un seul lien */}
              <Link
                href={b.href}
                className={`mt-7 inline-flex w-full items-center justify-center gap-2 rounded-full border-2 px-5 py-3 text-sm font-semibold transition-colors duration-300 after:absolute after:inset-0 after:rounded-2xl ${b.btn}`}
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
