// apps/web/src/components/admin/CoverPicker.tsx
"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/app/admin/AuthContext";
import { listAdminMedia, AdminApiError } from "@/lib/api/admin-products";
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

  useEffect(() => {
    if (!accessToken || !isOpen) return;

    let cancelled = false;
    setIsLoading(true);
    setError(null);

    listAdminMedia(accessToken, { limit: 50 })
      .then((data) => {
        if (!cancelled) setItems(data);
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
  }, [accessToken, isOpen]);

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
        <div className="mt-2 max-h-64 overflow-auto rounded border border-stone-200 p-2">
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
      )}
    </div>
  );
}