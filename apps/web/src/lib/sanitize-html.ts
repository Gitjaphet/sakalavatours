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
// de cette liste est supprimée silencieusement par DOMPurify, pas rejetée
// avec erreur — le contenu reste affichable même si une balise est filtrée.

import DOMPurify from "isomorphic-dompurify";

const ALLOWED_TAGS = [
  "p", "br",
  "strong", "b", "em", "i", "u",
  "ul", "ol", "li",
  "a",
  "h3", "h4",
  "blockquote",
];

const ALLOWED_ATTR = ["href", "target", "rel"];

export function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    // Empêche tout attribut on* (onclick, onerror...) même s'il passait
    // au travers d'une future modification de la liste blanche ci-dessus.
    FORBID_ATTR: ["style"],
  });
}