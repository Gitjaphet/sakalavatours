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

  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadAltText, setUploadAltText] = useState("");
  const [isUploading, setIsUploading] = useState(false);
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

  function removeFromGallery(id: string) {
    onChange(items.filter((i) => i.id !== id));
  }

  async function handleUpload() {
    if (!accessToken || !uploadFile || !uploadAltText.trim()) return;
    setIsUploading(true);
    setUploadError(null);
    try {
      const media = await uploadAdminMedia(accessToken, {
        file: uploadFile,
        altText: uploadAltText.trim(),
      });
      setUploadFile(null);
      setUploadAltText("");
      reloadLibrary();
      addToGallery(media);
    } catch (err) {
      const message =
        err instanceof AdminApiError ? err.message : "Erreur inattendue";
      setUploadError(message);
    } finally {
      setIsUploading(false);
    }
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
              Ajouter une nouvelle image
            </p>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setUploadFile(e.target.files?.[0] ?? null)}
              className="block w-full text-xs"
            />
            <input
              type="text"
              placeholder="Texte alternatif (obligatoire)"
              value={uploadAltText}
              onChange={(e) => setUploadAltText(e.target.value)}
              className="block w-full rounded border border-stone-300 p-1.5 text-xs"
            />
            <button
              type="button"
              onClick={handleUpload}
              disabled={isUploading || !uploadFile || !uploadAltText.trim()}
              className="rounded bg-stone-900 px-3 py-1.5 text-xs text-white disabled:opacity-50"
            >
              {isUploading ? "Envoi…" : "Envoyer et ajouter"}
            </button>
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