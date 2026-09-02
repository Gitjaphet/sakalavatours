// apps/web/src/app/admin/messages/[id]/page.tsx
"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { RequireAuth } from "../../RequireAuth";
import { useAuth } from "../../AuthContext";
import { AdminApiError } from "@/lib/api/admin-products";
import { getAdminMessage, updateAdminMessage } from "@/lib/api/admin-messages";
import type { ContactAdminRead, ContactUpdateRequest } from "@/types/api";

function formatDate(value: string | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function MessageDetailContent({ id }: { id: string }) {
  const { accessToken } = useAuth();
  const [message, setMessage] = useState<ContactAdminRead | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!accessToken) return;

    let cancelled = false;
    setIsLoading(true);
    setError(null);

    // Le backend marque le message lu à l'ouverture.
    getAdminMessage(accessToken, id)
      .then((data) => {
        if (!cancelled) setMessage(data);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof AdminApiError ? err.message : "Erreur inattendue");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [accessToken, id]);

  async function update(payload: ContactUpdateRequest, label: string) {
    if (!accessToken) return;
    setIsSaving(true);
    setError(null);
    setNotice(null);

    try {
      const data = await updateAdminMessage(accessToken, id, payload);
      setMessage(data);
      setNotice(label);
    } catch (err) {
      setError(err instanceof AdminApiError ? err.message : "Erreur inattendue");
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) return <p className="p-8 text-stone-500">Chargement…</p>;
  if (error && !message) return <p className="p-8 text-red-600">Erreur : {error}</p>;
  if (!message) return null;

  const mailto = `mailto:${message.email}?subject=${encodeURIComponent(
    `Re: ${message.subject ?? "Votre message"} — Sakalava Tours`,
  )}`;

  return (
    <div className="max-w-5xl p-8">
      <Link
        href="/admin/messages"
        className="mb-4 inline-block text-sm text-stone-500 hover:text-stone-800"
      >
        ← Retour aux messages
      </Link>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-semibold text-stone-900">
          {message.subject ?? "Sans objet"}
        </h1>
        {message.replied_at && (
          <span className="rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-700">
            Répondu
          </span>
        )}
        {message.is_archived && (
          <span className="rounded-full bg-stone-100 px-2 py-1 text-xs font-medium text-stone-600">
            Archivé
          </span>
        )}
      </div>

      {notice && (
        <p className="mb-4 rounded border border-green-200 bg-green-50 p-3 text-sm text-green-800">
          {notice}
        </p>
      )}
      {error && (
        <p className="mb-4 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.7fr_1fr]">
        <div className="rounded-lg border border-stone-200 bg-white p-5">
          <p className="font-medium text-stone-900">{message.name}</p>
          <p className="mb-4 text-sm text-stone-500">
            <a href={mailto} className="text-[#1a6b2f] hover:underline">
              {message.email}
            </a>
            {message.phone && (
              <>
                {" · "}
                <a href={`tel:${message.phone}`} className="hover:underline">
                  {message.phone}
                </a>
              </>
            )}
          </p>
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-stone-700">
            {message.message}
          </p>
        </div>

        <div>
          <div className="mb-3 rounded-lg border border-stone-200 bg-white p-5">
            <p className="mb-3 font-medium text-stone-900">Actions</p>

            <a
              href={mailto}
              className="mb-2 block w-full rounded bg-[#1a6b2f] px-3 py-2 text-center text-sm font-medium text-white"
            >
              Répondre par email
            </a>

            <button
              type="button"
              onClick={() => void update({ mark_replied: true }, "Marqué comme répondu.")}
              disabled={isSaving || message.replied_at !== null}
              className="mb-2 w-full rounded border border-stone-300 px-3 py-2 text-sm disabled:opacity-40"
            >
              {message.replied_at ? "Déjà marqué répondu" : "Marquer comme répondu"}
            </button>

            <button
              type="button"
              onClick={() =>
                void update(
                  { is_archived: !message.is_archived },
                  message.is_archived ? "Message désarchivé." : "Message archivé.",
                )
              }
              disabled={isSaving}
              className="w-full rounded border border-stone-300 px-3 py-2 text-sm disabled:opacity-40"
            >
              {message.is_archived ? "Désarchiver" : "Archiver"}
            </button>
          </div>

          <div className="rounded-lg border border-stone-200 bg-stone-50 p-5 text-xs text-stone-600">
            <p className="mb-2 text-sm font-medium text-stone-700">Traçabilité</p>
            <p className="leading-relaxed">
              Reçu le · {formatDate(message.created_at)}
              <br />
              Langue · {message.locale.toUpperCase()}
              <br />
              Adresse IP · {message.submitted_ip ?? "—"}
              <br />
              Score de spam ·{" "}
              {message.spam_score !== null
                ? message.spam_score.toFixed(2).replace(".", ",")
                : "—"}
              <br />
              Répondu le · {formatDate(message.replied_at)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminMessageDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return (
    <RequireAuth>
      <MessageDetailContent id={id} />
    </RequireAuth>
  );
}