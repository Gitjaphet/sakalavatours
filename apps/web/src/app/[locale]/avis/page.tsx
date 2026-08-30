// apps/web/src/app/[locale]/avis/page.tsx
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { PageHero } from "@/components/layout/PageHero";
import { SectionBackdrop } from "@/components/ui/SectionBackdrop";
import { Squiggle } from "@/components/ui/Doodles";
import { ReviewList } from "@/components/reviews/ReviewList";
import { ReviewForm } from "@/components/reviews/ReviewForm";
import { getReviews } from "@/lib/api/reviews";
import { getProducts } from "@/lib/api/products";
import { buildBreadcrumbSchema } from "@/lib/schema/breadcrumb";
import { routing } from "@/i18n/routing";

type Params = Promise<{ locale: string }>;

export const revalidate = 3600;

export async function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "avis.meta" });

  return {
    title: t("title"),
    description: t("description"),
    alternates: { canonical: `/${locale}/avis` },
  };
}

export default async function AvisPage({ params }: { params: Params }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: "avis" });
  const tNav = await getTranslations({ locale, namespace: "nav" });

  // Sans product_slug : uniquement les avis portant sur l'agence. Les avis
  // d'un produit vivent sur sa fiche — jamais le même texte sur deux URL.
  const [{ items, aggregate }, catalogue] = await Promise.all([
    getReviews({ limit: 50 }),
    // Plafond de l'API : 100 par appel.
    getProducts(locale, { limit: 100 }),
  ]);

  const products = catalogue.items.map((p) => ({
    slug: p.slug,
    title: p.title,
    product_type: p.product_type,
  }));

  // Pas de JSON-LD d'entité ici : le TravelAgency est déclaré sur /apropos,
  // et c'est là que l'aggregateRating devra être rattaché. Deux entités du
  // même type sur deux URL sèmeraient la confusion.
  const jsonLd = [
    buildBreadcrumbSchema(locale, [
      { name: tNav("accueil"), path: "/" },
      { name: t("breadcrumb") },
    ]),
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

        <div className="relative mx-auto max-w-3xl px-4 pb-24 pt-14 sm:px-6 sm:pt-16 lg:px-8">
          <div className="mb-10 text-center">
            <h2 className="font-[family-name:var(--font-courgette)] text-2xl text-stone-900 sm:text-3xl">
              {t("listTitle")}
            </h2>
            <Squiggle className="mx-auto mt-2 h-2 w-24 opacity-50" color="#F4A261" />
          </div>

          <ReviewList
            items={items}
            aggregate={aggregate}
            locale={locale}
            labels={{
              empty: t("empty"),
              verified: t("verified"),
              agencyReply: t("agencyReply"),
              basedOn: t("basedOn", { count: aggregate.count }),
              traveledIn: t("traveledIn"),
            }}
          />

          <div className="mt-16 mb-8 text-center">
            <h2 className="font-[family-name:var(--font-courgette)] text-2xl text-stone-900 sm:text-3xl">
              {t("form.sectionTitle")}
            </h2>
            <Squiggle className="mx-auto mt-2 h-2 w-24 opacity-50" color="#F4A261" />
            <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-stone-600">
              {t("form.sectionIntro")}
            </p>
          </div>

          <ReviewForm products={products} locale={locale} />
        </div>
      </main>
    </div>
  );
}