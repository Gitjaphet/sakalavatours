// apps/web/src/app/admin/bookings/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { RequireAuth } from "../RequireAuth";
import { useAuth } from "../AuthContext";
import { AdminApiError } from "@/lib/api/admin-products";
import { listAdminBookings } from "@/lib/api/admin-bookings";
import type { BookingListItem, BookingStatus } from "@/types/api";

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

type TabKey = "open" | BookingStatus | "all";

const TABS: { key: TabKey; label: string }[] = [
  { key: "open", label: "En cours" },
  { key: "new", label: "Nouvelles" },
  { key: "contacted", label: "Contactées" },
  { key: "quoted", label: "Devis" },
  { key: "confirmed", label: "Confirmées" },
  { key: "completed", label: "Terminées" },
  { key: "cancelled", label: "Annulées" },
  { key: "all", label: "Toutes" },
];

function BookingsContent() {
  const { accessToken } = useAuth();
  const [items, setItems] = useState<BookingListItem[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>("open");
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!accessToken) return;

    let cancelled = false;
    setIsLoading(true);
    setError(null);

    const params =
      activeTab === "open"
        ? { only_open: true, search: search || undefined }
        : activeTab === "all"
          ? { search: search || undefined }
          : { status: activeTab, search: search || undefined };

    listAdminBookings(accessToken, params)
      .then((data) => {
        if (cancelled) return;
        setItems(data.items);
        setCounts(data.counts_by_status);
        setTotal(data.total);
      })
      .catch((err) => {
        if (cancelled) return;
        const msg = err instanceof AdminApiError ? err.message : "Erreur inattendue";
        setError(msg);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [accessToken, activeTab, search]);

  return (
    <div className="p-8">
      <h1 className="mb-6 text-2xl font-semibold text-stone-900">Réservations</h1>

      <div className="mb-4 flex flex-wrap gap-1 border-b border-stone-200">
        {TABS.map((tab) => {
          const count = tab.key === "all" ? undefined : counts[tab.key];
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`px-3 py-2 text-sm border-b-2 transition-colors ${
                activeTab === tab.key
                  ? "border-[#1a6b2f] font-medium text-stone-900"
                  : "border-transparent text-stone-500 hover:text-stone-800"
              }`}
            >
              {tab.label}
              {count !== undefined && count > 0 && (
                <span className="ml-1.5 rounded-full bg-stone-100 px-1.5 py-0.5 text-xs text-stone-600">
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <input
        type="search"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Référence, nom ou email du client…"
        className="mb-4 block w-full max-w-md rounded border border-stone-300 p-2 text-sm"
      />

      {isLoading && <p className="text-stone-500">Chargement…</p>}
      {error && <p className="text-red-600">Erreur : {error}</p>}

      {!isLoading && !error && items.length === 0 && (
        <p className="rounded-lg border border-dashed border-stone-300 p-8 text-center text-sm text-stone-500">
          Aucune réservation dans cette catégorie.
        </p>
      )}

      {items.length > 0 && (
        <>
          <p className="mb-2 text-sm text-stone-500">{total} réservation(s)</p>
          <div className="overflow-hidden rounded-lg border border-stone-200 bg-white">
            <table className="w-full text-sm">
              <thead className="border-b border-stone-200 bg-stone-50 text-left">
                <tr>
                  <th className="px-4 py-3 font-medium">Référence</th>
                  <th className="px-4 py-3 font-medium">Client</th>
                  <th className="px-4 py-3 font-medium">Produit</th>
                  <th className="px-4 py-3 font-medium">Date souhaitée</th>
                  <th className="px-4 py-3 font-medium">Pax</th>
                  <th className="px-4 py-3 font-medium">Montant</th>
                  <th className="px-4 py-3 font-medium">Statut</th>
                </tr>
              </thead>
              <tbody>
                {items.map((b) => (
                  <tr
                    key={b.id}
                    className="border-b border-stone-100 last:border-0 hover:bg-stone-50"
                  >
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/bookings/${b.id}`}
                        className="font-medium text-[#1a6b2f] hover:underline"
                      >
                        {b.reference}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <p>{b.customer_name}</p>
                      <p className="text-xs text-stone-500">{b.customer_email}</p>
                    </td>
                    <td className="px-4 py-3">{b.product_title}</td>
                    <td className="px-4 py-3">{b.requested_date}</td>
                    <td className="px-4 py-3">
                      {b.adults}
                      {b.children > 0 && ` + ${b.children} enf.`}
                    </td>
                    <td className="px-4 py-3">
                      {b.total_amount} {b.currency}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-1 text-xs font-medium ${STATUS_STYLES[b.status]}`}
                      >
                        {STATUS_LABELS[b.status]}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

export default function AdminBookingsPage() {
  return (
    <RequireAuth>
      <BookingsContent />
    </RequireAuth>
  );
}