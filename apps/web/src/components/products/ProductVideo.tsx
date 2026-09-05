// src/components/products/ProductVideo.tsx
// Lecteur video d'une fiche produit.
//
// Composant serveur : aucun JavaScript envoye au navigateur, le lecteur natif
// suffit. Trois regles de performance appliquees ici :
//   - preload="none" : rien n'est telecharge tant que le visiteur ne lance pas
//     la lecture. Seul le poster (~60 Ko) pese sur le chargement de la page.
//   - pas d'autoplay : l'autoplay telecharge la video immediatement et la fait
//     entrer dans le calcul du LCP.
//   - width/height explicites : sans eux le navigateur ne reserve pas la place
//     et le contenu saute a l'arrivee du poster, ce qui degrade le CLS.

import type { ProductVideo as ProductVideoData } from "@/lib/product-videos";

export function ProductVideo({
  video,
  title,
  description,
}: {
  video: ProductVideoData;
  title: string;
  description: string;
}) {
  return (
    <section className="mt-10">
      <h2 className="font-[family-name:var(--font-courgette)] text-2xl text-stone-900">
        {title}
      </h2>

      <div className="mt-4 flex flex-col gap-6 sm:flex-row sm:items-start">
        <video
          controls
          preload="none"
          playsInline
          poster={video.poster}
          width={video.width}
          height={video.height}
          className="w-full max-w-[280px] shrink-0 self-center rounded-lg bg-stone-900 sm:self-start"
        >
          <source src={video.src} type="video/mp4" />
        </video>

        <p className="text-[15px] leading-relaxed text-stone-700">
          {description}
        </p>
      </div>
    </section>
  );
}
