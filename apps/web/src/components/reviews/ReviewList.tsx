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
      {aggregate.average && (
        <div className="mb-10 text-center">
          <p className="text-4xl font-semibold text-stone-900">
            {aggregate.average.replace(".", ",")}
            <span className="text-2xl text-stone-400">/5</span>
          </p>
          <p className="mt-1 text-lg">
            <Stars rating={Math.round(Number(aggregate.average))} />
          </p>
          <p className="mt-1 text-sm text-stone-500">
            {labels.basedOn.replace("{count}", String(aggregate.count))}
          </p>
        </div>
      )}

      <ul className="space-y-5">
        {items.map((r) => (
          <li
            key={r.id}
            className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm"
          >
            <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
              <p className="font-medium text-stone-900">
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
              <Stars rating={r.rating} />
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