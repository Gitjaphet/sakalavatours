// apps/web/src/components/reviews/ReviewList.tsx
import type { ReviewPublic, ReviewAggregate } from "@/lib/api/reviews";

function Stars({ rating }: { rating: number }) {
  return (
    <span className="text-[#F4A261]" aria-label={`${rating} sur 5`}>
      {"★".repeat(rating)}
      <span className="text-stone-300">{"★".repeat(5 - rating)}</span>
    </span>
  );
}

/** Palette dérivée des couleurs de marque, assez foncée pour du texte blanc. */
const MONOGRAM_COLORS = [
  "#1d4e5f",
  "#E76F51",
  "#1a6b2f",
  "#8B5E34",
  "#5B4B8A",
  "#0F766E",
];

/**
 * Couleur stable pour un auteur donné.
 *
 * Dérivée du nom plutôt que tirée au hasard : la même personne garde la
 * même couleur d'un rendu à l'autre, y compris entre serveur et client.
 */
function monogramColor(name: string): string {
  let hash = 0;
  for (const char of name) {
    hash = (hash * 31 + char.codePointAt(0)!) % 9973;
  }
  return MONOGRAM_COLORS[hash % MONOGRAM_COLORS.length];
}

function Monogram({ name }: { name: string }) {
  return (
    <span
      aria-hidden="true"
      className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-sm font-semibold text-white"
      style={{ background: monogramColor(name) }}
    >
      {name.trim().charAt(0).toUpperCase()}
    </span>
  );
}

function formatDate(iso: string, locale: string): string {
  return new Date(iso).toLocaleDateString(locale, {
    month: "long",
    year: "numeric",
  });
}

type Props = {
  items: ReviewPublic[];
  aggregate: ReviewAggregate;
  locale: string;
  labels: {
    empty: string;
    verified: string;
    agencyReply: string;
    basedOn: string;
    traveledIn: string;
  };
};

export function ReviewList({ items, aggregate, locale, labels }: Props) {
  if (items.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-stone-300 p-10 text-center text-stone-500">
        {labels.empty}
      </p>
    );
  }

  return (
    <div>
      {/* La moyenne n'est affichée qu'une fois le seuil de crédibilité
          atteint — le même que celui qui autorise le balisage. En dessous,
          « 3,0 sur 1 avis » dessert plus qu'il n'informe. */}
      {aggregate.average && aggregate.is_schema_eligible && (
        <div className="mb-10 text-center">
          <p className="text-4xl font-semibold text-stone-900">
            {aggregate.average.replace(".", ",")}
            <span className="text-2xl text-stone-400">/5</span>
          </p>
          <p className="mt-1 text-lg">
            <Stars rating={Math.round(Number(aggregate.average))} />
          </p>
          <p className="mt-1 text-sm text-stone-500">
            {labels.basedOn}
          </p>
        </div>
      )}

      <ul className="space-y-5">
        {items.map((r) => (
          <li
            key={r.id}
            className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm"
          >
            <div className="mb-2 flex items-start gap-3">
              <Monogram name={r.author_name} />
              <p className="flex-1 font-medium text-stone-900">
                {r.author_name}
                {r.author_country && (
                  <span className="ml-2 text-sm font-normal text-stone-400">
                    {r.author_country}
                  </span>
                )}
                {r.is_verified && (
                  <span className="ml-2 rounded-full bg-green-50 px-2 py-0.5 text-xs font-normal text-green-700">
                    {labels.verified}
                  </span>
                )}
              </p>
              <span className="shrink-0">
                <Stars rating={r.rating} />
              </span>
            </div>

            {r.title && (
              <p className="mb-2 font-medium text-stone-800">{r.title}</p>
            )}
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-stone-600">
              {r.body}
            </p>

            <p className="mt-3 text-xs text-stone-400">
              {r.travel_date &&
                `${labels.traveledIn} ${formatDate(r.travel_date, locale)} · `}
              {formatDate(r.published_at, locale)}
            </p>

            {r.admin_reply && (
              <div className="mt-4 rounded-xl bg-[#FDFAF6] p-4">
                <p className="mb-1 text-xs font-medium text-[#1d4e5f]">
                  {labels.agencyReply}
                </p>
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-stone-600">
                  {r.admin_reply}
                </p>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}