// src/components/ui/SectionDivider.tsx
// Separateurs de section.
//
// ⚠ La couleur passee est celle de la section QUI ARRIVE : le SVG se place a
// la fin de la section precedente et « avance » la couleur suivante. Une
// couleur qui ne correspond pas exactement laisse un lisere visible.
//
// Quatre formes pour eviter qu'un seul motif se repete et devienne un tic :
//   wave     — vague douce, bonne entree vers une section sombre
//   diagonal — biais franc, moderne, entre deux fonds clairs
//   arch     — arche symetrique, plus solennelle
//   organic  — bord irregulier dessine a la main, esprit doodle du site
//
// Le cinquieme, "route", n'est pas une decoupe mais une trace d'itineraire
// pointillee : il separe deux sections de MEME fond, sans changement de
// couleur. C'est le seul separateur thematique — un trajet d'un point a
// l'autre, ce que vend l'agence.

type Forme = "wave" | "diagonal" | "arch" | "organic";

const CHEMINS: Record<Forme, { d: string; viewBox: string }> = {
  wave: {
    viewBox: "0 0 1440 90",
    d: "M0,0 C360,0 480,62 720,66 C980,70 1180,26 1440,8 L1440,0 Z",
  },
  diagonal: {
    viewBox: "0 0 1440 60",
    d: "M0,60 L1440,0 L1440,60 Z",
  },
  arch: {
    viewBox: "0 0 1440 70",
    d: "M0,70 Q720,-16 1440,70 Z",
  },
  organic: {
    viewBox: "0 0 1440 64",
    d: "M0,30 C120,58 200,6 340,26 C480,46 560,4 700,22 C840,40 940,2 1080,24 C1220,46 1330,10 1440,32 L1440,64 L0,64 Z",
  },
};

export function SectionDivider({
  forme = "wave",
  color,
  className,
}: {
  forme?: Forme;
  /** Couleur de la section qui arrive, pas celle qu'on quitte. */
  color: string;
  className?: string;
}) {
  const { d, viewBox } = CHEMINS[forme];
  return (
    <svg
      aria-hidden="true"
      viewBox={viewBox}
      preserveAspectRatio="none"
      className={`block w-full ${className ?? ""}`}
    >
      <path d={d} fill={color} />
    </svg>
  );
}

/** Trace d'itineraire pointillee — separe deux sections de meme fond. */
export function RouteDivider({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 1440 60"
      preserveAspectRatio="none"
      className={`block w-full ${className ?? ""}`}
    >
      <path
        d="M40,44 C300,-4 560,72 820,26 C1030,-10 1240,40 1400,18"
        fill="none"
        stroke="#E76F51"
        strokeWidth="3"
        strokeDasharray="10 12"
        strokeLinecap="round"
        opacity="0.6"
      />
      <circle cx="40" cy="44" r="7" fill="#E76F51" />
      <circle cx="1400" cy="18" r="7" fill="#F4A261" />
    </svg>
  );
}
