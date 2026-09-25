// src/components/home/HomeIntro.tsx
// Section 1 — presentation de l'agence.
//
// Role SEO : c'est le premier bloc de texte reel de la page d'accueil.
// Composant serveur, aucun JavaScript envoye au navigateur.
// Fond : forme SVG decorative (aria-hidden), photo en forme de "8" via clipPath.

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
      {/* Forme de fond : diagonale en haut a droite + grande courbe en bas */}
      <svg
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 h-full w-full"
        viewBox="0 0 1440 800"
        preserveAspectRatio="none"
      >
        <path
          d="M0 0 H1440 C1200 220 1000 420 860 560 C640 740 300 780 0 800 Z"
          fill={SHAPE_COLOR}
        />
      </svg>

      {/* Masque "8" : deux ellipses qui se chevauchent (coordonnees relatives) */}
      <svg aria-hidden="true" className="absolute h-0 w-0">
        <defs>
          <clipPath id="intro-blob" clipPathUnits="objectBoundingBox">
            <ellipse cx="0.5" cy="0.3" rx="0.5" ry="0.3" />
            <ellipse cx="0.5" cy="0.7" rx="0.5" ry="0.3" />
          </clipPath>
        </defs>
      </svg>

      <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-[1.3fr_1fr] lg:gap-16 lg:px-8">
        <div>
          <h2 className="font-[family-name:var(--font-courgette)] text-3xl text-stone-900 sm:text-4xl">
            {t("title")}
          </h2>
          <Squiggle className="mt-2 h-2 w-24 opacity-70" color="#E76F51" />

          <div className="mt-6 space-y-4 text-base leading-relaxed text-stone-800">
            <p>{t("p1")}</p>
            <p>{t("p2")}</p>
            <p>{t("p3")}</p>
          </div>

          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              href="/excursions"
              className="rounded-full bg-[#E76F51] px-5 py-2.5 text-sm font-medium text-white transition-transform duration-300 hover:scale-[1.03]"
            >
              {t("ctaExcursions")}
            </Link>
            <Link
              href="/circuits"
              className="rounded-full border border-stone-800/30 bg-white/60 px-5 py-2.5 text-sm font-medium text-stone-800 transition-colors duration-300 hover:border-[#E76F51] hover:text-[#E76F51]"
            >
              {t("ctaCircuits")}
            </Link>
          </div>
        </div>

        <div className="mx-auto w-full max-w-[260px] sm:max-w-xs lg:max-w-sm">
          <div
            className="relative aspect-[3/4] w-full"
            style={{ clipPath: "url(#intro-blob)" }}
          >
            <Image
              src={IMAGE_URL}
              alt={t("imageAlt")}
              fill
              sizes="(min-width: 1024px) 384px, (min-width: 640px) 320px, 260px"
              className="object-cover"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
