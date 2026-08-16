// src/lib/circuits-data.ts
// ─────────────────────────────────────────────────────────────────────────────
// Catalogue des circuits multi-jours — à remplacer par le modèle FastAPI.
//
// ⚠ TOUTES LES VALEURS CHIFFRÉES SONT DES MOCKS.
// Prix, durées, tailles de groupe et notes doivent être remplacés par les
// valeurs réelles avant toute mise en avant commerciale : un tarif erroné
// affiché publiquement engage la responsabilité de l'agence.
//
// RÈGLE : aucun texte affiché ici. Titres, régions et descriptions vivent
// dans src/messages/*.json sous la clé `circuits.items.<id>`.
// ─────────────────────────────────────────────────────────────────────────────

// APRÈS
const HERO_CURRENCY = "EUR";

export { HERO_CURRENCY as CIRCUIT_CURRENCY };

/** Thème dominant — sert de filtre et de libellé (`circuits.themes.<theme>`) */
export type CircuitTheme =
  | "nature"
  | "culture"
  | "mer"
  | "randonnee"
  | "decouverte";

/** Niveau d'effort physique demandé (`circuits.levels.<level>`) */
export type CircuitLevel = "facile" | "modere" | "sportif";

export type Circuit = {
  /** Slug repris de l'ancien site — conserve le bénéfice des liens entrants
   *  existants. Sert aussi de clé de traduction. Ne jamais le renommer. */
  id: string;

  /** Durée du séjour. `nights` = 0 pour une sortie sans nuitée. */
  days: number;
  nights: number;

  /** Taille de groupe. `groupMax` alimente `maximumAttendeeCapacity`
   *  dans le JSON-LD TouristTrip. */
  groupMin: number;
  groupMax: number;

  /** ⚠ MOCK — prix par personne, dans CIRCUIT_CURRENCY */
  priceFrom: number;

  /** ⚠ MOCK — note moyenne, 0 → 5 */
  rating: number;

  /** ⚠ MOCK — nombre d'avis. Ne JAMAIS publier de JSON-LD AggregateRating
   *  avec ces valeurs : une note inventée expose à une pénalité manuelle
   *  Google. Le balisage n'est activé qu'avec de vrais avis vérifiables. */
  reviewCount: number;

  theme: CircuitTheme;
  level: CircuitLevel;

  /** Mois de la meilleure période, 1 = janvier. Vide = toute l'année. */
  bestMonths: number[];

  /** Mise en avant sur la page liste (bandeau "Coup de cœur") */
  featured: boolean;

  image: string;
  imageWidth: number;
  imageHeight: number;

  /** Fiche détaillée. next-intl préfixe automatiquement la locale. */
  href: string;
};

export const circuits: Circuit[] = [
  {
    id: "les-circuits-nord-de-madagascar-11jours-10-nuits",
    days: 11,
    nights: 10,
    groupMin: 2,
    groupMax: 12,
    priceFrom: 1490,
    rating: 5,
    reviewCount: 18,
    theme: "decouverte",
    level: "modere",
    bestMonths: [4, 5, 6, 7, 8, 9, 10, 11],
    featured: true,
    image: "/images/hero/lokobe.jpg",
    imageWidth: 2400,
    imageHeight: 1600,
    href: "/circuits/les-circuits-nord-de-madagascar-11jours-10-nuits",
  },
  {
    id: "circuit-nature-traditions-du-nord-8-jours-7-nuits",
    days: 8,
    nights: 7,
    groupMin: 2,
    groupMax: 12,
    priceFrom: 1090,
    rating: 5,
    reviewCount: 12,
    theme: "culture",
    level: "modere",
    bestMonths: [4, 5, 6, 7, 8, 9, 10, 11],
    featured: true,
    image: "/images/hero/lokobe.jpg",
    imageWidth: 2400,
    imageHeight: 1600,
    href: "/circuits/circuit-nature-traditions-du-nord-8-jours-7-nuits",
  },
  {
    id: "circuit-sava",
    days: 7,
    nights: 6,
    groupMin: 2,
    groupMax: 10,
    priceFrom: 980,
    rating: 5,
    reviewCount: 9,
    theme: "culture",
    level: "modere",
    bestMonths: [5, 6, 7, 8, 9, 10],
    featured: false,
    image: "/images/hero/lokobe.jpg",
    imageWidth: 2400,
    imageHeight: 1600,
    href: "/circuits/circuit-sava",
  },
  {
    id: "tours-des-archipels-de-nosy-be",
    days: 4,
    nights: 3,
    groupMin: 2,
    groupMax: 12,
    priceFrom: 520,
    rating: 5,
    reviewCount: 24,
    theme: "mer",
    level: "facile",
    bestMonths: [4, 5, 6, 7, 8, 9, 10, 11, 12],
    featured: true,
    image: "/images/hero/lokobe.jpg",
    imageWidth: 2400,
    imageHeight: 1600,
    href: "/circuits/tours-des-archipels-de-nosy-be",
  },
  {
    id: "une-experience-authentique",
    days: 3,
    nights: 2,
    groupMin: 2,
    groupMax: 8,
    priceFrom: 340,
    rating: 5,
    reviewCount: 7,
    theme: "culture",
    level: "facile",
    bestMonths: [],
    featured: false,
    image: "/images/hero/lokobe.jpg",
    imageWidth: 2400,
    imageHeight: 1600,
    href: "/circuits/une-experience-authentique",
  },
  {
    id: "randonnees-immersive-a-nosy-komba",
    days: 2,
    nights: 1,
    groupMin: 2,
    groupMax: 8,
    priceFrom: 210,
    rating: 5,
    reviewCount: 15,
    theme: "randonnee",
    level: "sportif",
    bestMonths: [4, 5, 6, 7, 8, 9, 10, 11],
    featured: false,
    image: "/images/hero/lokobe.jpg",
    imageWidth: 2400,
    imageHeight: 1600,
    href: "/circuits/randonnees-immersive-a-nosy-komba",
  },
  {
    id: "circuit-2-jours-a-lokobe",
    days: 2,
    nights: 1,
    groupMin: 2,
    groupMax: 8,
    priceFrom: 195,
    rating: 5,
    reviewCount: 11,
    theme: "nature",
    level: "facile",
    bestMonths: [],
    featured: false,
    image: "/images/hero/lokobe.jpg",
    imageWidth: 2400,
    imageHeight: 1600,
    href: "/circuits/circuit-2-jours-a-lokobe",
  },
];

/** Ordre d'affichage : les mises en avant d'abord, puis du plus long au plus
 *  court — les longs séjours ont la plus forte valeur, ils doivent être vus. */
export const circuitsSorted = [...circuits].sort((a, b) => {
  if (a.featured !== b.featured) return a.featured ? -1 : 1;
  return b.days - a.days;
});

export function getCircuitById(id: string): Circuit | undefined {
  return circuits.find((c) => c.id === id);
}