// src/lib/schema/videoObject.ts
// VideoObject — declenche la miniature video dans les resultats de recherche.
//
// ⚠ Trois conditions Google souvent manquees :
//   1. thumbnailUrl doit etre une image crawlable (JPG/PNG), jamais generee
//      en JavaScript, jamais bloquee par le robots.txt.
//   2. duration est en ISO 8601 — PT55S, PT1M30S. Un format libre invalide
//      tout le balisage, silencieusement.
//   3. contentUrl doit repondre en video/mp4 et rester accessible aux robots.
//
// La video balisee doit etre reellement visible sur la page : baliser une
// video absente du rendu est un motif documente d'action manuelle.

export type VideoSchemaInput = {
  /** Titre descriptif, avec le mot-cle cible formule naturellement. */
  name: string;
  /** Deux a trois phrases decrivant reellement le contenu de la video. */
  description: string;
  /** URL absolue du fichier video (video/mp4). */
  contentUrl: string;
  /** URL absolue de la miniature (JPG ou PNG). */
  thumbnailUrl: string;
  /** Date de mise en ligne, ISO 8601 (2026-09-05). */
  uploadDate: string;
  /** Duree ISO 8601 : PT55S pour 55 secondes. */
  duration: string;
  /** URL absolue de la page qui heberge la video. */
  pageUrl: string;
};

export function buildVideoSchema(input: VideoSchemaInput) {
  return {
    "@context": "https://schema.org",
    "@type": "VideoObject",
    name: input.name,
    description: input.description,
    thumbnailUrl: [input.thumbnailUrl],
    uploadDate: input.uploadDate,
    duration: input.duration,
    contentUrl: input.contentUrl,
    // embedUrl pointe vers la page du site, jamais vers un lecteur tiers :
    // un embedUrl externe fait attribuer le resultat enrichi a ce tiers.
    embedUrl: input.pageUrl,
  };
}
