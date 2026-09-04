// apps/web/src/app/admin/medias/page.tsx
"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/app/admin/AuthContext";
import {
  listAdminMedia,
  deleteAdminMedia,
  AdminApiError,
} from "@/lib/api/admin-products";
import type { MediaAdminRead } from "@/types/api";

const PAGE_SIZE = 48;
/** Au-dela de ce poids, une image ralentit sensiblement une fiche produit. */
const SEUIL_POIDS_OCTETS = 300_000;

function formatPoids(octets: number): string {
  if (octets < 1024) return `${octets} o`;
  if (octets < 1024 * 1024) return `${Math.round(octets / 1024)} Ko`;
  return `${(octets / (1024 * 1024)).toFixed(1)} Mo`;
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

export default function MediasPage() {
  const { accessToken } = useAuth();

  const [medias, setMedias] = useState<MediaAdminRead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);

  const [recherche, setRecherche] = useState("");
  const [selection, setSelection] = useState<Set<string>>(new Set());
  const [aSupprimer, setASupprimer] = useState<MediaAdminRead[] | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [detail, setDetail] = useState<MediaAdminRead | null>(null);
  const [urlCopiee, setUrlCopiee] = useState<string | null>(null);

  const charger = useCallback(
    async (offset: number) => {
      if (!accessToken) return;
      const premierChargement = offset === 0;
      if (premierChargement) {
        setIsLoading(true);
        setError(null);
      } else {
        setIsLoadingMore(true);
      }
      try {
        const data = await listAdminMedia(accessToken, {
          limit: PAGE_SIZE,
          offset,
        });
        setMedias((prev) => (premierChargement ? data : [...prev, ...data]));
        setHasMore(data.length === PAGE_SIZE);
      } catch (err) {
        const message =
          err instanceof AdminApiError ? err.message : "Erreur inattendue";
        setError(message);
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    [accessToken],
  );

  useEffect(() => {
    charger(0);
  }, [charger]);

  function basculerSelection(id: string) {
    setSelection((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function copierUrl(url: string) {
    try {
      await navigator.clipboard.writeText(url);
      setUrlCopiee(url);
      setTimeout(() => setUrlCopiee(null), 2000);
    } catch {
      setUrlCopiee(null);
    }
  }

  /** Suppression sequentielle. En cas d'echec on s'arrete : les medias deja
   *  supprimes disparaissent de la liste, les restants demeurent selectionnes
   *  pour un nouvel essai — jamais de double appel, jamais de perte de contexte. */
  async function confirmerSuppression() {
    if (!accessToken || !aSupprimer) return;
    setIsDeleting(true);
    setDeleteError(null);

    const restants = [...aSupprimer];
    const supprimes: string[] = [];

    try {
      while (restants.length > 0) {
        const courant = restants[0];
        await deleteAdminMedia(accessToken, courant.id);
        supprimes.push(courant.id);
        restants.shift();
      }
    } catch (err) {
      const message =
        err instanceof AdminApiError ? err.message : "Erreur inattendue";
      setDeleteError(
        `${message} — ${supprimes.length} supprimee(s), ${restants.length} restante(s).`,
      );
    } finally {
      if (supprimes.length > 0) {
        const set = new Set(supprimes);
        setMedias((prev) => prev.filter((m) => !set.has(m.id)));
        setSelection((prev) => {
          const next = new Set(prev);
          supprimes.forEach((id) => next.delete(id));
          return next;
        });
        setDetail((d) => (d && set.has(d.id) ? null : d));
      }
      setIsDeleting(false);
      if (restants.length === 0) setASupprimer(null);
      else setASupprimer(restants);
    }
  }

  const filtres = recherche.trim()
    ? medias.filter((m) => {
        const q = recherche.trim().toLowerCase();
        return (
          m.filename.toLowerCase().includes(q) ||
          m.alt_text.toLowerCase().includes(q) ||
          (m.folder ?? "").toLowerCase().includes(q)
        );
      })
    : medias;

  const selectionnes = medias.filter((m) => selection.has(m.id));

  return (
    <div className="text-sm">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-stone-900">Médias</h1>
          <p className="mt-1 text-stone-500">
            {medias.length} image{medias.length > 1 ? "s" : ""} chargée
            {medias.length > 1 ? "s" : ""}
            {hasMore ? " (bibliothèque partielle)" : ""}
          </p>
        </div>
        <input
          type="search"
          placeholder="Rechercher un nom, un texte alternatif…"
          value={recherche}
          onChange={(e) => setRecherche(e.target.value)}
          className="w-72 rounded border border-stone-300 px-3 py-2 text-sm"
        />
      </div>

      {selectionnes.length > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-3 rounded border border-stone-300 bg-stone-50 px-4 py-3">
          <span className="font-medium text-stone-700">
            {selectionnes.length} image{selectionnes.length > 1 ? "s" : ""} sélectionnée
            {selectionnes.length > 1 ? "s" : ""}
          </span>
          <button
            type="button"
            onClick={() => setSelection(new Set())}
            className="rounded border border-stone-300 px-3 py-1.5 text-xs hover:bg-white"
          >
            Tout désélectionner
          </button>
          <button
            type="button"
            onClick={() => {
              setDeleteError(null);
              setASupprimer(selectionnes);
            }}
            className="rounded bg-red-600 px-3 py-1.5 text-xs text-white hover:bg-red-700"
          >
            Supprimer la sélection
          </button>
        </div>
      )}

      {isLoading && <p className="text-stone-500">Chargement…</p>}
      {error && <p className="text-red-600">Erreur : {error}</p>}

      {!isLoading && filtres.length === 0 && (
        <p className="text-stone-500">
          {recherche.trim()
            ? "Aucune image ne correspond à cette recherche."
            : "La bibliothèque est vide."}
        </p>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
        {filtres.map((media) => {
          const estSelectionne = selection.has(media.id);
          const estLourde = media.file_size > SEUIL_POIDS_OCTETS;
          return (
            <div
              key={media.id}
              className={`group relative overflow-hidden rounded-lg border-2 bg-white transition-colors ${
                estSelectionne ? "border-stone-900" : "border-stone-200"
              }`}
            >
              <button
                type="button"
                onClick={() => setDetail(media)}
                className="block w-full"
                title={media.alt_text}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={media.url}
                  alt={media.alt_text}
                  className="h-28 w-full object-cover"
                />
              </button>

              <label className="absolute left-1.5 top-1.5 flex cursor-pointer items-center rounded bg-white/90 p-1 shadow-sm">
                <input
                  type="checkbox"
                  checked={estSelectionne}
                  onChange={() => basculerSelection(media.id)}
                  className="h-3.5 w-3.5 cursor-pointer"
                  aria-label={`Sélectionner ${media.filename}`}
                />
              </label>

              {estLourde && (
                <span
                  className="absolute right-1.5 top-1.5 rounded bg-amber-500 px-1.5 py-0.5 text-[10px] font-medium text-white"
                  title="Image lourde — pensez à la compresser"
                >
                  {formatPoids(media.file_size)}
                </span>
              )}

              <div className="px-2 py-1.5">
                <p className="truncate text-[11px] text-stone-600" title={media.filename}>
                  {media.filename}
                </p>
                <p className="text-[10px] text-stone-400">
                  {media.width && media.height
                    ? `${media.width}×${media.height}`
                    : "dimensions inconnues"}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {hasMore && !isLoading && (
        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() => charger(medias.length)}
            disabled={isLoadingMore}
            className="rounded border border-stone-300 px-4 py-2 text-xs hover:bg-stone-50 disabled:opacity-50"
          >
            {isLoadingMore ? "Chargement…" : "Charger plus d'images"}
          </button>
        </div>
      )}

      {detail && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setDetail(null)}
        >
          <div
            className="max-h-[90vh] w-full max-w-3xl overflow-auto rounded-lg bg-white"
            onClick={(e) => e.stopPropagation()}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={detail.url}
              alt={detail.alt_text}
              className="max-h-[50vh] w-full bg-stone-100 object-contain"
            />
            <div className="space-y-3 p-5">
              <div>
                <p className="font-medium text-stone-900">{detail.filename}</p>
                <p className="mt-1 text-stone-600">{detail.alt_text}</p>
              </div>

              <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-xs text-stone-600 sm:grid-cols-3">
                <div>
                  <dt className="text-stone-400">Dimensions</dt>
                  <dd>
                    {detail.width && detail.height
                      ? `${detail.width} × ${detail.height} px`
                      : "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-stone-400">Poids</dt>
                  <dd
                    className={
                      detail.file_size > SEUIL_POIDS_OCTETS ? "text-amber-700" : ""
                    }
                  >
                    {formatPoids(detail.file_size)}
                  </dd>
                </div>
                <div>
                  <dt className="text-stone-400">Type</dt>
                  <dd>{detail.mime_type}</dd>
                </div>
                <div>
                  <dt className="text-stone-400">Dossier</dt>
                  <dd>{detail.folder ?? "—"}</dd>
                </div>
                <div>
                  <dt className="text-stone-400">Ajoutée le</dt>
                  <dd>{formatDate(detail.created_at)}</dd>
                </div>
                <div>
                  <dt className="text-stone-400">Crédit</dt>
                  <dd>{detail.photographer ?? "—"}</dd>
                </div>
              </dl>

              <div className="flex flex-wrap gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => copierUrl(detail.url)}
                  className="rounded border border-stone-300 px-3 py-1.5 text-xs hover:bg-stone-50"
                >
                  {urlCopiee === detail.url ? "URL copiée" : "Copier l'URL"}
                </button>
                <a
                  href={detail.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded border border-stone-300 px-3 py-1.5 text-xs hover:bg-stone-50"
                >
                  Ouvrir l'original
                </a>
                <button
                  type="button"
                  onClick={() => {
                    setDeleteError(null);
                    setASupprimer([detail]);
                  }}
                  className="rounded bg-red-600 px-3 py-1.5 text-xs text-white hover:bg-red-700"
                >
                  Supprimer
                </button>
                <button
                  type="button"
                  onClick={() => setDetail(null)}
                  className="ml-auto rounded border border-stone-300 px-3 py-1.5 text-xs hover:bg-stone-50"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {aSupprimer && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-lg bg-white p-5">
            <h2 className="text-lg font-semibold text-stone-900">
              Supprimer {aSupprimer.length} image
              {aSupprimer.length > 1 ? "s" : ""} ?
            </h2>
            <p className="mt-2 text-stone-600">
              L&apos;image sera retirée du site. Si une fiche produit l&apos;utilise
              en couverture ou en galerie, cette fiche s&apos;affichera sans elle.
            </p>
            <p className="mt-2 text-xs text-stone-500">
              La suppression est logique : le fichier reste stocké et l&apos;URL
              publique continue de répondre, pour ne pas casser les liens déjà
              indexés.
            </p>

            <ul className="mt-3 max-h-32 overflow-auto text-xs text-stone-500">
              {aSupprimer.map((m) => (
                <li key={m.id} className="truncate">
                  {m.filename}
                </li>
              ))}
            </ul>

            {deleteError && (
              <p className="mt-3 text-xs text-red-600">Erreur : {deleteError}</p>
            )}

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setASupprimer(null)}
                disabled={isDeleting}
                className="rounded border border-stone-300 px-4 py-2 text-xs hover:bg-stone-50 disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={confirmerSuppression}
                disabled={isDeleting}
                className="rounded bg-red-600 px-4 py-2 text-xs text-white hover:bg-red-700 disabled:opacity-50"
              >
                {isDeleting ? "Suppression…" : "Confirmer la suppression"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
