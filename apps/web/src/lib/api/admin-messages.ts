// apps/web/src/lib/api/admin-messages.ts
"use client";

import { AdminApiError } from "./admin-products";
import type {
  ContactAdminListResponse,
  ContactAdminRead,
  ContactListParams,
  ContactUpdateRequest,
} from "@/types/api";

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

export async function listAdminMessages(
  accessToken: string,
  params: ContactListParams = {},
): Promise<ContactAdminListResponse> {
  const search = new URLSearchParams();
  if (params.is_archived !== undefined)
    search.set("is_archived", String(params.is_archived));
  if (params.is_read !== undefined) search.set("is_read", String(params.is_read));
  if (params.limit !== undefined) search.set("limit", String(params.limit));
  if (params.offset !== undefined) search.set("offset", String(params.offset));

  const query = search.toString();
  const res = await fetch(`/api/admin/messages${query ? `?${query}` : ""}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  return handleResponse<ContactAdminListResponse>(res);
}

/** Ouvre un message. Le backend le marque lu au passage. */
export async function getAdminMessage(
  accessToken: string,
  id: string,
): Promise<ContactAdminRead> {
  const res = await fetch(`/api/admin/messages/${id}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  return handleResponse<ContactAdminRead>(res);
}

export async function updateAdminMessage(
  accessToken: string,
  id: string,
  payload: ContactUpdateRequest,
): Promise<ContactAdminRead> {
  const res = await fetch(`/api/admin/messages/${id}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  return handleResponse<ContactAdminRead>(res);
}