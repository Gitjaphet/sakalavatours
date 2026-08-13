// src/components/excursions/ExcursionCard.tsx
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import type { Excursion, ExcursionInclude } from "@/lib/excursions-data";
import { Rating } from "@/components/ui/Rating";
import {
  IconBus,
  IconSailboat,
  IconUserCheck,
  IconToolsKitchen2,
  IconCoffee,
  IconBottle,
  IconScubaMask,
  IconTicket,
  IconClock,
  IconUsers,
  IconArrowNarrowRight,
  } from "@tabler/icons-react";

/** Signature minimale commune aux icônes Tabler — évite de dépendre du nom
 *  du type exporté, qui change entre les versions majeures. */
type TablerIcon = React.ComponentType<{
  size?: number | string;
  stroke?: number;
  className?: string;
}>;

type Props = {
  excursion: Excursion;
};

const INCLUDE_ICONS: Record<ExcursionInclude, TablerIcon> = {
  transfert: IconBus,
  bateau: IconSailboat,
  guide: IconUserCheck,
  dejeuner: IconToolsKitchen2,
  collation: IconCoffee,
  eau: IconBottle,
  snorkeling: IconScubaMask,
  "entree-parc": IconTicket,
};

/** Nombre de prestations affichées sur la carte — le reste passe en "+N" */
const INCLUDES_ON_CARD = 4;

export function ExcursionCard({ excursion }: Props) {
  const t = useTranslations("excursions");
  const item = t.raw(`items.${excursion.id}`) as {
    title: string;
    region: string;
    summary: string;
  };

  const hours = Math.floor(excursion.durationHours);
  const minutes = Math.round((excursion.durationHours - hours) * 60);
  const duration =
    minutes > 0
      ? t("durationHM", { h: hours, m: minutes })
      : t("durationH", { h: hours });

  const travelH = Math.floor(excursion.travelMinutes / 60);
  const travelM = excursion.travelMinutes % 60;
  const travelValue =
    travelH > 0
      ? travelM > 0
        ? t("durationHM", { h: travelH, m: travelM })
        : t("durationH", { h: travelH })
      : t("durationMin", { m: travelM });

  const shownIncludes = excursion.includes.slice(0, INCLUDES_ON_CARD);
  const extraIncludes = excursion.includes.length - shownIncludes.length;

  return (
    <Link
      href={excursion.href}
      aria-label={t("viewAria", { title: item.title })}
      className="group grid overflow-hidden rounded-3xl border border-[#1d4e5f]/10 bg-white
                 shadow-[0_2px_12px_-4px_rgba(8,34,43,0.12)] transition-all duration-300
                 hover:-translate-y-0.5 hover:border-[#1d4e5f]/20
                 hover:shadow-[0_16px_40px_-16px_rgba(8,34,43,0.30)]
                 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2
                 focus-visible:outline-[#1d4e5f]
                 sm:grid-cols-[minmax(0,40%)_1fr]"
    >
      {/* ── Colonne image ─────────────────────────────────────────────── */}
      <div className="relative aspect-[16/10] w-full overflow-hidden sm:aspect-auto sm:h-full">
        <Image
          src={excursion.image}
          alt={t("imageAlt", { title: item.title })}
          width={excursion.imageWidth}
          height={excursion.imageHeight}
          className="h-full w-full object-cover transition-transform duration-700
                     group-hover:scale-[1.06]"
        />

        {/* Voile bas pour asseoir le badge format */}
        <div
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#08222b]/70 to-transparent"
        />

        {excursion.featured && (
          <span
            className="absolute left-3 top-3 rounded-full bg-white/95 px-2.5 py-1 text-[11px]
                       font-bold uppercase tracking-wider text-[#E76F51] shadow-sm backdrop-blur-sm"
          >
            {t("featured")}
          </span>
        )}

        <span
          className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-full
                     bg-white/95 px-2.5 py-1 text-[11px] font-semibold text-[#1d4e5f]
                     shadow-sm backdrop-blur-sm"
        >
          <IconClock size={13} stroke={2.2} />
          {t(`formats.${excursion.format}`)} · {duration}
        </span>
      </div>

      {/* ── Colonne contenu ───────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 p-5 sm:p-6">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] font-semibold uppercase tracking-wider">
          <span className="rounded-md bg-[#1d4e5f]/8 px-2 py-1 text-[#1d4e5f]">
            {t(`themes.${excursion.theme}`)}
          </span>
          {excursion.travelMinutes > 0 && (
            <span className="font-medium normal-case tracking-normal text-stone-500">
              {t(`travel.${excursion.transport}`, { time: travelValue })}
            </span>
          )}
        </div>

        <div>
          <h3 className="font-[family-name:var(--font-courgette)] text-[1.4rem] leading-snug text-stone-900 sm:text-2xl">
            {item.title}
          </h3>
          <p className="mt-0.5 text-sm text-stone-500">{item.region}</p>
        </div>

        <p className="line-clamp-2 text-sm leading-relaxed text-stone-600">
          {item.summary}
        </p>

        {/* Points forts — séparateurs en losange, signature visuelle distincte */}
        {excursion.highlights.length > 0 && (
          <ul className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] text-stone-700">
            {excursion.highlights.map((h, i) => (
              <li key={h} className="flex items-center gap-2">
                {i > 0 && (
                  <span aria-hidden="true" className="text-[#F4A261]">
                    ◆
                  </span>
                )}
                <span>{t(`highlights.${h}`)}</span>
              </li>
            ))}
          </ul>
        )}

        {/* Prestations incluses — la rangée de pictos, cœur de la densité */}
        <div className="mt-auto border-t border-dashed border-stone-200 pt-3.5">
          <p className="sr-only">{t("includesLabel")}</p>
          <ul className="flex flex-wrap items-center gap-x-3.5 gap-y-2">
            {shownIncludes.map((key) => {
              const Icon = INCLUDE_ICONS[key];
              return (
                <li
                  key={key}
                  className="flex items-center gap-1.5 text-xs text-stone-600"
                >
                  <Icon size={15} stroke={1.7} className="text-[#1d4e5f]" />
                  {t(`includes.${key}`)}
                </li>
              );
            })}
            {extraIncludes > 0 && (
              <li className="text-xs font-medium text-stone-400">
                +{extraIncludes}
              </li>
            )}
          </ul>
        </div>

        {/* Pied : horaire + groupe à gauche, prix + note à droite */}
        <div className="flex flex-wrap items-end justify-between gap-3 border-t border-stone-200 pt-3.5">
          <div className="space-y-1">
            <p className="flex items-center gap-1.5 text-xs text-stone-500">
              <IconClock size={13} stroke={1.8} />
              {t("departAt", { time: excursion.departureTime })}
              <IconArrowNarrowRight size={13} stroke={1.8} className="text-stone-400" />
              {excursion.returnTime}
            </p>
            <p className="flex items-center gap-1.5 text-xs text-stone-500">
              <IconUsers size={13} stroke={1.8} />
              {t("group", { min: excursion.groupMin, max: excursion.groupMax })}
              {excursion.hotelPickup && (
                <>
                  <span aria-hidden="true" className="text-stone-300">·</span>
                  <span className="text-[#1d4e5f]">{t("pickup")}</span>
                </>
              )}
            </p>
          </div>

          <div className="text-right">
            <Rating
              value={excursion.rating}
              count={excursion.reviewCount}
              starClassName="h-3.5 w-3.5"
              className="justify-end"
            />
            <p className="mt-1 text-stone-900">
              <span className="text-xs text-stone-500">{t("priceLabel")} </span>
              <span className="text-xl font-bold">
                {excursion.priceFrom}
                {EXCURSION_CURRENCY_SUFFIX}
              </span>
              <span className="text-xs font-normal text-stone-500">
                {" "}
                {t("perPerson")}
              </span>
            </p>
          </div>
        </div>
      </div>
    </Link>
  );
}

// ⚠ À remplacer par EXCURSION_CURRENCY importé de excursions-data une fois le symbole confirmé
const EXCURSION_CURRENCY_SUFFIX = "€";
