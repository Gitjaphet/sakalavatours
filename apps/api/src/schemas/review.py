"""Contrats d'API pour les avis voyageurs.

⚠ DEUX RÈGLES QUI PROTÈGENT LE RÉFÉRENCEMENT

1. `author_email`, `submitted_ip` et `user_agent` ne figurent JAMAIS dans
   un schéma public. Un avis affiché ne doit rien révéler de son auteur
   au-delà de son prénom et de son pays.

2. Seuls les avis APPROVED **et** is_verified alimentent la note agrégée.
   Publier un aggregateRating calculé sur des avis non vérifiés est le
   premier motif d'action manuelle Google sur les sites de tourisme.
"""

from datetime import date, datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr, Field

from src.models.enums import ReviewStatus


class ReviewCreate(BaseModel):
    """Formulaire d'avis du site public."""

    product_slug: str | None = Field(
        default=None,
        max_length=200,
        description="Vide = avis sur l'agence, affiché sur /avis",
    )

    author_name: str = Field(min_length=2, max_length=120)
    author_email: EmailStr
    author_country: str | None = Field(default=None, min_length=2, max_length=2)

    rating: int = Field(ge=1, le=5)
    title: str | None = Field(default=None, max_length=200)
    body: str = Field(
        min_length=30,
        max_length=5000,
        description="30 caractères minimum : décourage les avis vides",
    )
    locale: str = Field(default="fr", min_length=2, max_length=5)
    travel_date: date | None = Field(
        default=None, description="Date du voyage, pas de l'avis"
    )

    booking_reference: str | None = Field(
        default=None,
        max_length=40,
        description="Référence de réservation — permet la vérification automatique",
    )

    # Champ piège, invisible à l'écran
    website: str | None = Field(default=None, max_length=200, exclude=True)


class ReviewPublicRead(BaseModel):
    """Avis affiché sur le site.

    Volontairement pauvre : prénom, pays, note, texte. Rien qui permette
    d'identifier ou de recontacter l'auteur.
    """

    id: UUID
    author_name: str
    author_country: str | None
    rating: int
    title: str | None
    body: str
    travel_date: date | None
    is_verified: bool
    admin_reply: str | None
    published_at: datetime
    product_slug: str | None = None


class ReviewSubmitResponse(BaseModel):
    message: str = (
        "Merci pour votre avis. Il sera publié après vérification par notre équipe."
    )


class ReviewAggregate(BaseModel):
    """Note agrégée d'un produit ou de l'agence.

    ⚠ `is_schema_eligible` indique au frontend s'il peut émettre le
    JSON-LD aggregateRating. False tant que les avis ne sont pas
    vérifiables — mieux vaut aucun balisage qu'un balisage sanctionné.
    """

    average: Decimal | None = None
    count: int = 0
    verified_count: int = 0
    distribution: dict[str, int] = Field(
        default_factory=dict, description="Répartition par note : {'5': 12, '4': 3, …}"
    )
    is_schema_eligible: bool = False


class ReviewListResponse(BaseModel):
    items: list[ReviewPublicRead]
    total: int
    limit: int
    offset: int
    aggregate: ReviewAggregate
    

class ReviewProductRef(BaseModel):
    """Produit rattaché à un avis, résolu dans la locale par défaut."""

    id: UUID
    title: str
    slug: str


class ReviewAdminRead(BaseModel):
    """Vue de modération — contient tout."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    
    author_name: str
    author_email: EmailStr
    author_country: str | None

    rating: int
    title: str | None
    body: str
    locale: str
    travel_date: date | None

    status: ReviewStatus
    is_verified: bool
    booking_reference: str | None
    email_verified_at: datetime | None

    moderated_by: UUID | None
    moderated_at: datetime | None
    rejection_reason: str | None

    admin_reply: str | None
    admin_replied_at: datetime | None
    published_at: datetime | None

    submitted_ip: str | None
    spam_score: float | None

    is_featured: bool
    created_at: datetime

    # None signifie « avis portant sur l'agence », jamais « information
    # non chargée » : les deux routes admin renseignent ce champ.
    product: ReviewProductRef | None = None


class ReviewAdminListResponse(BaseModel):
    items: list[ReviewAdminRead]
    total: int
    limit: int
    offset: int
    counts_by_status: dict[str, int] = Field(default_factory=dict)


class ReviewModerateRequest(BaseModel):
    """Décision de modération."""

    status: ReviewStatus
    rejection_reason: str | None = Field(
        default=None,
        max_length=500,
        description="Obligatoire pour un rejet — une modération doit se justifier",
    )
    is_verified: bool | None = Field(
        default=None,
        description="Ne passer à true que si la réalité du voyage est établie",
    )
    is_featured: bool | None = None


class ReviewReplyRequest(BaseModel):
    """Réponse publique de l'agence.

    Répondre à un avis négatif vaut mieux que le masquer : c'est visible
    par les futurs clients et ça démontre le sérieux de l'agence.
    """

    admin_reply: str = Field(min_length=1, max_length=2000)
