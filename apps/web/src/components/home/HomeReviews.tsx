// src/components/home/HomeReviews.tsx
// Section 5 — avis voyageurs sur l'agence (avis produit = sur leur fiche).
//
// Regle projet : uniquement des avis reels, approuves en moderation.
// Seuil de 3 avis : en dessous, la section invite a laisser un avis au lieu
// d'afficher 1 ou 2 avis isoles. Le seuil s'applique quel que soit le
// contenu (aucun tri positif/negatif). Tous les avis restent sur /avis.
// La note moyenne n'est affichee que si aggregate.is_schema_eligible.

import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { IconStar, IconStarFilled, IconCircleCheck, IconMessageCircle, IconArrowRight } from "@tabler/icons-react";
import { getReviews } from "@/lib/api/reviews";

const SEUIL = 3;

function Stars({ rating, size = 16 }: { rating: number; size?: number }) {
  return (
    <span aria-hidden="true" className="flex gap-0.5 text-[#F4A261]">
      {[1, 2, 3, 4, 5].map((i) =>
        i <= Math.round(rating) ? <IconStarFilled key={i} size={size} /> : <IconStar key={i} size={size} />,
      )}
    </span>
  );
}

export async function HomeReviews({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: "home.reviews" });
  const { items, total, aggregate } = await getReviews({ locale, limit: 3 });

  // Moins de SEUIL avis : invitation
  if (total < SEUIL) {
    return (
      <section className="bg-[#FDFAF6] py-16 sm:py-24">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <div className="rounded-3xl border border-stone-200 bg-white px-6 py-12 text-center shadow-sm sm:px-12">
            <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-[#1d4e5f]/10 text-[#1d4e5f]">
              <IconMessageCircle size={28} stroke={1.7} aria-hidden="true" />
            </span>
            <p className="mt-5 text-xs font-bold uppercase tracking-[0.18em] text-[#E76F51]">{t("eyebrow")}</p>
            <h2 className="mt-2 font-[family-name:var(--font-courgette)] text-3xl text-stone-900 sm:text-4xl">{t("invite.title")}</h2>
            <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-stone-600">{t("invite.text")}</p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link href="/avis" className="inline-flex items-center gap-2 rounded-full bg-[#E76F51] px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-[#E76F51]/25 transition-transform duration-300 hover:scale-[1.03]">
                {t("invite.cta")}
                <IconArrowRight size={16} aria-hidden="true" />
              </Link>
              {total > 0 && (
                <Link href="/avis" className="inline-flex items-center rounded-full border border-stone-300 px-6 py-3 text-sm font-semibold text-stone-700 transition-colors duration-300 hover:border-[#1d4e5f] hover:text-[#1d4e5f]">
                  {t("invite.read")}
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>
    );
  }

  // SEUIL atteint : les avis les plus recents
  return (
    <section className="bg-[#FDFAF6] py-16 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <header className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#E76F51]">{t("eyebrow")}</p>
          <h2 className="mt-2 font-[family-name:var(--font-courgette)] text-3xl text-stone-900 sm:text-4xl">{t("title")}</h2>
          {aggregate.is_schema_eligible && aggregate.average && (
            <div className="mt-4 flex items-center justify-center gap-2 text-sm text-stone-600">
              <Stars rating={Number(aggregate.average)} />
              {t("average", { average: Number(aggregate.average).toFixed(1), count: aggregate.count })}
            </div>
          )}
        </header>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {items.map((r) => (
            <article key={r.id} className="flex flex-col rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
              <span className="sr-only">{t("ratingAria", { rating: r.rating })}</span>
              <Stars rating={r.rating} />
              {r.title && <h3 className="mt-4 font-semibold text-stone-900">{r.title}</h3>}
              <p className="mt-2 line-clamp-5 flex-1 text-sm leading-relaxed text-stone-600">{r.body}</p>
              <footer className="mt-5 border-t border-stone-100 pt-4">
                <p className="text-sm font-semibold text-stone-900">
                  {r.author_name}
                  {r.author_country && <span className="font-normal text-stone-500"> · {r.author_country}</span>}
                </p>
                {r.is_verified && (
                  <p className="mt-1 flex items-center gap-1 text-xs font-medium text-[#1d4e5f]">
                    <IconCircleCheck size={14} aria-hidden="true" />
                    {t("verified")}
                  </p>
                )}
              </footer>
            </article>
          ))}
        </div>

        <div className="mt-10 text-center">
          <Link href="/avis" className="inline-flex items-center gap-2 text-sm font-semibold text-[#E76F51] hover:text-[#c2451f]">
            {t("seeAll")}
            <IconArrowRight size={16} aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  );
}
