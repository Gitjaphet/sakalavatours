// src/app/[locale]/excursions/[slug]/page.tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { formatDepartureMonths } from '@/lib/format/departureMonths';
import { getProduct, getProducts, getRelatedProducts } from "@/lib/api/products";
import { RelatedProducts } from "@/components/products/RelatedProducts";
import { ItineraryTimeline, type ItineraryStepData } from "@/components/products/ItineraryTimeline";
import { GalleryLightbox, type GalleryImage } from "@/components/products/GalleryLightbox";
import { PageHero } from "@/components/layout/PageHero";
import { SectionBackdrop } from "@/components/ui/SectionBackdrop";
import { Rating } from "@/components/ui/Rating";
import { Squiggle } from "@/components/ui/Doodles";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { buildBreadcrumbSchema } from "@/lib/schema/breadcrumb";
import { buildFaqSchema } from "@/lib/schema/faqPage";
import { sanitizeHtml } from "@/lib/sanitize-html";
import { buildTouristTripSchema } from "@/lib/schema/touristTrip";
import { getReviews } from "@/lib/api/reviews";
import { ReviewList } from "@/components/reviews/ReviewList";
import { ReviewFormToggle } from "@/components/reviews/ReviewFormToggle";
import {
  IconCheck,
  IconX,
  IconClock,
  IconUsers,
  IconArrowNarrowRight,
  IconChevronDown,
  IconCalendarEvent,
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

/** Formatage prix localisé — même logique que CircuitCard.tsx / circuits/[slug]. */
function formatPrice(price: number, currency: string, locale: string): string {
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(price);
  } catch {
    return `${Math.round(price)} ${currency}`;
  }
}

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
  // Une fiche excursion consultée via un circuit effacé, ou l'inverse,
  // doit rendre un 404 plutôt qu'afficher un produit du mauvais type.
  if (!product || product.product_type !== "excursion") notFound();

  // Avis de ce produit uniquement : ceux portant sur l'agence vivent sur
  // /avis, jamais le même texte sur deux URL.
  const [linkedProducts, reviews] = await Promise.all([
    getRelatedProducts(product.related_slugs, locale),
    getReviews({ productSlug: slug, limit: 50 }),
  ]);

  // Aucune fiche ne doit être un cul-de-sac : sans liaison configurée,
  // on propose d'autres excursions plutôt que de masquer la section.
  const relatedProducts =
    linkedProducts.length > 0
      ? linkedProducts
      : (await getProducts(locale, { type: "excursion", limit: 4 })).items.filter(
          (p) => p.slug !== product.slug,
        );
  // Une excursion sans couverture propre reprend celle du premier
  // circuit lié qui en a une, avant de retomber sur l'image générique.
  const heroCover =
    product.cover ?? linkedProducts.find((p) => p.cover)?.cover ?? null;
  const t = await getTranslations({ locale, namespace: "excursions" });
  const tNav = await getTranslations({ locale, namespace: "nav" });
  const levelKey = LEVEL_KEYS[product.difficulty] ?? "facile";
  // Libellés d'avis partagés avec /avis — une seule source de traduction.
  const tAvis = await getTranslations({ locale, namespace: "avis" });
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

  const itinerarySteps: ItineraryStepData[] = product.itinerary.map((step) => {
    const meta: ItineraryStepData["meta"] = [];
    if (step.location_label) {
      meta.push({ icon: "location", label: step.location_label, srLabel: t("detail.locationAria") });
    }
    if (step.hotel_name) {
      meta.push({ icon: "hotel", label: step.hotel_name, srLabel: t("detail.hotelAria") });
    }
    if (step.meal_plan) {
      meta.push({ icon: "meal", label: step.meal_plan, srLabel: t("detail.mealAria") });
    }
    if (step.distance_km !== null) {
      meta.push({
        icon: "distance",
        label: t("detail.distanceValue", { km: step.distance_km }),
        srLabel: t("detail.distanceAria"),
      });
    }
    return {
      dayLabel: step.time_label ?? t("detail.day", { number: step.day_number }),
      optionalLabel: step.is_optional ? t("detail.optional") : undefined,
      title: step.title,
      description: step.description,
      meta,
    };
  });

  const galleryImages: GalleryImage[] = product.gallery.map((media) => ({
    id: media.id,
    url: media.url,
    alt: media.alt_text || product.title,
    width: media.width,
    height: media.height,
  }));

  // Garde fiabilisée : rating_average est string | null côté API — un
  // check "truthy" laisserait passer une chaîne "0".
  const hasRating =
    product.rating_average !== null &&
    Number(product.rating_average) > 0 &&
    product.review_count > 0;

  // FAQ balisée uniquement si elle est aussi rendue visuellement plus bas
  // — condition partagée avec la section FAQ du JSX (règle Google FAQPage).
  const hasFaqs = product.faqs.length > 0;

  const jsonLd = [
    buildBreadcrumbSchema(locale, [
      { name: tNav("accueil"), path: "/" },
      { name: t("breadcrumb"), path: "/excursions" },
      { name: product.title },
    ]),
    buildTouristTripSchema(locale, {
      name: product.title,
      description: product.meta_description || product.summary,
      path: `/excursions/${product.slug}`,
      image: heroCover?.url ?? "/images/hero/nosy-tanikely.jpg",
      priceFrom: product.price_from,
      currency: product.currency,
      maxAttendees: product.group_max,
    }),
    ...(hasFaqs ? [buildFaqSchema(product.faqs)] : []),
  ];

  return (
    <div className="bg-[#FDFAF6]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <PageHero
        title={product.title}
        intro={product.subtitle ?? undefined}
        image={heroCover?.url ?? "/images/hero/nosy-tanikely.jpg"}
        imageAlt={heroCover?.alt_text ?? product.title}
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
              {hasRating && (
                <Rating value={Number(product.rating_average)} count={product.review_count} />
              )}
            </div>

            {product.is_fallback && (
              <p className="mb-4 inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-700">
                {t("detail.translationPending")}
              </p>
            )}

            {product.departure_months.length > 0 && (
              <p className="mb-4 inline-flex items-center gap-2 rounded-full bg-[#1d4e5f]/8 px-3 py-1.5 text-xs font-medium text-[#1d4e5f]">
                <IconCalendarEvent size={16} className="shrink-0" />
                {t('detail.bestPeriod', {
                  period: formatDepartureMonths(
                    product.departure_months,
                    (m: number) => t(`months.${m}`),
                    t('detail.monthRangeJoiner')
                  ),
                })}
              </p>
            )}

            {product.description && (
              <div
                className="prose prose-stone max-w-none text-[15px] leading-relaxed text-stone-700"
                dangerouslySetInnerHTML={{ __html: sanitizeHtml(product.description) }}
              />
            )}

            {product.itinerary.length > 0 && (
              <section className="mt-10">
                <h2 className="font-[family-name:var(--font-courgette)] text-2xl text-stone-900">
                  {t("detail.itineraryTitle")}
                </h2>
                <Squiggle className="mt-1 h-2 w-20 opacity-50" color="#F4A261" />
                <ItineraryTimeline steps={itinerarySteps} />
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

            {hasFaqs && (
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
          </div>

          <aside className="h-fit lg:sticky lg:top-24">
            <div className="rounded-3xl border border-[#1d4e5f]/10 bg-white p-6 shadow-[0_16px_40px_-16px_rgba(8,34,43,0.25)]">
              <p className="flex items-baseline gap-1 text-stone-900">
                <span className="text-xs text-stone-500">{t("priceLabel")}</span>
                <span className="text-3xl font-bold">
                  {formatPrice(Number(product.price_from), product.currency, locale)}
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

            {(included.length > 0 || excluded.length > 0 || product.packing_items.length > 0 || product.gallery.length > 0) && (
              <div className="mt-5 space-y-5">
                {included.length > 0 && (
                  <div className="rounded-3xl border border-[#1d4e5f]/10 bg-white p-6 shadow-[0_16px_40px_-16px_rgba(8,34,43,0.25)]">
                    <h3 className="text-sm font-semibold text-stone-900">
                      {t("detail.includedTitle")}
                    </h3>
                    <div className="mt-3 space-y-2">
                      {included.map((inc) => (
                        <p key={inc.code} className="flex items-start gap-2 text-sm text-stone-700">
                          <IconCheck size={16} stroke={2.4} className="mt-0.5 shrink-0 text-emerald-600" />
                          {inc.label}
                        </p>
                      ))}
                    </div>
                  </div>
                )}

                {excluded.length > 0 && (
                  <div className="rounded-3xl border border-[#1d4e5f]/10 bg-white p-6 shadow-[0_16px_40px_-16px_rgba(8,34,43,0.25)]">
                    <h3 className="text-sm font-semibold text-stone-900">
                      {t("detail.excludedTitle")}
                    </h3>
                    <div className="mt-3 space-y-2">
                      {excluded.map((inc) => (
                        <p key={inc.code} className="flex items-start gap-2 text-sm text-stone-400">
                          <IconX size={16} stroke={2.4} className="mt-0.5 shrink-0 text-stone-300" />
                          {inc.label}
                        </p>
                      ))}
                    </div>
                  </div>
                )}

                {product.packing_items.length > 0 && (
                  <div className="rounded-3xl border border-[#1d4e5f]/10 bg-white p-6 shadow-[0_16px_40px_-16px_rgba(8,34,43,0.25)]">
                    <h3 className="text-sm font-semibold text-stone-900">
                      {t("detail.packingTitle")}
                    </h3>
                    <ul className="mt-3 flex flex-wrap gap-2">
                      {product.packing_items.map((item) => (
                        <li
                          key={item.code}
                          className="rounded-full border border-stone-200 bg-stone-50 px-3 py-1.5 text-xs font-medium text-stone-600"
                        >
                          {item.label}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {product.gallery.length > 0 && (
                  <div className="rounded-3xl border border-[#1d4e5f]/10 bg-white p-6 shadow-[0_16px_40px_-16px_rgba(8,34,43,0.25)]">
                    <h3 className="text-sm font-semibold text-stone-900">
                      {t("detail.galleryTitle")}
                    </h3>
                    <div className="mt-3">
                      <GalleryLightbox images={galleryImages} compact />
                    </div>
                  </div>
                )}
              </div>
            )}
          </aside>

          <section className="mt-10 lg:col-span-2">
            <h2 className="font-[family-name:var(--font-courgette)] text-2xl text-stone-900">
              {t("detail.reviewsTitle")}
            </h2>
            <Squiggle className="mt-1 h-2 w-20 opacity-50" color="#F4A261" />
            <div className="mt-6">
              <ReviewList
                items={reviews.items}
                aggregate={reviews.aggregate}
                locale={locale}
                labels={{
                  empty: tAvis("empty"),
                  verified: tAvis("verified"),
                  agencyReply: tAvis("agencyReply"),
                  basedOn: tAvis("basedOn", { count: reviews.aggregate.count }),
                  traveledIn: tAvis("traveledIn"),
                  showMore: tAvis("showMore", { count: Math.max(reviews.items.length - 4, 0) }),
                  showLess: tAvis("showLess"),
                }}
              />
            </div>
            <ReviewFormToggle
              locale={locale}
              lockedProduct={{ slug: product.slug, title: product.title }}
              ctaLabel={tAvis("form.cta")}
            />
          </section>
        </div>
        <RelatedProducts products={relatedProducts} title={t("detail.relatedTitle")} intro={t("detail.relatedIntro")} seeAllHref="/excursions" seeAllLabel={t("detail.seeAll")} />
      </main>
    </div>
  );
}