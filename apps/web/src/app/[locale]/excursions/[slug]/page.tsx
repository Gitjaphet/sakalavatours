import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { getProduct, getProducts } from "@/lib/api/products";
import { PageHero } from "@/components/layout/PageHero";
import { SectionBackdrop } from "@/components/ui/SectionBackdrop";
import { Rating } from "@/components/ui/Rating";
import { Squiggle } from "@/components/ui/Doodles";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import {
  IconCheck,
  IconX,
  IconClock,
  IconUsers,
  IconArrowNarrowRight,
  IconChevronDown,
} from "@tabler/icons-react";

type Params = Promise<{ locale: string; slug: string }>;

export const revalidate = 3600;

const HOME_LABEL: Record<string, string> = {
  fr: "Accueil",
  en: "Home",
  de: "Startseite",
  it: "Home",
};

const LEVEL_KEYS: Record<string, string> = {
  easy: "facile",
  moderate: "modere",
  sporty: "sportif",
};

const FORMAT_KEYS: Record<string, string> = {
  full_day: "journee",
  half_day: "demi-journee",
  evening: "soiree",
  multi_day: "journee",
};

export async function generateStaticParams() {
  const perLocale = await Promise.all(
    routing.locales.map(async (locale) => {
      const { items } = await getProducts(locale, { type: "excursion", limit: 100 });
      return items.map((item) => ({ locale, slug: item.slug }));
    }),
  );
  return perLocale.flat();
}

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const product = await getProduct(slug, locale);
  if (!product || product.product_type !== "excursion") return {};

  return {
    title: product.meta_title || `${product.title} — Sakalava Tours`,
    description: product.meta_description || product.summary,
    alternates: { canonical: `/${locale}/excursions/${slug}` },
    openGraph: {
      title: product.meta_title || product.title,
      description: product.meta_description || product.summary,
      images: product.cover
        ? [{ url: product.cover.url, alt: product.cover.alt_text || product.title }]
        : [],
    },
  };
}

export default async function ExcursionDetailPage({ params }: { params: Params }) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const product = await getProduct(slug, locale);
  if (!product || product.product_type !== "excursion") notFound();

  const t = await getTranslations({ locale, namespace: "excursions" });
  const levelKey = LEVEL_KEYS[product.difficulty] ?? "facile";
  const formatKey = FORMAT_KEYS[product.product_format] ?? "journee";
  const included = product.inclusions.filter((i) => i.is_included);
  const excluded = product.inclusions.filter((i) => !i.is_included);

  const hoursValue = product.duration_hours ? Number(product.duration_hours) : null;
  const duration = (() => {
    if (hoursValue === null) return null;
    const h = Math.floor(hoursValue);
    const m = Math.round((hoursValue - h) * 60);
    return m > 0 ? t("durationHM", { h, m }) : t("durationH", { h });
  })();

  return (
    <div className="bg-[#FDFAF6]">
      <PageHero
        title={product.title}
        intro={product.subtitle ?? undefined}
        image={product.cover?.url ?? "/images/hero/nosy-tanikely.jpg"}
        imageAlt={product.cover?.alt_text ?? product.title}
        breadcrumb={[
          { label: HOME_LABEL[locale] ?? HOME_LABEL.fr, href: "/" },
          { label: t("breadcrumb"), href: "/excursions" },
          { label: product.title },
        ]}
      />

      <main className="relative isolate z-10 -mt-8 overflow-hidden rounded-t-[2rem] bg-[#FDFAF6] shadow-[0_-12px_40px_-12px_rgba(8,34,43,0.25)]">
        <SectionBackdrop />

        <div className="relative mx-auto grid max-w-6xl gap-10 px-4 pb-24 pt-10 sm:px-6 sm:pt-12 lg:grid-cols-[1fr_340px] lg:gap-12 lg:px-8">
          <div className="min-w-0">
            <div className="mb-6 flex flex-wrap items-center gap-2 text-xs font-medium">
              {product.region_label && (
                <span className="rounded-md bg-[#1d4e5f]/8 px-2.5 py-1 uppercase tracking-wider text-[#1d4e5f]">
                  {product.region_label}
                </span>
              )}
              <span className="rounded-full bg-amber-50 px-2.5 py-1 text-amber-800">
                {t(`levels.${levelKey}`)}
              </span>
              {product.rating_average && product.review_count > 0 && (
                <Rating value={Number(product.rating_average)} count={product.review_count} />
              )}
            </div>

            {product.description && (
              <p className="whitespace-pre-line text-[15px] leading-relaxed text-stone-700">
                {product.description}
              </p>
            )}

            {product.itinerary.length > 0 && (
              <section className="mt-10">
                <h2 className="font-[family-name:var(--font-courgette)] text-2xl text-stone-900">
                  {t("detail.itineraryTitle")}
                </h2>
                <Squiggle className="mt-1 h-2 w-20 opacity-50" color="#F4A261" />
                <ol className="mt-6 space-y-5 border-l-2 border-[#1d4e5f]/15 pl-6">
                  {product.itinerary.map((step, i) => (
                    <li key={i} className="relative">
                      <span
                        aria-hidden="true"
                        className="absolute -left-[1.95rem] top-1 h-3 w-3 rounded-full bg-[#F4A261]"
                      />
                      <p className="text-xs font-semibold uppercase tracking-wide text-[#1d4e5f]">
                        {step.time_label ?? t("detail.day", { number: step.day_number })}
                        {step.is_optional && ` · ${t("detail.optional")}`}
                      </p>
                      <h3 className="mt-1 text-base font-semibold text-stone-900">{step.title}</h3>
                      {step.description && (
                        <p className="mt-1 text-sm leading-relaxed text-stone-600">
                          {step.description}
                        </p>
                      )}
                    </li>
                  ))}
                </ol>
              </section>
            )}

            {(included.length > 0 || excluded.length > 0) && (
              <section className="mt-10">
                <h2 className="font-[family-name:var(--font-courgette)] text-2xl text-stone-900">
                  {t("detail.inclusionsTitle")}
                </h2>
                <Squiggle className="mt-1 h-2 w-20 opacity-50" color="#F4A261" />
                <div className="mt-6 grid gap-x-8 gap-y-2 sm:grid-cols-2">
                  {included.map((inc) => (
                    <p key={inc.code} className="flex items-start gap-2 text-sm text-stone-700">
                      <IconCheck size={16} stroke={2.4} className="mt-0.5 shrink-0 text-emerald-600" />
                      {inc.label}
                    </p>
                  ))}
                  {excluded.map((inc) => (
                    <p key={inc.code} className="flex items-start gap-2 text-sm text-stone-400">
                      <IconX size={16} stroke={2.4} className="mt-0.5 shrink-0 text-stone-300" />
                      {inc.label}
                    </p>
                  ))}
                </div>
              </section>
            )}

            {product.packing_items.length > 0 && (
              <section className="mt-10">
                <h2 className="font-[family-name:var(--font-courgette)] text-2xl text-stone-900">
                  {t("detail.packingTitle")}
                </h2>
                <Squiggle className="mt-1 h-2 w-20 opacity-50" color="#F4A261" />
                <ul className="mt-6 flex flex-wrap gap-2">
                  {product.packing_items.map((item) => (
                    <li
                      key={item.code}
                      className="rounded-full border border-stone-200 bg-white px-3 py-1.5 text-xs font-medium text-stone-600"
                    >
                      {item.label}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {product.practical_info && (
              <section className="mt-10">
                <h2 className="font-[family-name:var(--font-courgette)] text-2xl text-stone-900">
                  {t("detail.practicalTitle")}
                </h2>
                <Squiggle className="mt-1 h-2 w-20 opacity-50" color="#F4A261" />
                <p className="mt-6 whitespace-pre-line text-sm leading-relaxed text-stone-600">
                  {product.practical_info}
                </p>
              </section>
            )}

            {product.faqs.length > 0 && (
              <section className="mt-10">
                <h2 className="font-[family-name:var(--font-courgette)] text-2xl text-stone-900">
                  {t("detail.faqTitle")}
                </h2>
                <Squiggle className="mt-1 h-2 w-20 opacity-50" color="#F4A261" />
                <div className="mt-6 divide-y divide-stone-200 border-y border-stone-200">
                  {product.faqs.map((faq, i) => (
                    <details key={i} className="group py-4">
                      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-semibold text-stone-900">
                        {faq.question}
                        <IconChevronDown
                          size={18}
                          className="shrink-0 text-stone-400 transition-transform group-open:rotate-180"
                        />
                      </summary>
                      <p className="mt-2 text-sm leading-relaxed text-stone-600">{faq.answer}</p>
                    </details>
                  ))}
                </div>
              </section>
            )}

            {product.gallery.length > 0 && (
              <section className="mt-10">
                <h2 className="font-[family-name:var(--font-courgette)] text-2xl text-stone-900">
                  {t("detail.galleryTitle")}
                </h2>
                <Squiggle className="mt-1 h-2 w-20 opacity-50" color="#F4A261" />
                <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {product.gallery.map((media) => (
                    <div key={media.id} className="relative aspect-square overflow-hidden rounded-2xl">
                      <Image
                        src={media.url}
                        alt={media.alt_text || product.title}
                        fill
                        className="object-cover"
                      />
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>

          <aside className="h-fit lg:sticky lg:top-24">
            <div className="rounded-3xl border border-[#1d4e5f]/10 bg-white p-6 shadow-[0_16px_40px_-16px_rgba(8,34,43,0.25)]">
              <p className="flex items-baseline gap-1 text-stone-900">
                <span className="text-xs text-stone-500">{t("priceLabel")}</span>
                <span className="text-3xl font-bold">
                  {Math.round(Number(product.price_from))}
                  {product.currency === "EUR" ? "€" : ` ${product.currency}`}
                </span>
                <span className="text-xs text-stone-500">{t("perPerson")}</span>
              </p>

              <div className="mt-4 space-y-2.5 border-t border-stone-100 pt-4 text-sm text-stone-600">
                <p className="flex items-center gap-2">
                  <IconClock size={16} className="text-[#1d4e5f]" />
                  {t(`formats.${formatKey}`)}
                  {duration && ` · ${duration}`}
                </p>
                {product.departure_time && product.return_time && (
                  <p className="flex items-center gap-1.5">
                    <IconArrowNarrowRight size={16} className="text-[#1d4e5f]" />
                    {t("departAt", { time: product.departure_time.slice(0, 5) })}
                    {" → "}
                    {product.return_time.slice(0, 5)}
                  </p>
                )}
                <p className="flex items-center gap-2">
                  <IconUsers size={16} className="text-[#1d4e5f]" />
                  {t("group", { min: product.group_min, max: product.group_max })}
                  {product.hotel_pickup && ` · ${t("pickup")}`}
                </p>
              </div>

              <Link
                href={`/reservation?produit=${product.slug}`}
                className="mt-6 flex w-full items-center justify-center rounded-full bg-gradient-to-r from-[#F4A261] to-[#E76F51] px-6 py-3.5 text-sm font-semibold text-white shadow-[0_14px_30px_-10px_rgba(231,111,81,0.8)] transition-transform hover:-translate-y-0.5"
              >
                {t("detail.bookCta")}
              </Link>
              <Link
                href="/contact"
                className="mt-3 flex w-full items-center justify-center rounded-full border border-stone-200 px-6 py-3 text-sm font-medium text-stone-700 transition-colors hover:bg-stone-50"
              >
                {t("detail.callCta")}
              </Link>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}