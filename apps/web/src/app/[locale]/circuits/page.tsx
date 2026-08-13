import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { circuitsSorted } from "@/lib/circuits-data";
import { CircuitCard } from "@/components/circuits/CircuitCard";
import { PageHero } from "@/components/layout/PageHero";
import { SectionBackdrop } from "@/components/ui/SectionBackdrop";

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
  const t = await getTranslations({ locale, namespace: "circuits.meta" });

  return {
    title: t("title"),
    description: t("description"),
    alternates: {
      canonical: `/${locale}/circuits`,
    },
    openGraph: {
      title: t("title"),
      description: t("description"),
      images: [{ url: "/images/og/circuits.jpg", alt: t("ogAlt") }],
    },
  };
}

export default async function CircuitsPage({ params }: { params: Params }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: "circuits" });

  return (
    <div className="bg-[#FDFAF6]">
      <PageHero
        title={t("pageTitle")}
        intro={t("pageIntro")}
        image="/images/backgrounds/baobabs.jpeg"
        imageAlt=""
        breadcrumb={[
          { label: HOME_LABEL[locale] ?? HOME_LABEL.fr, href: "/" },
          { label: t("breadcrumb") },
        ]}
      />

      {/* Feuille crème qui remonte sur le bandeau : coupe net la photo */}
      <main className="relative isolate z-10 -mt-8 overflow-hidden rounded-t-[2rem] bg-[#FDFAF6] shadow-[0_-12px_40px_-12px_rgba(8,34,43,0.25)]">
        <SectionBackdrop />
        <div className="relative mx-auto max-w-6xl px-4 pb-24 pt-10 sm:px-6 sm:pt-12 lg:px-8">
          <div className="mb-8 flex items-center justify-between border-b border-stone-200 pb-4">
            <p className="text-sm font-medium tracking-wide text-stone-500">
              {t("count", { count: circuitsSorted.length })}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8">
            {circuitsSorted.map((circuit) => (
              <CircuitCard key={circuit.id} circuit={circuit} />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
