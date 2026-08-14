import type { Metadata } from "next";
import Image from "next/image";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { PageHero } from "@/components/layout/PageHero";
import { SectionBackdrop } from "@/components/ui/SectionBackdrop";
import { Sparkle, Squiggle, HalfBurst } from "@/components/ui/Doodles";
import { aboutValues, aboutPillars, aboutFaqKeys, aboutStats } from "@/lib/about-data";
import { buildBreadcrumbSchema } from "@/lib/schema/breadcrumb";
import { buildFaqSchema } from "@/lib/schema/faqPage";
import { buildTravelAgencySchema } from "@/lib/schema/travelAgency";
import { businessInfo } from "@/lib/nav-config";
import {
  IconCompass,
  IconLeaf,
  IconHeartHandshake,
  IconClock,
  IconUsers,
  IconMapPin,
  IconUserCheck,
  IconChevronDown,
  IconArrowRight,
} from "@tabler/icons-react";

type Params = Promise<{ locale: string }>;

type IconCmp = React.ComponentType<{ size?: number; stroke?: number; className?: string }>;

const VALUE_ICONS: Record<string, IconCmp> = {
  authenticite: IconCompass,
  respect: IconLeaf,
  partage: IconHeartHandshake,
};

const PILLAR_ICONS: Record<string, IconCmp> = {
  assistance: IconClock,
  equipe: IconUsers,
  local: IconMapPin,
  groupes: IconUserCheck,
};

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "about.meta" });

  return {
    title: t("title"),
    description: t("description"),
    alternates: { canonical: `/${locale}/apropos` },
    openGraph: {
      title: t("title"),
      description: t("description"),
      type: "website",
      images: [{ url: "/images/og/apropos.jpg", alt: t("ogAlt") }],
    },
  };
}

export default async function AProposPage({ params }: { params: Params }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: "about" });
  const tNav = await getTranslations({ locale, namespace: "nav" });

  const faqEntries = aboutFaqKeys.map((key) => ({
    question: t(`faq.items.${key}.question`),
    answer: t(`faq.items.${key}.answer`),
  }));

  const jsonLd = [
    buildBreadcrumbSchema(locale, [
      { name: tNav("accueil"), path: "/" },
      { name: t("breadcrumb") },
    ]),
    buildFaqSchema(faqEntries),
    buildTravelAgencySchema(locale, t("meta.description")),
    {
      "@context": "https://schema.org",
      "@type": "AboutPage",
      name: t("pageTitle"),
      description: t("meta.description"),
      url: `${businessInfo.url}/${locale}/apropos`,
      mainEntity: { "@id": `${businessInfo.url}/#organization` },
    },
  ];

  return (
    <div className="bg-[#FDFAF6]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <PageHero
        title={t("pageTitle")}
        eyebrow={t("eyebrow")}
        intro={t("pageIntro")}
        image="/images/hero/nosy-iranja.jpg"
        imageAlt=""
        breadcrumb={[
          { label: tNav("accueil"), href: "/" },
          { label: t("breadcrumb") },
        ]}
      />

      <main className="relative isolate z-10 -mt-8 overflow-hidden rounded-t-[2rem] bg-[#FDFAF6] shadow-[0_-12px_40px_-12px_rgba(8,34,43,0.25)]">
        <SectionBackdrop />

        <div className="relative mx-auto max-w-6xl px-4 pb-24 pt-14 sm:px-6 sm:pt-16 lg:px-8">

          {/* ── Valeurs ──────────────────────────────────────────────── */}
          <section aria-labelledby="valeurs-title">
            <div className="max-w-2xl">
              <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-[#E76F51]">
                <Sparkle className="h-3.5 w-3.5 shrink-0" color="#E76F51" />
                {t("breadcrumb")}
              </p>
              <h2
                id="valeurs-title"
                className="mt-2 font-[family-name:var(--font-courgette)] text-3xl text-stone-900 sm:text-4xl"
              >
                {t("values.title")}
              </h2>
              <Squiggle className="mt-2 h-2 w-28 opacity-50" color="#F4A261" />
              <p className="mt-4 text-base leading-relaxed text-stone-600">
                {t("values.subtitle")}
              </p>
            </div>

            <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
              {aboutValues.map(({ key }) => {
                const Icon = VALUE_ICONS[key];
                return (
                  <li
                    key={key}
                    className="rounded-3xl border border-[#1d4e5f]/10 bg-white p-6 shadow-[0_2px_12px_-4px_rgba(8,34,43,0.10)] transition-shadow hover:shadow-[0_16px_40px_-18px_rgba(8,34,43,0.28)]"
                  >
                    <span className="inline-grid h-11 w-11 place-items-center rounded-2xl bg-[#1d4e5f]/8 text-[#1d4e5f]">
                      <Icon size={22} stroke={1.7} />
                    </span>
                    <h3 className="mt-4 text-lg font-semibold text-stone-900">
                      {t(`values.${key}.title`)}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-stone-600">
                      {t(`values.${key}.text`)}
                    </p>
                  </li>
                );
              })}
            </ul>
          </section>

          {/* ── Fondateur ────────────────────────────────────────────── */}
          <section aria-labelledby="histoire-title" className="mt-24 lg:mt-28">
            <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,45%)] lg:items-start lg:gap-14">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#E76F51]">
                  {t("founder.eyebrow")}
                </p>
                <h2
                  id="histoire-title"
                  className="mt-2 font-[family-name:var(--font-courgette)] text-3xl text-stone-900 sm:text-4xl"
                >
                  {t("founder.title")}
                </h2>

                <div className="mt-5 space-y-4 text-base leading-relaxed text-stone-600">
                  <p>{t("founder.p1")}</p>
                  <p>{t("founder.p2")}</p>
                  <p>{t("founder.p3")}</p>
                  <p>{t("founder.p4")}</p>
                </div>

                <figure className="mt-8 border-l-2 border-[#F4A261] pl-5">
                  <p className="text-sm text-stone-500">{t("founder.quoteIntro")}</p>
                  <blockquote className="mt-1 font-[family-name:var(--font-courgette)] text-2xl leading-snug text-[#1d4e5f]">
                    «&nbsp;{t("founder.quote")}&nbsp;»
                  </blockquote>
                  <figcaption className="mt-2 text-sm text-stone-600">
                    {t("founder.quoteAfter")}
                  </figcaption>
                </figure>
              </div>

              <div className="relative">
                <div className="relative aspect-[4/5] overflow-hidden rounded-3xl">
                  <Image
                    src="/images/hero/lokobe.jpg"
                    alt={t("founder.imageAlt")}
                    fill
                    sizes="(min-width: 1024px) 45vw, 100vw"
                    className="object-cover"
                  />
                </div>

                <HalfBurst
                  className="absolute -left-5 -top-4 h-10 w-12 opacity-70"
                  color="#F4A261"
                />

                {/* Carte statistique flottante */}
                <div className="absolute -bottom-6 left-4 right-4 rounded-2xl border border-[#1d4e5f]/10 bg-white/95 p-4 shadow-[0_18px_40px_-18px_rgba(8,34,43,0.45)] backdrop-blur-sm sm:left-6 sm:right-auto sm:w-64">
                  <dl className="grid grid-cols-2 gap-4">
                    <div>
                      <dt className="text-[11px] uppercase tracking-wider text-stone-500">
                        {t("stats.destinations")}
                      </dt>
                      <dd className="mt-0.5 text-2xl font-bold text-[#1d4e5f]">
                        {aboutStats.destinations}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-[11px] uppercase tracking-wider text-stone-500">
                        {t("stats.languages")}
                      </dt>
                      <dd className="mt-0.5 text-2xl font-bold text-[#1d4e5f]">
                        {t("stats.languagesValue")}
                      </dd>
                    </div>
                  </dl>
                  <p className="mt-3 border-t border-stone-200 pt-2.5 text-xs text-stone-600">
                    {t("stats.years", { count: aboutStats.yearsActive })} ·{" "}
                    {t("stats.groupSizeValue")} {t("stats.groupSize").toLowerCase()}
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* ── Mission + piliers ────────────────────────────────────── */}
          <section aria-labelledby="mission-title" className="mt-32 lg:mt-36">
            <div className="max-w-2xl">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#E76F51]">
                {t("mission.eyebrow")}
              </p>
              <h2
                id="mission-title"
                className="mt-2 font-[family-name:var(--font-courgette)] text-3xl text-stone-900 sm:text-4xl"
              >
                {t("mission.title")}
              </h2>
              <p className="mt-4 text-base leading-relaxed text-stone-600">
                {t("mission.text")}
              </p>
            </div>

            <h3 className="mt-12 text-sm font-bold uppercase tracking-[0.14em] text-stone-500">
              {t("pillars.title")}
            </h3>

            <ul className="mt-6 grid gap-x-8 gap-y-8 sm:grid-cols-2">
              {aboutPillars.map(({ key }) => {
                const Icon = PILLAR_ICONS[key];
                return (
                  <li key={key} className="flex gap-4">
                    <span className="mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#F4A261]/15 text-[#E76F51]">
                      <Icon size={20} stroke={1.7} />
                    </span>
                    <div>
                      <h4 className="text-base font-semibold text-stone-900">
                        {t(`pillars.${key}.title`)}
                      </h4>
                      <p className="mt-1.5 text-sm leading-relaxed text-stone-600">
                        {t(`pillars.${key}.text`)}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>

          {/* ── FAQ (visible : requis par Google pour le balisage) ───── */}
          <section aria-labelledby="faq-title" className="mt-24 lg:mt-28">
            <div className="max-w-2xl">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#E76F51]">
                {t("faq.eyebrow")}
              </p>
              <h2
                id="faq-title"
                className="mt-2 font-[family-name:var(--font-courgette)] text-3xl text-stone-900 sm:text-4xl"
              >
                {t("faq.title")}
              </h2>
              <Squiggle className="mt-2 h-2 w-28 opacity-50" color="#F4A261" />
            </div>

            <div className="mt-8 divide-y divide-stone-200 border-y border-stone-200">
              {aboutFaqKeys.map((key) => (
                <details key={key} className="group py-4">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-left text-base font-medium text-stone-900 marker:content-none">
                    {t(`faq.items.${key}.question`)}
                    <IconChevronDown
                      size={18}
                      stroke={2}
                      className="shrink-0 text-[#1d4e5f] transition-transform duration-300 group-open:rotate-180"
                    />
                  </summary>
                  <p className="mt-3 max-w-3xl text-sm leading-relaxed text-stone-600">
                    {t(`faq.items.${key}.answer`)}
                  </p>
                </details>
              ))}
            </div>
          </section>

          {/* ── CTA / maillage interne ───────────────────────────────── */}
          <section
            aria-labelledby="cta-title"
            className="mt-24 overflow-hidden rounded-3xl bg-[#1d4e5f] px-6 py-12 sm:px-10 sm:py-14 lg:mt-28"
          >
            <div className="mx-auto max-w-2xl text-center">
              <h2
                id="cta-title"
                className="font-[family-name:var(--font-courgette)] text-3xl text-white sm:text-4xl"
              >
                {t("cta.title")}
              </h2>
              <p className="mt-4 text-base leading-relaxed text-white/80">
                {t("cta.text")}
              </p>

              <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                <Link
                  href="/circuits"
                  className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#F4A261] to-[#E76F51] px-6 py-3 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5"
                >
                  {t("cta.circuits")}
                  <IconArrowRight size={16} stroke={2} />
                </Link>
                <Link
                  href="/excursions"
                  className="inline-flex items-center gap-2 rounded-full border border-white/30 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10"
                >
                  {t("cta.excursions")}
                  <IconArrowRight size={16} stroke={2} />
                </Link>
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-2 px-3 py-3 text-sm font-medium text-white/70 underline-offset-4 transition-colors hover:text-white hover:underline"
                >
                  {t("cta.contact")}
                </Link>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
