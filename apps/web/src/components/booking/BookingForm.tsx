// apps/web/src/components/booking/BookingForm.tsx
"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { createBooking, BookingError } from "@/lib/api/bookings";
import type { BookingConfirmation } from "@/lib/api/bookings";
import { IconCheck, IconAlertCircle } from "@tabler/icons-react";

type ProductOption = {
  slug: string;
  title: string;
  product_type: "circuit" | "excursion";
};

export function BookingForm({
  products,
  locale,
  initialSlug,
}: {
  products: ProductOption[];
  locale: string;
  initialSlug?: string;
}) {
  const t = useTranslations("reservation.form");

  const [productSlug, setProductSlug] = useState(initialSlug ?? "");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [hotel, setHotel] = useState("");
  const [requestedDate, setRequestedDate] = useState("");
  const [alternativeDate, setAlternativeDate] = useState("");
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [message, setMessage] = useState("");
  const [website, setWebsite] = useState(""); // honeypot

  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<BookingConfirmation | null>(null);

  const circuits = products.filter((p) => p.product_type === "circuit");
  const excursions = products.filter((p) => p.product_type === "excursion");

  // Empêche de demander une date passée.
  const today = new Date().toISOString().split("T")[0];

  async function handleSubmit() {
    setError(null);

    if (!productSlug || !name.trim() || !email.trim() || !requestedDate) {
      setError(t("errorRequired"));
      return;
    }

    setIsSending(true);
    try {
      const result = await createBooking({
        product_slug: productSlug,
        customer_name: name.trim(),
        customer_email: email.trim(),
        customer_phone: phone.trim() || null,
        preferred_locale: locale,
        hotel_name: hotel.trim() || null,
        requested_date: requestedDate,
        alternative_date: alternativeDate || null,
        adults,
        children,
        customer_message: message.trim() || null,
        website,
      });
      setConfirmation(result);
    } catch (err) {
      const msg = err instanceof BookingError ? err.message : t("errorUnexpected");
      setError(msg);
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
        <p className="mt-3 text-sm leading-relaxed text-stone-600">
          {confirmation.message}
        </p>
        <p className="mt-4 inline-block rounded-full bg-[#1d4e5f]/8 px-4 py-2 text-sm font-medium text-[#1d4e5f]">
          {t("reference")} : {confirmation.reference}
        </p>
        <p className="mt-4 text-xs text-stone-500">
          {t("successNote", { product: confirmation.product_title })}
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-[#1d4e5f]/10 bg-white p-6 shadow-[0_16px_40px_-16px_rgba(8,34,43,0.25)] sm:p-8">
      <div className="space-y-5">
        <label className="block text-sm">
          <span className="font-medium text-stone-900">{t("product")} *</span>
          <select
            value={productSlug}
            onChange={(e) => setProductSlug(e.target.value)}
            className="mt-1.5 block w-full rounded-xl border border-stone-300 p-3 text-sm focus:border-[#1d4e5f] focus:outline-none"
          >
            <option value="">{t("productPlaceholder")}</option>
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
              className="mt-1.5 block w-full rounded-xl border border-stone-300 p-3 text-sm focus:border-[#1d4e5f] focus:outline-none"
            />
          </label>

          <label className="block text-sm">
            <span className="font-medium text-stone-900">{t("email")} *</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1.5 block w-full rounded-xl border border-stone-300 p-3 text-sm focus:border-[#1d4e5f] focus:outline-none"
            />
          </label>

          <label className="block text-sm">
            <span className="font-medium text-stone-900">{t("phone")}</span>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+261 32 00 000 00"
              className="mt-1.5 block w-full rounded-xl border border-stone-300 p-3 text-sm focus:border-[#1d4e5f] focus:outline-none"
            />
          </label>

          <label className="block text-sm">
            <span className="font-medium text-stone-900">{t("hotel")}</span>
            <input
              type="text"
              value={hotel}
              onChange={(e) => setHotel(e.target.value)}
              placeholder={t("hotelPlaceholder")}
              className="mt-1.5 block w-full rounded-xl border border-stone-300 p-3 text-sm focus:border-[#1d4e5f] focus:outline-none"
            />
          </label>

          <label className="block text-sm">
            <span className="font-medium text-stone-900">{t("date")} *</span>
            <input
              type="date"
              value={requestedDate}
              min={today}
              onChange={(e) => setRequestedDate(e.target.value)}
              className="mt-1.5 block w-full rounded-xl border border-stone-300 p-3 text-sm focus:border-[#1d4e5f] focus:outline-none"
            />
          </label>

          <label className="block text-sm">
            <span className="font-medium text-stone-900">{t("alternativeDate")}</span>
            <input
              type="date"
              value={alternativeDate}
              min={today}
              onChange={(e) => setAlternativeDate(e.target.value)}
              className="mt-1.5 block w-full rounded-xl border border-stone-300 p-3 text-sm focus:border-[#1d4e5f] focus:outline-none"
            />
          </label>

          <label className="block text-sm">
            <span className="font-medium text-stone-900">{t("adults")} *</span>
            <input
              type="number"
              min={1}
              max={50}
              value={adults}
              onChange={(e) => setAdults(Number(e.target.value))}
              className="mt-1.5 block w-full rounded-xl border border-stone-300 p-3 text-sm focus:border-[#1d4e5f] focus:outline-none"
            />
          </label>

          <label className="block text-sm">
            <span className="font-medium text-stone-900">{t("children")}</span>
            <input
              type="number"
              min={0}
              max={50}
              value={children}
              onChange={(e) => setChildren(Number(e.target.value))}
              className="mt-1.5 block w-full rounded-xl border border-stone-300 p-3 text-sm focus:border-[#1d4e5f] focus:outline-none"
            />
          </label>
        </div>

        <label className="block text-sm">
          <span className="font-medium text-stone-900">{t("message")}</span>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
            placeholder={t("messagePlaceholder")}
            className="mt-1.5 block w-full rounded-xl border border-stone-300 p-3 text-sm focus:border-[#1d4e5f] focus:outline-none"
          />
        </label>

        {/* Champ piège : masqué à l'écran, rempli seulement par les robots. */}
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
          <p className="flex items-start gap-2 rounded-xl bg-red-50 p-3 text-sm text-red-700">
            <IconAlertCircle size={18} className="mt-0.5 shrink-0" />
            {error}
          </p>
        )}

        <button
          type="button"
          onClick={handleSubmit}
          disabled={isSending}
          className="flex w-full items-center justify-center rounded-full bg-gradient-to-r from-[#F4A261] to-[#E76F51] px-8 py-4 text-sm font-semibold text-white shadow-[0_14px_30px_-12px_rgba(231,111,81,0.85)] transition-transform hover:-translate-y-0.5 disabled:opacity-60"
        >
          {isSending ? t("sending") : t("submit")}
        </button>

        <p className="text-center text-xs text-stone-500">{t("privacy")}</p>
      </div>
    </div>
  );
}