// --- Admin · Produits ---

export type AdminRole = "owner" | "admin" | "editor";

export type ContentStatus = "draft" | "published" | "archived";

export type ProductAdminListItem = {
  id: string;
  slug: string;
  product_type: "circuit" | "excursion";
  status: ContentStatus;
  is_published: boolean;
  is_featured: boolean;
  price_from: string;
  currency: string;
  sort_order: number;
  review_count: number;
  rating_average: string | null;
  title: string;
  translated_locales: string[];
};

export type ProductAdminListResponse = {
  items: ProductAdminListItem[];
  total: number;
  limit: number;
  offset: number;
};


// --- Détail produit (lecture, GET /admin/products/{id}) ---

export type ProductDetailMedia = {
  id: string;
  url: string;
  width: number;
  height: number;
  blurhash: string | null;
  alt_text: string | null;
};

export type ProductDetailHighlight = {
  code: string;
  label: string;
  icon: string;
};

export type ProductDetailItineraryStep = {
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

export type ProductDetailInclusion = {
  code: string;
  label: string;
  icon: string;
  is_included: boolean;
  detail: string | null;
};

export type ProductDetailPackingItem = {
  code: string;
  label: string;
  icon: string;
};

export type ProductDetailFaq = {
  question: string;
  answer: string;
};

export type ProductDetailPriceTier = {
  label_code: string;
  price: string;
  min_pax: number | null;
  max_pax: number | null;
  is_private: boolean;
};

export type ProductDetail = {
  id: string;
  slug: string;
  product_type: "circuit" | "excursion";
  product_format: string;
  difficulty: string;
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
  transport: string | null;
  group_min: number;
  group_max: number;
  hotel_pickup: boolean;
  price_from: string;
  currency: string;
  rating_average: string | null;
  review_count: number;
  is_featured: boolean;
  cover: ProductDetailMedia | null;
  highlights: ProductDetailHighlight[];
  is_fallback: boolean;
  content_locale: string;
  description: string | null;
  practical_info: string | null;
  meta_title: string | null;
  meta_description: string | null;
  itinerary: ProductDetailItineraryStep[];
  inclusions: ProductDetailInclusion[];
  packing_items: ProductDetailPackingItem[];
  faqs: ProductDetailFaq[];
  price_tiers: ProductDetailPriceTier[];
  gallery: ProductDetailMedia[];
  departure_months: number[];
  related_slugs: string[];
};


// --- Admin · Produits (écriture, PATCH /admin/products/{id}) ---

export type ProductUpdate = {
  slug?: string;
  product_type?: "circuit" | "excursion";
  product_format?: string;
  difficulty?: string;
  status?: ContentStatus;
  is_published?: boolean;

  duration_days?: number | null;
  duration_nights?: number | null;
  duration_hours?: string | null;
  departure_time?: string | null;
  return_time?: string | null;
  travel_minutes?: number | null;
  transport?: string | null;

  group_min?: number;
  group_max?: number;
  hotel_pickup?: boolean;
  min_age?: number | null;

  price_from?: string;
  currency?: string;
  deposit_percent?: number | null;

  destination_id?: string | null;
  cover_media_id?: string | null;
  is_featured?: boolean;
  sort_order?: number;

  is_indexable?: boolean;
  sitemap_priority?: number;

  highlight_codes?: string[];
  packing_codes?: string[];
  departure_months?: number[];
  gallery_media_ids?: string[];
  // translations, itinerary, faqs, inclusions, price_tiers : omis pour l'instant
  // (champs multi-locale, traités dans une étape dédiée)
};