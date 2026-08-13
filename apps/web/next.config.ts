import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
 

  // ─── Images ───────────────────────────────────────────────────────────
  images: {
    // AVIF d'abord (≈ 30 % plus léger que WebP), WebP en repli.
    // Next choisit selon ce que le navigateur annonce accepter.
    formats: ["image/avif", "image/webp"],
    // Points de rupture alignés sur nos breakpoints Tailwind : évite de
    // générer des variantes que le site ne demandera jamais.
    deviceSizes: [640, 750, 828, 1080, 1200, 1440, 1920, 2048],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    // Cache CDN des images transformées : 30 jours.
    minimumCacheTTL: 2_592_000,
  },

  // ─── Divers ───────────────────────────────────────────────────────────
  // Retire l'en-tête X-Powered-By : aucune utilité, un indice de moins
  // pour un attaquant.
  poweredByHeader: false,

  // Retire les console.log en production, garde les erreurs.
  compiler: {
    removeConsole:
      process.env.NODE_ENV === "production" ? { exclude: ["error", "warn"] } : false,
  },

  // ─── En-têtes de sécurité ─────────────────────────────────────────────
  // Audités par Lighthouse dans la catégorie « Bonnes pratiques ».
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
        ],
      },
      {
        // Les visuels du hero ne changent jamais sans changer de nom :
        // cache agressif, aucun aller-retour serveur sur les visites suivantes.
        source: "/images/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
    ];
  },
};

export default withNextIntl(nextConfig);