// --- Admin · Produits ---

export type AdminRole = "owner" | "admin" | "editor";

export type ContentStatus = "draft" | "scheduled" | "published" | "archived";

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

import type {
  ProductFormat,
  DifficultyLevel,
  TransportMode,
} from "@/lib/constants/product-enums";

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
  product_format: ProductFormat;
  difficulty: DifficultyLevel;
  transport: TransportMode | null;
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
  product_format?: ProductFormat;
  difficulty?: DifficultyLevel;
  transport?: TransportMode | null;
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
  translations?: ProductTranslationIn[];
  inclusions?: InclusionLinkIn[];
  itinerary?: ItineraryItemIn[];
  price_tiers?: PriceTierIn[];
  faqs?: FaqIn[];
  
};

// --- Admin · Médias ---

export type CoverMediaLike = {
  id: string;
  url: string;
  alt_text: string | null;
};


export type MediaAdminRead = {
  id: string;
  kind: "image" | "video" | "document";
  url: string;
  width: number | null;
  height: number | null;
  blurhash: string | null;
  alt_text: string;
  caption: string | null;
  title: string | null;
  filename: string;
  file_size: number;
  mime_type: string;
  folder: string | null;
  is_public: boolean;
  photographer: string | null;
  created_at: string;
};



export type ProductTranslationIn = {
  locale: string;
  title: string;
  subtitle?: string | null;
  region_label?: string | null;
  summary: string;
  description?: string | null;
  practical_info?: string | null;
  meta_title?: string | null;
  meta_description?: string | null;
  og_title?: string | null;
  og_description?: string | null;
  is_machine_translated?: boolean;
};

export type ProductCreate = {
  slug?: string;
  product_type: "circuit" | "excursion";
  product_format: ProductFormat;
  difficulty?: DifficultyLevel;
  status?: ContentStatus;

  duration_days?: number | null;
  duration_nights?: number | null;
  duration_hours?: string | null;
  departure_time?: string | null;
  return_time?: string | null;
  travel_minutes?: number | null;
  transport?: TransportMode | null;

  group_min?: number;
  group_max?: number;
  hotel_pickup?: boolean;
  min_age?: number | null;

  price_from: string;
  currency?: string;
  deposit_percent?: number | null;

  destination_id?: string | null;
  cover_media_id?: string | null;
  is_featured?: boolean;
  sort_order?: number;

  is_indexable?: boolean;
  sitemap_priority?: number;

  translations: ProductTranslationIn[];
  highlight_codes?: string[];
  packing_codes?: string[];
  departure_months?: number[];
  gallery_media_ids?: string[];
  // inclusions, itinerary, price_tiers, faqs : omis pour l'instant,
  // même portée réduite que ProductUpdate — étape dédiée plus tard
};



// --- Admin · Produits (lecture multi-locale, GET /admin/products/{id}/translations) ---

export type ProductTranslationOut = ProductTranslationIn & {
  id: string;
};

export type ItineraryTranslationIn = {
  locale: string;
  title: string;
  description?: string | null;
  location_label?: string | null;
  meal_plan?: string | null;
};

export type ItineraryTranslationOut = ItineraryTranslationIn & {
  id: string;
};

export type ItineraryItemIn = {
  day_number?: number;
  time_label?: string | null;
  sort_order?: number;
  is_optional?: boolean;
  media_id?: string | null;
  hotel_name?: string | null;
  distance_km?: number | null;
  translations: ItineraryTranslationIn[];
};

export type ItineraryItemAdminOut = {
  id: string;
  day_number: number;
  time_label: string | null;
  sort_order: number;
  is_optional: boolean;
  media_id: string | null;
  hotel_name: string | null;
  distance_km: number | null;
  translations: ItineraryTranslationOut[];
};

export type FaqIn = {
  locale: string;
  question: string;
  answer: string;
  sort_order?: number;
};

export type FaqOut = FaqIn & {
  id: string;
};

export type PriceTierIn = {
  label_code: string;
  price: string;
  min_pax?: number | null;
  max_pax?: number | null;
  is_private?: boolean;
  sort_order?: number;
};

export type PriceTierOut = PriceTierIn & {
  id: string;
};

export type InclusionLinkIn = {
  code: string;
  is_included?: boolean;
  sort_order?: number;
};

export type ProductAdminDetail = {
  id: string;
  slug: string;
  product_type: "circuit" | "excursion";
  product_format: ProductFormat;
  difficulty: DifficultyLevel;
  status: ContentStatus;
  is_published: boolean;

  duration_days: number | null;
  duration_nights: number | null;
  duration_hours: string | null;
  departure_time: string | null;
  return_time: string | null;
  travel_minutes: number | null;
  transport: TransportMode | null;

  group_min: number;
  group_max: number;
  hotel_pickup: boolean;
  min_age: number | null;

  price_from: string;
  currency: string;
  deposit_percent: number | null;

  destination_id: string | null;
  cover_media_id: string | null;
  is_featured: boolean;
  sort_order: number;

  is_indexable: boolean;
  sitemap_priority: number;

  translations: ProductTranslationOut[];
  highlight_codes: string[];
  inclusions: InclusionLinkIn[];
  packing_codes: string[];
  departure_months: number[];
  gallery_media_ids: string[];
  itinerary: ItineraryItemAdminOut[];
  price_tiers: PriceTierOut[];
  faqs: FaqOut[];
};


// --- Admin · Taxonomies ---

export type TaxonomyType = "highlights" | "inclusions" | "packing-items";

export type TaxonomyTranslationIn = {
  locale: string;
  label: string;
  detail?: string | null;
};

export type TaxonomyTranslationOut = TaxonomyTranslationIn & {
  id: string;
};

export type TaxonomyOut = {
  id: string;
  code: string;
  icon: string | null;
  sort_order: number;
  translations: TaxonomyTranslationOut[];
};

export type TaxonomyListResponse = {
  items: TaxonomyOut[];
  total: number;
};

export type TaxonomyCreate = {
  code: string;
  icon?: string | null;
  sort_order?: number;
  translations: TaxonomyTranslationIn[];
};

export type TaxonomyUpdate = {
  code?: string;
  icon?: string | null;
  sort_order?: number;
  translations?: TaxonomyTranslationIn[];
};

// --- Admin · Réservations ---

export type BookingStatus =
  | "new"
  | "contacted"
  | "quoted"
  | "pending_payment"
  | "confirmed"
  | "completed"
  | "cancelled"
  | "expired";

export type BookingSource = "website" | "phone" | "email" | "walk_in" | "partner";

export type BookingListItem = {
  id: string;
  reference: string;
  status: BookingStatus;
  product_title: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  requested_date: string;
  adults: number;
  children: number;
  total_amount: string;
  currency: string;
  assigned_to: string | null;
  source: BookingSource;
  created_at: string;
  expires_at: string | null;
};

export type BookingListResponse = {
  items: BookingListItem[];
  total: number;
  limit: number;
  offset: number;
  counts_by_status: Record<string, number>;
};

export type BookingListParams = {
  status?: BookingStatus;
  only_open?: boolean;
  search?: string;
  limit?: number;
  offset?: number;
};

export type BookingAdminRead = {
  id: string;
  reference: string;
  status: BookingStatus;

  product_id: string | null;
  product_slug: string;
  product_title: string;
  product_type: "circuit" | "excursion";
  unit_price: string;
  currency: string;

  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  customer_country: string | null;
  preferred_locale: string;
  hotel_name: string | null;

  requested_date: string;
  alternative_date: string | null;
  adults: number;
  children: number;
  customer_message: string | null;

  total_amount: string;
  deposit_amount: string | null;
  deposit_paid_at: string | null;
  balance_paid_at: string | null;

  assigned_to: string | null;
  internal_notes: string | null;
  cancellation_reason: string | null;

  first_contacted_at: string | null;
  quoted_at: string | null;
  confirmed_at: string | null;
  completed_at: string | null;
  expires_at: string | null;

  source: BookingSource;
  utm_source: string | null;
  utm_campaign: string | null;

  created_at: string;
  updated_at: string;
};

export type BookingHistoryItem = {
  from_status: BookingStatus | null;
  to_status: BookingStatus;
  changed_by: string | null;
  note: string | null;
  is_automatic: boolean;
  created_at: string;
};

export type BookingTransitionRequest = {
  to_status: BookingStatus;
  note?: string | null;
};

export type BookingUpdateRequest = {
  assigned_to?: string | null;
  internal_notes?: string | null;
  deposit_amount?: string | null;
  deposit_paid_at?: string | null;
  balance_paid_at?: string | null;
  hotel_name?: string | null;
};


// --- Admin · Avis ---

export type ReviewStatus = "pending" | "approved" | "rejected" | "spam";

export type ReviewProductRef = {
  id: string;
  title: string;
  slug: string;
};

export type ReviewAdminRead = {
  id: string;

  author_name: string;
  author_email: string;
  author_country: string | null;

  rating: number;
  title: string | null;
  body: string;
  locale: string;
  travel_date: string | null;

  status: ReviewStatus;
  is_verified: boolean;
  booking_reference: string | null;
  email_verified_at: string | null;

  moderated_by: string | null;
  moderated_at: string | null;
  rejection_reason: string | null;

  admin_reply: string | null;
  admin_replied_at: string | null;
  published_at: string | null;

  submitted_ip: string | null;
  spam_score: number | null;

  is_featured: boolean;
  created_at: string;

  // null signifie « avis portant sur l'agence », jamais « non chargé ».
  product: ReviewProductRef | null;
};

export type ReviewAdminListResponse = {
  items: ReviewAdminRead[];
  total: number;
  limit: number;
  offset: number;
  counts_by_status: Record<string, number>;
};

export type ReviewListParams = {
  status?: ReviewStatus;
  product_id?: string;
  min_rating?: number;
  max_rating?: number;
  limit?: number;
  offset?: number;
};

export type ReviewModerateRequest = {
  status: ReviewStatus;
  rejection_reason?: string | null;
  is_verified?: boolean | null;
  is_featured?: boolean | null;
};

export type ReviewReplyRequest = {
  admin_reply: string;
};


export type ReviewScopeAggregate = {
  product: ReviewProductRef | null;
  approved_count: number;
  verified_count: number;
  is_schema_eligible: boolean;
};

export type ReviewAggregatesResponse = {
  threshold: number;
  scopes: ReviewScopeAggregate[];
};