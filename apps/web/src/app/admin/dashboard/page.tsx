// apps/web/src/app/admin/dashboard/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { RequireAuth } from "../RequireAuth";
import { useAuth } from "../AuthContext";
import { listAdminBookings } from "@/lib/api/admin-bookings";
import { listAdminReviews } from "@/lib/api/admin-reviews";
import { listAdminMessages } from "@/lib/api/admin-messages";
import { listAdminProducts, AdminApiError } from "@/lib/api/admin-products";
import type { BookingListItem } from "@/types/api";

type Stats = {
  bookingsTotal: number;
  bookingsNew: number;
  reviewsPending: number;
  messagesUnread: number;
  productsTotal: number;
  productsPublished: number;
  recentBookings: BookingListItem[];
};

function StatCard({
  label,
  value,
  hint,
  href,
  accent,
}: {
  label: string;
  value: number;
  hint?: string;
  href: string;
  accent?: boolean;
}) {
  return (
    <Link
      href={href}
      className="group rounded-xl border border-stone-200 bg-white p-5 transition-all hover:border-stone-300 hover:shadow-sm"
    >
      <p className="text-sm text-stone-500">{label}</p>
      <p
        className={`mt-2 text-3xl font-semibold tabular-nums ${
          accent && value > 0 ? "text-[#E76F51]" : "text-stone-900"
        }`}
      >
        {value}
      </p>
      {hint && <p className="mt-1 text-xs text-stone-400">{hint}</p>}
    </Link>
  );
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function DashboardContent() {
  const { accessToken } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken) return;

    let cancelled = false;

    Promise.all([
      listAdminBookings(accessToken, { limit: 5 }),
      listAdminReviews(accessToken, { limit: 1 }),
      listAdminMessages(accessToken, { limit: 1 }),
      listAdminProducts(accessToken, { limit: 50 }),
    ])
      .then(([bookings, reviews, messages, products]) => {
        if (cancelled) return;
        setStats({
          bookingsTotal: bookings.total,
          bookingsNew: bookings.counts_by_status?.new ?? 0,
          reviewsPending: reviews.counts_by_status?.pending ?? 0,
          messagesUnread: messages.unread_count ?? 0,
          productsTotal: products.total,
          productsPublished: products.items.filter((p) => p.is_published).length,
          recentBookings: bookings.items,
        });
      })
      .catch((err) => {
        if (cancelled) return;
        setError(
          err instanceof AdminApiError ? err.message : "Erreur inattendue",
        );
      });

    return () => {
      cancelled = true;
    };
  }, [accessToken]);

  if (error)
    return (
      <div className="p-8">
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Erreur : {error}
        </div>
      </div>
    );

  if (!stats)
    return (
      <div className="p-8">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-xl bg-stone-100" />
          ))}
        </div>
      </div>
    );

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-stone-900">Tableau de bord</h1>
        <p className="mt-1 text-sm text-stone-500">
          Vue d&apos;ensemble de l&apos;activité de l&apos;agence.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Réservations"
          value={stats.bookingsTotal}
          hint={`${stats.bookingsNew} nouvelle(s) à traiter`}
          href="/admin/bookings"
          accent={stats.bookingsNew > 0}
        />
        <StatCard
          label="Avis en attente"
          value={stats.reviewsPending}
          hint="À modérer"
          href="/admin/reviews"
          accent
        />
        <StatCard
          label="Messages non lus"
          value={stats.messagesUnread}
          hint="Depuis le formulaire de contact"
          href="/admin/messages"
          accent
        />
        <StatCard
          label="Activités"
          value={stats.productsTotal}
          hint={`${stats.productsPublished} publiée(s)`}
          href="/admin/activites"
        />
      </div>

      <section className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-stone-900">
            Dernières réservations
          </h2>
          <Link
            href="/admin/bookings"
            className="text-sm font-medium text-[#1a6b2f] hover:underline"
          >
            Tout voir
          </Link>
        </div>

        {stats.recentBookings.length === 0 ? (
          <div className="rounded-lg border border-dashed border-stone-300 p-10 text-center text-sm text-stone-500">
            Aucune réservation pour le moment.
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border border-stone-200 bg-white">
            <table className="w-full text-left text-sm">
              <thead className="bg-stone-50 text-xs uppercase tracking-wide text-stone-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Client</th>
                  <th className="px-4 py-3 font-medium">Activité</th>
                  <th className="px-4 py-3 font-medium">Date souhaitée</th>
                  <th className="px-4 py-3 font-medium">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {stats.recentBookings.map((b) => (
                  <tr key={b.id} className="transition-colors hover:bg-stone-50">
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/bookings/${b.id}`}
                        className="font-medium text-stone-900 hover:text-[#1a6b2f]"
                      >
                        {b.customer_name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-stone-600">{b.product_title}</td>
                    <td className="px-4 py-3 text-stone-600">
                      {formatDate(b.requested_date)}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center rounded-full bg-stone-100 px-2 py-0.5 text-xs font-medium text-stone-700">
                        {b.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

export default function AdminDashboardPage() {
  return (
    <RequireAuth>
      <DashboardContent />
    </RequireAuth>
  );
}
