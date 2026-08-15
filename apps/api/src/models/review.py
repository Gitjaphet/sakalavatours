"""Avis voyageurs, avec modération.

⚠ CINQ RÈGLES NON NÉGOCIABLES

1. Seuls les avis `APPROVED` **et** `is_verified` alimentent le
   `aggregateRating` du JSON-LD. Publier une note issue d'avis non
   vérifiés est le premier motif d'action manuelle Google sur les sites
   de tourisme.
2. Les avis négatifs ne se suppriment jamais. Une note de 5,0 sur
   200 avis est un signal de fraude ; 4,6 est infiniment plus crédible.
   Le champ `admin_reply` sert à répondre, pas à masquer.
3. `rejection_reason` est obligatoire à tout rejet — une modération doit
   pouvoir se justifier.
4. `author_email`, `submitted_ip` et `user_agent` ne sortent JAMAIS de
   l'API publique. Ils vivent uniquement dans les schémas admin.
5. Un avis passe par la vérification d'email avant même d'atteindre
   `PENDING`, et le rate limit Redis s'applique par IP et par email.
"""

from datetime import date, datetime
from uuid import UUID

from sqlalchemy import DateTime
from sqlmodel import Field

from src.models.base import SoftDeleteMixin, TimestampMixin, UUIDMixin
from src.models.enums import ReviewStatus


class Review(UUIDMixin, TimestampMixin, SoftDeleteMixin, table=True):
    __tablename__ = "review"

    # ── Rattachement ───────────────────────────────────────────────────
    # NULL = avis portant sur l'agence en général, affiché sur /avis.
    product_id: UUID | None = Field(default=None, foreign_key="product.id", index=True)

    # ── Auteur ─────────────────────────────────────────────────────────
    author_name: str = Field(max_length=120)
    author_email: str = Field(
        max_length=255, index=True, description="PRIVÉ — jamais exposé publiquement"
    )
    author_country: str | None = Field(
        default=None, max_length=2, description="Code ISO, affiché comme drapeau"
    )
    author_media_id: UUID | None = Field(default=None, foreign_key="media.id")

    # ── Contenu ────────────────────────────────────────────────────────
    rating: int = Field(ge=1, le=5, index=True)
    title: str | None = Field(default=None, max_length=200)
    body: str = Field(max_length=5000)
    locale: str = Field(max_length=5, index=True)
    travel_date: date | None = Field(
        default=None, description="Date du voyage, pas de l'avis"
    )

    # ── Modération ─────────────────────────────────────────────────────
    status: ReviewStatus = Field(default=ReviewStatus.PENDING, index=True)

    is_verified: bool = Field(
        default=False,
        index=True,
        description=(
            "Avis rattaché à une réservation réelle. SEULE condition qui "
            "autorise la prise en compte dans le aggregateRating."
        ),
    )
    booking_reference: str | None = Field(
        default=None, max_length=40, description="Référence fournie par le voyageur"
    )
    email_verified_at: datetime | None = Field(
        default=None, sa_type=DateTime(timezone=True)
    )

    moderated_by: UUID | None = Field(default=None, foreign_key="admin_user.id")
    moderated_at: datetime | None = Field(default=None, sa_type=DateTime(timezone=True))
    rejection_reason: str | None = Field(
        default=None, max_length=500, description="Obligatoire si status = REJECTED"
    )

    # ── Réponse de l'agence ────────────────────────────────────────────
    admin_reply: str | None = Field(default=None, max_length=2000)
    admin_replied_at: datetime | None = Field(
        default=None, sa_type=DateTime(timezone=True)
    )

    # ── Traçabilité anti-spam ──────────────────────────────────────────
    # ⚠ RGPD : données techniques à purger après un délai raisonnable
    # (12 mois), et strictement absentes des réponses publiques.
    submitted_ip: str | None = Field(default=None, max_length=45)
    user_agent: str | None = Field(default=None, max_length=500)
    spam_score: float | None = Field(
        default=None, description="Score heuristique calculé à la soumission"
    )

    # ── Affichage ──────────────────────────────────────────────────────
    is_featured: bool = Field(
        default=False, index=True, description="Remonté en page d'accueil"
    )
    sort_order: int = Field(default=0)
