import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { useTranslations, useLocale } from "next-intl";
import type { ProductListItem } from "@/lib/api/products";
import { Rating } from "@/components/ui/Rating";

type Props = {
  circuit: ProductListItem;
};

const LEVEL_KEYS: Record<string, string> = {
  easy: "facile",
  moderate: "modere",
  sporty: "sportif",
};

const DEFAULT_LEVEL_KEY = "facile";

/**
 * Ratio par défaut si l'image est absente ou si ses dimensions sont
 * invalides (0, négatives, non numériques). 4/3 est le ratio historique
 * des visuels mock — conservé comme filet de sécurité, pas comme référence.
 */
const FALLBACK_ASPECT_RATIO = 4 / 3;

function resolveAspectRatio(
  width?: number | null,
  height?: number | null
): number {
  if (
    typeof width === "number" &&
    typeof height === "number" &&
    width > 0 &&
    height > 0
  ) {
    return width / height;
  }
  return FALLBACK_ASPECT_RATIO;
}

function resolveLevelKey(difficulty: string | null | undefined): string {
  if (!difficulty) return DEFAULT_LEVEL_KEY;
  return LEVEL_KEYS[difficulty] ?? DEFAULT_LEVEL_KEY;
}

/**
 * Formatage prix localisé. Évite la concaténation manuelle (`€` codé en dur
 * côté V1) : Intl.NumberFormat gère à la fois le symbole de devise correct
 * pour n'importe quel code ISO renvoyé par l'API, et le format numérique
 * propre à chaque locale (virgule décimale en fr/de/it, point en en).
 */
function formatPrice(
  price: number,
  currency: string,
  locale: string
): string {
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(price);
  } catch {
    // Code devise invalide/non reconnu par Intl (ne devrait pas arriver
    // avec des données propres, mais on ne casse jamais l'affichage pour ça).
    return `${Math.round(price)} ${currency}`;
  }
}

export function CircuitCard({ circuit }: Props) {
  const t = useTranslations("circuits");
  const locale = useLocale();

  const levelKey = resolveLevelKey(circuit.difficulty);
  const aspectRatio = resolveAspectRatio(
    circuit.cover?.width,
    circuit.cover?.height
  );

  const hasGroupSize =
    typeof circuit.group_min === "number" &&
    typeof circuit.group_max === "number";

  const hasRating =
    circuit.rating_average != null &&
    Number(circuit.rating_average) > 0 &&
    (circuit.review_count ?? 0) > 0;

  return (
    <Link
      href={`/circuits/${circuit.slug}`}
      aria-label={t("viewAria", { title: circuit.title })}
      className="group flex flex-col overflow-hidden rounded-2xl border border-black/5
                 bg-white shadow-sm transition-shadow hover:shadow-lg focus-visible:outline
                 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
    >
      <div
        className="relative w-full overflow-hidden"
        style={{ aspectRatio }}
      >
        {circuit.cover ? (
          <Image
            src={circuit.cover.url}
            alt={circuit.cover.alt_text || t("imageAlt", { title: circuit.title })}
            fill
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="h-full w-full object-cover transition-transform duration-500
                       group-hover:scale-105"
          />
        ) : (
          <div className="h-full w-full bg-[#1d4e5f]/10" />
        )}

        {circuit.is_featured && (
          <span
            className="absolute left-3 top-3 rounded-full bg-red-700/90 px-3 py-1
                       text-xs font-semibold uppercase tracking-wide text-white backdrop-blur-sm"
          >
            {t("featured")}
          </span>
        )}

        <span
          className="absolute bottom-3 left-3 rounded-full bg-black/60 px-3 py-1
                     text-xs font-medium text-white backdrop-blur-sm"
        >
          {circuit.duration_nights && circuit.duration_nights > 0
            ? t("duration", {
                days: circuit.duration_days ?? 0,
                nights: circuit.duration_nights,
              })
            : t("durationNoNight", { days: circuit.duration_days ?? 0 })}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex items-center gap-2 text-xs font-medium text-emerald-800">
          <span className="rounded-full bg-amber-50 px-2.5 py-1 text-amber-800">
            {t(`levels.${levelKey}`)}
          </span>
        </div>

        <div>
          <h3 className="font-[family-name:var(--font-courgette)] text-2xl leading-snug text-stone-900">
            {circuit.title}
          </h3>
          {circuit.region_label && (
            <p className="mt-0.5 text-sm text-stone-500">{circuit.region_label}</p>
          )}
        </div>

        <p className="line-clamp-3 text-sm text-stone-600">{circuit.summary}</p>

        <div className="mt-auto flex items-end justify-between pt-2">
          <div>
            {hasGroupSize && (
              <p className="text-xs text-stone-500">
                {t("group", {
                  min: circuit.group_min,
                  max: circuit.group_max,
                })}
              </p>
            )}
            <p className="text-base font-semibold text-stone-900">
              {t("priceLabel")}{" "}
              <span className="text-lg">
                {formatPrice(Number(circuit.price_from), circuit.currency, locale)}
              </span>
              <span className="text-xs font-normal text-stone-500">
                {" "}{t("perPerson")}
              </span>
            </p>
          </div>

          {hasRating && (
            <Rating
              value={Number(circuit.rating_average)}
              count={circuit.review_count}
            />
          )}
        </div>
      </div>
    </Link>
  );
}