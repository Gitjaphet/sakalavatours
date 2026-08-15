"""Contrats d'écriture pour l'administration des produits.

Trois schémas par entité, et la distinction est essentielle :

- Create : ce qui est requis à la création
- Update : TOUT est optionnel — c'est un PATCH, pas un remplacement
- AdminRead : ce que voit un administrateur (plus que le public)

Le piège du PATCH : si Update utilisait `None` comme « ne pas toucher »,
on ne pourrait jamais effacer un champ optionnel. On s'appuie donc sur
`model_dump(exclude_unset=True)`, qui distingue « absent de la requête »
de « explicitement mis à null ».
"""

from datetime import time
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator

from src.models.enums import (
    ContentStatus,
    DifficultyLevel,
    ProductFormat,
    ProductType,
    TransportMode,
)


class ProductTranslationIn(BaseModel):
    """Contenu d'un produit dans une langue."""

    locale: str = Field(min_length=2, max_length=5)
    title: str = Field(min_length=1, max_length=200)
    subtitle: str | None = Field(default=None, max_length=250)
    region_label: str | None = Field(default=None, max_length=150)
    summary: str = Field(min_length=1, max_length=600)
    description: str | None = None
    practical_info: str | None = None

    meta_title: str | None = Field(default=None, max_length=70)
    meta_description: str | None = Field(default=None, max_length=180)
    og_title: str | None = Field(default=None, max_length=120)
    og_description: str | None = Field(default=None, max_length=250)
    is_machine_translated: bool = False


class ItineraryItemIn(BaseModel):
    day_number: int = Field(default=1, ge=1)
    time_label: str | None = Field(default=None, max_length=20)
    sort_order: int = 0
    is_optional: bool = False
    media_id: UUID | None = None
    translations: list["ItineraryTranslationIn"] = Field(default_factory=list)


class ItineraryTranslationIn(BaseModel):
    locale: str = Field(min_length=2, max_length=5)
    title: str = Field(min_length=1, max_length=200)
    description: str | None = None


class PriceTierIn(BaseModel):
    label_code: str = Field(min_length=1, max_length=60)
    price: Decimal = Field(ge=0, max_digits=10, decimal_places=2)
    min_pax: int | None = Field(default=None, ge=1)
    max_pax: int | None = Field(default=None, ge=1)
    is_private: bool = False
    sort_order: int = 0


class FaqIn(BaseModel):
    locale: str = Field(min_length=2, max_length=5)
    question: str = Field(min_length=1, max_length=300)
    answer: str = Field(min_length=1)
    sort_order: int = 0


class InclusionLinkIn(BaseModel):
    """Une prestation, incluse ou non."""

    code: str = Field(min_length=1, max_length=60)
    is_included: bool = True
    sort_order: int = 0


class ProductCreate(BaseModel):
    """Création d'un circuit ou d'une excursion.

    `slug` est optionnel : s'il est absent, il est dérivé du titre
    français. Une fois créé, il ne change plus qu'explicitement.
    """

    slug: str | None = Field(default=None, max_length=200)
    product_type: ProductType
    product_format: ProductFormat
    difficulty: DifficultyLevel = DifficultyLevel.EASY
    status: ContentStatus = ContentStatus.DRAFT

    duration_days: int | None = Field(default=None, ge=1)
    duration_nights: int | None = Field(default=None, ge=0)
    duration_hours: Decimal | None = Field(default=None, ge=0, max_digits=4, decimal_places=1)
    departure_time: time | None = None
    return_time: time | None = None
    travel_minutes: int | None = Field(default=None, ge=0)
    transport: TransportMode | None = None

    group_min: int = Field(default=2, ge=1)
    group_max: int = Field(default=12, ge=1)
    hotel_pickup: bool = True
    min_age: int | None = Field(default=None, ge=0)

    # ⚠ Prix affiché publiquement : engage la responsabilité de l'agence.
    price_from: Decimal = Field(ge=0, max_digits=10, decimal_places=2)
    currency: str = Field(default="EUR", min_length=3, max_length=3)
    deposit_percent: int | None = Field(default=None, ge=0, le=100)

    destination_id: UUID | None = None
    cover_media_id: UUID | None = None
    is_featured: bool = False
    sort_order: int = 0

    is_indexable: bool = True
    sitemap_priority: float = Field(default=0.7, ge=0.0, le=1.0)

    translations: list[ProductTranslationIn] = Field(min_length=1)
    highlight_codes: list[str] = Field(default_factory=list)
    inclusions: list[InclusionLinkIn] = Field(default_factory=list)
    packing_codes: list[str] = Field(default_factory=list)
    departure_months: list[int] = Field(default_factory=list)
    gallery_media_ids: list[UUID] = Field(default_factory=list)
    itinerary: list[ItineraryItemIn] = Field(default_factory=list)
    price_tiers: list[PriceTierIn] = Field(default_factory=list)
    faqs: list[FaqIn] = Field(default_factory=list)

    @field_validator("group_max")
    @classmethod
    def check_group(cls, v: int, info) -> int:
        gmin = info.data.get("group_min")
        if gmin is not None and v < gmin:
            raise ValueError("group_max doit être supérieur ou égal à group_min")
        return v

    @field_validator("departure_months")
    @classmethod
    def check_months(cls, v: list[int]) -> list[int]:
        if any(m < 1 or m > 12 for m in v):
            raise ValueError("Les mois doivent être compris entre 1 et 12")
        return sorted(set(v))

    @field_validator("translations")
    @classmethod
    def check_locales_unique(cls, v: list[ProductTranslationIn]):
        locales = [t.locale for t in v]
        if len(locales) != len(set(locales)):
            raise ValueError("Une seule traduction par langue")
        return v


class ProductUpdate(BaseModel):
    """Modification partielle.

    Tous les champs sont optionnels. Les listes suivent une règle claire :
    absentes = inchangées, présentes = REMPLACENT intégralement l'existant.
    Pas de fusion implicite, qui produirait des comportements imprévisibles.
    """

    slug: str | None = Field(default=None, max_length=200)
    product_type: ProductType | None = None
    product_format: ProductFormat | None = None
    difficulty: DifficultyLevel | None = None
    status: ContentStatus | None = None
    is_published: bool | None = None

    duration_days: int | None = None
    duration_nights: int | None = None
    duration_hours: Decimal | None = None
    departure_time: time | None = None
    return_time: time | None = None
    travel_minutes: int | None = None
    transport: TransportMode | None = None

    group_min: int | None = Field(default=None, ge=1)
    group_max: int | None = Field(default=None, ge=1)
    hotel_pickup: bool | None = None
    min_age: int | None = None

    price_from: Decimal | None = Field(default=None, ge=0)
    currency: str | None = Field(default=None, min_length=3, max_length=3)
    deposit_percent: int | None = Field(default=None, ge=0, le=100)

    destination_id: UUID | None = None
    cover_media_id: UUID | None = None
    is_featured: bool | None = None
    sort_order: int | None = None

    is_indexable: bool | None = None
    sitemap_priority: float | None = Field(default=None, ge=0.0, le=1.0)

    translations: list[ProductTranslationIn] | None = None
    highlight_codes: list[str] | None = None
    inclusions: list[InclusionLinkIn] | None = None
    packing_codes: list[str] | None = None
    departure_months: list[int] | None = None
    gallery_media_ids: list[UUID] | None = None
    itinerary: list[ItineraryItemIn] | None = None
    price_tiers: list[PriceTierIn] | None = None
    faqs: list[FaqIn] | None = None


class ProductAdminListItem(BaseModel):
    """Ligne du tableau d'administration.

    Contient ce que le public ne voit pas : statut, brouillons, dates.
    """

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    slug: str
    product_type: ProductType
    status: ContentStatus
    is_published: bool
    is_featured: bool
    price_from: Decimal
    currency: str
    sort_order: int
    review_count: int
    rating_average: Decimal | None = None

    title: str = ""
    translated_locales: list[str] = Field(default_factory=list)


class ProductAdminListResponse(BaseModel):
    items: list[ProductAdminListItem]
    total: int
    limit: int
    offset: int


ItineraryItemIn.model_rebuild()
