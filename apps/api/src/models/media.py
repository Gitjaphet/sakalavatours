"""Bibliothèque de médias.

Toutes les images du site passent par ici. Deux raisons :
- une image se réutilise (couverture d'article + galerie + section de page),
- son texte alternatif doit exister dans chaque langue.

L'alt_text est le levier SEO le plus sous-estimé sur un site de tourisme :
Google Images draine un trafic réel, et l'alt est son seul signal textuel.
"""

from datetime import date
from uuid import UUID

from sqlmodel import Field, SQLModel, UniqueConstraint

from src.models.base import (
    PublishableMixin,
    SeoMixin,
    SlugMixin,
    SoftDeleteMixin,
    TimestampMixin,
    TranslationMixin,
    UUIDMixin,
)
from src.models.enums import MediaKind


class Media(UUIDMixin, TimestampMixin, SoftDeleteMixin, table=True):
    """Fichier physique et ses métadonnées techniques."""

    __tablename__ = "media"

    kind: MediaKind = Field(default=MediaKind.IMAGE, index=True)

    # ── Fichier ────────────────────────────────────────────────────────
    filename: str = Field(max_length=255)
    storage_path: str = Field(max_length=500, description="Chemin relatif dans le stockage")
    mime_type: str = Field(max_length=100)
    file_size: int = Field(description="Taille en octets")

    # ── Dimensions ─────────────────────────────────────────────────────
    # Renseignées à l'upload et transmises au composant <Image> de Next.
    # Sans elles, le navigateur ne peut pas réserver l'espace et provoque
    # du Cumulative Layout Shift, qui est un facteur de classement Google.
    width: int | None = Field(default=None)
    height: int | None = Field(default=None)

    blurhash: str | None = Field(
        default=None,
        max_length=100,
        description="Placeholder flouté affiché pendant le chargement",
    )
    dominant_color: str | None = Field(
        default=None,
        max_length=9,
        description="Couleur dominante en hexadécimal, ex. #1d4e5f",
    )

    # ── Contexte éditorial ─────────────────────────────────────────────
    photographer: str | None = Field(
        default=None,
        max_length=150,
        description="Crédit photo. Obligatoire pour toute image tierce.",
    )
    taken_at: date | None = Field(default=None)
    latitude: float | None = Field(default=None)
    longitude: float | None = Field(default=None)

    # ── Classement ─────────────────────────────────────────────────────
    folder: str | None = Field(
        default=None,
        max_length=100,
        index=True,
        description="Dossier logique dans l'admin : excursions, blog, equipe…",
    )
    is_public: bool = Field(
        default=True,
        description="False pour les pièces jointes internes (devis, contrats)",
    )


class MediaTranslation(UUIDMixin, TimestampMixin, TranslationMixin, table=True):
    """Textes du média, par langue.

    `alt_text` est obligatoire côté application : une image sans alt est
    invisible pour Google Images et inaccessible aux lecteurs d'écran.
    """

    __tablename__ = "media_translation"
    __table_args__ = (UniqueConstraint("media_id", "locale", name="uq_media_translation"),)

    media_id: UUID = Field(foreign_key="media.id", index=True, ondelete="CASCADE")

    alt_text: str = Field(
        max_length=250,
        description="Décrit ce que montre l'image. Ni 'photo', ni le nom du fichier.",
    )
    caption: str | None = Field(default=None, max_length=500)
    title: str | None = Field(default=None, max_length=200)


class Gallery(
    UUIDMixin, TimestampMixin, SoftDeleteMixin, SlugMixin, PublishableMixin, table=True
):
    """Album thématique de la page /galerie."""

    __tablename__ = "gallery"

    cover_media_id: UUID | None = Field(default=None, foreign_key="media.id")
    is_indexable: bool = Field(default=True)


class GalleryTranslation(UUIDMixin, TimestampMixin, TranslationMixin, SeoMixin, table=True):
    __tablename__ = "gallery_translation"
    __table_args__ = (UniqueConstraint("gallery_id", "locale", name="uq_gallery_translation"),)

    gallery_id: UUID = Field(foreign_key="gallery.id", index=True, ondelete="CASCADE")

    title: str = Field(max_length=200)
    description: str | None = Field(default=None)


class GalleryMedia(SQLModel, table=True):
    """Table de liaison galerie ↔ média.

    Clé primaire composite : un média ne peut apparaître qu'une fois dans
    un même album, mais peut appartenir à plusieurs albums.
    """

    __tablename__ = "gallery_media"

    gallery_id: UUID = Field(
        foreign_key="gallery.id", primary_key=True, ondelete="CASCADE"
    )
    media_id: UUID = Field(foreign_key="media.id", primary_key=True, ondelete="CASCADE")
    sort_order: int = Field(default=0)
