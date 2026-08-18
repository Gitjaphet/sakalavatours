export const PRODUCT_FORMAT_OPTIONS = [
  { value: "full_day", label: "Journée complète" },
  { value: "half_day", label: "Demi-journée" },
  { value: "evening", label: "Soirée" },
  { value: "multi_day", label: "Plusieurs jours" },
] as const;

export const DIFFICULTY_OPTIONS = [
  { value: "easy", label: "Facile" },
  { value: "moderate", label: "Modéré" },
  { value: "sporty", label: "Sportif" },
] as const;

export const TRANSPORT_OPTIONS = [
  { value: "boat", label: "Bateau" },
  { value: "vehicle", label: "Véhicule" },
  { value: "pirogue", label: "Pirogue" },
  { value: "mixed", label: "Mixte" },
  { value: "walking", label: "À pied" },
] as const;

export type ProductFormat = (typeof PRODUCT_FORMAT_OPTIONS)[number]["value"];
export type DifficultyLevel = (typeof DIFFICULTY_OPTIONS)[number]["value"];
export type TransportMode = (typeof TRANSPORT_OPTIONS)[number]["value"];