// src/components/circuits/CircuitCard.tsx
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import type { Circuit } from "@/lib/circuits-data";
import { Rating } from "@/components/ui/Rating";

type Props = {
  circuit: Circuit;
};

export function CircuitCard({ circuit }: Props) {
  const t = useTranslations("circuits");
  const item = t.raw(`items.${circuit.id}`) as {
    title: string;
    region: string;
    summary: string;
  };

  return (
    <Link
      href={circuit.href}
      aria-label={t("viewAria", { title: item.title })}
      className="group flex flex-col overflow-hidden rounded-2xl border border-black/5
                 bg-white shadow-sm transition-shadow hover:shadow-lg focus-visible:outline
                 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden">
        <Image
          src={circuit.image}
          alt={t("imageAlt", { title: item.title })}
          width={circuit.imageWidth}
          height={circuit.imageHeight}
          className="h-full w-full object-cover transition-transform duration-500
                     group-hover:scale-105"
        />

        {circuit.featured && (
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
          {circuit.nights > 0
            ? t("duration", { days: circuit.days, nights: circuit.nights })
            : t("durationNoNight", { days: circuit.days })}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex items-center gap-2 text-xs font-medium text-emerald-800">
          <span className="rounded-full bg-emerald-50 px-2.5 py-1">
            {t(`themes.${circuit.theme}`)}
          </span>
          <span className="rounded-full bg-amber-50 px-2.5 py-1 text-amber-800">
            {t(`levels.${circuit.level}`)}
          </span>
        </div>

        <div>
          <h3 className="font-[family-name:var(--font-courgette)] text-2xl leading-snug text-stone-900">
            {item.title}
          </h3>
          <p className="mt-0.5 text-sm text-stone-500">{item.region}</p>
        </div>

        <p className="line-clamp-3 text-sm text-stone-600">{item.summary}</p>

        <div className="mt-auto flex items-end justify-between pt-2">
          <div>
            <p className="text-xs text-stone-500">
              {t("group", { min: circuit.groupMin, max: circuit.groupMax })}
            </p>
            <p className="text-base font-semibold text-stone-900">
              {t("priceLabel")}{" "}
              <span className="text-lg">
                {circuit.priceFrom} {CIRCUIT_CURRENCY_SUFFIX}
              </span>
              <span className="text-xs font-normal text-stone-500">
                {" "}{t("perPerson")}
              </span>
            </p>
          </div>

          <Rating value={circuit.rating} count={circuit.reviewCount} />
        </div>
      </div>
    </Link>
  );
}



// ⚠ À remplacer par CIRCUIT_CURRENCY importé de hero-data une fois le symbole confirmé
const CIRCUIT_CURRENCY_SUFFIX = "€";