"""Contrats d'API pour le formulaire de contact.

⚠ Un message de contact n'est jamais affiché publiquement. Aucun schéma
de lecture publique n'existe donc ici — seule l'administration y accède.
"""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class ContactCreate(BaseModel):
    """Formulaire de contact du site public."""

    name: str = Field(min_length=2, max_length=150)
    email: EmailStr
    phone: str | None = Field(default=None, max_length=40)
    subject: str | None = Field(default=None, max_length=250)
    message: str = Field(
        min_length=20,
        max_length=5000,
        description="20 caractères minimum : décourage les envois vides",
    )
    locale: str = Field(default="fr", min_length=2, max_length=5)

    # Champ piège, invisible à l'écran
    website: str | None = Field(default=None, max_length=200, exclude=True)


class ContactSubmitResponse(BaseModel):
    message: str = (
        "Merci pour votre message. Notre équipe vous répond sous 24 heures."
    )


class ContactAdminRead(BaseModel):
    """Vue d'administration — contient tout."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    email: EmailStr
    phone: str | None
    subject: str | None
    message: str
    locale: str

    is_read: bool
    is_archived: bool
    replied_at: datetime | None
    handled_by: UUID | None

    submitted_ip: str | None
    spam_score: float | None
    created_at: datetime


class ContactAdminListResponse(BaseModel):
    items: list[ContactAdminRead]
    total: int
    limit: int
    offset: int
    unread_count: int


class ContactUpdateRequest(BaseModel):
    """Suivi côté agence. Le contenu du message n'est jamais modifiable."""

    is_read: bool | None = None
    is_archived: bool | None = None
    mark_replied: bool | None = Field(
        default=None,
        description="Pose replied_at à maintenant — la date n'est jamais saisie à la main",
    )