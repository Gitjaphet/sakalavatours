// src/lib/schema/touristTrip.ts
// TouristTrip — balisage d'un circuit ou d'une excursion.
//
// ⚠ Aucun aggregateRating tant que les notes du catalogue ne sont pas
//   confirmées comme de vrais avis vérifiables en base (cf. lib/api/products.ts,
//   ProductDetail.rating_average / review_count).
// ⚠ L'offre n'est balisée que si le prix est un nombre valide : un prix
//   erroné ou absent dans le balisage est sanctionnable, donc `offers` est
//   omis plutôt que publié avec une valeur douteuse.
//
// Note vocabulaire : schema.org ne définit aucune propriété de durée pour
// Trip/TouristTrip (contrairement à Event ou Recipe). La durée reste donc
// affichée uniquement dans le rendu visuel de la page, jamais dans ce
// balisage — y ajouter un champ "duration" informel n'apporterait aucun
// bénéfice Rich Results et risquerait d'être signalé comme type inconnu
// par les validateurs.

import { businessInfo } from "@/lib/nav-config";

export type TouristTripInput = {
  name: string;
  description: string;
  /** Chemin sans locale, ex. "/excursions/nosy-iranja" */
  path: string;
  image: string;
  /**
   * Prix de départ. Accepte un nombre ou une chaîne provenant directement
   * de l'API (ex. ProductDetail.price_from, typé string côté backend).
   * Toute valeur qui ne se convertit pas en nombre fini fait omettre le
   * bloc `offers` plutôt que publier un prix invalide.
   */
  priceFrom: number | string;
  currency: string;
  maxAttendees: number;
  /** Étapes ou lieux visités, si connus explicitement (pas déduits des
   *  titres d'itinéraire, qui sont des titres d'activité, pas des noms de
   *  lieux). */
  places?: string[];
};

function resolvePrice(priceFrom: number | string): number | null {
  const value = typeof priceFrom === "string" ? Number(priceFrom) : priceFrom;
  return Number.isFinite(value) && value > 0 ? value : null;
}

export function buildTouristTripSchema(
  locale: string,
  trip: TouristTripInput,
) {
  const url = `${businessInfo.url}/${locale}${trip.path}`;
  const price = resolvePrice(trip.priceFrom);

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
    ...(price !== null && {
      offers: {
        "@type": "Offer",
        price,
        priceCurrency: trip.currency,
        availability: "https://schema.org/InStock",
        url,
      },
    }),
  };
}