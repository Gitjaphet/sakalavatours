// src/lib/schema/touristTrip.ts
// TouristTrip — balisage d'un circuit ou d'une excursion.
//
// ⚠ Aucun aggregateRating tant que les notes du catalogue sont des mocks.
// ⚠ L'offre n'est balisée que si le prix affiché est le prix réellement
//    pratiqué : un prix erroné dans le balisage est sanctionnable.

import { businessInfo } from "@/lib/nav-config";

export type TouristTripInput = {
  name: string;
  description: string;
  /** Chemin sans locale, ex. "/excursions/nosy-iranja" */
  path: string;
  image: string;
  /** Durée ISO 8601 : "P11D" pour 11 jours, "PT9H30M" pour 9h30 */
  duration: string;
  priceFrom: number;
  currency: string;
  maxAttendees: number;
  /** Étapes ou lieux visités */
  places?: string[];
};

export function buildTouristTripSchema(
  locale: string,
  trip: TouristTripInput,
) {
  const url = `${businessInfo.url}/${locale}${trip.path}`;

  return {
    "@context": "https://schema.org",
    "@type": "TouristTrip",
    "@id": `${url}#trip`,
    name: trip.name,
    description: trip.description,
    url,
    image: trip.image.startsWith("http")
      ? trip.image
      : `${businessInfo.url}${trip.image}`,
    touristType: "Leisure",
    maximumAttendeeCapacity: trip.maxAttendees,
    provider: { "@id": `${businessInfo.url}/#organization` },
    ...(trip.places?.length && {
      itinerary: {
        "@type": "ItemList",
        itemListElement: trip.places.map((place, i) => ({
          "@type": "ListItem",
          position: i + 1,
          item: { "@type": "Place", name: place },
        })),
      },
    }),
    offers: {
      "@type": "Offer",
      price: trip.priceFrom,
      priceCurrency: trip.currency,
      availability: "https://schema.org/InStock",
      url,
    },
    subjectOf: { "@type": "Duration", name: trip.duration },
  };
}
