// apps/web/src/components/contact/ContactForm.tsx
"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { submitContact, ContactError } from "@/lib/api/contact";
import { IconCheck, IconAlertCircle, IconAsterisk } from "@tabler/icons-react";

export function ContactForm({ locale }: { locale: string }) {
  const t = useTranslations("contact.form");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [website, setWebsite] = useState(""); // honeypot

  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSent, setIsSent] = useState(false);

  async function handleSubmit() {
    setError(null);

    // Le backend impose 20 caractères : autant le dire avant l'aller-retour.
    if (!name.trim() || !email.trim() || message.trim().length < 20) {
      setError(t("errorRequired"));
      return;
    }

    setIsSending(true);
    try {
      await submitContact({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim() || null,
        subject: subject.trim() || null,
        message: message.trim(),
        locale,
        website,
      });
      setIsSent(true);
    } catch (err) {
      setError(
        err instanceof ContactError && err.message ? err.message : t("errorUnexpected"),
      );
    } finally {
      setIsSending(false);
    }
  }

  if (isSent) {
    return (
      <div className="rounded-3xl border border-[#1d4e5f]/10 bg-white p-8 text-center shadow-[0_16px_40px_-16px_rgba(8,34,43,0.25)]">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-emerald-50 text-emerald-600">
          <IconCheck size={28} stroke={2} />
        </span>
        <h2 className="mt-5 font-[family-name:var(--font-courgette)] text-2xl text-stone-900">
          {t("successTitle")}
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-stone-600">
          {t("successMessage")}
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-[#1d4e5f]/10 bg-white p-6 shadow-[0_16px_40px_-16px_rgba(8,34,43,0.25)] sm:p-8">
      <div className="space-y-5">
        <p className="flex gap-2 text-xs leading-relaxed text-stone-500">
          <IconAsterisk size={15} stroke={2} className="mt-0.5 shrink-0 text-[#E76F51]" />
          {t("requiredNote")}
        </p>

        <div className="grid gap-5 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="font-medium text-stone-900">{t("name")} *</span>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError(null);
              }}
              maxLength={150}
              className="mt-1.5 w-full rounded-xl border border-stone-300 px-3 py-2.5 text-sm"
            />
          </label>

          <label className="block text-sm">
            <span className="font-medium text-stone-900">{t("email")} *</span>
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError(null);
              }}
              className="mt-1.5 w-full rounded-xl border border-stone-300 px-3 py-2.5 text-sm"
            />
          </label>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="font-medium text-stone-900">{t("phone")}</span>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              maxLength={40}
              placeholder={t("phonePlaceholder")}
              className="mt-1.5 w-full rounded-xl border border-stone-300 px-3 py-2.5 text-sm"
            />
          </label>

          <label className="block text-sm">
            <span className="font-medium text-stone-900">{t("subject")}</span>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              maxLength={250}
              placeholder={t("subjectPlaceholder")}
              className="mt-1.5 w-full rounded-xl border border-stone-300 px-3 py-2.5 text-sm"
            />
          </label>
        </div>

        <label className="block text-sm">
          <span className="font-medium text-stone-900">{t("message")} *</span>
          <textarea
            value={message}
            onChange={(e) => {
              setMessage(e.target.value);
              setError(null);
            }}
            rows={6}
            maxLength={5000}
            placeholder={t("messagePlaceholder")}
            className="mt-1.5 w-full rounded-xl border border-stone-300 px-3 py-2.5 text-sm"
          />
          <span
            className={`mt-1 block text-xs ${
              message.trim().length > 0 && message.trim().length < 20
                ? "text-[#E76F51]"
                : "text-stone-400"
            }`}
          >
            {t("messageHint", { min: 20, current: message.trim().length })}
          </span>
        </label>

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