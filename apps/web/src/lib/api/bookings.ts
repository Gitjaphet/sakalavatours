// apps/web/src/lib/api/bookings.ts
"use client";

/**
 * Envoi du formulaire de réservation public.
 *
 * Passe par le proxy Next.js plutôt que d'appeler l'API directement :
 * l'URL du backend reste côté serveur, et on évite toute question CORS.
 */

export type BookingFormPayload = {
  product_slug: string;
  customer_name: string;
  customer_email: string;
  customer_phone?: string | null;
  customer_country?: string | null;
  preferred_locale: string;
  hotel_name?: string | null;
  requested_date: string;
  alternative_date?: string | null;
  adults: number;
  children: number;
  customer_message?: string | null;
  /** Champ piège anti-robot : doit rester vide. */
  website?: string;
};

export type BookingConfirmation = {
  reference: string;
  status: string;
  product_title: string;
  requested_date: string;
  adults: number;
  children: number;
  message: string;
};

export class BookingError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "BookingError";
  }
}

export async function createBooking(
  payload: BookingFormPayload,
): Promise<BookingConfirmation> {
  const res = await fetch("/api/bookings", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
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
    throw new BookingError(message, res.status);
  }

  return res.json() as Promise<BookingConfirmation>;
}