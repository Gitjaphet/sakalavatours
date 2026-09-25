// src/components/home/HomeIntro.tsx
// Section 1 — presentation de l'agence.
//
// Role SEO : c'est le premier bloc de texte reel de la page d'accueil.
// Composant serveur, aucun JavaScript envoye au navigateur.
// Desktop (lg+) : forme SVG diagonale + courbe, photo a droite.
// Mobile/tablette : panneau jaune a bas courbe, photo a cheval sur la courbe.

import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Squiggle } from "@/components/ui/Doodles";

const SHAPE_COLOR = "#F9D55B";
const IMAGE_URL =
  "https://media.medevstack.com/excursions/2026/08/e198a63e-nosy-iranja.jpg";

export async function HomeIntro({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: "home.intro" });

  return (
    <section className="relative overflow-hidden bg-[#FDFAF6] py-16 sm:py-20 lg:py-28">
      {/* Desktop : diagonale en haut a droite + grande courbe en bas */}
      <svg
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 hidden h-full w-full lg:block"
        viewBox="0 0 1440 800"
        preserveAspectRatio="none"
      >
        <path
          d="M0 0 H1440 C1200 220 1000 420 860 560 C640 740 300 780 0 800 Z"
          fill={SHAPE_COLOR}
        />
      </svg>

      {/* Mobile/tablette : panneau plein, bas courbe qui remonte vers la droite.
          Le bas du panneau s'arrete au milieu de la photo. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 bottom-56 rounded-br-[100%_80px] sm:bottom-[267px] lg:hidden"
        style={{ backgroundColor: SHAPE_COLOR }}
      />

      {/* Masque "8" : deux ellipses qui se chevauchent */}
      <svg aria-hidden="true" className="absolute h-0 w-0">
        <defs>
          <clipPath id="intro-blob" clipPathUnits="objectBoundingBox">
            <ellipse cx="0.5" cy="0.3" rx="0.5" ry="0.3" />
            <ellipse cx="0.5" cy="0.7" rx="0.5" ry="0.3" />
          </clipPath>
        </defs>
      </svg>

      <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-5 sm:px-8 lg:grid-cols-[1.3fr_1fr] lg:gap-16">
        <div>
          <h2 className="font-[family-name:var(--font-courgette)] text-[1.75rem] leading-snug text-stone-900 sm:text-4xl">
            {t("title")}
          </h2>
          <Squiggle className="mt-2 h-2 w-24 opacity-70" color="#E76F51" />

          <div className="mt-6 space-y-4 text-[15px] leading-relaxed text-stone-800 sm:text-base">
            <p>{t("p1")}</p>
            <p>{t("p2")}</p>
            <p>{t("p3")}</p>
          </div>

          <div className="mt-8 flex gap-3">
            <Link
              href="/excursions"
              className="flex-1 rounded-full bg-[#E76F51] px-5 py-3 text-center text-sm font-medium text-white shadow-md shadow-[#E76F51]/25 transition-transform duration-300 hover:scale-[1.03] sm:flex-none"
            >
              {t("ctaExcursions")}
            </Link>
            <Link
              href="/circuits"
              className="flex-1 rounded-full border border-stone-800/25 bg-white/70 px-5 py-3 text-center text-sm font-medium text-stone-800 backdrop-blur-sm transition-colors duration-300 hover:border-[#E76F51] hover:text-[#E76F51] sm:flex-none"
            >
              {t("ctaCircuits")}
            </Link>
          </div>
        </div>

        <div className="mx-auto w-[240px] sm:w-[280px] lg:w-full lg:max-w-sm">
          <div className="[filter:drop-shadow(0_24px_32px_rgba(43,38,32,0.22))]">
            <div
              className="relative aspect-[3/4] w-full"
              style={{ clipPath: "url(#intro-blob)" }}
            >
              <Image
                src={IMAGE_URL}
                alt={t("imageAlt")}
                fill
                sizes="(min-width: 1024px) 384px, (min-width: 640px) 280px, 240px"
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
