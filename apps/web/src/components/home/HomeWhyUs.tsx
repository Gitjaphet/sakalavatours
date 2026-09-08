// src/components/home/HomeWhyUs.tsx
// Section 3 — reassurance.
//
// Peu de valeur SEO, forte valeur de conversion : c'est le bloc qui repond aux
// objections avant qu'elles n'arretent le visiteur.
//
// ⚠ Chaque argument est un engagement commercial. Ne rien affirmer ici qui ne
// soit tenu sur le terrain — voir la regle du projet sur les engagements.

import { getTranslations } from "next-intl/server";
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
    <section className="bg-[#FDFAF6] py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <h2 className="max-w-2xl font-[family-name:var(--font-courgette)] text-3xl text-stone-900 sm:text-4xl">
          {t("title")}
        </h2>

        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4 lg:gap-7">
          {CLES.map((cle, i) => {
            const Icon = ICONES[i];
            return (
              <div key={cle}>
                <span className="grid h-11 w-11 place-items-center rounded-full bg-[#1d4e5f]/10 text-[#1d4e5f]">
                  <Icon size={20} stroke={1.7} />
                </span>
                <h3 className="mt-3.5 text-lg font-semibold text-stone-900">
                  {t(`${cle}.title`)}
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-stone-600">
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
