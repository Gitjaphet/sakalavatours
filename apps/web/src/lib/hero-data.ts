// src/lib/hero-data.ts
// ─────────────────────────────────────────────────────────────────────────────
// Données mock du hero — à remplacer par le modèle Circuit (FastAPI) plus tard.
//
// RÈGLE : ce fichier ne contient AUCUN texte affiché à l'utilisateur.
// Tout le contenu rédactionnel (région, description, alt d'image, durée) vit
// dans src/messages/{fr,en,de}.json sous la clé `hero.destinations.<id>`.
// Ne jamais réintroduire de chaîne traduisible ici : elle échapperait à
// next-intl et casserait le référencement des versions /en et /de.
//
// VISUELS : /public/images/hero/, ratio paysage, ≥ 2000px de large, .webp
// de préférence (le .jpg reste accepté, Next les convertit à la volée).
// ─────────────────────────────────────────────────────────────────────────────


/** Format d'excursion — la locale décide du libellé (`hero.duration.<kind>`) */
export type HeroDurationKind = "full" | "half" | "evening";

/** Devise d'affichage. Changer ici la répercute partout. */
export const HERO_CURRENCY = "EUR";

/** Coordonnées réelles du site, utilisées par le JSON-LD (schema.org/GeoCoordinates) */
export type GeoPoint = {
  lat: number;
  lng: number;
};

export type HeroDestination = {
  /** Identifiant stable. Sert de clé de traduction ET d'ancre JSON-LD.
   *  Ne jamais le renommer une fois le site indexé. */
  id: string;

  /** Toponyme malgache — nom propre, identique dans les trois langues. */
  name: string;

  /** Format et durée. Séparés pour permettre un libellé localisé correct. */
  durationKind: HeroDurationKind;
  durationHours: number;

  /** Taille du groupe. `groupMax` alimentera `maximumAttendeeCapacity`
   *  dans le JSON-LD TouristTrip. */
  groupMin: number;
  groupMax: number;

  /** ⚠ TARIFS MOCK — à remplacer par la grille réelle avant production.
   *  Prix par personne, dans la devise HERO_CURRENCY. */
  priceFrom: number;

  /** Note moyenne affichée sur la carte, 0 → 5. */
  rating: number;

  /** Nombre d'avis réels. Laisser `undefined` tant que tu n'as pas d'avis
   *  vérifiables : une AggregateRating sans reviewCount authentique expose
   *  à une pénalité manuelle Google. */
  reviewCount?: number;

  /** Chemin du visuel, relatif à /public. */
  image: string;

  /** Dimensions intrinsèques du fichier source. */
  imageWidth: number;
  imageHeight: number;

  /** ⚠ Valeurs approximatives à vérifier avant mise en production. */
  geo: GeoPoint;

  /** Fiche circuit. next-intl préfixe automatiquement la locale. */
  href: string;
};

export const heroDestinations: HeroDestination[] = [
  {
    id: "nosy-iranja",
    name: "Nosy Iranja",
    durationKind: "full",
    durationHours: 8,
    groupMin: 2,
    groupMax: 12,
    priceFrom: 85,
    rating: 5,
    image: "/images/hero/nosy-iranja.jpg",
    imageWidth: 2400,
    imageHeight: 1600,
    geo: { lat: -13.5833, lng: 47.8333 },
    href: "/circuits/nosy-iranja",
  },
  {
    id: "nosy-tanikely",
    name: "Nosy Tanikely",
    durationKind: "full",
    durationHours: 7,
    groupMin: 2,
    groupMax: 10,
    priceFrom: 60,
    rating: 5,
    image: "/images/hero/nosy-tanikely.jpg",
    imageWidth: 2400,
    imageHeight: 1600,
    geo: { lat: -13.4833, lng: 48.2333 },
    href: "/circuits/nosy-tanikely",
  },
  {
    id: "lokobe",
    name: "Lokobe",
    durationKind: "half",
    durationHours: 5,
    groupMin: 2,
    groupMax: 8,
    priceFrom: 45,
    rating: 5,
    image: "/images/hero/lokobe.jpg",
    imageWidth: 2400,
    imageHeight: 1600,
    geo: { lat: -13.4167, lng: 48.3167 },
    href: "/circuits/reserve-lokobe",
  },
  {
    id: "mont-passot",
    name: "Mont Passot",
    durationKind: "evening",
    durationHours: 3,
    groupMin: 1,
    groupMax: 6,
    priceFrom: 25,
    rating: 4,
    image: "/images/hero/mont-passot.jpg",
    imageWidth: 2400,
    imageHeight: 1600,
    geo: { lat: -13.3167, lng: 48.2333 },
    href: "/circuits/mont-passot",
  },
];

/** Destination affichée au premier rendu — son image est préchargée en priorité
 *  (`priority` sur le <Image> du Hero). C'est elle qui porte le LCP de la home,
 *  donc c'est elle qu'il faut optimiser en premier. */
export const heroPrimaryDestination = heroDestinations[0];