// src/lib/schema/travelAgency.ts
// TravelAgency — alimente le Knowledge Panel sur une recherche de marque.
//
// ⚠ Aucun aggregateRating ici : les notes du catalogue sont des mocks, et
// publier une note inventée expose à une action manuelle Google.

import { businessInfo, contactInfo, socialLinks } from "@/lib/nav-config";
import { FOUNDING_YEAR } from "@/lib/about-data";

/** Codes BCP-47 des langues dans lesquelles l'agence accompagne */
const SPOKEN_LANGUAGES = ["fr", "en", "de", "it", "mg"] as const;

export function buildTravelAgencySchema(locale: string, description: string) {
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
  };
}
