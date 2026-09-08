// src/components/home/HomeGalleryScroller.tsx
// Conteneur defilant de la galerie, avec fleches.
//
// Composant client uniquement pour piloter scrollBy() : les cartes elles-memes
// arrivent en children depuis le composant serveur, donc les images et les
// liens sont dans le HTML servi. Aucun impact SEO.

"use client";

import { useRef } from "react";
import { IconArrowLeft, IconArrowRight } from "@tabler/icons-react";

export function HomeGalleryScroller({
  children,
  prevLabel,
  nextLabel,
}: {
  children: React.ReactNode;
  prevLabel: string;
  nextLabel: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  /** Defile d'environ une carte et demie, pour que la suivante soit visible. */
  function defiler(sens: 1 | -1) {
    const el = ref.current;
    if (!el) return;
    el.scrollBy({ left: sens * 400, behavior: "smooth" });
  }

  return (
    <>
      <div
        ref={ref}
        className="mt-8 overflow-x-auto pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {children}
      </div>

      <div className="mx-auto flex max-w-6xl justify-end gap-2 px-4 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={() => defiler(-1)}
          aria-label={prevLabel}
          className="grid h-11 w-11 place-items-center rounded-full border border-stone-300 text-stone-600 transition-colors duration-300 hover:border-[#E76F51] hover:text-[#E76F51]"
        >
          <IconArrowLeft size={18} />
        </button>
        <button
          type="button"
          onClick={() => defiler(1)}
          aria-label={nextLabel}
          className="grid h-11 w-11 place-items-center rounded-full border border-stone-300 text-stone-600 transition-colors duration-300 hover:border-[#E76F51] hover:text-[#E76F51]"
        >
          <IconArrowRight size={18} />
        </button>
      </div>
    </>
  );
}
