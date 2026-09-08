// src/components/ui/SectionWave.tsx
// Vague decorative en haut ou en bas d'une section.
//
// ⚠ La couleur doit correspondre EXACTEMENT au fond de la section voisine,
// sinon un liseré apparait au raccord. On passe donc la couleur en prop
// plutot que de la coder en dur.
//
// preserveAspectRatio="none" permet a la vague de s'etirer sur toute la
// largeur sans se deformer verticalement de facon incontrolee.

type Props = {
  /** Couleur de remplissage — celle du fond que la vague vient recouvrir. */
  color: string;
  /** Retourne la vague pour un usage en bas de section. */
  flip?: boolean;
  className?: string;
};

export function SectionWave({ color, flip = false, className }: Props) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 1440 90"
      preserveAspectRatio="none"
      className={`block w-full ${flip ? "rotate-180" : ""} ${className ?? ""}`}
    >
      <path
        d="M0,44 C240,88 420,10 720,34 C1020,58 1200,86 1440,52 L1440,0 L0,0 Z"
        fill={color}
      />
    </svg>
  );
}
