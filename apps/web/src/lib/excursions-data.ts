// src/lib/excursions-data.ts
// ─────────────────────────────────────────────────────────────────────────────
// Catalogue des excursions à la journée / demi-journée — à remplacer par le
// modèle FastAPI.
//
// ⚠ TOUTES LES VALEURS CHIFFRÉES SONT DES MOCKS.
// Prix, horaires, tailles de groupe et notes doivent être remplacés par les
// valeurs réelles avant toute mise en avant commerciale.
//
// RÈGLE : aucun texte affiché ici. Titres, lieux et descriptions vivent dans
// src/messages/*.json sous la clé `excursions.items.<id>`.
// ─────────────────────────────────────────────────────────────────────────────

import { HERO_CURRENCY } from "./hero-data";

export { HERO_CURRENCY as EXCURSION_CURRENCY };

/** Thème dominant — filtre et libellé (`excursions.themes.<theme>`) */
export type ExcursionTheme = "mer" | "nature" | "culture" | "aventure";

/** Format de sortie — badge sur l'image (`excursions.formats.<format>`) */
export type ExcursionFormat = "journee" | "demi-journee" | "soiree";

/** Moyen d'acheminement principal (`excursions.transports.<transport>`) */
export type ExcursionTransport = "bateau" | "vehicule" | "mixte" | "pirogue";

/** Prestations incluses — mappées vers des pictos dans la carte.
 *  Libellés dans `excursions.includes.<key>`. */
export type ExcursionInclude =
  | "transfert"
  | "bateau"
  | "guide"
  | "dejeuner"
  | "collation"
  | "eau"
  | "snorkeling"
  | "entree-parc";

/** Points forts mis en avant sur la carte — 3 maximum.
 *  Libellés dans `excursions.highlights.<key>`. */
export type ExcursionHighlight =
  | "banc-de-sable"
  | "village-pecheurs"
  | "phare"
  | "snorkeling"
  | "tortues"
  | "lemuriens"
  | "panorama"
  | "mangrove"
  | "coucher-soleil"
  | "distillerie"
  | "foret-primaire"
  | "plage";

export type Excursion = {
  /** Slug — sert de clé de traduction et d'URL. Ne jamais le renommer. */
  id: string;

  format: ExcursionFormat;
  theme: ExcursionTheme;
  transport: ExcursionTransport;

  /** Durée totale porte-à-porte, en heures (9.5 = 9h30) */
  durationHours: number;

  /** Horaires indicatifs, format 24h "HH:mm" — localisés à l'affichage */
  departureTime: string;
  returnTime: string;

  /** Temps de trajet aller, en minutes. 0 si non pertinent. */
  travelMinutes: number;

  /** Le transfert hôtel est-il compris dans le prix ? */
  hotelPickup: boolean;

  groupMin: number;
  groupMax: number;

  /** ⚠ MOCK — prix par personne, dans EXCURSION_CURRENCY */
  priceFrom: number;

  /** ⚠ MOCK — note moyenne 0 → 5 */
  rating: number;

  /** ⚠ MOCK — nombre d'avis. Ne JAMAIS publier de JSON-LD AggregateRating
   *  avec ces valeurs : une note inventée expose à une pénalité manuelle. */
  reviewCount: number;

  /** Mois recommandés, 1 = janvier. Vide = toute l'année. */
  bestMonths: number[];

  /** 3 maximum — au-delà la carte devient illisible */
  highlights: readonly ExcursionHighlight[];

  /** 4 à 6 — la carte en affiche 4, la fiche détail les affiche tous */
  includes: readonly ExcursionInclude[];

  featured: boolean;

  image: string;
  imageWidth: number;
  imageHeight: number;

  href: string;
};

export const excursions: Excursion[] = [
  {
    id: "nosy-iranja",
    format: "journee",
    theme: "mer",
    transport: "bateau",
    durationHours: 9.5,
    departureTime: "07:30",
    returnTime: "17:00",
    travelMinutes: 90,
    hotelPickup: true,
    groupMin: 2,
    groupMax: 12,
    priceFrom: 85,
    rating: 4.9,
    reviewCount: 42,
    bestMonths: [4, 5, 6, 7, 8, 9, 10, 11, 12],
    highlights: ["banc-de-sable", "village-pecheurs", "phare"],
    includes: ["transfert", "bateau", "guide", "dejeuner", "eau", "snorkeling"],
    featured: true,
    image: "/images/hero/nosy-iranja.jpg",
    imageWidth: 2400,
    imageHeight: 1600,
    href: "/excursions/nosy-iranja",
  },
  {
    id: "nosy-tanikely",
    format: "journee",
    theme: "mer",
    transport: "bateau",
    durationHours: 8,
    departureTime: "08:30",
    returnTime: "16:30",
    travelMinutes: 45,
    hotelPickup: true,
    groupMin: 2,
    groupMax: 12,
    priceFrom: 65,
    rating: 4.8,
    reviewCount: 56,
    bestMonths: [4, 5, 6, 7, 8, 9, 10, 11],
    highlights: ["snorkeling", "tortues", "plage"],
    includes: ["transfert", "bateau", "guide", "dejeuner", "eau", "snorkeling", "entree-parc"],
    featured: true,
    image: "/images/hero/nosy-tanikely.jpg",
    imageWidth: 2400,
    imageHeight: 1600,
    href: "/excursions/nosy-tanikely",
  },
  {
    id: "nosy-komba-nosy-tanikely",
    format: "journee",
    theme: "mer",
    transport: "bateau",
    durationHours: 8.5,
    departureTime: "08:00",
    returnTime: "16:30",
    travelMinutes: 40,
    hotelPickup: true,
    groupMin: 2,
    groupMax: 12,
    priceFrom: 75,
    rating: 4.7,
    reviewCount: 38,
    bestMonths: [4, 5, 6, 7, 8, 9, 10, 11],
    highlights: ["lemuriens", "snorkeling", "village-pecheurs"],
    includes: ["transfert", "bateau", "guide", "dejeuner", "eau", "snorkeling"],
    featured: true,
    image: "/images/hero/lokobe.jpg",
    imageWidth: 2400,
    imageHeight: 1600,
    href: "/excursions/nosy-komba-nosy-tanikely",
  },
  {
    id: "reserve-de-lokobe",
    format: "demi-journee",
    theme: "nature",
    transport: "pirogue",
    durationHours: 5,
    departureTime: "08:00",
    returnTime: "13:00",
    travelMinutes: 30,
    hotelPickup: true,
    groupMin: 2,
    groupMax: 8,
    priceFrom: 45,
    rating: 4.8,
    reviewCount: 31,
    bestMonths: [],
    highlights: ["foret-primaire", "lemuriens", "village-pecheurs"],
    includes: ["transfert", "guide", "collation", "eau", "entree-parc"],
    featured: false,
    image: "/images/hero/lokobe.jpg",
    imageWidth: 2400,
    imageHeight: 1600,
    href: "/excursions/reserve-de-lokobe",
  },
  {
    id: "nosy-sakatia",
    format: "journee",
    theme: "mer",
    transport: "bateau",
    durationHours: 7,
    departureTime: "09:00",
    returnTime: "16:00",
    travelMinutes: 25,
    hotelPickup: true,
    groupMin: 2,
    groupMax: 10,
    priceFrom: 55,
    rating: 4.7,
    reviewCount: 27,
    bestMonths: [4, 5, 6, 7, 8, 9, 10, 11],
    highlights: ["tortues", "snorkeling", "plage"],
    includes: ["transfert", "bateau", "guide", "dejeuner", "eau", "snorkeling"],
    featured: false,
    image: "/images/hero/lokobe.jpg",
    imageWidth: 2400,
    imageHeight: 1600,
    href: "/excursions/nosy-sakatia",
  },
  {
    id: "mont-passot-coucher-de-soleil",
    format: "soiree",
    theme: "nature",
    transport: "vehicule",
    durationHours: 3.5,
    departureTime: "15:30",
    returnTime: "19:00",
    travelMinutes: 40,
    hotelPickup: true,
    groupMin: 2,
    groupMax: 8,
    priceFrom: 30,
    rating: 4.6,
    reviewCount: 22,
    bestMonths: [],
    highlights: ["coucher-soleil", "panorama"],
    includes: ["transfert", "guide", "eau"],
    featured: false,
    image: "/images/hero/mont-passot.jpg",
    imageWidth: 2400,
    imageHeight: 1600,
    href: "/excursions/mont-passot-coucher-de-soleil",
  },
  {
    id: "mangroves-ambatozavavy",
    format: "demi-journee",
    theme: "aventure",
    transport: "pirogue",
    durationHours: 4,
    departureTime: "08:30",
    returnTime: "12:30",
    travelMinutes: 30,
    hotelPickup: true,
    groupMin: 2,
    groupMax: 8,
    priceFrom: 40,
    rating: 4.6,
    reviewCount: 14,
    bestMonths: [],
    highlights: ["mangrove", "village-pecheurs", "panorama"],
    includes: ["transfert", "guide", "collation", "eau"],
    featured: false,
    image: "/images/hero/lokobe.jpg",
    imageWidth: 2400,
    imageHeight: 1600,
    href: "/excursions/mangroves-ambatozavavy",
  },
  {
    id: "distillerie-ylang-ylang",
    format: "demi-journee",
    theme: "culture",
    transport: "vehicule",
    durationHours: 4,
    departureTime: "09:00",
    returnTime: "13:00",
    travelMinutes: 25,
    hotelPickup: true,
    groupMin: 2,
    groupMax: 10,
    priceFrom: 35,
    rating: 4.5,
    reviewCount: 16,
    bestMonths: [],
    highlights: ["distillerie", "panorama"],
    includes: ["transfert", "guide", "eau"],
    featured: false,
    image: "/images/hero/lokobe.jpg",
    imageWidth: 2400,
    imageHeight: 1600,
    href: "/excursions/distillerie-ylang-ylang",
  },
];

/** Ordre d'affichage : mises en avant d'abord, puis de la plus longue à la
 *  plus courte — la journée complète a la plus forte valeur perçue. */
export const excursionsSorted = [...excursions].sort((a, b) => {
  if (a.featured !== b.featured) return a.featured ? -1 : 1;
  return b.durationHours - a.durationHours;
});

export function getExcursionById(id: string): Excursion | undefined {
  return excursions.find((e) => e.id === id);
}
