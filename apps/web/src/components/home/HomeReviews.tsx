// src/components/home/HomeReviews.tsx
// Section 5 — avis voyageurs sur l'agence (avis produit = sur leur fiche).
//
// Regle projet : uniquement des avis reels, approuves en moderation.
// En dessous de SEUIL avis : invitation a laisser un avis. Aucun tri
// positif/negatif. La note moyenne n'apparait que si is_schema_eligible.
// Pas de photo client : initiales dans un rond (on n'invente pas de visage).

import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { IconStar, IconStarFilled, IconCircleCheck, IconMessageCircle, IconArrowRight, IconQuote } from "@tabler/icons-react";
import { getReviews } from "@/lib/api/reviews";

const SEUIL = 1;
const SHAPE_COLOR = "#FBE3D6";

function Stars({ rating, size = 16 }: { rating: number; size?: number }) {
  return (
    <span aria-hidden="true" className="flex gap-0.5 text-[#F4A261]">
      {[1, 2, 3, 4, 5].map((i) =>
        i <= Math.round(rating) ? <IconStarFilled key={i} size={size} /> : <IconStar key={i} size={size} />,
      )}
    </span>
  );
}

function initiales(nom: string): string {
  return nom.split(/\s+/).filter(Boolean).slice(0, 2).map((m) => m[0]!.toUpperCase()).join("");
}

export async function HomeReviews({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: "home.reviews" });
  const { items, total, aggregate } = await getReviews({ locale, limit: 3 });

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
            <div className="mt-8 flex justify-center">
              <Link href="/avis" className="inline-flex items-center gap-2 rounded-full bg-[#E76F51] px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-[#E76F51]/25 transition-transform duration-300 hover:scale-[1.03]">
                {t("invite.cta")}
                <IconArrowRight size={16} aria-hidden="true" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="relative overflow-hidden bg-[#FDFAF6] py-16 sm:py-24">
      {/* Grande courbe de fond : monte du bas-gauche vers le haut-droite */}
      <svg aria-hidden="true" className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 1440 800" preserveAspectRatio="none">
        <path d="M0 640 C420 760 900 640 1180 300 C1290 160 1370 60 1440 0 L1440 800 L0 800 Z" fill={SHAPE_COLOR} />
      </svg>

      <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-[1fr_1.1fr] lg:gap-16 lg:px-8">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#E76F51]">{t("eyebrow")}</p>
          <h2 className="mt-2 font-[family-name:var(--font-courgette)] text-3xl leading-tight text-stone-900 sm:text-5xl">{t("title")}</h2>
          <p className="mt-6 max-w-md text-base leading-relaxed text-stone-600">{t("intro")}</p>
          {aggregate.is_schema_eligible && aggregate.average && (
            <div className="mt-5 flex items-center gap-2 text-sm font-medium text-stone-700">
              <Stars rating={Number(aggregate.average)} />
              {t("average", { average: Number(aggregate.average).toFixed(1), count: aggregate.count })}
            </div>
          )}
          <Link href="/avis" className="mt-8 inline-flex items-center gap-2 rounded-full bg-[#E76F51] px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-[#E76F51]/25 transition-transform duration-300 hover:scale-[1.03]">
            {t("seeMore")}
            <IconArrowRight size={16} aria-hidden="true" />
          </Link>
        </div>

        <div className="flex flex-col gap-5">
          {items.map((r) => (
            <article key={r.id} className="flex gap-5 rounded-2xl bg-white p-6 shadow-xl shadow-stone-900/[0.06]">
              <span aria-hidden="true" className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-[#1d4e5f] text-base font-semibold text-white">
                {initiales(r.author_name)}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-start gap-3">
                  <IconQuote size={28} aria-hidden="true" className="shrink-0 rotate-180 text-[#E76F51]" />
                  <div className="min-w-0">
                    <span className="sr-only">{t("ratingAria", { rating: r.rating })}</span>
                    <Stars rating={r.rating} size={14} />
                    {r.title && <h3 className="mt-2 font-semibold text-stone-900">{r.title}</h3>}
                    <p className="mt-1.5 line-clamp-4 text-sm italic leading-relaxed text-stone-600">{r.body}</p>
                  </div>
                </div>
                <p className="mt-3 text-right text-sm font-semibold text-[#E76F51]">
                  — {r.author_name}
                  {r.author_country && <span className="font-normal text-stone-500">, {r.author_country}</span>}
                </p>
                {r.is_verified && (
                  <p className="mt-1 flex items-center justify-end gap-1 text-xs font-medium text-[#1d4e5f]">
                    <IconCircleCheck size={14} aria-hidden="true" />
                    {t("verified")}
                  </p>
                )}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
