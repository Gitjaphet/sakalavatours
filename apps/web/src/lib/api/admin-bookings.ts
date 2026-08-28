// apps/web/src/lib/api/admin-bookings.ts
"use client";

import { AdminApiError } from "./admin-products";
import type {
  BookingListParams,
  BookingListResponse,
  BookingAdminRead,
  BookingHistoryItem,
  BookingTransitionRequest,
  BookingUpdateRequest,
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
  return handleResponse<BookingListResponse>(res);
}

export async function getAdminBooking(
  accessToken: string,
  id: string,
): Promise<BookingAdminRead> {
  const res = await fetch(`/api/admin/bookings/${id}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return handleResponse<BookingAdminRead>(res);
}

export async function getAdminBookingHistory(
  accessToken: string,
  id: string,
): Promise<BookingHistoryItem[]> {
  const res = await fetch(`/api/admin/bookings/${id}/history`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return handleResponse<BookingHistoryItem[]>(res);
}

export async function transitionBooking(
  accessToken: string,
  id: string,
  payload: BookingTransitionRequest,
): Promise<BookingAdminRead> {
  const res = await fetch(`/api/admin/bookings/${id}/transition`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  return handleResponse<BookingAdminRead>(res);
}

export async function updateAdminBooking(
  accessToken: string,
  id: string,
  payload: BookingUpdateRequest,
): Promise<BookingAdminRead> {
  const res = await fetch(`/api/admin/bookings/${id}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  return handleResponse<BookingAdminRead>(res);
}