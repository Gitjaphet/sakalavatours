// apps/web/src/app/sitemap.ts
import type { MetadataRoute } from "next";
import { businessInfo } from "@/lib/nav-config";
import { getProducts } from "@/lib/api/products";
import { routing } from "@/i18n/routing";

// Régénéré toutes les heures : un build lancé pendant une indisponibilité
// de l'API produirait sinon un sitemap sans produits, figé jusqu'au
// déploiement suivant.
export const revalidate = 3600;

/** Pages fixes, hors fiches produit. */
const STATIC_PATHS = [
  "",
  "/circuits",
  "/excursions",
  "/apropos",
  "/contact",
  "/galerie",
  "/avis",
  "/blog",
  "/reservation",
] as const;

/**
 * Alternates hreflang d'un chemin donné.
 *
 * Chaque URL déclare ses équivalents dans les trois autres langues :
 * c'est ce qui évite que Google traite les quatre versions comme du
 * contenu dupliqué.
 */
function languages(path: string): Record<string, string> {
  return Object.fromEntries(
    routing.locales.map((l) => [l, `${businessInfo.url}/${l}${path}`]),
  );
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Plafond de l'API : limit ne peut dépasser 100. Au-delà, elle renvoie
  // un 422 que apiGetSafe convertit en liste vide — le sitemap sortirait
  // sans aucune fiche produit, sans erreur visible.
  const [circuits, excursions] = await Promise.all([
    getProducts(routing.defaultLocale, { type: "circuit", limit: 100 }),
    getProducts(routing.defaultLocale, { type: "excursion", limit: 100 }),
  ]);

  const productPaths = [
    ...circuits.items.map((p) => `/circuits/${p.slug}`),
    ...excursions.items.map((p) => `/excursions/${p.slug}`),
  ];

  const entries: MetadataRoute.Sitemap = [];

  for (const path of [...STATIC_PATHS, ...productPaths]) {
    for (const locale of routing.locales) {
      entries.push({
        url: `${businessInfo.url}/${locale}${path}`,
        changeFrequency: path === "" ? "weekly" : "monthly",
        // La page d'accueil et les listes changent plus souvent que les
        // fiches ; les fiches produit convertissent, d'où leur priorité.
        priority: path === "" ? 1 : path.includes("/") ? 0.8 : 0.6,
        alternates: { languages: languages(path) },
      });
    }
  }

  return entries;
}