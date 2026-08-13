// src/components/ui/ComingSoon.tsx
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { telHref } from "@/lib/nav-config";

export function ComingSoon({ pageKey }: { pageKey: string }) {
  const t = useTranslations("pages");

  return (
    <main className="relative flex min-h-[60vh] flex-col items-center justify-center overflow-hidden bg-[#0b2a35] px-5 py-24 text-center sm:py-32">
      {/* Halo décoratif — rappelle le dégradé couchant de la marque */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-0 h-[420px] w-[720px] max-w-none -translate-x-1/2 -translate-y-1/3 rounded-full bg-[#E76F51]/18 blur-[120px]"
      />

      <div className="relative z-10 flex max-w-xl flex-col items-center">
        <span className="rounded-full border border-white/15 bg-white/8 px-4 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#F4A261] backdrop-blur-sm">
          {t("comingSoon.badge")}
        </span>

        <h1 className="mt-7 font-[family-name:var(--font-courgette)] text-[clamp(2.25rem,7vw,3.5rem)] font-normal leading-[1.1] text-white">
          {t(`${pageKey}.title`)}
        </h1>

        <p className="mt-5 max-w-[46ch] text-[15px] leading-relaxed text-white/70 sm:text-base">
          {t(`${pageKey}.text`)}
        </p>

        <div className="mt-9 flex w-full max-w-[380px] flex-col gap-3 sm:max-w-none sm:flex-row sm:justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-[#F4A261] to-[#E76F51] px-7 py-3.5 text-sm font-semibold text-white shadow-[0_14px_30px_-10px_rgba(231,111,81,0.8)] transition-transform duration-300 hover:-translate-y-0.5"
          >
            {t("comingSoon.backHome")}
          </Link>

          <a
            href={telHref}
            className="inline-flex items-center justify-center rounded-full bg-white/10 px-7 py-3.5 text-sm font-medium text-white/90 ring-1 ring-white/25 backdrop-blur-md transition-colors duration-300 hover:bg-white/20 hover:text-white"
          >
            {t("comingSoon.callUs")}
          </a>
        </div>
      </div>
    </main>
  );
}