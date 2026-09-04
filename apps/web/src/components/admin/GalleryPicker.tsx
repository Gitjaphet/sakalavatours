// apps/web/src/components/admin/GalleryPicker.tsx
"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/app/admin/AuthContext";
import {
  listAdminMedia,
  uploadAdminMedia,
  AdminApiError,
} from "@/lib/api/admin-products";
import type { MediaAdminRead } from "@/types/api";

export type GalleryMediaItem = {
  id: string;
  url: string;
  alt_text: string | null;
};

/** Fichier en attente d'envoi, avec son texte alternatif editable. */
type QueuedUpload = {
  /** Cle stable pour React : le meme fichier peut etre choisi deux fois. */
  key: string;
  file: File;
  alt: string;
};

/** Devine un texte alternatif a partir du nom de fichier.
 *  "nosy-mitsio-groupe.jpeg" donne "Nosy mitsio groupe".
 *  C'est un point de depart editable, jamais une valeur definitive. */
function altDepuisNomFichier(nom: string): string {
  const sansExtension = nom.replace(/\.[^.]+$/, "");
  const mots = sansExtension.replace(/[-_]+/g, " ").replace(/\s+/g, " ").trim();
  if (!mots) return "";
  return mots.charAt(0).toUpperCase() + mots.slice(1);
}

export function GalleryPicker({
  items,
  onChange,
}: {
  items: GalleryMediaItem[];
  onChange: (items: GalleryMediaItem[]) => void;
}) {
  const { accessToken } = useAuth();
  const [library, setLibrary] = useState<MediaAdminRead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const [queue, setQueue] = useState<QueuedUpload[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);

  function reloadLibrary() {
    if (!accessToken) return;
    setIsLoading(true);
    setError(null);
    listAdminMedia(accessToken, { limit: 50 })
      .then((data) => setLibrary(data))
      .catch((err) => {
        const message =
          err instanceof AdminApiError ? err.message : "Erreur inattendue";
        setError(message);
      })
      .finally(() => setIsLoading(false));
  }

  useEffect(() => {
    if (!accessToken || !isOpen) return;
    reloadLibrary();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken, isOpen]);

  function addToGallery(media: MediaAdminRead) {
    if (items.some((i) => i.id === media.id)) return;
    onChange([...items, { id: media.id, url: media.url, alt_text: media.alt_text }]);
  }

  function handleFilesSelected(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    const ajouts: QueuedUpload[] = Array.from(fileList).map((file, i) => ({
      key: `${Date.now()}-${i}-${file.name}`,
      file,
      alt: altDepuisNomFichier(file.name),
    }));
    setQueue((q) => [...q, ...ajouts]);
    setUploadError(null);
  }

  function updateAlt(key: string, alt: string) {
    setQueue((q) => q.map((item) => (item.key === key ? { ...item, alt } : item)));
  }

  function removeFromQueue(key: string) {
    setQueue((q) => q.filter((item) => item.key !== key));
  }

  const queuePrete = queue.length > 0 && queue.every((item) => item.alt.trim());

  /** Envoi sequentiel. En cas d'echec on s'arrete : les fichiers deja
   *  envoyes sortent de la file, les restants y demeurent pour un nouvel
   *  essai — jamais de doublon, jamais de perte. */
  async function handleUploadAll() {
    if (!accessToken || !queuePrete) return;
    setIsUploading(true);
    setUploadError(null);
    setProgress(0);

    const restants = [...queue];
    const nouveaux: MediaAdminRead[] = [];

    try {
      while (restants.length > 0) {
        const courant = restants[0];
        const media = await uploadAdminMedia(accessToken, {
          file: courant.file,
          altText: courant.alt.trim(),
        });
        nouveaux.push(media);
        restants.shift();
        setQueue([...restants]);
        setProgress(nouveaux.length);
      }
    } catch (err) {
      const message =
        err instanceof AdminApiError ? err.message : "Erreur inattendue";
      setUploadError(
        `${message} — ${nouveaux.length} image(s) envoyee(s), ${restants.length} restante(s).`,
      );
    } finally {
      if (nouveaux.length > 0) {
        const dejaPresents = new Set(items.map((i) => i.id));
        const ajouts = nouveaux
          .filter((m) => !dejaPresents.has(m.id))
          .map((m) => ({ id: m.id, url: m.url, alt_text: m.alt_text }));
        if (ajouts.length > 0) onChange([...items, ...ajouts]);
        reloadLibrary();
      }
      setIsUploading(false);
    }
  }

  function removeFromGallery(id: string) {
    onChange(items.filter((i) => i.id !== id));
  }

  return (
    <div className="text-sm">
      <p className="mb-1 font-medium">
        Galerie ({items.length} image{items.length > 1 ? "s" : ""})
      </p>

      {items.length > 0 && (
        <div className="mb-2 grid grid-cols-4 gap-2">
          {items.map((item) => (
            <div key={item.id} className="relative overflow-hidden rounded border border-stone-200">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.url}
                alt={item.alt_text ?? ""}
                className="h-16 w-full object-cover"
              />
              <button
                type="button"
                onClick={() => removeFromGallery(item.id)}
                className="absolute right-0 top-0 rounded-bl bg-red-600 px-1.5 py-0.5 text-xs text-white"
                title="Retirer de la galerie"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        className="rounded border border-stone-300 px-3 py-1.5 text-xs hover:bg-stone-50"
      >
        {isOpen ? "Fermer la bibliothèque" : "Ajouter des images"}
      </button>

      {isOpen && (
        <div className="mt-2 space-y-3 rounded border border-stone-200 p-2">
          <div className="space-y-2 border-b border-stone-200 pb-3">
            <p className="text-xs font-medium text-stone-600">
              Ajouter des images (sélection multiple possible)
            </p>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => {
                handleFilesSelected(e.target.files);
                e.target.value = "";
              }}
              className="block w-full text-xs"
            />

            {queue.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-xs text-stone-500">
                  {queue.length} fichier{queue.length > 1 ? "s" : ""} en attente — vérifiez les textes alternatifs
                </p>
                {queue.map((item) => (
                  <div key={item.key} className="flex items-center gap-2">
                    <span
                      className="w-32 shrink-0 truncate text-xs text-stone-500"
                      title={item.file.name}
                    >
                      {item.file.name}
                    </span>
                    <input
                      type="text"
                      placeholder="Texte alternatif (obligatoire)"
                      value={item.alt}
                      onChange={(e) => updateAlt(item.key, e.target.value)}
                      disabled={isUploading}
                      className="block w-full rounded border border-stone-300 p-1.5 text-xs disabled:bg-stone-100"
                    />
                    <button
                      type="button"
                      onClick={() => removeFromQueue(item.key)}
                      disabled={isUploading}
                      className="shrink-0 rounded border border-stone-300 px-2 py-1 text-xs text-stone-600 disabled:opacity-50"
                      title="Retirer de la file"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}

            <button
              type="button"
              onClick={handleUploadAll}
              disabled={isUploading || !queuePrete}
              className="rounded bg-stone-900 px-3 py-1.5 text-xs text-white disabled:opacity-50"
            >
              {isUploading
                ? `Envoi… ${progress} / ${progress + queue.length}`
                : `Envoyer ${queue.length > 0 ? queue.length : ""} image${queue.length > 1 ? "s" : ""}`}
            </button>
            {queue.length > 0 && !queuePrete && !isUploading && (
              <p className="text-xs text-amber-700">
                Chaque image doit avoir un texte alternatif.
              </p>
            )}
            {uploadError && <p className="text-red-600">Erreur : {uploadError}</p>}
          </div>

          <div className="max-h-64 overflow-auto">
            {isLoading && <p className="text-stone-500">Chargement…</p>}
            {error && <p className="text-red-600">Erreur : {error}</p>}
            <div className="grid grid-cols-4 gap-2">
              {library.map((media) => {
                const alreadyAdded = items.some((i) => i.id === media.id);
                return (
                  <button
                    type="button"
                    key={media.id}
                    onClick={() => addToGallery(media)}
                    disabled={alreadyAdded}
                    className={`overflow-hidden rounded border-2 ${
                      alreadyAdded
                        ? "border-stone-900 opacity-40"
                        : "border-transparent hover:border-stone-300"
                    }`}
                    title={alreadyAdded ? "Déjà dans la galerie" : media.alt_text}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={media.url}
                      alt={media.alt_text}
                      className="h-16 w-full object-cover"
                    />
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
