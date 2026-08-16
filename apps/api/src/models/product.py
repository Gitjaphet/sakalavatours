"""Circuits et excursions.

Une seule table pour les deux, discriminée par `product_type`. Le contenu
fourni pour Nosy Iranja et Nosy Sakatia le confirme : même programme
horaire, mêmes prestations incluses, mêmes points forts, mêmes affaires à
prévoir. Seule la granularité temporelle diffère — heures pour une
excursion, jours pour un circuit.

Séparer en deux tables aurait imposé de dupliquer neuf tables satellites
et deux interfaces d'administration.
"""

from datetime import time
from decimal import Decimal
from uuid import UUID

from sqlmodel import Field, SQLModel, UniqueConstraint

from src.models.base import (
    PublishableMixin,
    SeoMixin,
    SeoTechnicalMixin,
    SlugMixin,
    SoftDeleteMixin,
    TimestampMixin,
    TranslationMixin,
    UUIDMixin,
)
from src.models.enums import (
    ContentStatus,
    DifficultyLevel,
    ProductFormat,
    ProductType,
    TransportMode,
)


class Product(
    UUIDMixin,
    TimestampMixin,
    SoftDeleteMixin,
    SlugMixin,
    PublishableMixin,
    SeoTechnicalMixin,
    table=True,
):
    """Données non traduisibles d'un circuit ou d'une excursion."""

    __tablename__ = "product"

    product_type: ProductType = Field(index=True)
    product_format: ProductFormat = Field(index=True)
    status: ContentStatus = Field(default=ContentStatus.DRAFT, index=True)

    # ── Durée ──────────────────────────────────────────────────────────
    # Un circuit renseigne days/nights, une excursion duration_hours.
    # Les deux jeux coexistent plutôt que de forcer une conversion.
    duration_days: int | None = Field(default=None)
    duration_nights: int | None = Field(default=None)
    duration_hours: Decimal | None = Field(
        default=None, max_digits=4, decimal_places=1, description="9.5 = 9h30"
    )

    departure_time: time | None = Field(default=None)
    return_time: time | None = Field(default=None)

    travel_minutes: int | None = Field(
        default=None, description="Trajet aller. 90 pour Nosy Iranja."
    )
    transport: TransportMode | None = Field(default=None)
    difficulty: DifficultyLevel = Field(default=DifficultyLevel.EASY, index=True)

    # ── Groupe et prise en charge ──────────────────────────────────────
    group_min: int = Field(default=2, ge=1)
    group_max: int = Field(default=12, ge=1)
    hotel_pickup: bool = Field(default=True)
    min_age: int | None = Field(default=None)

    # ── Tarification ───────────────────────────────────────────────────
    # ⚠ Prix affiché publiquement : engage la responsabilité de l'agence.
    # `price_from` est le tarif d'appel ; la grille détaillée vit dans
    # ProductPriceTier.
    price_from: Decimal = Field(max_digits=10, decimal_places=2, ge=0)
    currency: str = Field(default="EUR", max_length=3)
    deposit_percent: int | None = Field(
        default=None, ge=0, le=100, description="Acompte demandé à la réservation"
    )

    # ── Relations ──────────────────────────────────────────────────────
    destination_id: UUID | None = Field(
        default=None, foreign_key="destination.id", index=True
    )
    cover_media_id: UUID | None = Field(default=None, foreign_key="media.id")

    # ── Mise en avant ──────────────────────────────────────────────────
    is_featured: bool = Field(default=False, index=True)

    # ── Avis ───────────────────────────────────────────────────────────
    # ⚠ Ces deux champs sont RECALCULÉS à partir des avis approuvés ET
    # vérifiés. Ils ne sont jamais saisis à la main, et ne sont exposés
    # en JSON-LD aggregateRating que si review_count > 0 sur des avis
    # réels : une note inventée expose à une action manuelle Google.
    rating_average: Decimal | None = Field(
        default=None, max_digits=3, decimal_places=2
    )
    review_count: int = Field(default=0)


class ProductTranslation(
    UUIDMixin, TimestampMixin, TranslationMixin, SeoMixin, table=True
):
    __tablename__ = "product_translation"
    __table_args__ = (UniqueConstraint("product_id", "locale", name="uq_product_translation"),)

    product_id: UUID = Field(foreign_key="product.id", index=True, ondelete="CASCADE")

    title: str = Field(max_length=200)
    subtitle: str | None = Field(
        default=None, max_length=250, description="Ex. « Un joyau de l'océan Indien »"
    )
    region_label: str | None = Field(
        default=None, max_length=150, description="Affiché sous le titre de la carte"
    )
    summary: str = Field(max_length=600, description="Résumé de la carte, 2-3 lignes")
    description: str | None = Field(default=None, description="Corps de la fiche, en HTML")
    practical_info: str | None = Field(
        default=None,
        description="Avertissement météo/marée affiché en pied de fiche",
    )


class ProductItineraryItem(UUIDMixin, TimestampMixin, table=True):
    """Une étape du programme.

    Excursion : `time_label` = "07h30", `day_number` reste à 1.
    Circuit   : `day_number` = 3, `time_label` peut rester vide.
    """

    __tablename__ = "product_itinerary_item"

    product_id: UUID = Field(foreign_key="product.id", index=True, ondelete="CASCADE")

    day_number: int = Field(default=1, ge=1)
    time_label: str | None = Field(
        default=None, max_length=20, description="Affiché tel quel : 07h30, Matin…"
    )
    sort_order: int = Field(default=0)
    media_id: UUID | None = Field(default=None, foreign_key="media.id")
    is_optional: bool = Field(
        default=False, description="Étape soumise aux conditions (marée, météo)"
    )

    # ── Détails structurés de l'étape ────────────────────────────────
    # Non traduits : un nom d'hôtel et une distance en km sont identiques
    # quelle que soit la langue du visiteur.
    hotel_name: str | None = Field(
        default=None, max_length=150, description="Hébergement de la nuit, si applicable"
    )
    distance_km: int | None = Field(
        default=None, ge=0, description="Distance du trajet vers cette étape"
    )


class ProductItineraryTranslation(
    UUIDMixin, TimestampMixin, TranslationMixin, table=True
):
    __tablename__ = "product_itinerary_translation"
    __table_args__ = (
        UniqueConstraint("item_id", "locale", name="uq_product_itinerary_translation"),
    )

    item_id: UUID = Field(
        foreign_key="product_itinerary_item.id", index=True, ondelete="CASCADE"
    )

    title: str = Field(max_length=200, description="Ex. « Départ de votre hôtel »")
    description: str | None = Field(default=None)

    # ── Détails structurés de l'étape, traduits ──────────────────────
    location_label: str | None = Field(
        default=None, max_length=150, description="Lieu ou région de l'étape"
    )
    meal_plan: str | None = Field(
        default=None, max_length=200, description="Repas inclus, texte libre"
    )

class ProductPriceTier(UUIDMixin, TimestampMixin, table=True):
    """Grille tarifaire par taille de groupe.

    Permet le dégressif (« 85 € de 2 à 4 pers., 70 € au-delà ») et les
    tarifs privatifs, sans multiplier les produits.
    """

    __tablename__ = "product_price_tier"

    product_id: UUID = Field(foreign_key="product.id", index=True, ondelete="CASCADE")

    label_code: str = Field(
        max_length=60, description="adult | child | private | high_season…"
    )
    price: Decimal = Field(max_digits=10, decimal_places=2, ge=0)
    min_pax: int | None = Field(default=None)
    max_pax: int | None = Field(default=None)
    is_private: bool = Field(default=False)
    sort_order: int = Field(default=0)


class ProductFaq(UUIDMixin, TimestampMixin, TranslationMixin, table=True):
    """Questions fréquentes propres à un produit.

    ⚠ Alimente le JSON-LD FAQPage. Google exige que chaque question
    balisée soit VISIBLE sur la page — la fiche produit doit donc les
    afficher en clair, jamais dans un onglet masqué au chargement.

    C'est le levier SEO le plus rentable d'une fiche produit : les
    questions occupent une place considérable dans les résultats.
    """

    __tablename__ = "product_faq"

    product_id: UUID = Field(foreign_key="product.id", index=True, ondelete="CASCADE")

    question: str = Field(max_length=300)
    answer: str
    sort_order: int = Field(default=0)


# ─────────────────────────────────────────────────────────────────────────
# Tables de liaison — clés primaires composites, pas d'UUID inutile
# ─────────────────────────────────────────────────────────────────────────


class ProductHighlight(SQLModel, table=True):
    __tablename__ = "product_highlight"

    product_id: UUID = Field(foreign_key="product.id", primary_key=True, ondelete="CASCADE")
    highlight_id: UUID = Field(
        foreign_key="highlight.id", primary_key=True, ondelete="CASCADE"
    )
    sort_order: int = Field(default=0)


class ProductInclusion(SQLModel, table=True):
    """Prestations incluses ET non incluses.

    Le booléen `is_included` permet à un même élément (« Déjeuner ») d'être
    compris dans une excursion et en supplément dans une autre.
    """

    __tablename__ = "product_inclusion"

    product_id: UUID = Field(foreign_key="product.id", primary_key=True, ondelete="CASCADE")
    inclusion_id: UUID = Field(
        foreign_key="inclusion.id", primary_key=True, ondelete="CASCADE"
    )
    is_included: bool = Field(default=True)
    sort_order: int = Field(default=0)


class ProductPackingItem(SQLModel, table=True):
    __tablename__ = "product_packing_item"

    product_id: UUID = Field(foreign_key="product.id", primary_key=True, ondelete="CASCADE")
    packing_item_id: UUID = Field(
        foreign_key="packing_item.id", primary_key=True, ondelete="CASCADE"
    )
    sort_order: int = Field(default=0)


class ProductMedia(SQLModel, table=True):
    __tablename__ = "product_media"

    product_id: UUID = Field(foreign_key="product.id", primary_key=True, ondelete="CASCADE")
    media_id: UUID = Field(foreign_key="media.id", primary_key=True, ondelete="CASCADE")
    sort_order: int = Field(default=0)


class ProductRelated(SQLModel, table=True):
    """Maillage interne entre produits.

    « Vous aimerez aussi » n'est pas qu'un dispositif commercial : c'est
    ce qui fait circuler l'autorité entre tes fiches et aide Google à
    comprendre qu'elles forment un ensemble cohérent.
    """

    __tablename__ = "product_related"

    product_id: UUID = Field(foreign_key="product.id", primary_key=True, ondelete="CASCADE")
    related_product_id: UUID = Field(
        foreign_key="product.id", primary_key=True, ondelete="CASCADE"
    )
    sort_order: int = Field(default=0)


class ProductDepartureMonth(SQLModel, table=True):
    """Saisonnalité — mois recommandés.

    Aucune ligne = praticable toute l'année.
    """

    __tablename__ = "product_departure_month"

    product_id: UUID = Field(foreign_key="product.id", primary_key=True, ondelete="CASCADE")
    month: int = Field(primary_key=True, ge=1, le=12)
