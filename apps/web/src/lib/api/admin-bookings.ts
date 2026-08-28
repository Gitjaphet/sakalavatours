// apps/web/src/lib/api/admin-bookings.ts
"use client";

import { AdminApiError } from "./admin-products";
import type { BookingListResponse, BookingListParams } from "@/types/api";

export async function listAdminBookings(
  accessToken: string,
  params: BookingListParams = {},
): Promise<BookingListResponse> {
  const search = new URLSearchParams();
  if (params.status) search.set("status", params.status);
  if (params.only_open) search.set("only_open", "true");
  if (params.search) search.set("search", params.search);
  if (params.limit !== undefined) search.set("limit", String(params.limit));
  if (params.offset !== undefined) search.set("offset", String(params.offset));

  const query = search.toString();
  const res = await fetch(`/api/admin/bookings${query ? `?${query}` : ""}`, {
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

  return res.json() as Promise<BookingListResponse>;
}