// src/lib/placeholder-page.tsx
// Fabrique de pages provisoires. Chaque route en construction s'y branche
// en trois lignes. À supprimer au fur et à mesure que les vraies pages arrivent.

import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { ComingSoon } from "@/components/ui/ComingSoon";

type Params = Promise<{ locale: string }>;

export function createPlaceholderPage(pageKey: string) {
  async function generateMetadata({
    params,
  }: {
    params: Params;
  }): Promise<Metadata> {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: "pages" });

    return {
      title: t(`${pageKey}.title`),
      description: t(`${pageKey}.text`),
      // Page vide : on répond 200 pour éviter les 404 au crawl,
      // mais on interdit l'indexation d'un contenu sans valeur.
      // `follow: true` laisse Google suivre les liens vers l'accueil.
      robots: { index: false, follow: true },
    };
  }

  async function Page({ params }: { params: Params }) {
    const { locale } = await params;
    setRequestLocale(locale);
    return <ComingSoon pageKey={pageKey} />;
  }

  function generateStaticParams() {
    return routing.locales.map((locale) => ({ locale }));
  }

  return { Page, generateMetadata, generateStaticParams };
}