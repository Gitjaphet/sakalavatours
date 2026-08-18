// apps/web/src/lib/api/product-transform.ts
import type { ProductDetail, ProductUpdate } from "@/types/api";

/**
 * Transforme la forme lecture (GET, dénormalisée, une seule locale)
 * en payload d'écriture partiel (PATCH).
 *
 * ⚠ Volontairement incomplet : les champs multi-locale (translations,
 * itinerary, faqs) ne sont PAS inclus ici. Le GET ne renvoie qu'une
 * seule langue (content_locale) ; les inclure enverrait un PATCH qui
 * remplacerait TOUTES les langues par une seule. Ces champs seront
 * traités séparément, avec un mécanisme dédié au multi-locale.
 */
export function productDetailToUpdate(detail: ProductDetail): ProductUpdate {
  return {
    slug: detail.slug,
    product_type: detail.product_type,
    product_format: detail.product_format,
    difficulty: detail.difficulty,

    duration_days: detail.duration_days,
    duration_nights: detail.duration_nights,
    duration_hours: detail.duration_hours,
    departure_time: detail.departure_time,
    return_time: detail.return_time,
    travel_minutes: detail.travel_minutes,
    transport: detail.transport,

    group_min: detail.group_min,
    group_max: detail.group_max,
    hotel_pickup: detail.hotel_pickup,

    price_from: detail.price_from,
    currency: detail.currency,

    cover_media_id: detail.cover?.id ?? null,
    is_featured: detail.is_featured,

    highlight_codes: detail.highlights.map((h) => h.code),
    packing_codes: detail.packing_items.map((p) => p.code),
    departure_months: detail.departure_months,
    gallery_media_ids: detail.gallery.map((g) => g.id),
  };
}