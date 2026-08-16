// src/lib/about-data.ts
// ─────────────────────────────────────────────────────────────────────────────
// Données structurelles de la page "À propos".
//
// RÈGLE : aucun texte affiché ici. Les libellés vivent dans
// src/messages/*.json sous la clé `about.*`.
//
// Le nombre de destinations n'est PAS calculé ici : il dépend du catalogue
// réel (API), qui ne peut être lu qu'en async côté page serveur. Le calculer
// depuis un mock statique afficherait un chiffre public potentiellement faux
// — voir apropos/page.tsx pour le calcul réel via getProducts().
// ─────────────────────────────────────────────────────────────────────────────

/** Année de création — alimente `foundingDate` du JSON-LD TravelAgency
 *  et le compteur d'années d'expérience. */
export const FOUNDING_YEAR = 2019;

/** Valeurs affichées en cartes (`about.values.<key>`) */
export const aboutValues = [
  { key: "authenticite", icon: "compass" },
  { key: "respect", icon: "leaf" },
  { key: "partage", icon: "hands" },
] as const;

export type AboutValueKey = (typeof aboutValues)[number]["key"];

/** Piliers de service (`about.pillars.<key>`) */
export const aboutPillars = [
  { key: "assistance", icon: "clock" },
  { key: "equipe", icon: "users" },
  { key: "local", icon: "map-pin" },
  { key: "groupes", icon: "user-check" },
] as const;

export type AboutPillarKey = (typeof aboutPillars)[number]["key"];

/** Questions de la FAQ (`about.faq.items.<key>`) — alimente le JSON-LD FAQPage */
export const aboutFaqKeys = [
  "guides",
  "langues",
  "reservation",
  "groupes-taille",
  "meilleure-periode",
  "paiement",
] as const;

export type AboutFaqKey = (typeof aboutFaqKeys)[number];

/** Statistiques statiques — n'incluent volontairement pas le nombre de
 *  destinations, qui doit toujours refléter le catalogue réel. */
export const aboutStats = {
  yearsActive: new Date().getFullYear() - FOUNDING_YEAR,
} as const;