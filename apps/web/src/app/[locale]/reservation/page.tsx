// apps/web/src/app/[locale]/reservation/page.tsx
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { PageHero } from "@/components/layout/PageHero";
import { SectionBackdrop } from "@/components/ui/SectionBackdrop";
import { Squiggle } from "@/components/ui/Doodles";
import { BookingForm } from "@/components/booking/BookingForm";
import { getProducts } from "@/lib/api/products";
import { buildBreadcrumbSchema } from "@/lib/schema/breadcrumb";
import { routing } from "@/i18n/routing";

type Params = Promise<{ locale: string }>;
type SearchParams = Promise<{ produit?: string }>;

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
  const t = await getTranslations({ locale, namespace: "reservation.meta" });

  return {
    title: t("title"),
    description: t("description"),
    alternates: { canonical: `/${locale}/reservation` },
  };
}

export default async function ReservationPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  const { locale } = await params;
  const { produit } = await searchParams;
  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: "reservation" });
  const tNav = await getTranslations({ locale, namespace: "nav" });

  const { items } = await getProducts(locale, { limit: 100 });
  const products = items.map((p) => ({
    slug: p.slug,
    title: p.title,
    product_type: p.product_type,
  }));

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
          <div className="mb-8 text-center">
            <h2 className="font-[family-name:var(--font-courgette)] text-2xl text-stone-900 sm:text-3xl">
              {t("formTitle")}
            </h2>
            <Squiggle className="mx-auto mt-2 h-2 w-24 opacity-50" color="#F4A261" />
            <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-stone-600">
              {t("formIntro")}
            </p>
          </div>

          <BookingForm products={products} locale={locale} initialSlug={produit} />
        </div>
      </main>
    </div>
  );
}