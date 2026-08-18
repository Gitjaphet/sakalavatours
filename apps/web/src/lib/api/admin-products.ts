// apps/web/src/lib/api/admin-products.ts
"use client";

import type {
  ProductAdminListResponse,
  ContentStatus,
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
): Promise<unknown> {
  const res = await fetch(
    `/api/admin/products/${id}?locale=${locale}`,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new AdminApiError(
      data.detail ?? `Erreur ${res.status}`,
      res.status,
    );
  }

  return res.json();
}