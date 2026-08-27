// apps/web/src/app/admin/taxonomies/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { RequireAuth } from "../RequireAuth";
import { useAuth } from "../AuthContext";
import { AdminApiError } from "@/lib/api/admin-products";
import {
  listTaxonomy,
  createTaxonomyItem,
  updateTaxonomyItem,
  deleteTaxonomyItem,
} from "@/lib/api/admin-taxonomies";
import { routing } from "@/i18n/routing";
import type { TaxonomyType, TaxonomyOut, TaxonomyTranslationIn } from "@/types/api";

const TYPE_LABELS: Record<TaxonomyType, string> = {
  highlights: "Points forts",
  inclusions: "Prestations",
  "packing-items": "Affaires à prévoir",
};

type DraftState = {
  code: string;
  icon: string;
  sort_order: number;
  translations: Record<string, TaxonomyTranslationIn>;
};

function emptyDraft(): DraftState {
  return { code: "", icon: "", sort_order: 0, translations: {} };
}

function TaxonomiesContent() {
  const { accessToken, user } = useAuth();
  const [activeType, setActiveType] = useState<TaxonomyType>("inclusions");
  const [items, setItems] = useState<TaxonomyOut[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<DraftState>(emptyDraft());

  const canDelete = user?.role === "owner" || user?.role === "admin";

  function reload() {
    if (!accessToken) return;
    setIsLoading(true);
    setError(null);
    listTaxonomy(accessToken, activeType)
      .then((data) => setItems(data.items))
      .catch((err) => {
        const msg = err instanceof AdminApiError ? err.message : "Erreur inattendue";
        setError(msg);
      })
      .finally(() => setIsLoading(false));
  }

  useEffect(() => {
    reload();
    setEditingId(null);
    setDraft(emptyDraft());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken, activeType]);

  function startEdit(item: TaxonomyOut) {
    const byLocale: Record<string, TaxonomyTranslationIn> = {};
    for (const tr of item.translations) {
      byLocale[tr.locale] = { locale: tr.locale, label: tr.label, detail: tr.detail };
    }
    setEditingId(item.id);
    setDraft({
      code: item.code,
      icon: item.icon ?? "",
      sort_order: item.sort_order,
      translations: byLocale,
    });
    setMessage(null);
  }

  function startCreate() {
    setEditingId(null);
    setDraft(emptyDraft());
    setMessage(null);
  }

  async function handleSave() {
    if (!accessToken) return;
    const translations = Object.values(draft.translations).filter(
      (t) => t.label.trim() !== "",
    );
    if (!draft.code.trim() || translations.length === 0) {
      setMessage("Le code et au moins un libellé sont obligatoires.");
      return;
    }

    setIsSaving(true);
    setMessage(null);
    try {
      const payload = {
        code: draft.code.trim(),
        icon: draft.icon.trim() || null,
        sort_order: draft.sort_order,
        translations,
      };
      if (editingId) {
        await updateTaxonomyItem(accessToken, activeType, editingId, payload);
        setMessage("Modifié.");
      } else {
        await createTaxonomyItem(accessToken, activeType, payload);
        setMessage("Créé.");
      }
      reload();
      startCreate();
    } catch (err) {
      const msg = err instanceof AdminApiError ? err.message : "Erreur inattendue";
      setMessage(`Erreur : ${msg}`);
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(item: TaxonomyOut) {
    if (!accessToken) return;
    const confirmed = window.confirm(
      `Supprimer « ${item.code} » ? Les produits qui l'utilisent cesseront de l'afficher.`,
    );
    if (!confirmed) return;

    try {
      await deleteTaxonomyItem(accessToken, activeType, item.id);
      setMessage("Supprimé.");
      reload();
      if (editingId === item.id) startCreate();
    } catch (err) {
      const msg = err instanceof AdminApiError ? err.message : "Erreur inattendue";
      setMessage(`Erreur : ${msg}`);
    }
  }

  return (
    <div className="p-6">
      <Link
        href="/admin/dashboard"
        className="text-sm text-stone-500 hover:text-stone-900"
      >
        ← Retour au tableau de bord
      </Link>
      <h1 className="mt-2 mb-4 text-xl font-semibold">Taxonomies</h1>

      <div className="mb-4 flex gap-1 border-b border-stone-200">
        {(Object.keys(TYPE_LABELS) as TaxonomyType[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setActiveType(t)}
            className={`px-3 py-1.5 text-sm border-b-2 ${
              activeType === t
                ? "border-stone-900 font-medium"
                : "border-transparent text-stone-500 hover:text-stone-800"
            }`}
          >
            {TYPE_LABELS[t]}
          </button>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_400px]">
        <div>
          {isLoading && <p className="text-stone-500">Chargement…</p>}
          {error && <p className="text-red-600">Erreur : {error}</p>}

          <div className="space-y-2">
            {items.map((item) => {
              const fr = item.translations.find((t) => t.locale === "fr");
              return (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded border border-stone-200 p-3 text-sm"
                >
                  <div>
                    <p className="font-medium">{fr?.label ?? item.code}</p>
                    <p className="text-xs text-stone-500">
                      {item.code}
                      {item.icon ? ` · ${item.icon}` : ""} ·{" "}
                      {item.translations.length} langue
                      {item.translations.length > 1 ? "s" : ""}
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => startEdit(item)}
                      className="text-sm text-stone-700 hover:underline"
                    >
                      Modifier
                    </button>
                    {canDelete && (
                      <button
                        type="button"
                        onClick={() => handleDelete(item)}
                        className="text-sm text-red-600 hover:underline"
                      >
                        Supprimer
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="h-fit rounded border border-stone-200 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium">
              {editingId ? "Modifier" : "Nouvel élément"}
            </h2>
            {editingId && (
              <button
                type="button"
                onClick={startCreate}
                className="text-xs text-stone-500 hover:underline"
              >
                Annuler
              </button>
            )}
          </div>

          <label className="block text-sm">
            Code
            <input
              type="text"
              value={draft.code}
              onChange={(e) => setDraft((d) => ({ ...d, code: e.target.value }))}
              placeholder="drinks"
              className="mt-1 block w-full rounded border border-stone-300 p-2"
            />
          </label>

          <label className="block text-sm">
            Icône (nom Tabler)
            <input
              type="text"
              value={draft.icon}
              onChange={(e) => setDraft((d) => ({ ...d, icon: e.target.value }))}
              placeholder="IconGlassFull"
              className="mt-1 block w-full rounded border border-stone-300 p-2"
            />
          </label>

          <label className="block text-sm">
            Ordre
            <input
              type="number"
              value={draft.sort_order}
              onChange={(e) =>
                setDraft((d) => ({ ...d, sort_order: Number(e.target.value) }))
              }
              className="mt-1 block w-24 rounded border border-stone-300 p-2"
            />
          </label>

          <div className="space-y-2 border-t border-stone-100 pt-3">
            <p className="text-sm font-medium">Libellés</p>
            {routing.locales.map((loc) => (
              <label key={loc} className="block text-sm">
                {loc.toUpperCase()}
                <input
                  type="text"
                  value={draft.translations[loc]?.label ?? ""}
                  onChange={(e) =>
                    setDraft((d) => ({
                      ...d,
                      translations: {
                        ...d.translations,
                        [loc]: {
                          locale: loc,
                          label: e.target.value,
                          detail: d.translations[loc]?.detail ?? null,
                        },
                      },
                    }))
                  }
                  className="mt-1 block w-full rounded border border-stone-300 p-2"
                />
              </label>
            ))}
          </div>

          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="rounded bg-stone-900 px-4 py-2 text-sm text-white disabled:opacity-50"
          >
            {isSaving ? "Enregistrement…" : editingId ? "Modifier" : "Créer"}
          </button>

          {message && <p className="text-sm">{message}</p>}
        </div>
      </div>
    </div>
  );
}

export default function AdminTaxonomiesPage() {
  return (
    <RequireAuth>
      <TaxonomiesContent />
    </RequireAuth>
  );
}