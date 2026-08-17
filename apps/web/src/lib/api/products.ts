/**
 * Accès aux produits (circuits et excursions) via l'API.
 *
 * Les types reflètent exactement les schémas Pydantic côté FastAPI. Toute
 * modification d'un schéma doit être répercutée ici — c'est la limite d'un
 * contrat non généré automatiquement.
 */

import { apiGet, apiGetSafe, ApiError } from "./client";

export type ProductType = "circuit" | "excursion";
export type ProductFormat = "full_day" | "half_day" | "evening" | "multi_day";
export type Difficulty = "easy" | "moderate" | "sporty";
export type Transport = "boat" | "vehicle" | "pirogue" | "mixed" | "walking";

export type MediaOut = {
  id: string;
  url: string;
  width: number | null;
  height: number | null;
  blurhash: string | null;
  alt_text: string;
};

export type LabelOut = {
  code: string;
  label: string;
  icon: string | null;
};

export type InclusionOut = LabelOut & {
  is_included: boolean;
  detail: string | null;
};

export type ItineraryItem = {
  day_number: number;
  time_label: string | null;
  title: string;
  description: string | null;
  location_label: string | null;
  hotel_name: string | null;
  meal_plan: string | null;
  distance_km: number | null;
  is_optional: boolean;
};

export type ProductListItem = {
  id: string;
  slug: string;
  product_type: ProductType;
  product_format: ProductFormat;
  difficulty: Difficulty;

  title: string;
  subtitle: string | null;
  region_label: string | null;
  summary: string;

  duration_days: number | null;
  duration_nights: number | null;
  duration_hours: string | null;
  departure_time: string | null;
  return_time: string | null;
  travel_minutes: number | null;
  transport: Transport | null;

  group_min: number;
  group_max: number;
  hotel_pickup: boolean;

  price_from: string;
  currency: string;

  rating_average: string | null;
  review_count: number;

  is_featured: boolean;
  cover: MediaOut | null;
  highlights: LabelOut[];

  /** true = le contenu n'est pas dans la langue demandée */
  is_fallback: boolean;
  content_locale: string;
};

export type ProductDetail = ProductListItem & {
  description: string | null;
  practical_info: string | null;
  meta_title: string | null;
  meta_description: string | null;
  itinerary: ItineraryItem[];
  inclusions: InclusionOut[];
  packing_items: LabelOut[];
  faqs: { question: string; answer: string }[];
  gallery: MediaOut[];
  departure_months: number[];
  related_slugs: string[];
};

export type ProductListResponse = {
  items: ProductListItem[];
  total: number;
  limit: number;
  offset: number;
};

const EMPTY_LIST: ProductListResponse = { items: [], total: 0, limit: 0, offset: 0 };

/**
 * Liste des produits publiés.
 *
 * Version tolérante : si l'API est injoignable, la page s'affiche vide
 * plutôt que de faire échouer le build Vercel.
 */
export async function getProducts(
  locale: string,
  options: { type?: ProductType; limit?: number; offset?: number } = {},
): Promise<ProductListResponse> {
  const params = new URLSearchParams({ locale });
if (options.type) params.set("product_type", options.type);
if (options.limit !== undefined) params.set("limit", String(options.limit));
if (options.offset !== undefined) params.set("offset", String(options.offset));

  return apiGetSafe<ProductListResponse>(
    `/public/products?${params}`,
    EMPTY_LIST,
    { tags: ["products"] },
  );
}

/**
 * Fiche complète d'un produit.
 *
 * Retourne null sur 404 — la page appelante déclenche alors notFound().
 * Les autres erreurs remontent : mieux vaut un build en échec qu'une fiche
 * produit vide servie aux visiteurs.
 */
export async function getProduct(
  slug: string,
  locale: string,
): Promise<ProductDetail | null> {
  try {
    return await apiGet<ProductDetail>(
      `/public/products/${slug}?locale=${locale}`,
      { tags: ["products", `product:${slug}`] },
    );
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return null;
    }
    throw error;
  }
}


/**
 * Résout une liste de slugs liés en fiches produits complètes.
 *
 * Fait un appel par slug (peu nombreux en pratique — 2 à 4). Les slugs
 * introuvables (404, produit dépublié) sont silencieusement ignorés
 * plutôt que de faire échouer tout le bloc "vous aimerez aussi".
 */
export async function getRelatedProducts(
  slugs: string[],
  locale: string,
): Promise<ProductListItem[]> {
  if (slugs.length === 0) return [];

  const results = await Promise.all(
    slugs.map((slug) => getProduct(slug, locale)),
  );

  return results.filter((p): p is ProductDetail => p !== null);
}

/**
 * Tous les slugs publiés — alimente generateStaticParams().
 *
 * Sans cette liste, les fiches détail resteraient en rendu dynamique et
 * perdraient le bénéfice du CDN.
 */
export async function getProductSlugs(): Promise<string[]> {
  return apiGetSafe<string[]>("/public/products/slugs", [], {
    tags: ["products"],
  });
}
