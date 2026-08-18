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

export function ProductList() {
  const { accessToken } = useAuth();
  const router = useRouter();
  const [items, setItems] = useState<ProductAdminListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);

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

  if (isLoading) return <p className="text-stone-500">Chargement…</p>;
  if (error) return <p className="text-red-600">Erreur : {error}</p>;

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-stone-500">{total} produit(s)</p>
        <button
          onClick={() => setShowModal(true)}
          className="rounded bg-stone-900 px-4 py-2 text-sm text-white hover:bg-stone-800"
        >
          Nouveau produit
        </button>
      </div>

      {items.length === 0 ? (
        <p className="text-stone-500">Aucun produit.</p>
      ) : (
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-stone-200 text-stone-500">
              <th className="py-2">Titre</th>
              <th className="py-2">Type</th>
              <th className="py-2">Statut</th>
              <th className="py-2">Publié</th>
              <th className="py-2">Prix</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr
                key={item.id}
                className="cursor-pointer border-b border-stone-100 hover:bg-stone-50"
              >
                <td className="py-2">
                  <Link href={`/admin/products/${item.id}`} className="block">
                    {item.title}
                  </Link>
                </td>
                <td className="py-2">{item.product_type}</td>
                <td className="py-2">{item.status}</td>
                <td className="py-2">{item.is_published ? "Oui" : "Non"}</td>
                <td className="py-2">
                  {item.price_from} {item.currency}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {showModal && (
        <NewProductModal
          onClose={() => setShowModal(false)}
          onCreated={handleCreated}
        />
      )}
    </div>
  );
}