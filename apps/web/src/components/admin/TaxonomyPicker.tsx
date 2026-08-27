// apps/web/src/components/admin/TaxonomyPicker.tsx
"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/app/admin/AuthContext";
import { AdminApiError } from "@/lib/api/admin-products";
import { listTaxonomy } from "@/lib/api/admin-taxonomies";
import type { TaxonomyType, TaxonomyOut } from "@/types/api";

/**
 * Sélecteur de codes de taxonomie, façon "tags" Odoo.
 *
 * Affiche les codes choisis en puces avec leur libellé français, plus une
 * liste déroulante des codes encore disponibles. Élimine la saisie libre
 * — donc plus d'erreur « Codes inconnus » au moment d'enregistrer.
 */
export function TaxonomyPicker({
  type,
  label,
  selected,
  onChange,
  includedMap,
  onIncludedChange,
}: {
  type: TaxonomyType;
  label: string;
  selected: string[];
  onChange: (codes: string[]) => void;
  /** Prestations uniquement : état inclus/non inclus par code. */
  includedMap?: Record<string, boolean>;
  onIncludedChange?: (code: string, isIncluded: boolean) => void;
}) {
  const { accessToken } = useAuth();
  const [available, setAvailable] = useState<TaxonomyOut[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken) return;
    listTaxonomy(accessToken, type)
      .then((data) => setAvailable(data.items))
      .catch((err) => {
        const msg = err instanceof AdminApiError ? err.message : "Erreur inattendue";
        setError(msg);
      });
  }, [accessToken, type]);

  function labelFor(code: string): string {
    const item = available.find((i) => i.code === code);
    if (!item) return code;
    return item.translations.find((t) => t.locale === "fr")?.label ?? code;
  }

  const remaining = available.filter((i) => !selected.includes(i.code));

  return (
    <div className="text-sm">
      <p className="mb-1">{label}</p>

      {error && <p className="text-xs text-red-600">Erreur : {error}</p>}

      <div className="mb-2 flex flex-wrap gap-1.5">
        {selected.map((code) => (
          <span
            key={code}
            className="inline-flex items-center gap-1 rounded-full bg-stone-100 px-2.5 py-1 text-xs"
          >
            {labelFor(code)}
            <button
              type="button"
              onClick={() => onChange(selected.filter((c) => c !== code))}
              className="text-stone-500 hover:text-red-600"
              title="Retirer"
            >
              ×
            </button>
          </span>
        ))}
        {selected.length === 0 && (
          <span className="text-xs text-stone-400">Aucun élément sélectionné</span>
        )}
      </div>

      <select
        value=""
        onChange={(e) => {
          if (!e.target.value) return;
          onChange([...selected, e.target.value]);
        }}
        disabled={remaining.length === 0}
        className="block w-full rounded border border-stone-300 p-2 text-sm disabled:opacity-50"
      >
        <option value="">
          {remaining.length === 0 ? "— tout est sélectionné —" : "+ Ajouter…"}
        </option>
        {remaining.map((item) => (
          <option key={item.id} value={item.code}>
            {item.translations.find((t) => t.locale === "fr")?.label ?? item.code}
          </option>
        ))}
      </select>
        {includedMap && onIncludedChange && selected.length > 0 && (
        <div className="mt-2 space-y-1">
          <p className="text-xs text-stone-500">
            Cocher = inclus, décocher = en supplément
          </p>
          {selected.map((code) => (
            <label key={code} className="flex items-center gap-2 text-xs">
              <input
                type="checkbox"
                checked={includedMap[code] ?? true}
                onChange={(e) => onIncludedChange(code, e.target.checked)}
              />
              {labelFor(code)}
            </label>
          ))}
        </div>
      )}
    </div>
  );
}