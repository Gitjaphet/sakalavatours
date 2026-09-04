// src/lib/nav-active.ts
// Etat actif de la navigation principale.
// Aucun caractere JSX ici : ce fichier reste editable sans risque de patch.
import { navLinks } from "@/lib/nav-config";

/** Vrai si `href` correspond a la page courante.
 *  L'accueil exige une egalite stricte, sinon "/" matcherait toutes les pages.
 *  Le "/" concatene evite qu'un futur /circuits-prives allume /circuits. */
export function isActiveNav(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
}

/** Href du lien de nav actif, ou null. `pathname` vient de @/i18n/navigation :
 *  il est deja deprefixe de la locale (/excursions, pas /fr/excursions). */
export function findActiveHref(pathname: string): string | null {
  for (const link of navLinks) {
    if (isActiveNav(pathname, link.href)) return link.href;
  }
  return null;
}

/** Classes du lien de nav. Les variantes de hauteur du trait sont exclusives :
 *  jamais after:h-px et after:h-0.5 dans la meme chaine. */
export function navLinkClass(active: boolean, overlay: boolean): string {
  const base =
    "relative py-1 transition-colors after:absolute after:inset-x-0 after:-bottom-0.5 after:origin-center after:transition-transform after:duration-300";
  const trait = active
    ? "after:h-0.5 after:scale-x-100"
    : "after:h-px after:scale-x-0 hover:after:scale-x-100";
  const teinte = overlay
    ? `hover:text-white after:bg-[#F4A261] ${active ? "text-white" : ""}`
    : `hover:text-[#E63946] after:bg-[#E63946] ${active ? "text-[#E63946]" : ""}`;
  return `${base} ${trait} ${teinte}`;
}
