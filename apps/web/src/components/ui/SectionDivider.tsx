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
//   torn     — papier dechire / coup de pinceau, deux couches (d2 = fibres)
//
// inverse : retourne le SVG. La couleur devient alors celle de la section
// QU'ON QUITTE, qui « descend » sur la suivante (utile quand la section
// suivante a une photo en fond).
//
// Le cinquieme, "route", n'est pas une decoupe mais une trace d'itineraire
// pointillee : il separe deux sections de MEME fond, sans changement de
// couleur. C'est le seul separateur thematique — un trajet d'un point a
// l'autre, ce que vend l'agence.

type Forme = "wave" | "diagonal" | "arch" | "organic" | "torn";

const CHEMINS: Record<Forme, { d: string; viewBox: string; d2?: string }> = {
  torn: {
    viewBox: "0 0 1440 64",
    d2: "M0,26 L40,22 L90,28 L150,18 L210,25 L270,14 L330,24 L400,20 L460,10 L520,22 L590,17 L640,6 L700,20 L770,16 L840,24 L900,12 L960,21 L1030,18 L1100,26 L1130,9 L1190,20 L1260,15 L1320,23 L1380,13 L1440,20 L1440,64 L0,64 Z",
    d: "M0,38 L22,34 L40,40 L66,31 L90,36 L118,28 L140,35 L170,30 L196,39 L220,33 L252,37 L280,26 L300,33 L336,29 L360,38 L392,32 L420,35 L446,22 L470,31 L500,34 L530,27 L560,36 L590,30 L616,33 L640,18 L662,30 L700,35 L730,28 L760,37 L790,31 L820,34 L848,24 L872,32 L905,36 L936,29 L962,35 L990,27 L1020,33 L1050,38 L1078,30 L1100,34 L1130,21 L1154,31 L1186,36 L1214,28 L1246,34 L1270,30 L1300,37 L1330,27 L1356,33 L1390,29 L1416,36 L1440,31 L1440,64 L0,64 Z",
  },
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
  inverse = false,
}: {
  forme?: Forme;
  /** Couleur de la section qui arrive, pas celle qu'on quitte. */
  color: string;
  className?: string;
  /** Retourne le SVG : la couleur est alors celle de la section qu'on quitte. */
  inverse?: boolean;
}) {
  const { d, viewBox, d2 } = CHEMINS[forme];
  return (
    <svg
      aria-hidden="true"
      viewBox={viewBox}
      preserveAspectRatio="none"
      className={`block w-full ${className ?? ""}`}
      style={inverse ? { transform: "scaleY(-1)" } : undefined}
    >
      {d2 && <path d={d2} fill={color} opacity={0.35} />}
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
