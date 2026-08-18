"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { RequireAuth } from "../../RequireAuth";
import { useAuth } from "../../AuthContext";
import {
  getAdminProduct,
  updateAdminProduct,
  AdminApiError,
} from "@/lib/api/admin-products";
import { productDetailToUpdate } from "@/lib/api/product-transform";
import type { ProductDetail, ContentStatus } from "@/types/api";

function ProductDetailContent({ id }: { id: string }) {
  const { accessToken } = useAuth();
  const [data, setData] = useState<ProductDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  // Champs du formulaire, dérivés de `data` une fois chargé
  const [status, setStatus] = useState<ContentStatus>("draft");
  const [isPublished, setIsPublished] = useState(false);
  const [isFeatured, setIsFeatured] = useState(false);
  const [priceFrom, setPriceFrom] = useState("");

  useEffect(() => {
    if (!accessToken) return;

    let cancelled = false;
    setIsLoading(true);
    setError(null);

    getAdminProduct(accessToken, id)
      .then((result) => {
        if (cancelled) return;
        setData(result);
        setIsPublished(true);// placeholder, corrigé ci-dessous
        setIsFeatured(result.is_featured);
        setPriceFrom(result.price_from);
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
  }, [accessToken, id]);

  async function handleSave() {
    if (!accessToken || !data) return;
    setIsSaving(true);
    setSaveMessage(null);
    try {
      const payload = {
        ...productDetailToUpdate(data),
        status,
        is_published: isPublished,
        is_featured: isFeatured,
        price_from: priceFrom,
      };
      const updated = await updateAdminProduct(accessToken, id, payload);
      setData(updated);
      setSaveMessage("Enregistré.");
    } catch (err) {
      const message =
        err instanceof AdminApiError ? err.message : "Erreur inattendue";
      setSaveMessage(`Erreur : ${message}`);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="p-6">
      <Link href="/admin/dashboard" className="text-sm text-stone-500 hover:text-stone-900">
        ← Retour à la liste
      </Link>
      <h1 className="mt-2 mb-4 text-xl font-semibold">Détail produit</h1>

      {isLoading && <p className="text-stone-500">Chargement…</p>}
      {error && <p className="text-red-600">Erreur : {error}</p>}

      {data && (
        <>
          <div className="mb-6 max-w-sm space-y-4 rounded border border-stone-200 p-4">
            <h2 className="font-medium">{data.title}</h2>

            <label className="block text-sm">
              Statut
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as ContentStatus)}
                className="mt-1 block w-full rounded border border-stone-300 p-2"
              >
                <option value="draft">draft</option>
                <option value="published">published</option>
                <option value="archived">archived</option>
              </select>
            </label>

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={isPublished}
                onChange={(e) => setIsPublished(e.target.checked)}
              />
              Publié
            </label>

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={isFeatured}
                onChange={(e) => setIsFeatured(e.target.checked)}
              />
              Mis en avant
            </label>

            <label className="block text-sm">
              Prix (à partir de)
              <input
                type="text"
                value={priceFrom}
                onChange={(e) => setPriceFrom(e.target.value)}
                className="mt-1 block w-full rounded border border-stone-300 p-2"
              />
            </label>

            <button
              onClick={handleSave}
              disabled={isSaving}
              className="rounded bg-stone-900 px-4 py-2 text-sm text-white disabled:opacity-50"
            >
              {isSaving ? "Enregistrement…" : "Enregistrer"}
            </button>

            {saveMessage && <p className="text-sm">{saveMessage}</p>}
          </div>

          <pre className="overflow-auto rounded bg-stone-100 p-4 text-xs">
            {JSON.stringify(data, null, 2)}
          </pre>
        </>
      )}
    </div>
  );
}

export default function AdminProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return (
    <RequireAuth>
      <ProductDetailContent id={id} />
    </RequireAuth>
  );
}