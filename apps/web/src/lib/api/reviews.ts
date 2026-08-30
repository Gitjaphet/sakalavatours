/**
 * Accès aux avis voyageurs via l'API publique.
 *
 * ⚠ `aggregate.is_schema_eligible` décide si la page a le droit d'émettre
 * un aggregateRating en JSON-LD. Ne jamais l'émettre sans ce drapeau :
 * une note agrégée calculée sur des avis non vérifiés est le premier
 * motif d'action manuelle Google sur les sites de tourisme.
 */

import { apiGetSafe } from "./client";

export type ReviewPublic = {
  id: string;
  author_name: string;
  author_country: string | null;
  rating: number;
  title: string | null;
  body: string;
  travel_date: string | null;
  is_verified: boolean;
  admin_reply: string | null;
  published_at: string;
  product_slug: string | null;
};

export type ReviewAggregate = {
  average: string | null;
  count: number;
  verified_count: number;
  distribution: Record<string, number>;
  is_schema_eligible: boolean;
};

export type ReviewListResponse = {
  items: ReviewPublic[];
  total: number;
  limit: number;
  offset: number;
  aggregate: ReviewAggregate;
};

const EMPTY_REVIEWS: ReviewListResponse = {
  items: [],
  total: 0,
  limit: 0,
  offset: 0,
  aggregate: {
    average: null,
    count: 0,
    verified_count: 0,
    distribution: {},
    is_schema_eligible: false,
  },
};

/**
 * Avis approuvés.
 *
 * Sans `productSlug`, la route ne renvoie que les avis portant sur
 * l'agence — les avis d'un produit vivent sur sa fiche, jamais en double.
 */
export async function getReviews(
  options: { productSlug?: string; locale?: string; limit?: number; offset?: number } = {},
): Promise<ReviewListResponse> {
  const params = new URLSearchParams();
  if (options.productSlug) params.set("product_slug", options.productSlug);
  if (options.locale) params.set("locale", options.locale);
  // Plafond de l'API : 50.
  if (options.limit !== undefined) params.set("limit", String(options.limit));
  if (options.offset !== undefined) params.set("offset", String(options.offset));

  const query = params.toString();
  return apiGetSafe<ReviewListResponse>(
    `/public/reviews${query ? `?${query}` : ""}`,
    EMPTY_REVIEWS,
    { tags: ["reviews"] },
  );
}