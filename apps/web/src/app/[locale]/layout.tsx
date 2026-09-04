import type { Metadata } from "next";
import { Courgette, Inter, Baloo_2 } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { RouteLoaderProvider } from "@/components/providers/RouteLoaderProvider";
import { businessInfo } from "@/lib/nav-config";
import "./globals.css";

export const courgette = Courgette({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-courgette",
  display: "swap",
});

export const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const baloo2 = Baloo_2({
  weight: ["600"],
  subsets: ["latin"],
  variable: "--font-baloo2",
  display: "swap",
});

/** Génère les 3 variantes de langue à la compilation (SSG) */
export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

/** Métadonnées localisées + hreflang : indispensable pour que Google
*  indexe toutes les versions comme des alternatives et non des doublons. */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "home.meta" });

  const languages = Object.fromEntries(
    routing.locales.map((l) => [l, `${businessInfo.url}/${l}`]),
  );

  return {
    metadataBase: new URL(businessInfo.url),
    title: t("title"),
    description: t("description"),
    alternates: {
      canonical: `${businessInfo.url}/${locale}`,
      languages: {
        ...languages,
        "x-default": `${businessInfo.url}/${routing.defaultLocale}`,
      },
    },
    openGraph: {
      type: "website",
      siteName: businessInfo.name,
      locale,
      url: `${businessInfo.url}/${locale}`,
      title: t("title"),
      description: t("description"),
    },
    twitter: {
      card: "summary_large_image",
      title: t("title"),
      description: t("description"),
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as (typeof routing.locales)[number])) {
    notFound();
  }

  // Autorise le rendu statique de la page (sans ceci, next-intl bascule en
  // rendu dynamique et tu perds le bénéfice SSG/ISR).
  setRequestLocale(locale);

  const messages = await getMessages();

  return (
    <html
      lang={locale}
      className={`${courgette.variable} ${inter.variable} ${baloo2.variable}`}
    >
      <head>
        {/* Marque la présence de JavaScript AVANT le premier rendu : sans lui,
            les styles de scroll-reveal ne s'appliquent pas et le contenu
            reste visible. Filet de sécurité SEO et accessibilité. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `document.documentElement.classList.add("js")`,
          }}
        />
      </head>
      <body className="bg-[#FDFAF6] text-[#2B2620] antialiased">
        <NextIntlClientProvider messages={messages}>
          <RouteLoaderProvider>
            <Header />
            {children}
            <Footer />
          </RouteLoaderProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}