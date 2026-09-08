// src/components/home/HomeGallery.tsx
// Section galerie — bandeau d'images defilant horizontalement.
//
// Defilement 100 % CSS : overflow-x-auto + scroll-snap. Aucun JavaScript,
// donc composant serveur et zero poids ajoute au bundle. Le glissement au
// doigt en mobile et la molette en desktop sont geres nativement par le
// navigateur, mieux que par n'importe quelle librairie de carrousel.
//
// Role SEO : chaque image est un lien vers sa fiche produit, present dans le
// HTML servi. Le alt vient de la mediatheque — un alt vide ou egal au nom de
// fichier n'apporte rien, c'est a corriger cote admin, pas ici.

import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getProducts } from "@/lib/api/products";

function productHref(type: string, slug: string): string {
  return `/${type === "circuit" ? "circuits" : "excursions"}/${slug}`;
}

export async function HomeGallery({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: "home.gallery" });
  const { items } = await getProducts(locale, { limit: 20 });

  // Sans couverture, une carte serait un rectangle vide : on ecarte.
  const avecImage = items.filter((p) => p.cover);

  // En dessous de 4 visuels, le bandeau ne defile pas et fait pauvre.
  if (avecImage.length < 4) return null;

  return (
    <section className="bg-white py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#E76F51]">
            {t("eyebrow")}
          </p>
          <h2 className="mt-2 font-[family-name:var(--font-courgette)] text-3xl text-stone-900 sm:text-4xl">
            {t("title")}
          </h2>
          <p className="mt-4 text-base leading-relaxed text-stone-600">
            {t("intro")}
          </p>
        </div>
      </div>

      {/* Le conteneur deborde volontairement de la grille : le bandeau part
          du bord gauche de l'ecran, ce qui signale qu'il continue au-dela. */}
      <div className="mt-8 overflow-x-auto pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <ul className="flex w-max snap-x snap-mandatory gap-3 px-4 sm:gap-4 sm:px-6 lg:px-8">
          {avecImage.map((p) => (
            <li key={p.id} className="snap-start">
              <Link
                href={productHref(p.product_type, p.slug)}
                className="group relative block h-[260px] w-[190px] overflow-hidden rounded-xl bg-[#0d2b32] sm:h-[340px] sm:w-[250px]"
              >
                <Image
                  src={p.cover!.url}
                  alt={p.cover!.alt_text || p.title}
                  fill
                  sizes="(max-width: 639px) 190px, 250px"
                  className="object-cover transition-transform duration-[900ms] ease-out group-hover:scale-[1.06]"
                />
                <span
                  aria-hidden="true"
                  className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"
                />
                <span className="absolute inset-x-0 bottom-0 p-4">
                  <span className="block text-xs font-bold uppercase tracking-[0.18em] text-[#F4A261]">
                    {p.product_type === "circuit"
                      ? t("typeCircuit")
                      : t("typeExcursion")}
                  </span>
                  <span className="mt-1 block font-[family-name:var(--font-courgette)] text-xl leading-snug text-white">
                    {p.title}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>

      <p className="mx-auto mt-2 max-w-6xl px-4 text-sm text-stone-400 sm:px-6 lg:px-8">
        {t("hint")}
      </p>
    </section>
  );
}
