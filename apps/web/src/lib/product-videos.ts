// src/lib/product-videos.ts
// Videos associees aux fiches produit.
//
// Solution transitoire : tant qu'aucun champ video_url n'existe sur le modele
// Product cote API, la correspondance slug -> video vit ici. Ajouter une
// entree par produit ; le composant et le balisage suivent automatiquement.
//
// RÈGLE : les fichiers sont sur R2 (media.medevstack.com), jamais dans public/
// — un binaire de plusieurs Mo n'a rien a faire dans le depot Git.

export type ProductVideo = {
  /** URL absolue du MP4, servi en video/mp4. */
  src: string;
  /** URL absolue du poster JPG. Charge au rendu, doit rester leger. */
  poster: string;
  /** Dimensions natives — obligatoires pour reserver la place et eviter le CLS. */
  width: number;
  height: number;
  /** Duree ISO 8601 pour le balisage VideoObject. */
  duration: string;
  /** Date de mise en ligne, ISO 8601. */
  uploadDate: string;
  /** Cle i18n du bloc de textes : videos.<i18nKey>.title / .description */
  i18nKey: string;
};

const BASE = "https://media.medevstack.com/videos";

export const productVideos: Record<string, ProductVideo> = {
  "bivouac-nosy-iranja": {
    src: `${BASE}/nosy-iranja.mp4`,
    poster: `${BASE}/bivouac-nosy-iranja-soiree-plage.jpg`,
    width: 540,
    height: 960,
    duration: "PT55S",
    uploadDate: "2026-09-05T10:00:00+03:00",
    i18nKey: "bivouacIranja",
  },
};

export function getProductVideo(slug: string): ProductVideo | null {
  return productVideos[slug] ?? null;
}
