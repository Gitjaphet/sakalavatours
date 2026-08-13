// src/lib/hero-data.ts
// Données mock du hero — à remplacer par le modèle Circuit (FastAPI) plus tard.
// ⚠️ Place les visuels dans /public/images/hero/ (ratio paysage, ≥ 2000px de large,
// compressés en .webp de préférence) ou pointe `image` vers tes fichiers actuels.

export type HeroDestination = {
  id: string;
  /** Titre géant affiché à gauche */
  name: string;
  /** Sous-localisation affichée dans l'eyebrow */
  region: string;
  /** 1 à 2 phrases, orientées envie de partir */
  description: string;
  /** Durée / format de l'excursion, affiché sur la carte active */
  duration: string;
  /** Note moyenne, 0 → 5 */
  rating: number;
  image: string;
  /** Lien vers la fiche circuit (next-intl gère la locale) */
  href: string;
};

export const heroDestinations: HeroDestination[] = [
  {
    id: "nosy-iranja",
    name: "Nosy Iranja",
    region: "Archipel de Nosy Be",
    description:
      "Deux îles reliées par un banc de sable blanc que la marée découvre. Départ en boutre au lever du jour, retour au coucher du soleil.",
    duration: "Journée complète · 8h",
    rating: 5,
    image: "/images/hero/nosy-iranja.jpg",
    href: "/circuits/nosy-iranja",
  },
  {
    id: "nosy-tanikely",
    name: "Nosy Tanikely",
    region: "Parc marin national",
    description:
      "Le meilleur spot de snorkeling de l'archipel : tortues vertes, coraux et poissons-clowns à quelques mètres du rivage.",
    duration: "Journée complète · 7h",
    rating: 5,
    image: "/images/hero/nosy-tanikely.jpg",
    href: "/circuits/nosy-tanikely",
  },
  {
    id: "lokobe",
    name: "Lokobe",
    region: "Réserve intégrale, Nosy Be",
    description:
      "La dernière forêt primaire de l'île, en pirogue traditionnelle. Lémuriens macaco, boas et caméléons avec un guide local.",
    duration: "Demi-journée · 5h",
    rating: 5,
    image: "/images/hero/lokobe.jpg",
    href: "/circuits/reserve-lokobe",
  },
  {
    id: "mont-passot",
    name: "Mont Passot",
    region: "Lacs sacrés, Nosy Be",
    description:
      "Le point culminant de l'île et ses lacs de cratère. Le coucher de soleil sur l'archipel se regarde depuis ici.",
    duration: "Soirée · 3h",
    rating: 4,
    image: "/images/hero/mont-passot.jpg",
    href: "/circuits/mont-passot",
  },
];