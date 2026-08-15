"""Référentiels partagés par les produits.

Quatre taxonomies, toutes construites sur le même patron :
une table parente (données non traduisibles) + une table de traduction.

Le champ `code` est un identifiant stable et lisible qui sert de pont
avec le frontend : Next l'utilise pour choisir le picto à afficher.
Contrairement au slug il n'apparaît jamais dans une URL, mais il ne doit
pas changer non plus — un composant React y fait référence.
"""

from uuid import UUID

from sqlmodel import Field, UniqueConstraint

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


# ─────────────────────────────────────────────────────────────────────────
# Destinations — Nosy Iranja, Lokobe, Mont Passot…
#
# Seule taxonomie à avoir ses propres pages indexables. C'est un gisement
# SEO majeur : « Nosy Tanikely » est une requête en soi, distincte de
# « excursion Nosy Be ». Chaque destination alimente aussi le type Place
# de schema.org.
# ─────────────────────────────────────────────────────────────────────────


class Destination(
    UUIDMixin,
    TimestampMixin,
    SoftDeleteMixin,
    SlugMixin,
    PublishableMixin,
    SeoTechnicalMixin,
    table=True,
):
    __tablename__ = "destination"

    code: str = Field(max_length=60, unique=True, index=True)

    latitude: float | None = Field(default=None)
    longitude: float | None = Field(default=None)

    region: str | None = Field(
        default=None, max_length=100, description="Diana, SAVA, Boeny…"
    )
    country_code: str = Field(default="MG", max_length=2)

    cover_media_id: UUID | None = Field(default=None, foreign_key="media.id")

    parent_id: UUID | None = Field(
        default=None,
        foreign_key="destination.id",
        index=True,
        description="Hiérarchie : Nosy Komba est rattachée à l'archipel de Nosy Be",
    )


class DestinationTranslation(
    UUIDMixin, TimestampMixin, TranslationMixin, SeoMixin, table=True
):
    __tablename__ = "destination_translation"
    __table_args__ = (
        UniqueConstraint("destination_id", "locale", name="uq_destination_translation"),
    )

    destination_id: UUID = Field(
        foreign_key="destination.id", index=True, ondelete="CASCADE"
    )

    name: str = Field(max_length=150)
    short_description: str | None = Field(default=None, max_length=500)
    description: str | None = Field(default=None)


# ─────────────────────────────────────────────────────────────────────────
# Points forts — « Banc de sable blanc », « Tortues marines »…
# ─────────────────────────────────────────────────────────────────────────


class Highlight(UUIDMixin, TimestampMixin, SoftDeleteMixin, table=True):
    __tablename__ = "highlight"

    code: str = Field(max_length=60, unique=True, index=True)
    icon: str | None = Field(
        default=None,
        max_length=60,
        description="Nom d'icône Tabler côté Next, ex. IconScubaMask",
    )
    sort_order: int = Field(default=0)


class HighlightTranslation(UUIDMixin, TimestampMixin, TranslationMixin, table=True):
    __tablename__ = "highlight_translation"
    __table_args__ = (
        UniqueConstraint("highlight_id", "locale", name="uq_highlight_translation"),
    )

    highlight_id: UUID = Field(foreign_key="highlight.id", index=True, ondelete="CASCADE")
    label: str = Field(max_length=120)


# ─────────────────────────────────────────────────────────────────────────
# Prestations — « Transfert hôtel », « Déjeuner », « Masque & tuba »…
#
# Sert aussi bien aux inclus qu'aux non-inclus : c'est la table de liaison
# product_inclusion qui porte le booléen `is_included`. Un même élément
# peut donc être compris dans une excursion et en supplément dans une autre.
# ─────────────────────────────────────────────────────────────────────────


class Inclusion(UUIDMixin, TimestampMixin, SoftDeleteMixin, table=True):
    __tablename__ = "inclusion"

    code: str = Field(max_length=60, unique=True, index=True)
    icon: str | None = Field(default=None, max_length=60)
    sort_order: int = Field(default=0)


class InclusionTranslation(UUIDMixin, TimestampMixin, TranslationMixin, table=True):
    __tablename__ = "inclusion_translation"
    __table_args__ = (
        UniqueConstraint("inclusion_id", "locale", name="uq_inclusion_translation"),
    )

    inclusion_id: UUID = Field(foreign_key="inclusion.id", index=True, ondelete="CASCADE")
    label: str = Field(max_length=150)
    detail: str | None = Field(
        default=None, max_length=300, description="Précision affichée au survol"
    )


# ─────────────────────────────────────────────────────────────────────────
# À prévoir — « Maillot de bain », « Crème solaire »…
# ─────────────────────────────────────────────────────────────────────────


class PackingItem(UUIDMixin, TimestampMixin, SoftDeleteMixin, table=True):
    __tablename__ = "packing_item"

    code: str = Field(max_length=60, unique=True, index=True)
    icon: str | None = Field(default=None, max_length=60)
    sort_order: int = Field(default=0)


class PackingItemTranslation(UUIDMixin, TimestampMixin, TranslationMixin, table=True):
    __tablename__ = "packing_item_translation"
    __table_args__ = (
        UniqueConstraint("packing_item_id", "locale", name="uq_packing_item_translation"),
    )

    packing_item_id: UUID = Field(
        foreign_key="packing_item.id", index=True, ondelete="CASCADE"
    )
    label: str = Field(max_length=150)
