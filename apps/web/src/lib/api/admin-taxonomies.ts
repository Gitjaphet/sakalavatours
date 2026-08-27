// apps/web/src/lib/api/admin-taxonomies.ts
"use client";

import { AdminApiError } from "./admin-products";
import type {
  TaxonomyType,
  TaxonomyListResponse,
  TaxonomyCreate,
  TaxonomyUpdate,
  TaxonomyOut,
} from "@/types/api";

async function handleResponse<T>(res: Response): Promise<T> {
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
  return res.json() as Promise<T>;
}

export async function listTaxonomy(
  accessToken: string,
  type: TaxonomyType,
): Promise<TaxonomyListResponse> {
  const res = await fetch(`/api/admin/taxonomies/${type}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return handleResponse<TaxonomyListResponse>(res);
}

export async function createTaxonomyItem(
  accessToken: string,
  type: TaxonomyType,
  payload: TaxonomyCreate,
): Promise<TaxonomyOut> {
  const res = await fetch(`/api/admin/taxonomies/${type}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  return handleResponse<TaxonomyOut>(res);
}

export async function updateTaxonomyItem(
  accessToken: string,
  type: TaxonomyType,
  id: string,
  payload: TaxonomyUpdate,
): Promise<TaxonomyOut> {
  const res = await fetch(`/api/admin/taxonomies/${type}/${id}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  return handleResponse<TaxonomyOut>(res);
}

export async function deleteTaxonomyItem(
  accessToken: string,
  type: TaxonomyType,
  id: string,
): Promise<{ message: string }> {
  const res = await fetch(`/api/admin/taxonomies/${type}/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return handleResponse<{ message: string }>(res);
}