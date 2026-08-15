// src/components/excursions/ExcursionCard.tsx
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import type { InclusionOut, ProductListItem } from "@/lib/api/products";
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

type TablerIcon = React.ComponentType<{
  size?: number | string;
  stroke?: number;
  className?: string;
}>;

/**
 * Les prestations ne figurent pas encore dans la charge utile de la liste
 * — seulement dans la fiche détail. Le champ est donc optionnel : la
 * rangée de pictos s'affiche dès que l'API les fournira, sans toucher au
 * composant.
 */
type Props = {
  excursion: ProductListItem & { inclusions?: InclusionOut[] };
};

const INCLUDE_ICONS: Record<string, TablerIcon> = {
  "hotel-transfer": IconBus,
  boat: IconSailboat,
  guide: IconUserCheck,
  lunch: IconToolsKitchen2,
  snack: IconCoffee,
  water: IconBottle,
  "snorkel-gear": IconScubaMask,
  "park-entrance": IconTicket,
};

/** Les codes de l'API diffèrent des clés i18n héritées du fichier mock. */
const FORMAT_KEYS: Record<string, string> = {
  full_day: "journee",
  half_day: "demi-journee",
  evening: "soiree",
  multi_day: "journee",
};

const TRANSPORT_KEYS: Record<string, string> = {
  boat: "bateau",
  vehicle: "vehicule",
  pirogue: "pirogue",
  mixed: "mixte",
  walking: "vehicule",
};

const INCLUDES_ON_CARD = 4;

export function ExcursionCard({ excursion }: Props) {
  const t = useTranslations("excursions");

  // L'API renvoie les décimales en chaîne (Decimal sérialisé) pour éviter
  // les erreurs d'arrondi du flottant JavaScript sur les montants.
  const hoursValue = excursion.duration_hours
    ? Number(excursion.duration_hours)
    : null;

  const duration = (() => {
    if (hoursValue === null) return null;
    const h = Math.floor(hoursValue);
    const m = Math.round((hoursValue - h) * 60);
    return m > 0 ? t("durationHM", { h, m }) : t("durationH", { h });
  })();

  const travelValue = (() => {
    if (!excursion.travel_minutes) return null;
    const h = Math.floor(excursion.travel_minutes / 60);
    const m = excursion.travel_minutes % 60;
    if (h > 0) return m > 0 ? t("durationHM", { h, m }) : t("durationH", { h });
    return t("durationMin", { m });
  })();

  const inclusions = excursion.inclusions ?? [];
  const shown = inclusions.slice(0, INCLUDES_ON_CARD);
  const extra = inclusions.length - shown.length;

  const formatKey = FORMAT_KEYS[excursion.product_format] ?? "journee";
  const transportKey = excursion.transport
    ? TRANSPORT_KEYS[excursion.transport]
    : null;

  return (
    <Link
      href={`/excursions/${excursion.slug}`}
      aria-label={t("viewAria", { title: excursion.title })}
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
        {excursion.cover ? (
          <Image
            src={excursion.cover.storage_path}
            alt={excursion.cover.alt_text || excursion.title}
            width={excursion.cover.width ?? 1200}
            height={excursion.cover.height ?? 800}
            className="h-full w-full object-cover transition-transform duration-700
                       group-hover:scale-[1.06]"
          />
        ) : (
          <div className="h-full w-full bg-[#1d4e5f]/10" />
        )}

        <div
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#08222b]/70 to-transparent"
        />

        {excursion.is_featured && (
          <span className="absolute left-3 top-3 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-[#E76F51] shadow-sm backdrop-blur-sm">
            {t("featured")}
          </span>
        )}

        <span className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-semibold text-[#1d4e5f] shadow-sm backdrop-blur-sm">
          <IconClock size={13} stroke={2.2} />
          {t(`formats.${formatKey}`)}
          {duration && ` · ${duration}`}
        </span>
      </div>

      {/* ── Colonne contenu ───────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 p-5 sm:p-6">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px]">
          {excursion.region_label && (
            <span className="rounded-md bg-[#1d4e5f]/8 px-2 py-1 font-semibold uppercase tracking-wider text-[#1d4e5f]">
              {excursion.region_label}
            </span>
          )}
          {transportKey && travelValue && (
            <span className="font-medium text-stone-500">
              {t(`travel.${transportKey}`, { time: travelValue })}
            </span>
          )}
        </div>

        <div>
          <h3 className="font-[family-name:var(--font-courgette)] text-[1.4rem] leading-snug text-stone-900 sm:text-2xl">
            {excursion.title}
          </h3>
          {excursion.subtitle && (
            <p className="mt-0.5 text-sm text-stone-500">{excursion.subtitle}</p>
          )}
        </div>

        <p className="line-clamp-2 text-sm leading-relaxed text-stone-600">
          {excursion.summary}
        </p>

        {/* Points forts — déjà traduits par l'API */}
        {excursion.highlights.length > 0 && (
          <ul className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] text-stone-700">
            {excursion.highlights.map((h, i) => (
              <li key={h.code} className="flex items-center gap-2">
                {i > 0 && (
                  <span aria-hidden="true" className="text-[#F4A261]">
                    ◆
                  </span>
                )}
                <span>{h.label}</span>
              </li>
            ))}
          </ul>
        )}

        {shown.length > 0 && (
          <div className="mt-auto border-t border-dashed border-stone-200 pt-3.5">
            <p className="sr-only">{t("includesLabel")}</p>
            <ul className="flex flex-wrap items-center gap-x-3.5 gap-y-2">
              {shown.map((inc) => {
                const Icon = INCLUDE_ICONS[inc.code];
                return (
                  <li
                    key={inc.code}
                    className="flex items-center gap-1.5 text-xs text-stone-600"
                  >
                    {Icon && (
                      <Icon size={15} stroke={1.7} className="text-[#1d4e5f]" />
                    )}
                    {inc.label}
                  </li>
                );
              })}
              {extra > 0 && (
                <li className="text-xs font-medium text-stone-400">+{extra}</li>
              )}
            </ul>
          </div>
        )}

        <div
          className={`flex flex-wrap items-end justify-between gap-3 border-t border-stone-200 pt-3.5 ${
            shown.length === 0 ? "mt-auto" : ""
          }`}
        >
          <div className="space-y-1">
            {excursion.departure_time && excursion.return_time && (
              <p className="flex items-center gap-1.5 text-xs text-stone-500">
                <IconClock size={13} stroke={1.8} />
                {t("departAt", { time: excursion.departure_time.slice(0, 5) })}
                <IconArrowNarrowRight
                  size={13}
                  stroke={1.8}
                  className="text-stone-400"
                />
                {excursion.return_time.slice(0, 5)}
              </p>
            )}
            <p className="flex items-center gap-1.5 text-xs text-stone-500">
              <IconUsers size={13} stroke={1.8} />
              {t("group", {
                min: excursion.group_min,
                max: excursion.group_max,
              })}
              {excursion.hotel_pickup && (
                <>
                  <span aria-hidden="true" className="text-stone-300">
                    ·
                  </span>
                  <span className="text-[#1d4e5f]">{t("pickup")}</span>
                </>
              )}
            </p>
          </div>

          <div className="text-right">
            {excursion.rating_average && excursion.review_count > 0 && (
              <Rating
                value={Number(excursion.rating_average)}
                count={excursion.review_count}
                starClassName="h-3.5 w-3.5"
                className="justify-end"
              />
            )}
            <p className="mt-1 text-stone-900">
              <span className="text-xs text-stone-500">{t("priceLabel")} </span>
              <span className="text-xl font-bold">
                {Math.round(Number(excursion.price_from))}
                {excursion.currency === "EUR" ? "€" : ` ${excursion.currency}`}
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
