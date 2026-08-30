// apps/web/src/app/admin/reviews/[id]/page.tsx
"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { RequireAuth } from "../../RequireAuth";
import { useAuth } from "../../AuthContext";
import { AdminApiError } from "@/lib/api/admin-products";
import {
  getAdminReview,
  moderateAdminReview,
  replyToAdminReview,
} from "@/lib/api/admin-reviews";
import type { ReviewAdminRead, ReviewStatus } from "@/types/api";

const STATUS_LABELS: Record<ReviewStatus, string> = {
  pending: "En attente",
  approved: "Publié",
  rejected: "Rejeté",
  spam: "Spam",
};

const STATUS_STYLES: Record<ReviewStatus, string> = {
  pending: "bg-amber-50 text-amber-700",
  approved: "bg-green-50 text-green-700",
  rejected: "bg-stone-100 text-stone-600",
  spam: "bg-red-50 text-red-600",
};

/** Le backend exige un motif pour ces deux statuts, sinon 400. */
const NEEDS_REASON: ReviewStatus[] = ["rejected", "spam"];

function formatDate(value: string | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function ReviewDetailContent({ id }: { id: string }) {
  const { accessToken } = useAuth();
  const [review, setReview] = useState<ReviewAdminRead | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [isVerified, setIsVerified] = useState(false);
  const [isFeatured, setIsFeatured] = useState(false);
  const [reply, setReply] = useState("");

  // Statut en attente de motif : ouvre la zone de saisie.
  const [pendingStatus, setPendingStatus] = useState<ReviewStatus | null>(null);
  const [reason, setReason] = useState("");

  useEffect(() => {
    if (!accessToken) return;

    let cancelled = false;
    setIsLoading(true);
    setError(null);

    getAdminReview(accessToken, id)
      .then((data) => {
        if (cancelled) return;
        setReview(data);
        setIsVerified(data.is_verified);
        setIsFeatured(data.is_featured);
        setReply(data.admin_reply ?? "");
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

  function applyResult(data: ReviewAdminRead, message: string) {
    setReview(data);
    setIsVerified(data.is_verified);
    setIsFeatured(data.is_featured);
    setReply(data.admin_reply ?? "");
    setPendingStatus(null);
    setReason("");
    setNotice(message);
  }

  async function submitModeration(status: ReviewStatus, rejectionReason?: string) {
    if (!accessToken || !review) return;
    setIsSaving(true);
    setError(null);
    setNotice(null);

    try {
      const data = await moderateAdminReview(accessToken, id, {
        status,
        rejection_reason: rejectionReason ?? null,
        is_verified: isVerified,
        is_featured: isFeatured,
      });
      applyResult(data, "Modification enregistrée.");
    } catch (err) {
      setError(err instanceof AdminApiError ? err.message : "Erreur inattendue");
    } finally {
      setIsSaving(false);
    }
  }

  function handleDecision(status: ReviewStatus) {
    if (NEEDS_REASON.includes(status)) {
      setPendingStatus(status);
      setNotice(null);
      return;
    }
    void submitModeration(status);
  }

  async function handleReply() {
    if (!accessToken || !reply.trim()) return;
    setIsSaving(true);
    setError(null);
    setNotice(null);

    try {
      const data = await replyToAdminReview(accessToken, id, {
        admin_reply: reply.trim(),
      });
      applyResult(data, "Réponse publiée.");
    } catch (err) {
      setError(err instanceof AdminApiError ? err.message : "Erreur inattendue");
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) return <p className="p-8 text-stone-500">Chargement…</p>;
  if (error && !review) return <p className="p-8 text-red-600">Erreur : {error}</p>;
  if (!review) return null;

  return (
    <div className="max-w-5xl p-8">
      <Link
        href="/admin/reviews"
        className="mb-4 inline-block text-sm text-stone-500 hover:text-stone-800"
      >
        ← Retour à la file
      </Link>

      <div className="mb-4 flex items-center gap-3">
        <h1 className="text-2xl font-semibold text-stone-900">
          Avis de {review.author_name}
        </h1>
        <span
          className={`rounded-full px-2 py-1 text-xs font-medium ${STATUS_STYLES[review.status]}`}
        >
          {STATUS_LABELS[review.status]}
        </span>

        {/* Adresse confirmée : atteste que l'email existe et que quelqu'un
            l'a lu. Distinct de « vérifié », qui atteste du voyage. */}
        <span
          className={`rounded-full px-2 py-1 text-xs font-medium ${
            review.email_verified_at
              ? "bg-green-50 text-green-700"
              : "bg-stone-100 text-stone-500"
          }`}
          title={
            review.email_verified_at
              ? "L'auteur a cliqué le lien reçu par email"
              : "L'adresse email n'a pas été confirmée"
          }
        >
          {review.email_verified_at ? "Email confirmé" : "Email non confirmé"}
        </span>
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
        <div>
          <div className="mb-3 rounded-lg border border-stone-200 bg-white p-5">
            <div className="mb-1 flex items-baseline justify-between">
              <span className="font-medium text-stone-900">{review.author_name}</span>
              <span className="text-sm text-stone-500">★ {review.rating}/5</span>
            </div>
            <p className="mb-4 text-xs text-stone-500">
              {review.author_country ?? "Pays non précisé"}
              {review.travel_date && ` · voyage du ${formatDate(review.travel_date)}`}
              {review.product ? ` · ${review.product.title}` : " · avis sur l'agence"}
            </p>
            {review.title && (
              <p className="mb-2 font-medium text-stone-900">{review.title}</p>
            )}
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-stone-700">
              {review.body}
            </p>
          </div>

          {review.rejection_reason && (
            <div className="mb-3 rounded-lg border border-stone-200 bg-stone-50 p-4">
              <p className="mb-1 text-sm font-medium text-stone-700">
                {review.status === "spam"
                  ? "Motif du classement en spam"
                  : "Motif du rejet"}
              </p>
              <p className="text-sm text-stone-600">{review.rejection_reason}</p>
            </div>
          )}

          {(review.status === "rejected" || review.status === "spam") && (
            <p className="rounded-lg border border-dashed border-stone-300 p-4 text-sm text-stone-500">
              Cet avis n&apos;est pas publié : une réponse ne serait visible de
              personne. Publiez-le d&apos;abord pour pouvoir y répondre.
            </p>
          )}

          <div
            className={`rounded-lg border border-stone-200 bg-white p-5 ${
              review.status === "rejected" || review.status === "spam" ? "hidden" : ""
            }`}
          >
            <p className="mb-1 font-medium text-stone-900">Réponse de l&apos;agence</p>
            <p className="mb-3 text-xs text-amber-700">
              ⚠ Une réponse publiée ne peut plus être retirée, seulement modifiée.
            </p>
            <textarea
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              rows={4}
              maxLength={2000}
              placeholder="Répondre publiquement à cet avis…"
              className="mb-2 w-full rounded border border-stone-300 p-2 text-sm"
            />
            <div className="flex items-center justify-between">
              <span className="text-xs text-stone-400">
                {review.admin_replied_at
                  ? `Répondu le ${formatDate(review.admin_replied_at)}`
                  : "Aucune réponse publiée"}
              </span>
              <button
                type="button"
                onClick={handleReply}
                disabled={isSaving || !reply.trim()}
                className="rounded bg-[#1a6b2f] px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
              >
                {review.admin_reply ? "Modifier la réponse" : "Publier la réponse"}
              </button>
            </div>
          </div>
        </div>

        <div>
          <div className="mb-3 rounded-lg border border-stone-200 bg-white p-5">
            <p className="mb-3 font-medium text-stone-900">Décision</p>

            {pendingStatus ? (
              <div>
                <p className="mb-2 text-sm text-stone-600">
                  Motif du {pendingStatus === "spam" ? "classement en spam" : "rejet"} —
                  obligatoire.
                </p>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={3}
                  maxLength={500}
                  autoFocus
                  className="mb-2 w-full rounded border border-stone-300 p-2 text-sm"
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => void submitModeration(pendingStatus, reason.trim())}
                    disabled={isSaving || !reason.trim()}
                    className="flex-1 rounded bg-red-600 px-3 py-2 text-sm font-medium text-white disabled:bg-stone-200 disabled:text-stone-400"
                  >
                    Confirmer
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPendingStatus(null);
                      setReason("");
                    }}
                    className="rounded border border-stone-300 px-3 py-2 text-sm"
                  >
                    Annuler
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => handleDecision("approved")}
                  disabled={isSaving}
                  className="w-full rounded bg-[#1a6b2f] px-3 py-2 text-sm font-medium text-white disabled:opacity-40"
                >
                  Publier
                </button>
                <button
                  type="button"
                  onClick={() => handleDecision("rejected")}
                  disabled={isSaving}
                  className="w-full rounded border border-stone-300 px-3 py-2 text-sm disabled:opacity-40"
                >
                  Rejeter
                </button>
                <button
                  type="button"
                  onClick={() => handleDecision("spam")}
                  disabled={isSaving}
                  className="w-full rounded border border-red-200 px-3 py-2 text-sm text-red-700 disabled:opacity-40"
                >
                  Marquer comme spam
                </button>
              </div>
            )}

            <div className="mt-4 border-t border-stone-200 pt-4">
              <label className="flex items-start gap-2 text-sm text-stone-700">
                <input
                  type="checkbox"
                  checked={isVerified}
                  onChange={(e) => setIsVerified(e.target.checked)}
                  className="mt-0.5"
                />
                <span>
                  Avis vérifié
                  <span className="block text-xs text-stone-500">
                    Seuls les avis vérifiés comptent dans la note déclarée à Google.
                  </span>
                </span>
              </label>

              <label className="mt-3 flex items-center gap-2 text-sm text-stone-700">
                <input
                  type="checkbox"
                  checked={isFeatured}
                  onChange={(e) => setIsFeatured(e.target.checked)}
                />
                Mis en avant
              </label>

              <button
                type="button"
                onClick={() => void submitModeration(review.status)}
                disabled={
                  isSaving ||
                  (isVerified === review.is_verified && isFeatured === review.is_featured)
                }
                className="mt-3 w-full rounded border border-stone-300 px-3 py-2 text-sm disabled:opacity-40"
              >
                Enregistrer les options
              </button>
            </div>
          </div>

          <div className="rounded-lg border border-stone-200 bg-stone-50 p-5 text-xs text-stone-600">
            <p className="mb-2 text-sm font-medium text-stone-700">Traçabilité</p>
            <p className="leading-relaxed">
              Score de spam ·{" "}
              {review.spam_score !== null
                ? review.spam_score.toFixed(2).replace(".", ",")
                : "—"}
              <br />
              Adresse IP · {review.submitted_ip ?? "—"}
              <br />
              Référence · {review.booking_reference ?? "aucune"}
              <br />
              
              Reçu le · {formatDate(review.created_at)}
              <br />
              Modéré le · {formatDate(review.moderated_at)}
              <br />
              Publié le · {formatDate(review.published_at)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminReviewDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return (
    <RequireAuth>
      <ReviewDetailContent id={id} />
    </RequireAuth>
  );
}