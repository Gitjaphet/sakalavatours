import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ComingSoon } from "@/components/ui/ComingSoon";

type Params = Promise<{ locale: string; slug: string }>;

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "pages" });

  return {
    title: t("circuitDetail.title"),
    description: t("circuitDetail.text"),
    robots: { index: false, follow: true },
  };
}

export default async function CircuitDetailPage({ params }: { params: Params }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <ComingSoon pageKey="circuitDetail" />;
}