// src/app/[locale]/page.tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { routing } from "@/i18n/routing";
import Hero from "@/components/home/Hero";

type Props = {
  params: Promise<{ locale: string }>;
};

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://sakalavatours.com";

/** Pré-rend /fr, /en, /de au build (SSG) */
export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();

  const t = await getTranslations({ locale, namespace: "home.meta" });
  const path = locale === routing.defaultLocale ? "/" : `/${locale}`;

  return {
    title: t("title"),
    description: t("description"),
    alternates: {
      canonical: `${SITE_URL}${path}`,
      languages: Object.fromEntries([
        ...routing.locales.map((l) => [
          l,
          `${SITE_URL}${l === routing.defaultLocale ? "/" : `/${l}`}`,
        ]),
        ["x-default", `${SITE_URL}/`],
      ]),
    },
    openGraph: {
      type: "website",
      siteName: "Sakalava Tours",
      locale,
      url: `${SITE_URL}${path}`,
      title: t("title"),
      description: t("description"),
      images: [
        {
          url: `${SITE_URL}/images/og/accueil.jpg`,
          width: 1200,
          height: 630,
          alt: t("ogAlt"),
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: t("title"),
      description: t("description"),
      images: [`${SITE_URL}/images/og/accueil.jpg`],
    },
  };
}

export default async function HomePage({ params }: Props) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();

  // Indispensable pour que la page reste statique (SSG) avec next-intl
  setRequestLocale(locale);

  return (
    <>
      <Hero />

      {/*
        Sections suivantes, dans cet ordre (chacune = 1 composant dans
        components/home/, à construire une par une) :
        <CircuitsPhares />   — 3 à 6 CircuitCard, données mock puis API
        <PourquoiNous />     — guides locaux, petits groupes, prix transparents
        <Temoignages />      — avis clients + note agrégée (schema Review)
        <FaqAccueil />       — 5 questions + JSON-LD FAQPage
        <CtaReservation />   — bandeau final vers /reservation
      */}
    </>
  );
}