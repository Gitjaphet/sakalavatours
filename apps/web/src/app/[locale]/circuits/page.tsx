import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { circuitsSorted } from "@/lib/circuits-data";
import { CircuitCard } from "@/components/circuits/CircuitCard";

type Params = Promise<{ locale: string }>;

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
    <main className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
      <nav aria-label="Fil d'Ariane" className="mb-6 text-sm text-stone-500">
        <span>{t("breadcrumb")}</span>
      </nav>

      <header className="mb-10 max-w-2xl">
        <h1 className="font-[family-name:var(--font-courgette)] text-4xl text-stone-900 sm:text-5xl">
          {t("pageTitle")}
        </h1>
        <p className="mt-4 text-lg text-stone-600">{t("pageIntro")}</p>
        <p className="mt-2 text-sm font-medium text-stone-500">
          {t("count", { count: circuitsSorted.length })}
        </p>
      </header>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {circuitsSorted.map((circuit) => (
          <CircuitCard key={circuit.id} circuit={circuit} />
        ))}
      </div>
    </main>
  );
}