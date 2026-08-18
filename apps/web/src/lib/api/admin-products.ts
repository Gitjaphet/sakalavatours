// apps/web/src/lib/api/admin-products.ts
"use client";

import type {
  ProductAdminListResponse,
  ContentStatus,
  ProductDetail,
  ProductUpdate,
  MediaAdminRead,
} from "@/types/api";

export class AdminApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "AdminApiError";
  }
}

type ListProductsParams = {
  product_type?: "circuit" | "excursion";
  status?: ContentStatus;
  search?: string;
  limit?: number;
  offset?: number;
};

export async function listAdminProducts(
  accessToken: string,
  params: ListProductsParams = {},
): Promise<ProductAdminListResponse> {
  const search = new URLSearchParams();
  if (params.product_type) search.set("product_type", params.product_type);
  if (params.status) search.set("status", params.status);
  if (params.search) search.set("search", params.search);
  if (params.limit !== undefined) search.set("limit", String(params.limit));
  if (params.offset !== undefined) search.set("offset", String(params.offset));

  const query = search.toString();
  const res = await fetch(`/api/admin/products${query ? `?${query}` : ""}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new AdminApiError(
      data.detail ?? `Erreur ${res.status}`,
      res.status,
    );
  }

  return res.json() as Promise<ProductAdminListResponse>;
}


export async function getAdminProduct(
  accessToken: string,
  id: string,
  locale: string = "fr",
): Promise<ProductDetail> {
  const res = await fetch(
    `/api/admin/products/${id}?locale=${locale}`,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    const message =
    typeof data.detail === "string"
        ? data.detail
        : Array.isArray(data.detail)
        ? data.detail.map((e: { msg?: string }) => e.msg).join(", ")
        : `Erreur ${res.status}`;
    throw new AdminApiError(message, res.status);
  }

  return res.json() as Promise<ProductDetail>;
}


export async function updateAdminProduct(
  accessToken: string,
  id: string,
  payload: ProductUpdate,
): Promise<ProductDetail> {
  const res = await fetch(`/api/admin/products/${id}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    const message =
      typeof data.detail === "string"
        ? data.detail
        : Array.isArray(data.detail)
          ? data.detail.map((e: { msg?: string }) => e.msg).join(", ")
          : `Erreur ${res.status}`;
    throw new AdminApiError(message, res.status);
  }

  return res.json() as Promise<ProductDetail>;
  
}


export async function listAdminMedia(
  accessToken: string,
  params: { folder?: string; limit?: number; offset?: number } = {},
): Promise<MediaAdminRead[]> {
  const search = new URLSearchParams();
  if (params.folder) search.set("folder", params.folder);
  if (params.limit !== undefined) search.set("limit", String(params.limit));
  if (params.offset !== undefined) search.set("offset", String(params.offset));

  const query = search.toString();
  const res = await fetch(`/api/admin/media${query ? `?${query}` : ""}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    const message =
      typeof data.detail === "string"
        ? data.detail
        : Array.isArray(data.detail)
          ? data.detail.map((e: { msg?: string }) => e.msg).join(", ")
          : `Erreur ${res.status}`;
    throw new AdminApiError(message, res.status);
  }

  return res.json() as Promise<MediaAdminRead[]>;
}