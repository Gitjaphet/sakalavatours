// apps/web/src/app/admin/bookings/[id]/page.tsx
"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { RequireAuth } from "../../RequireAuth";
import { useAuth } from "../../AuthContext";
import { AdminApiError } from "@/lib/api/admin-products";
import {
  getAdminBooking,
  getAdminBookingHistory,
  transitionBooking,
  updateAdminBooking,
} from "@/lib/api/admin-bookings";
import type {
  BookingAdminRead,
  BookingHistoryItem,
  BookingStatus,
} from "@/types/api";

const STATUS_LABELS: Record<BookingStatus, string> = {
  new: "Nouvelle",
  contacted: "Contactée",
  quoted: "Devis envoyé",
  pending_payment: "En attente de paiement",
  confirmed: "Confirmée",
  completed: "Terminée",
  cancelled: "Annulée",
  expired: "Expirée",
};

const STATUS_STYLES: Record<BookingStatus, string> = {
  new: "bg-blue-50 text-blue-700",
  contacted: "bg-amber-50 text-amber-700",
  quoted: "bg-violet-50 text-violet-700",
  pending_payment: "bg-orange-50 text-orange-700",
  confirmed: "bg-green-50 text-green-700",
  completed: "bg-stone-100 text-stone-600",
  cancelled: "bg-red-50 text-red-600",
  expired: "bg-stone-100 text-stone-400",
};

/** Miroir de ALLOWED_TRANSITIONS côté backend — le serveur reste juge. */
const ALLOWED_TRANSITIONS: Record<BookingStatus, BookingStatus[]> = {
  new: ["contacted", "cancelled", "expired"],
  contacted: ["quoted", "confirmed", "cancelled", "expired"],
  quoted: ["pending_payment", "confirmed", "cancelled", "expired"],
  pending_payment: ["confirmed", "cancelled", "expired"],
  confirmed: ["completed", "cancelled"],
  completed: [],
  cancelled: [],
  expired: ["contacted"],
};

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("fr-FR", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

function BookingDetailContent({ id }: { id: string }) {
  const { accessToken } = useAuth();

  const [booking, setBooking] = useState<BookingAdminRead | null>(null);
  const [history, setHistory] = useState<BookingHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);

  const [internalNotes, setInternalNotes] = useState("");
  const [depositAmount, setDepositAmount] = useState("");
  const [transitionNote, setTransitionNote] = useState("");

  function reload() {
    if (!accessToken) return;
    setIsLoading(true);
    setError(null);

    Promise.all([
      getAdminBooking(accessToken, id),
      getAdminBookingHistory(accessToken, id),
    ])
      .then(([b, h]) => {
        setBooking(b);
        setHistory(h);
        setInternalNotes(b.internal_notes ?? "");
        setDepositAmount(b.deposit_amount ?? "");
      })
      .catch((err) => {
        const msg = err instanceof AdminApiError ? err.message : "Erreur inattendue";
        setError(msg);
      })
      .finally(() => setIsLoading(false));
  }

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken, id]);

  async function handleTransition(to: BookingStatus) {
    if (!accessToken || !booking) return;

    if (to === "cancelled" && !transitionNote.trim()) {
      setMessage("Une note est obligatoire pour annuler.");
      return;
    }

    const confirmed = window.confirm(
      `Passer la réservation en « ${STATUS_LABELS[to]} » ?`,
    );
    if (!confirmed) return;

    setIsBusy(true);
    setMessage(null);
    try {
      await transitionBooking(accessToken, id, {
        to_status: to,
        note: transitionNote.trim() || null,
      });
      setTransitionNote("");
      setMessage("Statut mis à jour.");
      reload();
    } catch (err) {
      const msg = err instanceof AdminApiError ? err.message : "Erreur inattendue";
      setMessage(`Erreur : ${msg}`);
    } finally {
      setIsBusy(false);
    }
  }

  async function handleSaveNotes() {
    if (!accessToken) return;
    setIsBusy(true);
    setMessage(null);
    try {
      await updateAdminBooking(accessToken, id, {
        internal_notes: internalNotes || null,
        deposit_amount: depositAmount || null,
      });
      setMessage("Suivi enregistré.");
      reload();
    } catch (err) {
      const msg = err instanceof AdminApiError ? err.message : "Erreur inattendue";
      setMessage(`Erreur : ${msg}`);
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <div className="p-8">
      <Link
        href="/admin/bookings"
        className="text-sm text-stone-500 hover:text-stone-900"
      >
        ← Retour aux réservations
      </Link>

      {isLoading && <p className="mt-4 text-stone-500">Chargement…</p>}
      {error && <p className="mt-4 text-red-600">Erreur : {error}</p>}

      {booking && (
        <>
          <div className="mb-6 mt-2 flex flex-wrap items-center gap-4">
            <h1 className="text-2xl font-semibold text-stone-900">
              {booking.reference}
            </h1>
            <span
              className={`rounded-full px-3 py-1 text-sm font-medium ${STATUS_STYLES[booking.status]}`}
            >
              {STATUS_LABELS[booking.status]}
            </span>
            {message && (
              <span
                className={`text-sm ${
                  message.startsWith("Erreur") ? "text-red-600" : "text-[#1a6b2f]"
                }`}
              >
                {message}
              </span>
            )}
          </div>

          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
            <div className="space-y-6">
              <section className="rounded-lg border border-stone-200 bg-white p-5">
                <h2 className="mb-4 text-sm font-semibold text-stone-900">Client</h2>
                <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                  <div>
                    <dt className="text-stone-500">Nom</dt>
                    <dd>{booking.customer_name}</dd>
                  </div>
                  <div>
                    <dt className="text-stone-500">Email</dt>
                    <dd>
                      <a
                        href={`mailto:${booking.customer_email}`}
                        className="text-[#1a6b2f] hover:underline"
                      >
                        {booking.customer_email}
                      </a>
                    </dd>
                  </div>
                  <div>
                    <dt className="text-stone-500">Téléphone</dt>
                    <dd>{booking.customer_phone ?? "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-stone-500">Pays</dt>
                    <dd>{booking.customer_country ?? "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-stone-500">Langue</dt>
                    <dd>{booking.preferred_locale.toUpperCase()}</dd>
                  </div>
                  <div>
                    <dt className="text-stone-500">Hôtel</dt>
                    <dd>{booking.hotel_name ?? "—"}</dd>
                  </div>
                </dl>

                {booking.customer_message && (
                  <div className="mt-4 rounded border border-stone-100 bg-stone-50 p-3">
                    <p className="mb-1 text-xs text-stone-500">Message du client</p>
                    <p className="whitespace-pre-line text-sm">
                      {booking.customer_message}
                    </p>
                  </div>
                )}
              </section>

              <section className="rounded-lg border border-stone-200 bg-white p-5">
                <h2 className="mb-4 text-sm font-semibold text-stone-900">Demande</h2>
                <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                  <div>
                    <dt className="text-stone-500">Produit</dt>
                    <dd>{booking.product_title}</dd>
                  </div>
                  <div>
                    <dt className="text-stone-500">Date souhaitée</dt>
                    <dd>{booking.requested_date}</dd>
                  </div>
                  <div>
                    <dt className="text-stone-500">Date alternative</dt>
                    <dd>{booking.alternative_date ?? "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-stone-500">Participants</dt>
                    <dd>
                      {booking.adults} adulte{booking.adults > 1 ? "s" : ""}
                      {booking.children > 0 &&
                        `, ${booking.children} enfant${booking.children > 1 ? "s" : ""}`}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-stone-500">Prix unitaire</dt>
                    <dd>
                      {booking.unit_price} {booking.currency}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-stone-500">Total</dt>
                    <dd className="font-medium">
                      {booking.total_amount} {booking.currency}
                    </dd>
                  </div>
                </dl>
              </section>

              <section className="rounded-lg border border-stone-200 bg-white p-5">
                <h2 className="mb-4 text-sm font-semibold text-stone-900">
                  Historique
                </h2>
                {history.length === 0 ? (
                  <p className="text-sm text-stone-500">Aucun changement enregistré.</p>
                ) : (
                  <ol className="space-y-3 border-l-2 border-stone-100 pl-4">
                    {history.map((h, i) => (
                      <li key={i} className="relative text-sm">
                        <span className="absolute -left-[1.35rem] top-1.5 h-2 w-2 rounded-full bg-stone-300" />
                        <p>
                          {h.from_status
                            ? `${STATUS_LABELS[h.from_status]} → ${STATUS_LABELS[h.to_status]}`
                            : STATUS_LABELS[h.to_status]}
                          {h.is_automatic && (
                            <span className="ml-2 text-xs text-stone-400">
                              (automatique)
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-stone-500">
                          {formatDateTime(h.created_at)}
                        </p>
                        {h.note && (
                          <p className="mt-1 text-xs text-stone-600">{h.note}</p>
                        )}
                      </li>
                    ))}
                  </ol>
                )}
              </section>
            </div>

            <div className="space-y-4">
              <div className="space-y-3 rounded-lg border border-stone-200 bg-white p-5">
                <h3 className="text-sm font-semibold text-stone-900">
                  Changer le statut
                </h3>

                {ALLOWED_TRANSITIONS[booking.status].length === 0 ? (
                  <p className="text-sm text-stone-500">
                    Ce statut est final, aucune transition possible.
                  </p>
                ) : (
                  <>
                    <label className="block text-sm">
                      Note (obligatoire pour annuler)
                      <textarea
                        value={transitionNote}
                        onChange={(e) => setTransitionNote(e.target.value)}
                        rows={2}
                        className="mt-1 block w-full rounded border border-stone-300 p-2 text-sm"
                      />
                    </label>

                    <div className="flex flex-wrap gap-2">
                      {ALLOWED_TRANSITIONS[booking.status].map((to) => (
                        <button
                          key={to}
                          type="button"
                          onClick={() => handleTransition(to)}
                          disabled={isBusy}
                          className={`rounded-md px-3 py-1.5 text-sm disabled:opacity-50 ${
                            to === "cancelled"
                              ? "border border-red-300 text-red-600 hover:bg-red-50"
                              : "bg-[#1a6b2f] text-white hover:bg-[#155726]"
                          }`}
                        >
                          {STATUS_LABELS[to]}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>

              <div className="space-y-3 rounded-lg border border-stone-200 bg-white p-5">
                <h3 className="text-sm font-semibold text-stone-900">Suivi interne</h3>

                <label className="block text-sm">
                  Notes
                  <textarea
                    value={internalNotes}
                    onChange={(e) => setInternalNotes(e.target.value)}
                    rows={4}
                    placeholder="Visible uniquement par l'équipe"
                    className="mt-1 block w-full rounded border border-stone-300 p-2 text-sm"
                  />
                </label>

                <label className="block text-sm">
                  Acompte ({booking.currency})
                  <input
                    type="text"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    className="mt-1 block w-full rounded border border-stone-300 p-2 text-sm"
                  />
                </label>

                <button
                  type="button"
                  onClick={handleSaveNotes}
                  disabled={isBusy}
                  className="rounded-md bg-stone-900 px-4 py-2 text-sm text-white disabled:opacity-50"
                >
                  Enregistrer le suivi
                </button>
              </div>

              <div className="space-y-2 rounded-lg border border-stone-200 bg-white p-5 text-sm">
                <h3 className="mb-2 text-sm font-semibold text-stone-900">Origine</h3>
                <p className="text-stone-600">
                  Source : <span className="text-stone-900">{booking.source}</span>
                </p>
                {booking.utm_source && (
                  <p className="text-stone-600">
                    UTM source :{" "}
                    <span className="text-stone-900">{booking.utm_source}</span>
                  </p>
                )}
                {booking.utm_campaign && (
                  <p className="text-stone-600">
                    Campagne :{" "}
                    <span className="text-stone-900">{booking.utm_campaign}</span>
                  </p>
                )}
                <p className="text-stone-600">
                  Reçue le{" "}
                  <span className="text-stone-900">
                    {formatDateTime(booking.created_at)}
                  </span>
                </p>
                {booking.expires_at && (
                  <p className="text-stone-600">
                    Expire le{" "}
                    <span className="text-stone-900">
                      {formatDateTime(booking.expires_at)}
                    </span>
                  </p>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default function AdminBookingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return (
    <RequireAuth>
      <BookingDetailContent id={id} />
    </RequireAuth>
  );
}