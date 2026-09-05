// src/components/products/ProductVideo.tsx
// Section video d'une fiche produit.
//
// Composant client : uniquement pour l'etat du premier clic. Le <video> reste
// dans le DOM des le rendu serveur, donc le balisage VideoObject porte bien
// sur un media reellement present sur la page.
//
// Regles de performance preservees malgre l'habillage :
//   - preload="none" : rien n'est telecharge avant le clic. Seul le poster
//     (~60 Ko) pese sur le chargement.
//   - pas d'autoplay : l'autoplay ferait entrer la video dans le calcul du LCP.
//   - width/height explicites : reservent la place et evitent le CLS.
//   - le poster est rendu par l'attribut natif poster=, jamais par une seconde
//     balise img — sinon le navigateur telechargerait l'image deux fois.

"use client";

import { useRef, useState } from "react";
import { IconPlayerPlayFilled } from "@tabler/icons-react";
import { RayCluster } from "@/components/ui/Doodles";
import type { ProductVideo as ProductVideoData } from "@/lib/product-videos";

/** "PT55S" ou "PT1M30S" vers "0:55" / "1:30". Retourne null si non reconnu. */
function dureeLisible(iso: string): string | null {
  const m = iso.match(/^PT(?:(\d+)M)?(?:(\d+)S)?$/);
  if (!m) return null;
  const minutes = Number(m[1] ?? 0);
  const secondes = Number(m[2] ?? 0);
  if (!minutes && !secondes) return null;
  return `${minutes}:${String(secondes).padStart(2, "0")}`;
}

export function ProductVideo({
  video,
  eyebrow,
  title,
  description,
}: {
  video: ProductVideoData;
  eyebrow: string;
  title: string;
  description: string;
}) {
  const ref = useRef<HTMLVideoElement>(null);
  const [demarre, setDemarre] = useState(false);
  const duree = dureeLisible(video.duration);

  function lancer() {
    setDemarre(true);
    ref.current?.play();
  }

  return (
    <section className="mt-12 overflow-hidden rounded-2xl bg-[#0d2b32]">
      <div className="relative px-5 py-8 sm:px-8 sm:py-10">
        <p className="text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-[#F4A261]">
          {eyebrow}
        </p>

        {/* Titre au-dessus en mobile : sans lui, on ne voit qu'un rectangle
            vertical sans savoir de quoi il s'agit avant de faire defiler. */}
        <RayCluster
          className="pointer-events-none absolute right-4 top-5 h-14 w-14 opacity-75 sm:hidden"
          color="#F4A261"
        />
        <h2 className="mt-1.5 font-[family-name:var(--font-courgette)] text-2xl text-white sm:hidden">
          {title}
        </h2>

        <div className="mt-5 flex flex-col gap-6 sm:mt-6 sm:flex-row sm:items-center sm:gap-8">
          <div className="relative mx-auto w-[170px] shrink-0 sm:mx-0 sm:w-[190px]">
            <video
              ref={ref}
              controls={demarre}
              preload="none"
              playsInline
              poster={video.poster}
              width={video.width}
              height={video.height}
              onPlay={() => setDemarre(true)}
              className="block w-full rounded-xl bg-black"
            >
              <source src={video.src} type="video/mp4" />
            </video>

            {!demarre && (
              <button
                type="button"
                onClick={lancer}
                aria-label={title}
                className="absolute inset-0 grid place-items-center rounded-xl transition-colors duration-300 hover:bg-black/10"
              >
                <span className="grid h-14 w-14 place-items-center rounded-full bg-white/90 shadow-lg transition-transform duration-300 hover:scale-105">
                  <IconPlayerPlayFilled size={22} className="ml-0.5 text-[#0d2b32]" />
                </span>
                {duree && (
                  <span className="absolute bottom-2.5 left-2.5 rounded-full bg-black/55 px-2.5 py-0.5 text-[11px] text-white">
                    {duree}
                  </span>
                )}
              </button>
            )}
          </div>

          <div className="relative sm:flex-1">
            <RayCluster
              className="pointer-events-none absolute -top-6 right-0 hidden h-16 w-16 opacity-80 sm:block lg:h-20 lg:w-20"
              color="#F4A261"
            />
            <h2 className="hidden font-[family-name:var(--font-courgette)] text-[1.75rem] text-white sm:block">
              {title}
            </h2>
            <span
              aria-hidden="true"
              className="mt-3 hidden h-0.5 w-9 shrink-0 rounded-full bg-[#E76F51] sm:block"
            />
            <p className="mt-4 max-w-[42ch] text-[14.5px] leading-[1.75] text-white/75 sm:mt-4">
              {description}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
