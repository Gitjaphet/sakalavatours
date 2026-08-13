// src/components/home/DestinationCard.tsx
"use client";

import Image from "next/image";
import { useState } from "react";
import { useTranslations, useFormatter } from "next-intl";
import { IconUsers } from "@tabler/icons-react";
import { HERO_CURRENCY, type HeroDestination } from "@/lib/hero-data";

type Props = {
  destination: HeroDestination;
  isActive: boolean;
  onSelect: () => void;
};

function Stars({ rating, label }: { rating: number; label: string }) {
  return (
    <div className="flex items-center gap-[3px]" role="img" aria-label={label}>
      {Array.from({ length: 5 }).map((_, i) => (
        <svg
          key={i}
          viewBox="0 0 20 20"
          aria-hidden="true"
          className={`h-3.5 w-3.5 ${i < rating ? "fill-[#F4A261]" : "fill-white/25"}`}
        >
          <path d="M10 1.6l2.4 5.1 5.6.8-4 3.9 1 5.6-5-2.7-5 2.7 1-5.6-4-3.9 5.6-.8z" />
        </svg>
      ))}
    </div>
  );
}

export default function DestinationCard({ destination, isActive, onSelect }: Props) {
  const [saved, setSaved] = useState(false);
  const t = useTranslations("hero");
  const format = useFormatter();

  const region = t(`destinations.${destination.id}.region`);

  const duration = t(`duration.${destination.durationKind}`, {
    hours: destination.durationHours,
  });

  const group = t("group", {
    min: destination.groupMin,
    max: destination.groupMax,
  });

  /** Formatage monétaire piloté par la locale active : séparateurs,
   *  position du symbole et espacement suivent la convention du pays. */
  const price = format.number(destination.priceFrom, {
    style: "currency",
    currency: HERO_CURRENCY,
    maximumFractionDigits: 0,
  });

  /** Alt localisé et descriptif : les images de tourisme drainent un trafic
   *  réel via Google Images, l'alt est le seul signal textuel dont il dispose. */
  const imageAlt = t("imageAlt", { name: destination.name, region });

  return (
    <article
      className={[
        "group relative h-full w-full overflow-hidden rounded-[28px]",
        "bg-[#0d2f3c] ring-1 transition-[box-shadow,ring-color,transform] duration-500",
        isActive
          ? "scale-[1.02] shadow-[0_40px_80px_-30px_rgba(0,0,0,0.85)] ring-white/45"
          : "shadow-[0_25px_50px_-25px_rgba(0,0,0,0.7)] ring-white/15",
      ].join(" ")}
      style={{ transitionTimingFunction: "var(--ease-ios)" }}
    >
      <Image
        src={destination.image}
        alt={imageAlt}
        fill
        sizes="(max-width: 639px) 92vw, (max-width: 1279px) 42vw, 21vw"
        className="object-cover transition-transform duration-[900ms] ease-out group-hover:scale-[1.06]"
      />

      {/* Voile renforcé en bas : le bloc d'informations s'est allongé */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-black/30" />

      {/* Zone cliquable plein cadre (sous les contrôles) */}
      <button
        type="button"
        onClick={onSelect}
        className="absolute inset-0 z-10 cursor-pointer rounded-[28px] outline-none focus-visible:ring-2 focus-visible:ring-[#F4A261] focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
      >
        <span className="sr-only">{t("view", { name: destination.name })}</span>
      </button>

      {/* Badge durée */}
      <div className="pointer-events-none absolute left-3 top-3 z-20 sm:left-4 sm:top-4">
        <span className="inline-flex items-center rounded-full bg-white/12 px-3 py-1 text-[11px] font-medium text-white/90 ring-1 ring-white/20 backdrop-blur-sm">
          {duration}
        </span>
      </div>

      {/* Enregistrer */}
      <button
        type="button"
        onClick={() => setSaved((v) => !v)}
        aria-pressed={saved}
        className="absolute right-3 top-3 z-20 grid h-11 w-11 place-items-center rounded-full bg-white/15 text-white ring-1 ring-white/25 backdrop-blur-md transition hover:bg-white/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F4A261] sm:right-4 sm:top-4"
      >
        <span className="sr-only">{saved ? t("unsave") : t("save")}</span>
        <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4">
          <path
            d="M6 3.5h12a1 1 0 0 1 1 1v15.2a.6.6 0 0 1-.94.5L12 16.3l-6.06 3.9a.6.6 0 0 1-.94-.5V4.5a1 1 0 0 1 1-1z"
            className={saved ? "fill-[#F4A261]" : "fill-none"}
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {/* Contenu bas */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 p-4 sm:p-5 lg:p-6">
        <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-white/65 sm:text-[11px]">
          {region}
        </p>

        <h3 className="mt-1.5 font-[family-name:var(--font-courgette)] text-[26px] font-normal leading-snug text-white sm:text-[20px] lg:text-2xl">
          {destination.name}
        </h3>

        {/* Note + taille du groupe */}
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5">
          <Stars
            rating={destination.rating}
            label={t("ratingLabel", { rating: destination.rating })}
          />
          <span className="text-xs text-white/60">
            {destination.rating.toFixed(1)}
          </span>

          <span
            className="flex items-center gap-1.5 text-[11px] text-white/60"
            aria-label={t("groupAria", {
              min: destination.groupMin,
              max: destination.groupMax,
            })}
          >
            <IconUsers size={13} stroke={1.8} aria-hidden="true" />
            {group}
          </span>
        </div>

        {/* Prix */}
        <div
          className="mt-3 flex items-baseline gap-1.5 border-t border-white/15 pt-3"
          aria-label={t("priceAria", { price })}
        >
          <span className="text-[10px] font-medium uppercase tracking-[0.14em] text-white/50">
            {t("priceFrom", { price: "" }).trim()}
          </span>
          <span className="font-[family-name:var(--font-baloo2)] text-[19px] font-semibold leading-none text-white">
            {price}
          </span>
          <span className="text-[10px] text-white/45">{t("perPerson")}</span>
        </div>
      </div>
    </article>
  );
}