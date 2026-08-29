// apps/web/src/app/robots.ts
import type { MetadataRoute } from "next";
import { businessInfo } from "@/lib/nav-config";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // L'admin et les proxies API n'ont rien à faire dans l'index.
      // /avis/confirmation porte un jeton en query : la page se protège
      // déjà par un meta robots, cette règle évite même le passage.
      disallow: ["/admin", "/api/", "/*/avis/confirmation"],
    },
    sitemap: `${businessInfo.url}/sitemap.xml`,
  };
}