// apps/web/src/app/[locale]/contact/page.tsx
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { PageHero } from "@/components/layout/PageHero";
import { SectionBackdrop } from "@/components/ui/SectionBackdrop";
import { Squiggle } from "@/components/ui/Doodles";
import { ContactForm } from "@/components/contact/ContactForm";
import { buildBreadcrumbSchema } from "@/lib/schema/breadcrumb";
import { contactInfo, telHref, mailtoHref, businessInfo } from "@/lib/nav-config";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { IconPhone, IconMail, IconClock, IconMapPin } from "@tabler/icons-react";

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
  const t = await getTranslations({ locale, namespace: "contact.meta" });

  return {
    title: t("title"),
    description: t("description"),
    alternates: { canonical: `/${locale}/contact` },
  };
}

export default async function ContactPage({ params }: { params: Params }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: "contact" });
  const tNav = await getTranslations({ locale, namespace: "nav" });
  // Horaires déjà déclarés pour la barre supérieure — une seule source.
  const tTopbar = await getTranslations({ locale, namespace: "topbar" });

  // Pas de LocalBusiness ici : le TravelAgency est déclaré sur /apropos,
  // avec son @id. Deux entités du même type sèmeraient la confusion.
  const jsonLd = [
    buildBreadcrumbSchema(locale, [
      { name: tNav("accueil"), path: "/" },
      { name: t("breadcrumb") },
    ]),
    {
      "@context": "https://schema.org",
      "@type": "ContactPage",
      name: t("pageTitle"),
      url: `${businessInfo.url}/${locale}/contact`,
      mainEntity: { "@id": `${businessInfo.url}/#organization` },
    },
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

        <div className="relative mx-auto max-w-5xl px-4 pb-24 pt-14 sm:px-6 sm:pt-16 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-[1.6fr_1fr]">
            <div>
              <h2 className="font-[family-name:var(--font-courgette)] text-2xl text-stone-900">
                {t("formTitle")}
              </h2>
              <Squiggle className="mt-1 h-2 w-20 opacity-50" color="#F4A261" />
              <div className="mt-6">
                <ContactForm locale={locale} />
              </div>
            </div>

            <aside className="h-fit space-y-4 lg:sticky lg:top-24">
              <div className="rounded-3xl border border-[#1d4e5f]/10 bg-white p-6">
                <h3 className="mb-4 font-medium text-stone-900">
                  {t("directTitle")}
                </h3>

                <a
                  href={telHref}
                  className="mb-3 flex items-start gap-3 text-sm text-stone-600 hover:text-[#1d4e5f]"
                >
                  <IconPhone size={18} className="mt-0.5 shrink-0 text-[#E76F51]" />
                  {contactInfo.phoneDisplay}
                </a>

                <a
                  href={mailtoHref}
                  className="mb-3 flex items-start gap-3 break-all text-sm text-stone-600 hover:text-[#1d4e5f]"
                >
                  <IconMail size={18} className="mt-0.5 shrink-0 text-[#E76F51]" />
                  {contactInfo.email}
                </a>

                <p className="mb-3 flex items-start gap-3 text-sm text-stone-600">
                  <IconClock size={18} className="mt-0.5 shrink-0 text-[#E76F51]" />
                  {tTopbar("hours")}
                </p>

                <p className="flex items-start gap-3 text-sm text-stone-600">
                  <IconMapPin size={18} className="mt-0.5 shrink-0 text-[#E76F51]" />
                  {businessInfo.addressLocality}, {t("country")}
                </p>
              </div>

              <div className="rounded-3xl bg-[#1d4e5f]/5 p-6">
                <p className="text-sm leading-relaxed text-stone-600">
                  {t("bookingNote")}
                </p>
                <Link
                  href="/reservation"
                  className="mt-3 inline-block text-sm font-medium text-[#1d4e5f] hover:underline"
                >
                  {t("bookingCta")} →
                </Link>
              </div>
            </aside>
          </div>
        </div>
      </main>
    </div>
  );
}