// src/lib/about-data.ts
// ─────────────────────────────────────────────────────────────────────────────
// Données structurelles de la page "À propos".
//
// RÈGLE : aucun texte affiché ici. Les libellés vivent dans
// src/messages/*.json sous la clé `about.*`.
// ─────────────────────────────────────────────────────────────────────────────

import { circuits } from "./circuits-data";
import { excursions } from "./excursions-data";

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
/** Compteurs — calculés depuis le catalogue réel plutôt qu'écrits en dur :
 *  un chiffre affiché doit toujours correspondre à ce que le site propose. */
export const aboutStats = {
  destinations: circuits.length + excursions.length,
  yearsActive: new Date().getFullYear() - FOUNDING_YEAR,
} as const;
