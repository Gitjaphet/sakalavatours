// apps/web/src/components/admin/CoverPicker.tsx
"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/app/admin/AuthContext";
import {
  listAdminMedia,
  uploadAdminMedia,
  AdminApiError,
} from "@/lib/api/admin-products";
import type { MediaAdminRead } from "@/types/api";

export function CoverPicker({
  coverMediaId,
  onSelect,
}: {
  coverMediaId: string | null;
  onSelect: (media: MediaAdminRead) => void;
}) {
  const { accessToken } = useAuth();
  const [items, setItems] = useState<MediaAdminRead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadAltText, setUploadAltText] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  function reloadMedia() {
    if (!accessToken) return;
    setIsLoading(true);
    setError(null);
    listAdminMedia(accessToken, { limit: 50 })
      .then((data) => setItems(data))
      .catch((err) => {
        const message =
          err instanceof AdminApiError ? err.message : "Erreur inattendue";
        setError(message);
      })
      .finally(() => setIsLoading(false));
  }

  useEffect(() => {
    if (!accessToken || !isOpen) return;
    reloadMedia();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken, isOpen]);

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
      reloadMedia();
      onSelect(media);
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
      <p className="mb-1 font-medium">Image de couverture</p>
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        className="rounded border border-stone-300 px-3 py-1.5 text-xs hover:bg-stone-50"
      >
        {isOpen ? "Fermer la bibliothèque" : "Choisir dans la bibliothèque"}
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
              {isUploading ? "Envoi…" : "Envoyer"}
            </button>
            {uploadError && <p className="text-red-600">Erreur : {uploadError}</p>}
          </div>

          <div className="max-h-64 overflow-auto">
            {isLoading && <p className="text-stone-500">Chargement…</p>}
            {error && <p className="text-red-600">Erreur : {error}</p>}
            <div className="grid grid-cols-4 gap-2">
              {items.map((media) => (
                <button
                  type="button"
                  key={media.id}
                  onClick={() => {
                    onSelect(media);
                    setIsOpen(false);
                  }}
                  className={`overflow-hidden rounded border-2 ${
                    media.id === coverMediaId
                      ? "border-stone-900"
                      : "border-transparent hover:border-stone-300"
                  }`}
                  title={media.alt_text}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={media.url}
                    alt={media.alt_text}
                    className="h-16 w-full object-cover"
                  />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}