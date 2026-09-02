// apps/web/src/app/[locale]/galerie/page.tsx
import type { Metadata } from "next";
import Image from "next/image";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { PageHero } from "@/components/layout/PageHero";
import { SectionBackdrop } from "@/components/ui/SectionBackdrop";
import { getProducts, getProduct } from "@/lib/api/products";
import { buildBreadcrumbSchema } from "@/lib/schema/breadcrumb";
import { Link } from "@/i18n/navigation";
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
  const t = await getTranslations({ locale, namespace: "galerie.meta" });

  return {
    title: t("title"),
    description: t("description"),
    alternates: { canonical: `/${locale}/galerie` },
  };
}

export default async function GaleriePage({ params }: { params: Params }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: "galerie" });
  const tNav = await getTranslations({ locale, namespace: "nav" });

  // Les galeries ne sont exposées que par la fiche détail : un appel par
  // produit. Coûteux à l'unité, sans conséquence ici — la page est
  // statique, ces requêtes ont lieu au build et non à chaque visite.
  const { items } = await getProducts(locale, { limit: 100 });
  const details = await Promise.all(
    items.map((p) => getProduct(p.slug, locale)),
  );

  const photos = details.flatMap((product) => {
    if (!product) return [];
    const path =
      product.product_type === "circuit"
        ? `/circuits/${product.slug}`
        : `/excursions/${product.slug}`;

    // La couverture d'abord : c'est l'image choisie pour représenter
    // le produit, elle mérite d'ouvrir sa série.
    const media = [
      ...(product.cover ? [product.cover] : []),
      ...product.gallery,
    ];

    return media.map((m) => ({
      ...m,
      productTitle: product.title,
      path,
    }));
  });

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

        <div className="relative mx-auto max-w-6xl px-4 pb-24 pt-14 sm:px-6 sm:pt-16 lg:px-8">
          {photos.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-stone-300 p-10 text-center text-stone-500">
              {t("empty")}
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {photos.map((photo, i) => (
                <Link
                  key={`${photo.id}-${i}`}
                  href={photo.path}
                  className="group relative aspect-square overflow-hidden rounded-2xl"
                >
                  <Image
                    src={photo.url}
                    alt={photo.alt_text || photo.productTitle}
                    fill
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-3 text-xs font-medium text-white opacity-0 transition-opacity group-hover:opacity-100">
                    {photo.productTitle}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}