function StarIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" {...props}>
      <path d="M10 1.5l2.6 5.6 6.1.6-4.6 4.2 1.3 6L10 14.9 4.6 17.9l1.3-6-4.6-4.2 6.1-.6L10 1.5z" />
    </svg>
  );
}

type RatingProps = {
  /** Note de 0 à 5, décimales acceptées (ex. 4.8) */
  value: number;
  /** Nombre d'avis — affiché à côté de la note */
  count?: number;
  /** Taille des étoiles en classes Tailwind */
  starClassName?: string;
  className?: string;
  /** Masquer la valeur chiffrée */
  hideValue?: boolean;
};

export function Rating({
  value,
  count,
  starClassName = "h-4 w-4",
  className = "",
  hideValue = false,
}: RatingProps) {
  const safe = Math.max(0, Math.min(5, value));
  const percent = (safe / 5) * 100;

  const label =
    count != null
      ? `Note de ${safe.toString().replace(".", ",")} sur 5, ${count} avis`
      : `Note de ${safe.toString().replace(".", ",")} sur 5`;

  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      <span
        className="relative inline-flex shrink-0"
        role="img"
        aria-label={label}
      >
        {/* Rangée grise (fond) */}
        <span className="flex gap-0.5 text-stone-300" aria-hidden="true">
          {Array.from({ length: 5 }, (_, i) => (
            <StarIcon key={i} className={starClassName} />
          ))}
        </span>

        {/* Rangée pleine, rognée au pourcentage de la note */}
        <span
          className="absolute inset-0 overflow-hidden"
          style={{ width: `${percent}%` }}
          aria-hidden="true"
        >
          <span className="flex gap-0.5 text-[#F4A261]">
            {Array.from({ length: 5 }, (_, i) => (
              <StarIcon key={i} className={`${starClassName} shrink-0`} />
            ))}
          </span>
        </span>
      </span>

      {!hideValue && (
        <span className="text-sm font-semibold text-stone-700">
          {safe.toString().replace(".", ",")}
        </span>
      )}

      {count != null && (
        <span className="text-xs text-stone-500">
          ({count})
        </span>
      )}
    </div>
  );
}
