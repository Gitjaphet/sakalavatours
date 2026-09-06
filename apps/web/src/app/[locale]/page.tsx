// src/app/[locale]/page.tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { businessInfo } from "@/lib/nav-config";

import { routing } from "@/i18n/routing";
import { getProducts } from "@/lib/api/products";
import Hero from "@/components/home/Hero";

type Props = {
  params: Promise<{ locale: string }>;
};

/** Pré-rend /fr, /en, /de au build (SSG) */
export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();

  const t = await getTranslations({ locale, namespace: "home.meta" });

  return {
    title: t("title"),
    description: t("description"),
    alternates: {
      canonical: `${businessInfo.url}/${locale}`,
      languages: Object.fromEntries([
        ...routing.locales.map((l) => [l, `${businessInfo.url}/${l}`]),
        ["x-default", `${businessInfo.url}/${routing.defaultLocale}`],
      ]),
    },
    openGraph: {
      type: "website",
      siteName: businessInfo.name,
      locale,
      url: `${businessInfo.url}/${locale}`,
      title: t("title"),
      description: t("description"),
      images: [
        {
          url: `${businessInfo.url}/images/og/accueil.jpg`,
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
      images: [`${businessInfo.url}/images/og/accueil.jpg`],
    },
  };
}

export default async function HomePage({ params }: Props) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();

  // Indispensable pour que la page reste statique (SSG) avec next-intl
  setRequestLocale(locale);

  // Le hero porte 6 destinations : 3 excursions et 3 circuits, pour que les
  // deux offres soient représentées quel que soit le tri. Le backend trie
  // déjà par is_featured desc, sort_order, price_from desc — les coups de
  // cœur remontent donc naturellement en tête de chaque type.
  // On alterne excursion/circuit à l'affichage : le carrousel ne montre que
  // 3 cartes à la fois, un bloc de 3 excursions suivi de 3 circuits ferait
  // croire que l'agence ne propose qu'un seul type.
  const [{ items: excursions }, { items: circuits }] = await Promise.all([
    getProducts(locale, { type: "excursion", limit: 3 }),
    getProducts(locale, { type: "circuit", limit: 3 }),
  ]);

  const heroDestinations = Array.from({ length: 6 }, (_, i) =>
    i % 2 === 0 ? excursions[Math.floor(i / 2)] : circuits[Math.floor(i / 2)],
  ).filter(Boolean);

  return (
    <>
      <Hero destinations={heroDestinations} />

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