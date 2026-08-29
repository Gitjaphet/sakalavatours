// apps/web/src/app/[locale]/avis/confirmation/page.tsx
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { PageHero } from "@/components/layout/PageHero";
import { SectionBackdrop } from "@/components/ui/SectionBackdrop";
import { Squiggle } from "@/components/ui/Doodles";
import { ReviewVerification } from "@/components/reviews/ReviewVerification";
import { routing } from "@/i18n/routing";

type Params = Promise<{ locale: string }>;
type SearchParams = Promise<{ token?: string }>;

export async function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "avisConfirmation" });

  return {
    title: t("metaTitle"),
    // Jamais indexée : l'URL porte un jeton, et une page d'état n'a
    // aucune valeur de référencement.
    robots: { index: false, follow: false },
  };
}

export default async function ReviewConfirmationPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  const { locale } = await params;
  const { token } = await searchParams;
  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: "avisConfirmation" });
  const tNav = await getTranslations({ locale, namespace: "nav" });

  return (
    <div className="bg-[#FDFAF6]">
      <PageHero
        title={t("pageTitle")}
        eyebrow={t("eyebrow")}
        image="/images/hero/nosy-iranja.jpg"
        imageAlt=""
        breadcrumb={[
          { label: tNav("accueil"), href: "/" },
          { label: t("breadcrumb") },
        ]}
      />

      <main className="relative isolate z-10 -mt-8 overflow-hidden rounded-t-[2rem] bg-[#FDFAF6] shadow-[0_-12px_40px_-12px_rgba(8,34,43,0.25)]">
        <SectionBackdrop />

        <div className="relative mx-auto max-w-xl px-4 pb-24 pt-14 sm:px-6 sm:pt-16 lg:px-8">
          <div className="mb-8 text-center">
            <h2 className="font-[family-name:var(--font-courgette)] text-2xl text-stone-900 sm:text-3xl">
              {t("title")}
            </h2>
            <Squiggle className="mx-auto mt-2 h-2 w-24 opacity-50" color="#F4A261" />
          </div>

          <ReviewVerification
            token={token ?? null}
            labels={{
              intro: t("intro"),
              action: t("action"),
              pending: t("pending"),
              missing: t("missing"),
            }}
          />
        </div>
      </main>
    </div>
  );
}