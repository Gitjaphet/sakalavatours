// src/lib/schema/breadcrumb.ts
// BreadcrumbList — remplace l'URL brute par un fil d'Ariane sous le titre
// dans les résultats Google.

import { businessInfo } from "@/lib/nav-config";

export type Crumb = {
  name: string;
  /** Chemin sans locale ni domaine, ex. "/circuits". Omettre pour la page courante. */
  path?: string;
};

export function buildBreadcrumbSchema(locale: string, crumbs: Crumb[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((crumb, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: crumb.name,
      ...(crumb.path !== undefined && {
        item: `${businessInfo.url}/${locale}${crumb.path === "/" ? "" : crumb.path}`,
      }),
    })),
  };
}
