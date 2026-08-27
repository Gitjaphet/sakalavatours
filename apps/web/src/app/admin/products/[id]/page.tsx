// apps/web/src/app/admin/products/[id]/page.tsx
"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { RequireAuth } from "../../RequireAuth";
import { useAuth } from "../../AuthContext";
import { 
  getAdminProduct, 
  getAdminProductTranslations, 
  updateAdminProduct, 
  deleteAdminProduct, 
  AdminApiError
 } from "@/lib/api/admin-products";
import { useRouter } from "next/navigation";
import { productDetailToUpdate } from "@/lib/api/product-transform";
import { EnumSelect } from "@/components/admin/EnumSelect";
import { CoverPicker } from "@/components/admin/CoverPicker";
import { GalleryPicker } from "@/components/admin/GalleryPicker";
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
import type {
  ProductDetail,
  CoverMediaLike,
  ProductTranslationIn,
  ItineraryTranslationIn,
  InclusionLinkIn,
} from "@/types/api";

import { routing } from "@/i18n/routing";
import { TaxonomyPicker } from "@/components/admin/TaxonomyPicker";

type ItineraryStepState = {
  clientId: string;
  id: string | null;
  day_number: number;
  time_label: string | null;
  sort_order: number;
  is_optional: boolean;
  media_id: string | null;
  hotel_name: string | null;
  distance_km: number | null;
  translations: Record<string, ItineraryTranslationIn>;
};

type FaqState = {
  clientId: string;
  id: string | null;
  locale: string;
  question: string;
  answer: string;
  sort_order: number;
};


type PriceTierState = {
  clientId: string;
  id: string | null;
  label_code: string;
  price: string;
  min_pax: number | null;
  max_pax: number | null;
  is_private: boolean;
  sort_order: number;
};

type GalleryMediaItem = {
  id: string;
  url: string;
  alt_text: string | null;
};


function makeClientId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `tmp-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}


function ProductDetailContent({ id }: { id: string }) {
  const { accessToken, user } = useAuth();
  const router = useRouter();
  
  const [data, setData] = useState<ProductDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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

  const [translations, setTranslations] = useState<Record<string, ProductTranslationIn>>({});
  const [activeLocale, setActiveLocale] = useState<string>(routing.defaultLocale);
  const [itinerary, setItinerary] = useState<ItineraryStepState[]>([]);

  const [faqs, setFaqs] = useState<FaqState[]>([]);

  const [priceTiers, setPriceTiers] = useState<PriceTierState[]>([]);

  const [galleryMedia, setGalleryMedia] = useState<GalleryMediaItem[]>([]);

  const [highlightCodes, setHighlightCodes] = useState<string[]>([]);
  const [packingCodes, setPackingCodes] = useState<string[]>([]);
  const [inclusions, setInclusions] = useState<InclusionLinkIn[]>([]);
  const [departureMonths, setDepartureMonths] = useState<number[]>([]);
  const [relatedSlugs, setRelatedSlugs] = useState<string>("");

  const canDelete = user?.role === "owner" || user?.role === "admin";


  async function handleDelete() {
    if (!accessToken || !data) return;
    const confirmed = window.confirm(
      `Supprimer définitivement « ${data.title} » ? Cette action archive le produit et le retire du site.`,
    );
    if (!confirmed) return;

    setIsDeleting(true);
    try {
      await deleteAdminProduct(accessToken, id);
      router.push("/admin/dashboard");
    } catch (err) {
      const message =
        err instanceof AdminApiError ? err.message : "Erreur inattendue";
      setSaveMessage(`Erreur : ${message}`);
      setIsDeleting(false);
    }
  }

  useEffect(() => {
  if (!accessToken) return;

  let cancelled = false;
  setIsLoading(true);
  setError(null);

  Promise.all([
    getAdminProduct(accessToken, id),
    getAdminProductTranslations(accessToken, id),
  ])
    .then(([result, adminDetail]) => {
      if (cancelled) return;
      setData(result);
      setIsPublished(true);
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

      setGalleryMedia(
        result.gallery.map((m) => ({ id: m.id, url: m.url, alt_text: m.alt_text })),
      );

      const byLocale: Record<string, ProductTranslationIn> = {};
      for (const tr of adminDetail.translations) {
        byLocale[tr.locale] = tr;
      }
      setTranslations(byLocale);

      const steps: ItineraryStepState[] = adminDetail.itinerary
        .slice()
        .sort((a, b) => a.day_number - b.day_number || a.sort_order - b.sort_order)
        .map((item) => {
          const byLocaleItem: Record<string, ItineraryTranslationIn> = {};
          for (const tr of item.translations) {
            byLocaleItem[tr.locale] = tr;
          }
          return {
            clientId: makeClientId(),
            id: item.id,
            day_number: item.day_number,
            time_label: item.time_label,
            sort_order: item.sort_order,
            is_optional: item.is_optional,
            media_id: item.media_id,
            hotel_name: item.hotel_name,
            distance_km: item.distance_km,
            translations: byLocaleItem,
          };
        });
      setItinerary(steps);

        const faqStates: FaqState[] = adminDetail.faqs.map((f) => ({
        clientId: makeClientId(),
        id: f.id,
        locale: f.locale,
        question: f.question,
        answer: f.answer,
        sort_order: f.sort_order ?? 0,
      }));
      setFaqs(faqStates);

        const tierStates: PriceTierState[] = adminDetail.price_tiers.map((t) => ({
        clientId: makeClientId(),
        id: t.id,
        label_code: t.label_code,
        price: t.price,
        min_pax: t.min_pax ?? null,
        max_pax: t.max_pax ?? null,
        is_private: t.is_private ?? false,
        sort_order: t.sort_order ?? 0,
      }));
      setPriceTiers(tierStates);

      setHighlightCodes(adminDetail.highlight_codes);
      setPackingCodes(adminDetail.packing_codes);
      setInclusions(adminDetail.inclusions);
      setDepartureMonths(adminDetail.departure_months);
      setRelatedSlugs(result.related_slugs.join(", "));

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
        translations: Object.values(translations),
        itinerary: itinerary.map((step) => ({
          day_number: step.day_number,
          time_label: step.time_label,
          sort_order: step.sort_order,
          is_optional: step.is_optional,
          media_id: step.media_id,
          hotel_name: step.hotel_name,
          distance_km: step.distance_km,
          translations: Object.values(step.translations),
        })),
        faqs: faqs.map((f) => ({
          locale: f.locale,
          question: f.question,
          answer: f.answer,
          sort_order: f.sort_order,
        })),
        price_tiers: priceTiers.map((t) => ({
          label_code: t.label_code,
          price: t.price,
          min_pax: t.min_pax,
          max_pax: t.max_pax,
          is_private: t.is_private,
          sort_order: t.sort_order,
        })),
        gallery_media_ids: galleryMedia.map((m) => m.id),
        highlight_codes: highlightCodes,
        packing_codes: packingCodes,
        inclusions,
        departure_months: departureMonths,
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

            <GalleryPicker items={galleryMedia} onChange={setGalleryMedia} />


            {/* --- Traductions par langue --- */}
            <div className="border-t border-stone-200 pt-4">
              <h3 className="mb-2 text-sm font-medium">Contenu traduit</h3>

              <div className="mb-3 flex gap-1 border-b border-stone-200">
                {routing.locales.map((loc) => {
                  const hasContent = Boolean(translations[loc]);
                  return (
                    <button
                      key={loc}
                      type="button"
                      onClick={() => setActiveLocale(loc)}
                      className={`px-3 py-1.5 text-sm border-b-2 ${
                        activeLocale === loc
                          ? "border-stone-900 font-medium"
                          : "border-transparent text-stone-500 hover:text-stone-800"
                      }`}
                    >
                      {loc.toUpperCase()}
                      {hasContent && <span className="ml-1 text-green-600">●</span>}
                    </button>
                  );
                })}
              </div>

              {translations[activeLocale] ? (
                <div className="space-y-3">
                  <label className="block text-sm">
                    Titre
                    <input
                      type="text"
                      value={translations[activeLocale].title}
                      onChange={(e) =>
                        setTranslations((prev) => ({
                          ...prev,
                          [activeLocale]: { ...prev[activeLocale], title: e.target.value },
                        }))
                      }
                      className="mt-1 block w-full rounded border border-stone-300 p-2"
                    />
                  </label>

                  <label className="block text-sm">
                    Sous-titre
                    <input
                      type="text"
                      value={translations[activeLocale].subtitle ?? ""}
                      onChange={(e) =>
                        setTranslations((prev) => ({
                          ...prev,
                          [activeLocale]: { ...prev[activeLocale], subtitle: e.target.value },
                        }))
                      }
                      className="mt-1 block w-full rounded border border-stone-300 p-2"
                    />
                  </label>

                  <label className="block text-sm">
                    Résumé
                    <textarea
                      value={translations[activeLocale].summary}
                      onChange={(e) =>
                        setTranslations((prev) => ({
                          ...prev,
                          [activeLocale]: { ...prev[activeLocale], summary: e.target.value },
                        }))
                      }
                      rows={3}
                      className="mt-1 block w-full rounded border border-stone-300 p-2"
                    />
                  </label>

                  <label className="block text-sm">
                    Description
                    <textarea
                      value={translations[activeLocale].description ?? ""}
                      onChange={(e) =>
                        setTranslations((prev) => ({
                          ...prev,
                          [activeLocale]: { ...prev[activeLocale], description: e.target.value },
                        }))
                      }
                      rows={6}
                      className="mt-1 block w-full rounded border border-stone-300 p-2"
                    />
                  </label>

                  <button
                    type="button"
                    onClick={() => {
                      const confirmed = window.confirm(
                        `Retirer la traduction ${activeLocale.toUpperCase()} ? Elle sera supprimée à l'enregistrement.`,
                      );
                      if (!confirmed) return;
                      setTranslations((prev) => {
                        const next = { ...prev };
                        delete next[activeLocale];
                        return next;
                      });
                    }}
                    className="text-sm text-red-600 hover:underline"
                  >
                    Retirer cette traduction
                  </button>
                </div>
              ) : (
                <div className="rounded border border-dashed border-stone-300 p-4 text-center">
                  <p className="mb-2 text-sm text-stone-500">
                    Aucune traduction {activeLocale.toUpperCase()}.
                  </p>
                  <button
                    type="button"
                    onClick={() =>
                      setTranslations((prev) => ({
                        ...prev,
                        [activeLocale]: { locale: activeLocale, title: "", summary: "" },
                      }))
                    }
                    className="rounded bg-stone-900 px-3 py-1.5 text-sm text-white"
                  >
                    Ajouter la traduction {activeLocale.toUpperCase()}
                  </button>
                </div>
              )}
            </div>

            {/* --- Itinéraire --- */}
            <div className="border-t border-stone-200 pt-4">
              <h3 className="mb-2 text-sm font-medium">
                Itinéraire ({itinerary.length} étape{itinerary.length > 1 ? "s" : ""})
              </h3>

              <div className="space-y-2">
                {itinerary.map((step) => {
                  const tr = step.translations[activeLocale];

                  function updateStep(patch: Partial<ItineraryStepState>) {
                    setItinerary((prev) =>
                      prev.map((s) => (s.clientId === step.clientId ? { ...s, ...patch } : s)),
                    );
                  }

                  function updateStepTranslation(patch: Partial<ItineraryTranslationIn>) {
                    setItinerary((prev) =>
                      prev.map((s) =>
                        s.clientId === step.clientId
                          ? {
                              ...s,
                              translations: {
                                ...s.translations,
                                [activeLocale]: { ...s.translations[activeLocale], ...patch },
                              },
                            }
                          : s,
                      ),
                    );
                  }

                  return (
                    <details
                      key={step.clientId}
                      className="rounded border border-stone-200 p-3 text-sm"
                    >
                      <summary className="flex cursor-pointer items-center justify-between">
                        <span className="font-medium">
                          Jour {step.day_number}
                          {step.time_label ? ` · ${step.time_label}` : ""}
                          {" · "}
                          {tr ? tr.title : `pas de traduction ${activeLocale.toUpperCase()}`}
                        </span>
                        {step.is_optional && (
                          <span className="text-xs text-stone-500">optionnel</span>
                        )}
                      </summary>

                      <div className="mt-3 space-y-3">
                        <div className="flex gap-3">
                          <label className="block text-sm">
                            Jour
                            <input
                              type="number"
                              min={1}
                              value={step.day_number}
                              onChange={(e) => updateStep({ day_number: Number(e.target.value) })}
                              className="mt-1 block w-20 rounded border border-stone-300 p-2"
                            />
                          </label>
                          <label className="block text-sm">
                            Heure
                            <input
                              type="text"
                              value={step.time_label ?? ""}
                              onChange={(e) => updateStep({ time_label: e.target.value || null })}
                              placeholder="07h30"
                              className="mt-1 block w-24 rounded border border-stone-300 p-2"
                            />
                          </label>
                        </div>

                        <label className="flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={step.is_optional}
                            onChange={(e) => updateStep({ is_optional: e.target.checked })}
                          />
                          Étape optionnelle
                        </label>

                        <label className="block text-sm">
                          Nom de l&apos;hôtel
                          <input
                            type="text"
                            value={step.hotel_name ?? ""}
                            onChange={(e) => updateStep({ hotel_name: e.target.value || null })}
                            className="mt-1 block w-full rounded border border-stone-300 p-2"
                          />
                        </label>

                        <label className="block text-sm">
                          Distance (km)
                          <input
                            type="number"
                            min={0}
                            value={step.distance_km ?? ""}
                            onChange={(e) =>
                              updateStep({
                                distance_km: e.target.value === "" ? null : Number(e.target.value),
                              })
                            }
                            className="mt-1 block w-24 rounded border border-stone-300 p-2"
                          />
                        </label>

                        {tr ? (
                          <div className="space-y-2 border-t border-stone-100 pt-2">
                            <label className="block text-sm">
                              Titre ({activeLocale.toUpperCase()})
                              <input
                                type="text"
                                value={tr.title}
                                onChange={(e) => updateStepTranslation({ title: e.target.value })}
                                className="mt-1 block w-full rounded border border-stone-300 p-2"
                              />
                            </label>
                            <label className="block text-sm">
                              Description
                              <textarea
                                value={tr.description ?? ""}
                                onChange={(e) =>
                                  updateStepTranslation({ description: e.target.value })
                                }
                                rows={3}
                                className="mt-1 block w-full rounded border border-stone-300 p-2"
                              />
                            </label>
                            <button
                              type="button"
                              onClick={() => {
                                const confirmed = window.confirm(
                                  `Retirer la traduction ${activeLocale.toUpperCase()} de cette étape ?`,
                                );
                                if (!confirmed) return;
                                setItinerary((prev) =>
                                  prev.map((s) => {
                                    if (s.clientId !== step.clientId) return s;
                                    const nextTr = { ...s.translations };
                                    delete nextTr[activeLocale];
                                    return { ...s, translations: nextTr };
                                  }),
                                );
                              }}
                              className="text-sm text-red-600 hover:underline"
                            >
                              Retirer cette traduction
                            </button>
                          </div>
                        ) : (
                          <div className="rounded border border-dashed border-stone-300 p-3 text-center">
                            <p className="mb-2 text-xs text-stone-500">
                              Aucune traduction {activeLocale.toUpperCase()} pour cette étape.
                            </p>
                            <button
                              type="button"
                              onClick={() =>
                                setItinerary((prev) =>
                                  prev.map((s) =>
                                    s.clientId === step.clientId
                                      ? {
                                          ...s,
                                          translations: {
                                            ...s.translations,
                                            [activeLocale]: { locale: activeLocale, title: "" },
                                          },
                                        }
                                      : s,
                                  ),
                                )
                              }
                              className="rounded bg-stone-900 px-3 py-1.5 text-sm text-white"
                            >
                              Ajouter la traduction {activeLocale.toUpperCase()}
                            </button>
                          </div>
                        )}

                        <button
                          type="button"
                          onClick={() => {
                            const confirmed = window.confirm(
                              `Supprimer définitivement cette étape (Jour ${step.day_number}) ?`,
                            );
                            if (!confirmed) return;
                            setItinerary((prev) => prev.filter((s) => s.clientId !== step.clientId));
                          }}
                          className="text-sm text-red-600 hover:underline"
                        >
                          Supprimer cette étape
                        </button>
                      </div>
                    </details>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={() =>
                  setItinerary((prev) => [
                    ...prev,
                    {
                      clientId: makeClientId(),
                      id: null,
                      day_number: prev.length > 0 ? prev[prev.length - 1].day_number : 1,
                      time_label: null,
                      sort_order: prev.length,
                      is_optional: false,
                      media_id: null,
                      hotel_name: null,
                      distance_km: null,
                      translations: {},
                    },
                  ])
                }
                className="mt-3 rounded border border-stone-300 px-3 py-1.5 text-sm hover:bg-stone-50"
              >
                Ajouter une étape
              </button>

            </div>

            {/* --- FAQ --- */}
            <div className="border-t border-stone-200 pt-4">
              <h3 className="mb-2 text-sm font-medium">
                FAQ ({faqs.filter((f) => f.locale === activeLocale).length} question
                {faqs.filter((f) => f.locale === activeLocale).length > 1 ? "s" : ""}{" "}
                en {activeLocale.toUpperCase()})
              </h3>

              <div className="space-y-2">
                {faqs
                  .filter((f) => f.locale === activeLocale)
                  .map((faq) => (
                    <details
                      key={faq.clientId}
                      className="rounded border border-stone-200 p-3 text-sm"
                    >
                      <summary className="cursor-pointer font-medium">
                        {faq.question || "(question vide)"}
                      </summary>

                      <div className="mt-3 space-y-2">
                        <label className="block text-sm">
                          Question
                          <input
                            type="text"
                            value={faq.question}
                            onChange={(e) =>
                              setFaqs((prev) =>
                                prev.map((f) =>
                                  f.clientId === faq.clientId
                                    ? { ...f, question: e.target.value }
                                    : f,
                                ),
                              )
                            }
                            className="mt-1 block w-full rounded border border-stone-300 p-2"
                          />
                        </label>

                        <label className="block text-sm">
                          Réponse
                          <textarea
                            value={faq.answer}
                            onChange={(e) =>
                              setFaqs((prev) =>
                                prev.map((f) =>
                                  f.clientId === faq.clientId
                                    ? { ...f, answer: e.target.value }
                                    : f,
                                ),
                              )
                            }
                            rows={3}
                            className="mt-1 block w-full rounded border border-stone-300 p-2"
                          />
                        </label>

                        <button
                          type="button"
                          onClick={() => {
                            const confirmed = window.confirm("Supprimer cette question ?");
                            if (!confirmed) return;
                            setFaqs((prev) => prev.filter((f) => f.clientId !== faq.clientId));
                          }}
                          className="text-sm text-red-600 hover:underline"
                        >
                          Supprimer cette question
                        </button>
                      </div>
                    </details>
                  ))}
              </div>

              <button
                type="button"
                onClick={() =>
                  setFaqs((prev) => [
                    ...prev,
                    {
                      clientId: makeClientId(),
                      id: null,
                      locale: activeLocale,
                      question: "",
                      answer: "",
                      sort_order: prev.filter((f) => f.locale === activeLocale).length,
                    },
                  ])
                }
                className="mt-3 rounded border border-stone-300 px-3 py-1.5 text-sm hover:bg-stone-50"
              >
                Ajouter une question ({activeLocale.toUpperCase()})
              </button>
            </div>

            {/* --- Tarifs --- */}
            <div className="border-t border-stone-200 pt-4">
              <h3 className="mb-2 text-sm font-medium">
                Tarifs ({priceTiers.length} palier{priceTiers.length > 1 ? "s" : ""})
              </h3>

              <div className="space-y-2">
                {priceTiers.map((tier) => (
                  <div
                    key={tier.clientId}
                    className="rounded border border-stone-200 p-3 text-sm space-y-2"
                  >
                    <label className="block text-sm">
                      Code d&apos;étiquette
                      <input
                        type="text"
                        value={tier.label_code}
                        onChange={(e) =>
                          setPriceTiers((prev) =>
                            prev.map((t) =>
                              t.clientId === tier.clientId
                                ? { ...t, label_code: e.target.value }
                                : t,
                            ),
                          )
                        }
                        placeholder="adult, child, private…"
                        className="mt-1 block w-full rounded border border-stone-300 p-2"
                      />
                    </label>

                    <label className="block text-sm">
                      Prix
                      <input
                        type="text"
                        value={tier.price}
                        onChange={(e) =>
                          setPriceTiers((prev) =>
                            prev.map((t) =>
                              t.clientId === tier.clientId ? { ...t, price: e.target.value } : t,
                            ),
                          )
                        }
                        className="mt-1 block w-full rounded border border-stone-300 p-2"
                      />
                    </label>

                    <div className="flex gap-3">
                      <label className="block text-sm">
                        Pax min
                        <input
                          type="number"
                          min={1}
                          value={tier.min_pax ?? ""}
                          onChange={(e) =>
                            setPriceTiers((prev) =>
                              prev.map((t) =>
                                t.clientId === tier.clientId
                                  ? {
                                      ...t,
                                      min_pax: e.target.value === "" ? null : Number(e.target.value),
                                    }
                                  : t,
                              ),
                            )
                          }
                          className="mt-1 block w-24 rounded border border-stone-300 p-2"
                        />
                      </label>
                      <label className="block text-sm">
                        Pax max
                        <input
                          type="number"
                          min={1}
                          value={tier.max_pax ?? ""}
                          onChange={(e) =>
                            setPriceTiers((prev) =>
                              prev.map((t) =>
                                t.clientId === tier.clientId
                                  ? {
                                      ...t,
                                      max_pax: e.target.value === "" ? null : Number(e.target.value),
                                    }
                                  : t,
                              ),
                            )
                          }
                          className="mt-1 block w-24 rounded border border-stone-300 p-2"
                        />
                      </label>
                    </div>

                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={tier.is_private}
                        onChange={(e) =>
                          setPriceTiers((prev) =>
                            prev.map((t) =>
                              t.clientId === tier.clientId
                                ? { ...t, is_private: e.target.checked }
                                : t,
                            ),
                          )
                        }
                      />
                      Tarif privatif
                    </label>

                    <button
                      type="button"
                      onClick={() => {
                        const confirmed = window.confirm("Supprimer ce palier tarifaire ?");
                        if (!confirmed) return;
                        setPriceTiers((prev) => prev.filter((t) => t.clientId !== tier.clientId));
                      }}
                      className="text-sm text-red-600 hover:underline"
                    >
                      Supprimer ce palier
                    </button>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={() =>
                  setPriceTiers((prev) => [
                    ...prev,
                    {
                      clientId: makeClientId(),
                      id: null,
                      label_code: "",
                      price: "0",
                      min_pax: null,
                      max_pax: null,
                      is_private: false,
                      sort_order: prev.length,
                    },
                  ])
                }
                className="mt-3 rounded border border-stone-300 px-3 py-1.5 text-sm hover:bg-stone-50"
              >
                Ajouter un palier
              </button>
            </div>

            {/* --- Taxonomies et divers --- */}
            <div className="border-t border-stone-200 pt-4 space-y-4">
              <h3 className="text-sm font-medium">Points forts, prestations et divers</h3>

              <TaxonomyPicker
                type="highlights"
                label="Points forts"
                selected={highlightCodes}
                onChange={setHighlightCodes}
              />

              <TaxonomyPicker
                type="packing-items"
                label="Affaires à prévoir"
                selected={packingCodes}
                onChange={setPackingCodes}
              />

              <div>
                  <TaxonomyPicker
                    type="inclusions"
                    label={`Prestations (${inclusions.length})`}
                    selected={inclusions.map((i) => i.code)}
                    onChange={(codes) =>
                      setInclusions(
                        codes.map((code, idx) => {
                          const existing = inclusions.find((i) => i.code === code);
                          return {
                            code,
                            is_included: existing?.is_included ?? true,
                            sort_order: idx,
                          };
                        }),
                      )
                    }
                    includedMap={Object.fromEntries(
                      inclusions.map((i) => [i.code, i.is_included ?? true]),
                    )}
                    onIncludedChange={(code, isIncluded) =>
                      setInclusions((prev) =>
                        prev.map((i) => (i.code === code ? { ...i, is_included: isIncluded } : i)),
                      )
                    }
                  />

                
              </div>

              <div>
                <p className="mb-1 text-sm">Mois recommandés</p>
                <div className="flex flex-wrap gap-2">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((m) => (
                    <label key={m} className="flex items-center gap-1 text-xs">
                      <input
                        type="checkbox"
                        checked={departureMonths.includes(m)}
                        onChange={(e) =>
                          setDepartureMonths((prev) =>
                            e.target.checked
                              ? [...prev, m].sort((a, b) => a - b)
                              : prev.filter((x) => x !== m),
                          )
                        }
                      />
                      {m}
                    </label>
                  ))}
                </div>
              </div>

              <label className="block text-sm">
                Produits liés (lecture seule)
                <input
                  type="text"
                  value={relatedSlugs}
                  readOnly
                  className="mt-1 block w-full rounded border border-stone-200 bg-stone-50 p-2 text-stone-500"
                />
              </label>
            </div>

            <button
              onClick={handleSave}
              disabled={isSaving}
              className="rounded bg-stone-900 px-4 py-2 text-sm text-white disabled:opacity-50"
            >
              {isSaving ? "Enregistrement…" : "Enregistrer"}
            </button>

            {saveMessage && <p className="text-sm">{saveMessage}</p>}

            {canDelete && (
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="mt-2 rounded border border-red-300 px-4 py-2 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
              >
                {isDeleting ? "Suppression…" : "Supprimer ce produit"}
              </button>
            )}
            
          </div>

         
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