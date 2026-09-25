// src/components/home/HomeWhyUs.tsx
// Section 3 — reassurance.
//
// Peu de valeur SEO, forte valeur de conversion : c'est le bloc qui repond aux
// objections avant qu'elles n'arretent le visiteur.
//
// ⚠ Chaque argument est un engagement commercial. Ne rien affirmer ici qui ne
// soit tenu sur le terrain — voir la regle du projet sur les engagements.
//
// Effet : quart de cercle dans le coin, qui s'etend a toute la carte au survol
// (scale CSS + overflow-hidden, aucun JavaScript).

import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { SectionDivider } from "@/components/ui/SectionDivider";
import {
  IconMapPin,
  IconUsers,
  IconCoin,
  IconMessageCircle,
} from "@tabler/icons-react";

const ICONES = [IconMapPin, IconUsers, IconCoin, IconMessageCircle] as const;
const CLES = ["local", "small", "price", "languages"] as const;

export async function HomeWhyUs({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: "home.why" });

  return (
    <section className="relative overflow-hidden bg-[#FDFAF6] pb-16 pt-24 sm:pb-24 sm:pt-32">
      {/* Photo de fond decorative + voile creme (bords opaques pour fondre avec les sections voisines) */}
      <Image
        src="https://media.medevstack.com/divers/2026/09/a5f73d1f-mer-d-emeraude.jpeg"
        alt=""
        aria-hidden="true"
        fill
        sizes="100vw"
        quality={60}
        className="object-cover"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-b from-[#FDFAF6]/40 via-[#FDFAF6]/50 to-[#FDFAF6]"
      />
      {/* Bleu lagon de la section precedente qui "descend" en papier dechire */}
      <SectionDivider
        forme="torn"
        inverse
        color="#1d4e5f"
        className="absolute inset-x-0 top-0 h-12 sm:h-16"
      />
      <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <h2 className="mx-auto max-w-2xl text-center font-[family-name:var(--font-courgette)] text-3xl text-stone-900 sm:text-4xl">
          {t("title")}
        </h2>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {CLES.map((cle, i) => {
            const Icon = ICONES[i];
            return (
              <div
                key={cle}
                className="group relative overflow-hidden rounded-2xl border border-stone-200 bg-white p-6 pt-24 shadow-sm transition-shadow duration-500 hover:shadow-xl hover:shadow-[#1d4e5f]/20"
              >
                {/* Quart de cercle -> remplit la carte au survol */}
                <span
                  aria-hidden="true"
                  className="absolute -left-12 -top-12 h-32 w-32 rounded-full bg-[#1d4e5f] transition-transform duration-700 ease-out group-hover:scale-[7]"
                />
                <Icon
                  size={26}
                  stroke={1.7}
                  aria-hidden="true"
                  className="absolute left-5 top-5 text-white"
                />

                <h3 className="relative text-lg font-semibold text-[#1d4e5f] transition-colors delay-100 duration-500 group-hover:text-white">
                  {t(`${cle}.title`)}
                </h3>
                <p className="relative mt-2 text-sm leading-relaxed text-stone-600 transition-colors delay-100 duration-500 group-hover:text-white/85">
                  {t(`${cle}.text`)}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
