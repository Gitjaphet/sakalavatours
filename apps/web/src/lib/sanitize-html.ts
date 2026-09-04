// src/lib/sanitize-html.ts
// Sanitization centralisée du HTML admin avant rendu via dangerouslySetInnerHTML.
//
// Le contenu (ex. Product.description) est saisi côté admin, pas par un
// visiteur public — le risque XSS classique ne s'applique donc pas
// directement. Cette sanitization reste une défense en profondeur : elle
// protège contre un éditeur riche compromis, un copier-coller depuis une
// source externe, ou un accès admin élargi à plusieurs personnes demain.
//
// Liste blanche volontairement restreinte au strict nécessaire d'un corps
// de fiche produit (paragraphes, emphase, listes, liens). Toute balise hors
// de cette liste est supprimée silencieusement, pas rejetée avec erreur —
// le contenu reste affichable même si une balise est filtrée.
//
// ⚠ Ne pas revenir à isomorphic-dompurify : il embarque jsdom, dont une
// dépendance ESM casse le rendu serveur sur Vercel (ERR_REQUIRE_ESM).
// `sanitize-html` fait le même travail sans jsdom.

import sanitize from "sanitize-html";

const ALLOWED_TAGS = [
  "p", "br",
  "strong", "b", "em", "i", "u",
  "ul", "ol", "li",
  "a",
  "h3", "h4",
  "blockquote",
];

export function sanitizeHtml(html: string): string {
  return sanitize(html, {
    allowedTags: ALLOWED_TAGS,
    allowedAttributes: {
      a: ["href", "target", "rel"],
    },
    // Seuls les liens web et mailto sont autorisés : écarte javascript:
    // et data: même si un href passait la liste blanche ci-dessus.
    allowedSchemes: ["http", "https", "mailto"],
    // Un lien ouvert dans un nouvel onglet sans rel="noopener" expose la
    // page d'origine ; on le force plutôt que de faire confiance à la saisie.
    transformTags: {
      a: (tagName, attribs) => ({
        tagName,
        attribs: attribs.target
          ? { ...attribs, rel: "noopener noreferrer" }
          : attribs,
      }),
    },
    disallowedTagsMode: "discard",
  });
}
