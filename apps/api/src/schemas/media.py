"""Contrats d'entrée et de sortie pour la bibliothèque de médias."""

from datetime import date, datetime
from uuid import UUID

from pydantic import BaseModel, Field


class MediaTranslationIn(BaseModel):
    """Texte alternatif fourni par l'admin pour une langue donnée.

    `alt_text` est obligatoire ici (contrairement au modèle en base) :
    on refuse volontairement l'upload d'une image sans description,
    même si techniquement la colonne pourrait être vide un instant.
    """

    locale: str = Field(max_length=5, examples=["fr", "en", "de", "it"])
    alt_text: str = Field(min_length=1, max_length=250)
    caption: str | None = Field(default=None, max_length=500)
    title: str | None = Field(default=None, max_length=200)


class MediaUploadMeta(BaseModel):
    """Métadonnées accompagnant l'upload d'un fichier.

    Reçu comme chaîne JSON dans un champ de formulaire (`translations_json`
    côté route), puis validé ici — un `UploadFile` ne peut pas cohabiter
    avec un modèle Pydantic complexe dans un même paramètre multipart.
    """

    folder: str | None = Field(
        default=None,
        max_length=100,
        examples=["excursions", "blog", "equipe"],
    )
    is_public: bool = Field(default=True)
    photographer: str | None = Field(default=None, max_length=150)
    taken_at: date | None = Field(default=None)
    latitude: float | None = Field(default=None)
    longitude: float | None = Field(default=None)
    translations: list[MediaTranslationIn] = Field(
        min_length=1,
        description="Au moins une langue est obligatoire à l'upload",
    )


class MediaRead(BaseModel):
    """Vue publique d'un média — ce que consomme le front Next.js."""

    id: UUID
    kind: str
    url: str = Field(description="URL absolue, ex. https://media.medevstack.com/…")
    width: int | None
    height: int | None
    blurhash: str | None
    alt_text: str = Field(description="Dans la langue demandée, avec repli")
    caption: str | None = None
    title: str | None = None


class MediaAdminRead(MediaRead):
    """Vue admin — ajoute les métadonnées de gestion et toutes les langues."""

    filename: str
    file_size: int
    mime_type: str
    folder: str | None
    is_public: bool
    photographer: str | None
    created_at: datetime
    translations: list[MediaTranslationIn]
