// apps/web/src/components/reviews/ReviewForm.tsx
"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { submitReview, ReviewError } from "@/lib/api/reviews";
import {
  IconCheck,
  IconAlertCircle,
  IconInfoCircle,
  IconAsterisk,
} from "@tabler/icons-react";

type ProductOption = {
  slug: string;
  title: string;
  product_type: "circuit" | "excursion";
};

export function ReviewForm({
  products,
  locale,
}: {
  products: ProductOption[];
  locale: string;
}) {
  const t = useTranslations("avis.form");

  const [productSlug, setProductSlug] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [country, setCountry] = useState("");
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [travelDate, setTravelDate] = useState("");
  const [reference, setReference] = useState("");
  const [website, setWebsite] = useState(""); // honeypot

  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<string | null>(null);

  const circuits = products.filter((p) => p.product_type === "circuit");
  const excursions = products.filter((p) => p.product_type === "excursion");

  // Un voyage ne peut pas avoir eu lieu dans le futur.
  const today = new Date().toISOString().split("T")[0];

  async function handleSubmit() {
    setError(null);

    // Le backend impose 30 caractères minimum : autant le dire avant
    // l'aller-retour plutôt que d'afficher son message d'erreur brut.
    if (!name.trim() || !email.trim() || rating === 0 || body.trim().length < 30) {
      setError(t("errorRequired"));
      return;
    }

    setIsSending(true);
    try {
      const message = await submitReview({
        product_slug: productSlug || null,
        author_name: name.trim(),
        author_email: email.trim(),
        author_country: country || null,
        rating,
        title: title.trim() || null,
        body: body.trim(),
        locale,
        travel_date: travelDate || null,
        booking_reference: reference.trim() || null,
        website,
      });
      setConfirmation(message);
    } catch (err) {
      setError(err instanceof ReviewError && err.message ? err.message : t("errorUnexpected"));
    } finally {
      setIsSending(false);
    }
  }

  if (confirmation) {
    return (
      <div className="rounded-3xl border border-[#1d4e5f]/10 bg-white p-8 text-center shadow-[0_16px_40px_-16px_rgba(8,34,43,0.25)]">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-emerald-50 text-emerald-600">
          <IconCheck size={28} stroke={2} />
        </span>
        <h2 className="mt-5 font-[family-name:var(--font-courgette)] text-2xl text-stone-900">
          {t("successTitle")}
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-stone-600">{confirmation}</p>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-[#1d4e5f]/10 bg-white p-6 shadow-[0_16px_40px_-16px_rgba(8,34,43,0.25)] sm:p-8">
      <div className="space-y-5">
        <p className="flex gap-2 text-xs leading-relaxed text-stone-500">
            <IconAsterisk
            size={15}
            stroke={2}
            className="mt-0.5 shrink-0 text-[#E76F51]"
          />
          {t("requiredNote")}
        </p>

        <div>
          <span className="block text-sm font-medium text-stone-900">
            {t("rating")} *
          </span>
          <div className="mt-2 flex gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setRating(n)}
                aria-label={t("ratingOf", { n })}
                className={`text-3xl transition-colors ${
                  n <= rating ? "text-[#F4A261]" : "text-stone-300 hover:text-[#F4A261]/50"
                }`}
              >
                ★
              </button>
            ))}
          </div>
        </div>

        <label className="block text-sm">
          <span className="font-medium text-stone-900">{t("product")}</span>
          <select
            value={productSlug}
            onChange={(e) => setProductSlug(e.target.value)}
            className="mt-1.5 w-full rounded-xl border border-stone-300 px-3 py-2.5 text-sm"
          >
            <option value="">{t("productAgency")}</option>
            {excursions.length > 0 && (
              <optgroup label={t("excursions")}>
                {excursions.map((p) => (
                  <option key={p.slug} value={p.slug}>
                    {p.title}
                  </option>
                ))}
              </optgroup>
            )}
            {circuits.length > 0 && (
              <optgroup label={t("circuits")}>
                {circuits.map((p) => (
                  <option key={p.slug} value={p.slug}>
                    {p.title}
                  </option>
                ))}
              </optgroup>
            )}
          </select>
        </label>

        <div className="grid gap-5 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="font-medium text-stone-900">{t("name")} *</span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={120}
              className="mt-1.5 w-full rounded-xl border border-stone-300 px-3 py-2.5 text-sm"
            />
          </label>

          <label className="block text-sm">
            <span className="font-medium text-stone-900">{t("email")} *</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-stone-300 px-3 py-2.5 text-sm"
            />
          </label>
        </div>

        <label className="block text-sm">
          <span className="font-medium text-stone-900">{t("title")}</span>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={200}
            placeholder={t("titlePlaceholder")}
            className="mt-1.5 w-full rounded-xl border border-stone-300 px-3 py-2.5 text-sm"
          />
        </label>

        <label className="block text-sm">
          <span className="font-medium text-stone-900">{t("body")} *</span>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={6}
            maxLength={5000}
            placeholder={t("bodyPlaceholder")}
            className="mt-1.5 w-full rounded-xl border border-stone-300 px-3 py-2.5 text-sm"
          />
          <span className="mt-1 block text-xs text-stone-400">
            {t("bodyHint", { min: 30, current: body.trim().length })}
          </span>
        </label>

        <div className="grid gap-5 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="font-medium text-stone-900">{t("travelDate")}</span>
            <input
              type="date"
              value={travelDate}
              max={today}
              onChange={(e) => setTravelDate(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-stone-300 px-3 py-2.5 text-sm"
            />
          </label>

          <label className="block text-sm">
            <span className="font-medium text-stone-900">{t("reference")}</span>
            <input
              type="text"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              maxLength={40}
              placeholder="SKT-2026-0001"
              className="mt-1.5 w-full rounded-xl border border-stone-300 px-3 py-2.5 text-sm"
            />
          </label>
        </div>

        <p className="flex gap-2 rounded-xl bg-[#FDFAF6] p-3 text-xs leading-relaxed text-stone-600">
          <IconInfoCircle size={16} className="mt-0.5 shrink-0 text-[#1d4e5f]" />
          {t("referenceNote")}
        </p>

        {/* Honeypot — masqué visuellement, jamais rempli par un humain */}
        <input
          type="text"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          className="absolute left-[-9999px] h-0 w-0 opacity-0"
        />

        {error && (
          <p className="flex gap-2 rounded-xl bg-red-50 p-3 text-sm text-red-700">
            <IconAlertCircle size={18} className="mt-0.5 shrink-0" />
            {error}
          </p>
        )}

        <button
          type="button"
          onClick={handleSubmit}
          disabled={isSending}
          className="w-full rounded-full bg-gradient-to-r from-[#F4A261] to-[#E76F51] px-8 py-3 font-medium text-white transition-opacity disabled:opacity-50"
        >
          {isSending ? t("sending") : t("submit")}
        </button>

        <p className="text-center text-xs text-stone-500">{t("privacy")}</p>
      </div>
    </div>
  );
}