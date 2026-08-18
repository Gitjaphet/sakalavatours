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