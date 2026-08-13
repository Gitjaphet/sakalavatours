import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { excursionsSorted } from "@/lib/excursions-data";
import { ExcursionCard } from "@/components/excursions/ExcursionCard";
import { PageHero } from "@/components/layout/PageHero";
import { SectionBackdrop } from "@/components/ui/SectionBackdrop";
import { Sparkle, Squiggle } from "@/components/ui/Doodles";

type Params = Promise<{ locale: string }>;

const HOME_LABEL: Record<string, string> = {
  fr: "Accueil",
  en: "Home",
  de: "Startseite",
};

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "excursions.meta" });

  return {
    title: t("title"),
    description: t("description"),
    alternates: {
      canonical: `/${locale}/excursions`,
    },
    openGraph: {
      title: t("title"),
      description: t("description"),
      images: [{ url: "/images/og/excursions.jpg", alt: t("ogAlt") }],
    },
  };
}

export default async function ExcursionsPage({ params }: { params: Params }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: "excursions" });

  return (
    <div className="bg-[#FDFAF6]">
      <PageHero
        title={t("pageTitle")}
        intro={t("pageIntro")}
        image="/images/hero/nosy-tanikely.jpg"
        imageAlt=""
        breadcrumb={[
          { label: HOME_LABEL[locale] ?? HOME_LABEL.fr, href: "/" },
          { label: t("breadcrumb") },
        ]}
      />

      <main className="relative isolate z-10 -mt-8 overflow-hidden rounded-t-[2rem] bg-[#FDFAF6] shadow-[0_-12px_40px_-12px_rgba(8,34,43,0.25)]">
        <SectionBackdrop />

        <div className="relative mx-auto max-w-6xl px-4 pb-24 pt-10 sm:px-6 sm:pt-12 lg:px-8">
          <div className="mb-8 flex items-end justify-between border-b border-stone-200 pb-4">
            <div className="relative">
              <p className="flex items-center gap-2 text-sm font-medium tracking-wide text-stone-600">
                <Sparkle className="h-3.5 w-3.5 shrink-0" color="#E76F51" />
                {t("count", { count: excursionsSorted.length })}
              </p>
              <Squiggle className="mt-1 h-2 w-24 opacity-50" color="#F4A261" />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2 xl:gap-7">
            {excursionsSorted.map((excursion) => (
              <ExcursionCard key={excursion.id} excursion={excursion} />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
