// apps/web/src/lib/api/admin-reviews.ts
"use client";

import { AdminApiError } from "./admin-products";
import type {
  ReviewAdminListResponse,
  ReviewAdminRead,
  ReviewListParams,
  ReviewModerateRequest,
  ReviewReplyRequest,
} from "@/types/api";

/**
 * Lecture unifiée d'une réponse admin.
 *
 * Traite le cas que admin-products.ts ne couvre pas : sur un 422,
 * FastAPI renvoie `detail` sous forme de tableau d'erreurs de
 * validation, qu'un affichage direct rendrait en « [object Object] ».
 */
async function handleResponse<T>(res: Response): Promise<T> {
  if (res.ok) {
    return res.json() as Promise<T>;
  }

  const data = await res.json().catch(() => ({}));
  const detail = data?.detail;

  let message: string;
  if (typeof detail === "string") {
    message = detail;
  } else if (Array.isArray(detail)) {
    message = detail
      .map((e: { msg?: string }) => e?.msg)
      .filter(Boolean)
      .join(" · ");
  } else {
    message = "";
  }

  throw new AdminApiError(message || `Erreur ${res.status}`, res.status);
}

export async function listAdminReviews(
  accessToken: string,
  params: ReviewListParams = {},
): Promise<ReviewAdminListResponse> {
  const search = new URLSearchParams();
  if (params.status !== undefined) search.set("status", params.status);
  if (params.product_id !== undefined) search.set("product_id", params.product_id);
  if (params.min_rating !== undefined) search.set("min_rating", String(params.min_rating));
  if (params.max_rating !== undefined) search.set("max_rating", String(params.max_rating));
  if (params.limit !== undefined) search.set("limit", String(params.limit));
  if (params.offset !== undefined) search.set("offset", String(params.offset));

  const query = search.toString();
  const res = await fetch(`/api/admin/reviews${query ? `?${query}` : ""}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  return handleResponse<ReviewAdminListResponse>(res);
}

export async function getAdminReview(
  accessToken: string,
  id: string,
): Promise<ReviewAdminRead> {
  const res = await fetch(`/api/admin/reviews/${id}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  return handleResponse<ReviewAdminRead>(res);
}

/**
 * Approuve, rejette ou marque comme spam.
 *
 * Le backend exige un motif pour REJECTED et SPAM, et renvoie 400 sans
 * lui. La validation côté formulaire évite l'aller-retour, mais la règle
 * reste appliquée côté serveur.
 */
export async function moderateAdminReview(
  accessToken: string,
  id: string,
  payload: ReviewModerateRequest,
): Promise<ReviewAdminRead> {
  const res = await fetch(`/api/admin/reviews/${id}/moderate`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  return handleResponse<ReviewAdminRead>(res);
}

/**
 * Réponse publique de l'agence.
 *
 * ⚠ Aucune route ne permet de retirer une réponse une fois publiée :
 * elle reste modifiable mais jamais effaçable. Le formulaire doit le
 * signaler avant le premier envoi.
 */
export async function replyToAdminReview(
  accessToken: string,
  id: string,
  payload: ReviewReplyRequest,
): Promise<ReviewAdminRead> {
  const res = await fetch(`/api/admin/reviews/${id}/reply`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  return handleResponse<ReviewAdminRead>(res);
}