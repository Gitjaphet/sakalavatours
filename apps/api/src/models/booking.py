"""Demandes de réservation et leur suivi.

⚠ DEUX RÈGLES QUI PROTÈGENT L'AGENCE

1. SNAPSHOT DU PRIX. On ne stocke jamais seulement une référence au
   produit : si le tarif change six mois plus tard, l'historique devient
   faux et le montant d'une réservation passée n'est plus justifiable
   auprès du client. Les champs `product_*` et `unit_price` sont figés à
   la création et ne bougent plus jamais.

2. AUCUN CHANGEMENT DE STATUT SANS TRACE. « Qui a confirmé cette
   réservation, et quand » est la première question posée en cas de
   litige. Toute transition écrit une ligne dans BookingStatusHistory,
   et seul BookingService.transition() a le droit de modifier `status`.
"""

from datetime import date, datetime
from decimal import Decimal
from uuid import UUID

from sqlalchemy import DateTime
from sqlmodel import Field

from src.models.base import SoftDeleteMixin, TimestampMixin, UUIDMixin
from src.models.enums import BookingSource, BookingStatus, ProductType


class Booking(UUIDMixin, TimestampMixin, SoftDeleteMixin, table=True):
    __tablename__ = "booking"

    reference: str = Field(
        max_length=40,
        unique=True,
        index=True,
        description="Référence lisible communiquée au client : SKT-2026-0042",
    )

    status: BookingStatus = Field(default=BookingStatus.NEW, index=True)

    # ── Produit ────────────────────────────────────────────────────────
    # La FK reste nullable : si un produit est archivé, la réservation
    # doit survivre. C'est le snapshot ci-dessous qui fait foi.
    product_id: UUID | None = Field(default=None, foreign_key="product.id", index=True)

    product_slug: str = Field(max_length=200)
    product_title: str = Field(max_length=200)
    product_type: ProductType
    unit_price: Decimal = Field(max_digits=10, decimal_places=2)
    currency: str = Field(default="EUR", max_length=3)

    # ── Client ─────────────────────────────────────────────────────────
    # ⚠ PRIVÉ : email, téléphone et IP ne sortent jamais de l'API publique.
    customer_name: str = Field(max_length=150)
    customer_email: str = Field(max_length=255, index=True)
    customer_phone: str | None = Field(default=None, max_length=40)
    customer_country: str | None = Field(default=None, max_length=2)
    preferred_locale: str = Field(default="fr", max_length=5)
    hotel_name: str | None = Field(
        default=None, max_length=200, description="Point de prise en charge"
    )

    # ── Demande ────────────────────────────────────────────────────────
    requested_date: date = Field(index=True)
    alternative_date: date | None = Field(default=None)
    adults: int = Field(default=1, ge=1)
    children: int = Field(default=0, ge=0)
    customer_message: str | None = Field(default=None, max_length=3000)

    # ── Montants ───────────────────────────────────────────────────────
    total_amount: Decimal = Field(max_digits=10, decimal_places=2, ge=0)
    deposit_amount: Decimal | None = Field(default=None, max_digits=10, decimal_places=2)
    deposit_paid_at: datetime | None = Field(default=None, sa_type=DateTime(timezone=True))
    balance_paid_at: datetime | None = Field(default=None, sa_type=DateTime(timezone=True))

    # ── Suivi interne ──────────────────────────────────────────────────
    # `assigned_to` évite que deux personnes rappellent le même client.
    assigned_to: UUID | None = Field(default=None, foreign_key="admin_user.id", index=True)
    internal_notes: str | None = Field(default=None, description="PRIVÉ — jamais exposé")
    cancellation_reason: str | None = Field(default=None, max_length=500)

    # ── Jalons ─────────────────────────────────────────────────────────
    first_contacted_at: datetime | None = Field(
        default=None, sa_type=DateTime(timezone=True)
    )
    quoted_at: datetime | None = Field(default=None, sa_type=DateTime(timezone=True))
    confirmed_at: datetime | None = Field(default=None, sa_type=DateTime(timezone=True))
    completed_at: datetime | None = Field(default=None, sa_type=DateTime(timezone=True))
    expires_at: datetime | None = Field(
        default=None,
        sa_type=DateTime(timezone=True),
        description="Passage automatique en EXPIRED au-delà",
    )

    # ── Provenance ─────────────────────────────────────────────────────
    # Les champs UTM répondent à la question qui compte : quel article de
    # blog génère réellement des demandes ? C'est ce qui transforme le
    # SEO en décisions éditoriales.
    source: BookingSource = Field(default=BookingSource.WEBSITE, index=True)
    utm_source: str | None = Field(default=None, max_length=100)
    utm_medium: str | None = Field(default=None, max_length=100)
    utm_campaign: str | None = Field(default=None, max_length=150)
    referrer_url: str | None = Field(default=None, max_length=500)
    landing_page: str | None = Field(default=None, max_length=500)

    submitted_ip: str | None = Field(default=None, max_length=45)

    @property
    def total_pax(self) -> int:
        return self.adults + self.children

    @property
    def is_open(self) -> bool:
        """Réservation encore active — sert au filtre « En cours » du dashboard."""
        return self.status not in {
            BookingStatus.COMPLETED,
            BookingStatus.CANCELLED,
            BookingStatus.EXPIRED,
        }


class BookingStatusHistory(UUIDMixin, TimestampMixin, table=True):
    """Journal des transitions.

    Alimente directement la timeline affichée sur la fiche réservation du
    dashboard. `changed_by` à NULL signifie une transition automatique
    (expiration par tâche planifiée).
    """

    __tablename__ = "booking_status_history"

    booking_id: UUID = Field(foreign_key="booking.id", index=True, ondelete="CASCADE")

    from_status: BookingStatus | None = Field(default=None)
    to_status: BookingStatus

    changed_by: UUID | None = Field(default=None, foreign_key="admin_user.id")
    note: str | None = Field(default=None, max_length=1000)
    is_automatic: bool = Field(default=False)


class ContactMessage(UUIDMixin, TimestampMixin, SoftDeleteMixin, table=True):
    """Messages du formulaire de contact — distincts des réservations."""

    __tablename__ = "contact_message"

    name: str = Field(max_length=150)
    email: str = Field(max_length=255, index=True)
    phone: str | None = Field(default=None, max_length=40)
    subject: str | None = Field(default=None, max_length=250)
    message: str = Field(max_length=5000)
    locale: str = Field(default="fr", max_length=5)

    is_read: bool = Field(default=False, index=True)
    is_archived: bool = Field(default=False, index=True)
    replied_at: datetime | None = Field(default=None, sa_type=DateTime(timezone=True))
    handled_by: UUID | None = Field(default=None, foreign_key="admin_user.id")

    submitted_ip: str | None = Field(default=None, max_length=45)
    spam_score: float | None = Field(default=None)
