// apps/web/src/app/admin/reviews/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { RequireAuth } from "../RequireAuth";
import { useAuth } from "../AuthContext";
import { AdminApiError } from "@/lib/api/admin-products";
import { listAdminReviews } from "@/lib/api/admin-reviews";
import type { ReviewAdminRead, ReviewStatus } from "@/types/api";

const STATUS_LABELS: Record<ReviewStatus, string> = {
  pending: "En attente",
  approved: "Publié",
  rejected: "Rejeté",
  spam: "Spam",
};

const STATUS_STYLES: Record<ReviewStatus, string> = {
  pending: "bg-amber-50 text-amber-700",
  approved: "bg-green-50 text-green-700",
  rejected: "bg-stone-100 text-stone-600",
  spam: "bg-red-50 text-red-600",
};

type TabKey = ReviewStatus | "all";

const TABS: { key: TabKey; label: string }[] = [
  { key: "pending", label: "En attente" },
  { key: "approved", label: "Publiés" },
  { key: "rejected", label: "Rejetés" },
  { key: "spam", label: "Spam" },
  { key: "all", label: "Tous" },
];

/**
 * Seuils du score de spam.
 *
 * Calés sur compute_spam_score côté backend : un seul terme commercial
 * ajoute 0,3 ; deux liens ajoutent 0,4. En dessous de 0,3 l'avis n'a
 * déclenché aucune heuristique franche.
 */
function riskBadge(score: number | null): { label: string; className: string } {
  if (score === null) return { label: "—", className: "bg-stone-100 text-stone-500" };
  const value = score.toFixed(2).replace(".", ",");
  if (score >= 0.6)
    return { label: value, className: "bg-red-600 text-white font-semibold" };
  if (score >= 0.3) return { label: value, className: "bg-amber-50 text-amber-800" };
  return { label: value, className: "bg-green-50 text-green-800" };
}

function ReviewsContent() {
  const { accessToken } = useAuth();
  const [items, setItems] = useState<ReviewAdminRead[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>("pending");
  const [minRating, setMinRating] = useState<string>("");

  useEffect(() => {
    if (!accessToken) return;

    let cancelled = false;
    setIsLoading(true);
    setError(null);

    const params = {
      ...(activeTab === "all" ? {} : { status: activeTab }),
      ...(minRating ? { min_rating: Number(minRating), max_rating: Number(minRating) } : {}),
    };

    listAdminReviews(accessToken, params)
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
  }, [accessToken, activeTab, minRating]);

  return (
    <div className="max-w-5xl p-8">
      <h1 className="mb-6 text-2xl font-semibold text-stone-900">Avis</h1>

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

      <select
        value={minRating}
        onChange={(e) => setMinRating(e.target.value)}
        className="mb-4 block rounded border border-stone-300 p-2 text-sm"
      >
        <option value="">Toutes les notes</option>
        <option value="5">5 étoiles</option>
        <option value="4">4 étoiles</option>
        <option value="3">3 étoiles</option>
        <option value="2">2 étoiles</option>
        <option value="1">1 étoile</option>
      </select>

      {isLoading && <p className="text-stone-500">Chargement…</p>}
      {error && <p className="text-red-600">Erreur : {error}</p>}

      {!isLoading && !error && items.length === 0 && (
        <p className="rounded-lg border border-dashed border-stone-300 p-8 text-center text-sm text-stone-500">
          Aucun avis dans cette catégorie.
        </p>
      )}

      {items.length > 0 && (
        <>
          <p className="mb-2 text-sm text-stone-500">
            {total} avis · triés par risque décroissant
          </p>
          <div className="overflow-hidden rounded-lg border border-stone-200 bg-white">
            {items.map((r) => {
              const risk = riskBadge(r.spam_score);
              return (
                <Link
                  key={r.id}
                  href={`/admin/reviews/${r.id}`}
                  className="flex items-start gap-3 border-b border-stone-100 px-4 py-3 last:border-0 hover:bg-stone-50"
                >
                  <span
                    className={`shrink-0 rounded px-2 py-0.5 text-xs font-medium ${risk.className}`}
                    title="Score de spam"
                  >
                    {risk.label}
                  </span>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-stone-900">
                      <span className="font-medium">{r.author_name}</span>
                      {r.is_verified && (
                        <span className="ml-1.5 text-xs text-green-700" title="Avis vérifié">
                          ✓ vérifié
                        </span>
                      )}
                      <span className="text-stone-400">
                        {" · "}
                        {r.product_title ?? "Agence"}
                      </span>
                    </p>
                    <p className="truncate text-sm text-stone-500">
                      {r.title ? `${r.title} — ` : ""}
                      {r.body}
                    </p>
                  </div>

                  <span className="shrink-0 text-sm text-stone-500">★ {r.rating}</span>

                  <span
                    className={`shrink-0 rounded-full px-2 py-1 text-xs font-medium ${STATUS_STYLES[r.status]}`}
                  >
                    {STATUS_LABELS[r.status]}
                  </span>
                </Link>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

export default function AdminReviewsPage() {
  return (
    <RequireAuth>
      <ReviewsContent />
    </RequireAuth>
  );
}