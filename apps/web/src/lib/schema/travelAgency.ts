// ⚠ aggregateRating n'est émis que si le backend l'autorise, via
// `is_schema_eligible` : au moins trois avis APPROUVÉS ET VÉRIFIÉS.
// Publier une note calculée sur des avis non vérifiables est le premier
// motif d'action manuelle Google sur les sites de tourisme.

import { businessInfo, contactInfo, socialLinks } from "@/lib/nav-config";
import { FOUNDING_YEAR } from "@/lib/about-data";
import type { ReviewAggregate } from "@/lib/api/reviews";

/** Codes BCP-47 des langues dans lesquelles l'agence accompagne */
const SPOKEN_LANGUAGES = ["fr", "en", "de", "it", "mg"] as const;

export function buildTravelAgencySchema(
  locale: string,
  description: string,
  aggregate?: ReviewAggregate,
) {
  const rating =
    aggregate?.is_schema_eligible && aggregate.average
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: aggregate.average,
            // Seuls les avis vérifiés sont déclarés : la moyenne affichée
            // sur le site peut porter sur davantage d'avis.
            reviewCount: aggregate.verified_count,
            bestRating: 5,
            worstRating: 1,
          },
        }
      : {};

  return {
    "@context": "https://schema.org",
    "@type": "TravelAgency",
    "@id": `${businessInfo.url}/#organization`,
    name: businessInfo.name,
    legalName: businessInfo.legalName,
    url: `${businessInfo.url}/${locale}`,
    logo: `${businessInfo.url}${businessInfo.logo}`,
    image: `${businessInfo.url}${businessInfo.logo}`,
    description,
    foundingDate: String(FOUNDING_YEAR),
    telephone: contactInfo.phoneE164,
    email: contactInfo.email,
    priceRange: businessInfo.priceRange,
    address: {
      "@type": "PostalAddress",
      addressLocality: businessInfo.addressLocality,
      addressRegion: businessInfo.addressRegion,
      addressCountry: businessInfo.addressCountry,
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: businessInfo.geo.lat,
      longitude: businessInfo.geo.lng,
    },
    areaServed: [
      { "@type": "Place", name: "Nosy Be" },
      { "@type": "Place", name: "Diana" },
      { "@type": "Country", name: "Madagascar" },
    ],
    knowsLanguage: [...SPOKEN_LANGUAGES],
    sameAs: socialLinks.map((s) => s.href),
    ...rating,
  };
}
