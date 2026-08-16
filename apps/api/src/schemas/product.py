"""Contrats de sortie publics pour les produits.

Deux schémas distincts, et c'est délibéré :

- ProductListItem : ce dont la CARTE a besoin. Léger.
- ProductDetail   : la fiche complète, avec itinéraire, prestations, FAQ.

Renvoyer le détail complet dans une liste de 15 produits transférerait des
centaines de kilo-octets pour afficher des vignettes.
"""

from datetime import time
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from src.models.enums import DifficultyLevel, ProductFormat, ProductType, TransportMode


class MediaOut(BaseModel):
    """Image prête pour le composant <Image> de Next.

    width et height sont obligatoires côté frontend : sans eux, le
    navigateur ne réserve pas l'espace et provoque du layout shift, qui
    est un facteur de classement Google.
    """

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    url: str
    width: int | None = None
    height: int | None = None
    blurhash: str | None = None
    alt_text: str = ""


class LabelOut(BaseModel):
    """Étiquette traduite d'une taxonomie (point fort, prestation…)."""

    code: str
    label: str
    icon: str | None = None


class InclusionOut(LabelOut):
    is_included: bool = True
    detail: str | None = None


class ItineraryItemOut(BaseModel):
    day_number: int
    time_label: str | None = None
    title: str
    description: str | None = None
    location_label: str | None = None
    hotel_name: str | None = None
    meal_plan: str | None = None
    distance_km: int | None = None
    is_optional: bool = False


class FaqOut(BaseModel):
    question: str
    answer: str


class PriceTierOut(BaseModel):
    label_code: str
    price: Decimal
    min_pax: int | None = None
    max_pax: int | None = None
    is_private: bool = False


class ProductListItem(BaseModel):
    """Charge utile d'une carte produit."""

    id: UUID
    slug: str
    product_type: ProductType
    product_format: ProductFormat
    difficulty: DifficultyLevel

    title: str
    subtitle: str | None = None
    region_label: str | None = None
    summary: str

    duration_days: int | None = None
    duration_nights: int | None = None
    duration_hours: Decimal | None = None
    departure_time: time | None = None
    return_time: time | None = None
    travel_minutes: int | None = None
    transport: TransportMode | None = None

    group_min: int
    group_max: int
    hotel_pickup: bool

    price_from: Decimal
    currency: str

    rating_average: Decimal | None = None
    review_count: int = 0

    is_featured: bool = False
    cover: MediaOut | None = None
    highlights: list[LabelOut] = Field(default_factory=list)

    # Signale au frontend que le contenu n'est pas dans la langue demandée.
    # Permet d'afficher « traduction en cours » plutôt que de laisser
    # croire à une erreur.
    is_fallback: bool = False
    content_locale: str


class ProductDetail(ProductListItem):
    """Fiche complète. Hérite de la liste et ajoute le contenu lourd."""

    description: str | None = None
    practical_info: str | None = None

    meta_title: str | None = None
    meta_description: str | None = None

    itinerary: list[ItineraryItemOut] = Field(default_factory=list)
    inclusions: list[InclusionOut] = Field(default_factory=list)
    packing_items: list[LabelOut] = Field(default_factory=list)
    faqs: list[FaqOut] = Field(default_factory=list)
    price_tiers: list[PriceTierOut] = Field(default_factory=list)
    gallery: list[MediaOut] = Field(default_factory=list)
    departure_months: list[int] = Field(default_factory=list)
    related_slugs: list[str] = Field(default_factory=list)


class ProductListResponse(BaseModel):
    """Réponse paginée.

    `total` permet au frontend d'afficher « 7 circuits » sans requête
    supplémentaire.
    """

    items: list[ProductListItem]
    total: int
    limit: int
    offset: int
