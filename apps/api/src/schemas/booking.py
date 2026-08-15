"""Contrats d'API pour les réservations.

Trois familles distinctes, et la séparation est critique :

- BookingCreate    : ce que le PUBLIC envoie
- BookingPublicRead: ce que le PUBLIC reçoit en retour — minimal
- BookingAdminRead : ce que l'ADMIN voit — tout, y compris email et IP

Renvoyer le modèle Booking directement exposerait customer_email,
submitted_ip et internal_notes à n'importe quel visiteur.
"""

from datetime import date, datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr, Field

from src.models.enums import BookingSource, BookingStatus, ProductType


class BookingCreate(BaseModel):
    """Formulaire de réservation du site public."""

    product_slug: str = Field(min_length=1, max_length=200)

    customer_name: str = Field(min_length=2, max_length=150)
    customer_email: EmailStr
    customer_phone: str | None = Field(default=None, max_length=40)
    customer_country: str | None = Field(default=None, min_length=2, max_length=2)
    preferred_locale: str = Field(default="fr", min_length=2, max_length=5)
    hotel_name: str | None = Field(default=None, max_length=200)

    requested_date: date
    alternative_date: date | None = None
    adults: int = Field(default=1, ge=1, le=50)
    children: int = Field(default=0, ge=0, le=50)
    customer_message: str | None = Field(default=None, max_length=3000)

    utm_source: str | None = Field(default=None, max_length=100)
    utm_medium: str | None = Field(default=None, max_length=100)
    utm_campaign: str | None = Field(default=None, max_length=150)
    referrer_url: str | None = Field(default=None, max_length=500)
    landing_page: str | None = Field(default=None, max_length=500)

    # Champ piège : invisible à l'écran, rempli uniquement par les robots.
    # S'il contient quoi que ce soit, la requête est rejetée sans le dire.
    website: str | None = Field(default=None, max_length=200, exclude=True)


class BookingPublicRead(BaseModel):
    """Confirmation renvoyée au visiteur.

    Volontairement pauvre : la référence et l'essentiel. Aucun montant
    définitif, puisque le devis reste à établir.
    """

    reference: str
    status: BookingStatus
    product_title: str
    requested_date: date
    adults: int
    children: int
    message: str = "Votre demande a bien été enregistrée. Nous vous répondons sous 24 heures."


class BookingAdminRead(BaseModel):
    """Vue complète pour le dashboard."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    reference: str
    status: BookingStatus

    product_id: UUID | None
    product_slug: str
    product_title: str
    product_type: ProductType
    unit_price: Decimal
    currency: str

    customer_name: str
    customer_email: EmailStr
    customer_phone: str | None
    customer_country: str | None
    preferred_locale: str
    hotel_name: str | None

    requested_date: date
    alternative_date: date | None
    adults: int
    children: int
    customer_message: str | None

    total_amount: Decimal
    deposit_amount: Decimal | None
    deposit_paid_at: datetime | None
    balance_paid_at: datetime | None

    assigned_to: UUID | None
    internal_notes: str | None
    cancellation_reason: str | None

    first_contacted_at: datetime | None
    quoted_at: datetime | None
    confirmed_at: datetime | None
    completed_at: datetime | None
    expires_at: datetime | None

    source: BookingSource
    utm_source: str | None
    utm_campaign: str | None

    created_at: datetime
    updated_at: datetime


class BookingListItem(BaseModel):
    """Ligne du tableau. Allégée : pas de message ni de notes."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    reference: str
    status: BookingStatus
    product_title: str
    customer_name: str
    customer_email: EmailStr
    customer_phone: str | None
    requested_date: date
    adults: int
    children: int
    total_amount: Decimal
    currency: str
    assigned_to: UUID | None
    source: BookingSource
    created_at: datetime
    expires_at: datetime | None


class BookingListResponse(BaseModel):
    items: list[BookingListItem]
    total: int
    limit: int
    offset: int
    counts_by_status: dict[str, int] = Field(
        default_factory=dict,
        description="Compteurs pour les onglets du dashboard",
    )


class BookingTransitionRequest(BaseModel):
    to_status: BookingStatus
    note: str | None = Field(
        default=None,
        max_length=1000,
        description="Obligatoire pour une annulation",
    )


class BookingUpdateRequest(BaseModel):
    """Champs internes modifiables sans changer le statut."""

    assigned_to: UUID | None = None
    internal_notes: str | None = Field(default=None, max_length=5000)
    deposit_amount: Decimal | None = Field(default=None, ge=0)
    deposit_paid_at: datetime | None = None
    balance_paid_at: datetime | None = None
    hotel_name: str | None = Field(default=None, max_length=200)


class BookingHistoryItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    from_status: BookingStatus | None
    to_status: BookingStatus
    changed_by: UUID | None
    note: str | None
    is_automatic: bool
    created_at: datetime
