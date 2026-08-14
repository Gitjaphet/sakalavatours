type DoodleProps = {
  className?: string;
  color?: string;
  strokeWidth?: number;
};

/* Étincelle 4 branches — pleine, pour ponctuer un titre */
export function Sparkle({ className, color = "#E76F51" }: DoodleProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M12 0c1.1 8.2 3.8 10.9 12 12-8.2 1.1-10.9 3.8-12 12-1.1-8.2-3.8-10.9-12-12C8.2 10.9 10.9 8.2 12 0Z"
        fill={color}
      />
    </svg>
  );
}

/* Éclat rayonnant — style "soleil" dessiné à la main */
export function Burst({ className, color = "#F4A261", strokeWidth = 2 }: DoodleProps) {
  return (
    <svg viewBox="0 0 64 64" fill="none" className={className} aria-hidden="true">
      <g stroke={color} strokeWidth={strokeWidth} strokeLinecap="round">
        <path d="M32 4v14" />
        <path d="M32 46v14" />
        <path d="M4 32h14" />
        <path d="M46 32h14" />
        <path d="M12 12l10 10" />
        <path d="M42 42l10 10" />
        <path d="M52 12L42 22" />
        <path d="M22 42L12 52" />
      </g>
    </svg>
  );
}

/* Demi-éclat — rayons asymétriques, plus naturel en marge */
export function HalfBurst({ className, color = "#F4A261", strokeWidth = 2 }: DoodleProps) {
  return (
    <svg viewBox="0 0 48 40" fill="none" className={className} aria-hidden="true">
      <g stroke={color} strokeWidth={strokeWidth} strokeLinecap="round">
        <path d="M24 38V22" />
        <path d="M10 34l8-11" />
        <path d="M38 34l-8-11" />
        <path d="M2 24l14-4" />
        <path d="M46 24l-14-4" />
      </g>
    </svg>
  );
}

/* Flèche courbe en pointillés — guide le regard */
export function CurvedArrow({ className, color = "#1d4e5f", strokeWidth = 2 }: DoodleProps) {
  return (
    <svg viewBox="0 0 120 60" fill="none" className={className} aria-hidden="true">
      <path
        d="M4 46C18 14 62 2 106 20"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray="6 8"
      />
      <path
        d="M96 8l12 12-15 6"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/* Trait de soulignement ondulé */
export function Squiggle({ className, color = "#E76F51", strokeWidth = 3 }: DoodleProps) {
  return (
    <svg viewBox="0 0 120 12" fill="none" className={className} aria-hidden="true">
      <path
        d="M2 8c10-8 20 0 30 0s20-8 30-8 20 8 30 8 20-4 26-6"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
    </svg>
  );
}

/* Forme organique — tache de couleur très douce en arrière-plan */
export function Blob({ className, color = "#1d4e5f" }: DoodleProps) {
  return (
    <svg viewBox="0 0 200 200" fill="none" className={className} aria-hidden="true">
      <path
        d="M42 62c14-28 52-46 84-36s52 44 46 78-38 58-72 54-58-26-64-52 0-30 6-44Z"
        fill={color}
      />
    </svg>
  );
}

/* Grappe de rayons asymétriques — l'éclat "dessiné main" façon éditorial.
   Les longueurs et angles sont volontairement irréguliers : une grappe
   parfaitement régulière rend mécanique. */
export function RayCluster({ className, color = "#F4A261" }: DoodleProps) {
  return (
    <svg viewBox="0 0 120 120" fill="none" className={className} aria-hidden="true">
      <g stroke={color} strokeWidth="4" strokeLinecap="round">
        <path d="M104 16C96 26 88 36 82 44" />
        <path d="M112 44c-10 5-20 9-28 12" />
        <path d="M78 8c-4 12-8 23-11 31" />
        <path d="M116 74c-11-1-21-2-29-3" />
        <path d="M52 12c0 11 1 21 2 29" />
      </g>
      {/* Éclats pleins — les petites virgules épaisses d'Odoo */}
      <path d="M30 30c5 3 9 8 11 13-5-2-10-3-15-3 2-3 3-6 4-10Z" fill={color} />
      <path d="M96 88c4 2 7 6 9 10-4-1-8-2-12-2 1-3 2-5 3-8Z" fill={color} />
    </svg>
  );
}

/* Flèche verticale — pointe vers le CTA situé au-dessus */
export function ArrowUp({ className, color = "#1d4e5f", strokeWidth = 2.5 }: DoodleProps) {
  return (
    <svg viewBox="0 0 24 40" fill="none" className={className} aria-hidden="true">
      <path
        d="M12 38V6"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
      <path
        d="M5 13l7-7 7 7"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
