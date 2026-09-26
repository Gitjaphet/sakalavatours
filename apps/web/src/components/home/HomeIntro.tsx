// src/components/home/HomeIntro.tsx
// Section 1 — presentation de l'agence.
// Composant serveur, aucun JavaScript envoye au navigateur.
// Fond : photo plein cadre avec fondu creme.
//   Desktop (lg+) : creme plein uniquement derriere le texte (a droite), fondu court, photo nette a gauche et au centre.
//   Mobile/tablette : voile creme uniforme (texte pleine largeur).

import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Squiggle } from "@/components/ui/Doodles";

const CREAM = "#FDFAF6";
const BG_URL = "/images/hero/plage-sakalavatours-nosy-iranja.jpg";

export async function HomeIntro({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: "home.intro" });

  return (
    <section className="relative isolate overflow-hidden bg-[#FDFAF6] py-16 sm:py-20 lg:py-28">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        <Image src={BG_URL} alt="" fill sizes="100vw" quality={70} className="object-cover object-left" />
        <div className="absolute inset-0 lg:hidden" style={{ backgroundColor: `${CREAM}D9` }} />
        <div
          className="absolute inset-0 hidden lg:block"
          style={{ background: `linear-gradient(to left, ${CREAM}B3 0%, ${CREAM} 16%, ${CREAM} 46%, ${CREAM}CC 53%, ${CREAM}4D 62%, ${CREAM}00 72%)` }}
        />
      </div>

      <div className="relative mx-auto max-w-7xl px-5 sm:px-8">
        <div className="lg:ml-auto lg:w-[560px]">
          <h2 className="font-[family-name:var(--font-courgette)] text-[1.75rem] leading-snug text-stone-900 sm:text-4xl">{t("title")}</h2>
          <Squiggle className="mt-2 h-2 w-24 opacity-70" color="#E76F51" />
          <div className="mt-6 space-y-4 text-[15px] leading-relaxed text-stone-800 sm:text-base">
            <p>{t("p1")}</p>
            <p>{t("p2")}</p>
            <p>{t("p3")}</p>
          </div>
          <div className="mt-8 flex gap-3">
            <Link href="/excursions" className="flex-1 rounded-full bg-[#E76F51] px-5 py-3 text-center text-sm font-medium text-white shadow-md shadow-[#E76F51]/25 transition-transform duration-300 hover:scale-[1.03] sm:flex-none">{t("ctaExcursions")}</Link>
            <Link href="/circuits" className="flex-1 rounded-full border border-stone-800/25 bg-white/70 px-5 py-3 text-center text-sm font-medium text-stone-800 backdrop-blur-sm transition-colors duration-300 hover:border-[#E76F51] hover:text-[#E76F51] sm:flex-none">{t("ctaCircuits")}</Link>
          </div>
        </div>
      </div>
    </section>
  );
}
