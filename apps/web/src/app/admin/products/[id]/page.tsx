// apps/web/src/app/admin/products/[id]/page.tsx
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
import { EnumSelect } from "@/components/admin/EnumSelect";
import { CoverPicker } from "@/components/admin/CoverPicker";
import {
  PRODUCT_FORMAT_OPTIONS,
  DIFFICULTY_OPTIONS,
  TRANSPORT_OPTIONS,
} from "@/lib/constants/product-enums";
import type {
  ProductFormat,
  DifficultyLevel,
  TransportMode,
} from "@/lib/constants/product-enums";
import type { ProductDetail, CoverMediaLike } from "@/types/api";


function ProductDetailContent({ id }: { id: string }) {
  const { accessToken } = useAuth();
  const [data, setData] = useState<ProductDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  // Champs du formulaire, dérivés de `data` une fois chargé
  const [isPublished, setIsPublished] = useState(false);
  const [isFeatured, setIsFeatured] = useState(false);
  const [priceFrom, setPriceFrom] = useState("");
  const [slug, setSlug] = useState("");
  const [productFormat, setProductFormat] = useState<ProductFormat>("full_day");
  const [difficulty, setDifficulty] = useState<DifficultyLevel>("easy");
  const [transport, setTransport] = useState<TransportMode | "">("");
  const [groupMin, setGroupMin] = useState("2");
  const [groupMax, setGroupMax] = useState("12");
  const [hotelPickup, setHotelPickup] = useState(true);
  const [coverMedia, setCoverMedia] = useState<CoverMediaLike | null>(null);

  useEffect(() => {
    if (!accessToken) return;

    let cancelled = false;
    setIsLoading(true);
    setError(null);

    getAdminProduct(accessToken, id)
      .then((result) => {
        if (cancelled) return;
        setData(result);
        setIsPublished(true); // le GET ne renvoie un ProductDetail que si le produit est publié
        setIsFeatured(result.is_featured);
        setPriceFrom(result.price_from);
        setSlug(result.slug);
        setProductFormat(result.product_format);
        setDifficulty(result.difficulty);
        setTransport(result.transport ?? "");
        setGroupMin(String(result.group_min));
        setGroupMax(String(result.group_max));
        setHotelPickup(result.hotel_pickup);
        setCoverMedia(result.cover);
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
        is_published: isPublished,
        is_featured: isFeatured,
        price_from: priceFrom,
        slug,
        product_format: productFormat,
        difficulty,
        transport: transport === "" ? null : transport,
        group_min: Number(groupMin),
        group_max: Number(groupMax),
        hotel_pickup: hotelPickup,
        cover_media_id: coverMedia?.id ?? null,
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

            <label className="block text-sm">
              Slug
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                className="mt-1 block w-full rounded border border-stone-300 p-2"
              />
            </label>

            <EnumSelect
              label="Format"
              value={productFormat}
              onChange={setProductFormat}
              options={PRODUCT_FORMAT_OPTIONS}
            />

            <EnumSelect
              label="Difficulté"
              value={difficulty}
              onChange={setDifficulty}
              options={DIFFICULTY_OPTIONS}
            />

            <label className="block text-sm">
              Transport
              <select
                value={transport}
                onChange={(e) => setTransport(e.target.value as TransportMode | "")}
                className="mt-1 block w-full rounded border border-stone-300 p-2"
              >
                <option value="">— Aucun —</option>
                {TRANSPORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </label>

            <div className="flex gap-4">
              <label className="block text-sm">
                Groupe min
                <input
                  type="number"
                  min={1}
                  value={groupMin}
                  onChange={(e) => setGroupMin(e.target.value)}
                  className="mt-1 block w-full rounded border border-stone-300 p-2"
                />
              </label>
              <label className="block text-sm">
                Groupe max
                <input
                  type="number"
                  min={1}
                  value={groupMax}
                  onChange={(e) => setGroupMax(e.target.value)}
                  className="mt-1 block w-full rounded border border-stone-300 p-2"
                />
              </label>
            </div>

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={hotelPickup}
                onChange={(e) => setHotelPickup(e.target.checked)}
              />
              Transfert hôtel inclus
            </label>

            {coverMedia && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={coverMedia.url}
                alt={coverMedia.alt_text ?? ""}
                className="h-24 w-full rounded object-cover"
              />
            )}

            <CoverPicker coverMediaId={coverMedia?.id ?? null} onSelect={setCoverMedia} />

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