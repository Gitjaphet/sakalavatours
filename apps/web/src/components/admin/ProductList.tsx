// apps/web/src/components/admin/ProductList.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/admin/AuthContext";
import {
  listAdminProducts,
  createAdminProduct,
  AdminApiError,
} from "@/lib/api/admin-products";
import Link from "next/link";
import type { ProductAdminListItem } from "@/types/api";
import { PRODUCT_FORMAT_OPTIONS } from "@/lib/constants/product-enums";

function NewProductModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (id: string) => void;
}) {
  const { accessToken } = useAuth();
  const [productType, setProductType] = useState<"circuit" | "excursion">(
    "excursion",
  );
  const [productFormat, setProductFormat] = useState(
    PRODUCT_FORMAT_OPTIONS[0].value,
  );
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [priceFrom, setPriceFrom] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const product = await createAdminProduct(accessToken, {
        product_type: productType,
        product_format: productFormat,
        price_from: priceFrom,
        translations: [{ locale: "fr", title, summary }],
      });
      onCreated(product.id);
    } catch (err) {
      const message =
        err instanceof AdminApiError ? err.message : "Erreur inattendue";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
        <h2 className="mb-4 text-lg font-semibold">Nouveau produit</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm text-stone-600">Type</label>
            <select
              value={productType}
              onChange={(e) =>
                setProductType(e.target.value as "circuit" | "excursion")
              }
              className="w-full rounded border border-stone-300 px-3 py-2 text-sm"
            >
              <option value="excursion">Excursion</option>
              <option value="circuit">Circuit</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm text-stone-600">Format</label>
            <select
              value={productFormat}
              onChange={(e) => setProductFormat(e.target.value as typeof productFormat)}
              className="w-full rounded border border-stone-300 px-3 py-2 text-sm"
            >
              {PRODUCT_FORMAT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm text-stone-600">
              Titre (français)
            </label>
            <input
              type="text"
              required
              minLength={1}
              maxLength={200}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded border border-stone-300 px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm text-stone-600">
              Résumé (français)
            </label>
            <textarea
              required
              minLength={1}
              maxLength={600}
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              rows={3}
              className="w-full rounded border border-stone-300 px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm text-stone-600">
              Prix de départ (EUR)
            </label>
            <input
              type="number"
              required
              min="0"
              step="0.01"
              value={priceFrom}
              onChange={(e) => setPriceFrom(e.target.value)}
              className="w-full rounded border border-stone-300 px-3 py-2 text-sm"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded px-4 py-2 text-sm text-stone-600 hover:bg-stone-100"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded bg-stone-900 px-4 py-2 text-sm text-white hover:bg-stone-800 disabled:opacity-50"
            >
              {isSubmitting ? "Création…" : "Créer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

type TabKey = "all" | "excursion" | "circuit";

const TABS: { key: TabKey; label: string }[] = [
  { key: "all", label: "Toutes" },
  { key: "excursion", label: "Excursions" },
  { key: "circuit", label: "Circuits" },
];

const STATUS_STYLES: Record<string, string> = {
  published: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  draft: "bg-amber-50 text-amber-700 ring-amber-600/20",
  archived: "bg-stone-100 text-stone-600 ring-stone-500/20",
};

function StatusBadge({ status }: { status: string }) {
  const style = STATUS_STYLES[status] ?? STATUS_STYLES.archived;
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${style}`}
    >
      {status}
    </span>
  );
}

function formatPrice(amount: string, currency: string): string {
  const value = Number(amount);
  if (Number.isNaN(value)) return `${amount} ${currency}`;
  try {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(value);
  } catch {
    return `${Math.round(value)} ${currency}`;
  }
}

export function ProductList() {
  const { accessToken } = useAuth();
  const router = useRouter();
  const [items, setItems] = useState<ProductAdminListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [tab, setTab] = useState<TabKey>("all");
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!accessToken) return;

    let cancelled = false;
    setIsLoading(true);
    setError(null);

    listAdminProducts(accessToken, { limit: 50, offset: 0 })
      .then((data) => {
        if (cancelled) return;
        setItems(data.items);
        setTotal(data.total);
      })
      .catch((err) => {
        if (cancelled) return;
        const message =
          err instanceof AdminApiError ? err.message : "Erreur inattendue";
        setError(message);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [accessToken]);

  const handleCreated = (id: string) => {
    setShowModal(false);
    router.push(`/admin/products/${id}`);
  };

  // Filtrage côté client : la liste tient en une page (50 max), inutile
  // de refaire un aller-retour serveur à chaque changement d'onglet.
  const visible = items.filter((item) => {
    if (tab !== "all" && item.product_type !== tab) return false;
    if (query.trim() && !item.title.toLowerCase().includes(query.trim().toLowerCase()))
      return false;
    return true;
  });

  const counts = {
    all: items.length,
    excursion: items.filter((i) => i.product_type === "excursion").length,
    circuit: items.filter((i) => i.product_type === "circuit").length,
  };

  if (isLoading)
    return (
      <div className="space-y-3">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-14 animate-pulse rounded-lg bg-stone-100" />
        ))}
      </div>
    );
  if (error)
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        Erreur : {error}
      </div>
    );

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1 rounded-lg bg-stone-100 p-1">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                tab === t.key
                  ? "bg-white text-stone-900 shadow-sm"
                  : "text-stone-600 hover:text-stone-900"
              }`}
            >
              {t.label}
              <span className="ml-1.5 text-xs text-stone-400">{counts[t.key]}</span>
            </button>
          ))}
        </div>

        <div className="flex flex-1 items-center justify-end gap-3">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher…"
            className="w-full max-w-xs rounded-lg border border-stone-300 px-3 py-2 text-sm focus:border-stone-400 focus:outline-none"
          />
          <button
            onClick={() => setShowModal(true)}
            className="shrink-0 rounded-lg bg-[#1a6b2f] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#155a27]"
          >
            Nouvelle activité
          </button>
        </div>
      </div>

      {visible.length === 0 ? (
        <div className="rounded-lg border border-dashed border-stone-300 p-10 text-center">
          <p className="text-sm text-stone-500">
            {query.trim() || tab !== "all"
              ? "Aucune activité ne correspond à ce filtre."
              : "Aucune activité pour le moment."}
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-stone-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-stone-50 text-xs uppercase tracking-wide text-stone-500">
              <tr>
                <th className="px-4 py-3 font-medium">Titre</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Statut</th>
                <th className="px-4 py-3 font-medium">Publié</th>
                <th className="px-4 py-3 text-right font-medium">Prix</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {visible.map((item) => (
                <tr key={item.id} className="transition-colors hover:bg-stone-50">
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/products/${item.id}`}
                      className="font-medium text-stone-900 hover:text-[#1a6b2f]"
                    >
                      {item.title}
                    </Link>
                  </td>
                  <td className="px-4 py-3 capitalize text-stone-600">
                    {item.product_type}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={item.status} />
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={
                        item.is_published ? "text-emerald-600" : "text-stone-400"
                      }
                    >
                      {item.is_published ? "Oui" : "Non"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-medium tabular-nums text-stone-900">
                    {formatPrice(item.price_from, item.currency)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="mt-3 text-xs text-stone-400">
        {visible.length} affichée(s) sur {total} au total
      </p>

      {showModal && (
        <NewProductModal
          onClose={() => setShowModal(false)}
          onCreated={handleCreated}
        />
      )}
    </div>
  );
}
