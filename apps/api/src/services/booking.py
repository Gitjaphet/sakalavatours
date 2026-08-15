"""Logique métier des réservations.

⚠ DEUX RÈGLES QUI PROTÈGENT L'AGENCE

1. SNAPSHOT DU PRIX. Le tarif est figé à la création. Si le prix du
   produit change six mois plus tard, la réservation garde le montant
   convenu — sinon l'historique devient faux et un montant passé n'est
   plus justifiable auprès du client.

2. AUCUNE TRANSITION SANS TRACE. « Qui a confirmé cette réservation, et
   quand » est la première question posée en cas de litige. Le champ
   `status` ne se modifie QUE par transition(), qui journalise.
"""

from datetime import UTC, date, datetime, timedelta
from decimal import Decimal
from uuid import UUID

from sqlalchemy import func
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from src.models.booking import Booking, BookingStatusHistory
from src.models.enums import BookingSource, BookingStatus, ContentStatus
from src.models.product import Product
from src.models.system import AdminUser

# Délai avant passage automatique en EXPIRED
DEFAULT_EXPIRY_DAYS = 14

# Transitions autorisées. Tout ce qui n'est pas listé est refusé —
# une liste blanche, jamais une liste noire.
ALLOWED_TRANSITIONS: dict[BookingStatus, set[BookingStatus]] = {
    BookingStatus.NEW: {
        BookingStatus.CONTACTED,
        BookingStatus.CANCELLED,
        BookingStatus.EXPIRED,
    },
    BookingStatus.CONTACTED: {
        BookingStatus.QUOTED,
        BookingStatus.CONFIRMED,
        BookingStatus.CANCELLED,
        BookingStatus.EXPIRED,
    },
    BookingStatus.QUOTED: {
        BookingStatus.PENDING_PAYMENT,
        BookingStatus.CONFIRMED,
        BookingStatus.CANCELLED,
        BookingStatus.EXPIRED,
    },
    BookingStatus.PENDING_PAYMENT: {
        BookingStatus.CONFIRMED,
        BookingStatus.CANCELLED,
        BookingStatus.EXPIRED,
    },
    BookingStatus.CONFIRMED: {
        BookingStatus.COMPLETED,
        BookingStatus.CANCELLED,
    },
    BookingStatus.COMPLETED: set(),   # terminal
    BookingStatus.CANCELLED: set(),   # terminal
    BookingStatus.EXPIRED: {BookingStatus.CONTACTED},  # relance possible
}

# Statuts encore actifs — alimente le filtre « En cours » du dashboard
OPEN_STATUSES = {
    BookingStatus.NEW,
    BookingStatus.CONTACTED,
    BookingStatus.QUOTED,
    BookingStatus.PENDING_PAYMENT,
    BookingStatus.CONFIRMED,
}


class BookingError(Exception):
    """Erreur métier. Le routeur la traduit en 400."""


class InvalidTransition(BookingError):
    pass


async def generate_reference(session: AsyncSession) -> str:
    """Référence lisible communiquée au client : SKT-2026-0042.

    Le compteur repart à 1 chaque année, ce qui donne une référence courte
    et lisible au téléphone.
    """
    year = datetime.now(UTC).year
    prefix = f"SKT-{year}-"

    stmt = select(func.count()).select_from(Booking).where(
        Booking.reference.like(f"{prefix}%")
    )
    count = (await session.exec(stmt)).one()

    return f"{prefix}{count + 1:04d}"


async def create_from_request(
    session: AsyncSession,
    *,
    product: Product | None,
    customer_name: str,
    customer_email: str,
    customer_phone: str | None,
    customer_country: str | None,
    preferred_locale: str,
    hotel_name: str | None,
    requested_date: date,
    alternative_date: date | None,
    adults: int,
    children: int,
    customer_message: str | None,
    source: BookingSource = BookingSource.WEBSITE,
    utm_source: str | None = None,
    utm_medium: str | None = None,
    utm_campaign: str | None = None,
    referrer_url: str | None = None,
    landing_page: str | None = None,
    submitted_ip: str | None = None,
) -> Booking:
    if product is None:
        raise BookingError("Produit introuvable ou non disponible")

    if product.status != ContentStatus.PUBLISHED or not product.is_published:
        raise BookingError("Ce produit n'est pas réservable actuellement")

    if requested_date <= date.today():
        raise BookingError("La date souhaitée doit être postérieure à aujourd'hui")

    total_pax = adults + children
    if total_pax < product.group_min:
        raise BookingError(
            f"Cette sortie demande au minimum {product.group_min} participants"
        )
    if total_pax > product.group_max:
        raise BookingError(
            f"Cette sortie accueille au maximum {product.group_max} participants"
        )

    # Les enfants comptent au tarif plein tant qu'aucune grille enfant
    # n'est définie — mieux vaut annoncer haut et ajuster au devis que
    # l'inverse.
    total = product.price_from * Decimal(total_pax)

    deposit = None
    if product.deposit_percent:
        deposit = (total * Decimal(product.deposit_percent) / Decimal(100)).quantize(
            Decimal("0.01")
        )

    now = datetime.now(UTC)

    booking = Booking(
        reference=await generate_reference(session),
        status=BookingStatus.NEW,
        product_id=product.id,
        # ── Snapshot figé ──────────────────────────────────────────────
        product_slug=product.slug,
        product_title=product.slug,  # remplacé par le titre traduit côté routeur
        product_type=product.product_type,
        unit_price=product.price_from,
        currency=product.currency,
        # ── Client ─────────────────────────────────────────────────────
        customer_name=customer_name,
        customer_email=customer_email.lower().strip(),
        customer_phone=customer_phone,
        customer_country=customer_country,
        preferred_locale=preferred_locale,
        hotel_name=hotel_name,
        # ── Demande ────────────────────────────────────────────────────
        requested_date=requested_date,
        alternative_date=alternative_date,
        adults=adults,
        children=children,
        customer_message=customer_message,
        # ── Montants ───────────────────────────────────────────────────
        total_amount=total,
        deposit_amount=deposit,
        # ── Provenance ─────────────────────────────────────────────────
        source=source,
        utm_source=utm_source,
        utm_medium=utm_medium,
        utm_campaign=utm_campaign,
        referrer_url=referrer_url,
        landing_page=landing_page,
        submitted_ip=submitted_ip,
        expires_at=now + timedelta(days=DEFAULT_EXPIRY_DAYS),
    )

    session.add(booking)
    await session.flush()

    session.add(
        BookingStatusHistory(
            booking_id=booking.id,
            from_status=None,
            to_status=BookingStatus.NEW,
            note="Demande reçue depuis le site",
            is_automatic=True,
        )
    )

    return booking


async def transition(
    session: AsyncSession,
    booking: Booking,
    to_status: BookingStatus,
    *,
    actor: AdminUser | None = None,
    note: str | None = None,
    is_automatic: bool = False,
) -> Booking:
    """SEUL point d'entrée pour changer un statut.

    Refuse toute transition non déclarée dans ALLOWED_TRANSITIONS, et
    journalise systématiquement.
    """
    current = booking.status

    if to_status == current:
        raise InvalidTransition(f"La réservation est déjà en statut « {current.value} »")

    allowed = ALLOWED_TRANSITIONS.get(current, set())
    if to_status not in allowed:
        readable = ", ".join(sorted(s.value for s in allowed)) or "aucune"
        raise InvalidTransition(
            f"Transition « {current.value} » → « {to_status.value} » interdite. "
            f"Transitions possibles : {readable}"
        )

    if to_status == BookingStatus.CANCELLED and not note:
        raise BookingError("Un motif est obligatoire pour annuler une réservation")

    now = datetime.now(UTC)
    booking.status = to_status

    # Jalons datés — permettent de mesurer le délai de réponse réel
    if to_status == BookingStatus.CONTACTED and booking.first_contacted_at is None:
        booking.first_contacted_at = now
    elif to_status == BookingStatus.QUOTED:
        booking.quoted_at = now
    elif to_status == BookingStatus.CONFIRMED:
        booking.confirmed_at = now
        booking.expires_at = None  # une réservation confirmée n'expire plus
    elif to_status == BookingStatus.COMPLETED:
        booking.completed_at = now
    elif to_status == BookingStatus.CANCELLED:
        booking.cancellation_reason = note

    session.add(booking)
    session.add(
        BookingStatusHistory(
            booking_id=booking.id,
            from_status=current,
            to_status=to_status,
            changed_by=actor.id if actor else None,
            note=note,
            is_automatic=is_automatic,
        )
    )

    return booking


async def expire_stale(session: AsyncSession) -> int:
    """Bascule en EXPIRED les demandes sans réponse.

    Appelé par un cron. Sans ça, une demande de mars encombre encore la
    liste en août.
    """
    now = datetime.now(UTC)
    stmt = select(Booking).where(
        Booking.status.in_([BookingStatus.NEW, BookingStatus.CONTACTED]),
        Booking.expires_at.is_not(None),
        Booking.expires_at < now,
        Booking.deleted_at.is_(None),
    )

    count = 0
    for booking in (await session.exec(stmt)).all():
        await transition(
            session,
            booking,
            BookingStatus.EXPIRED,
            note=f"Expiration automatique après {DEFAULT_EXPIRY_DAYS} jours",
            is_automatic=True,
        )
        count += 1

    return count


async def get_history(
    session: AsyncSession, booking_id: UUID
) -> list[BookingStatusHistory]:
    stmt = (
        select(BookingStatusHistory)
        .where(BookingStatusHistory.booking_id == booking_id)
        .order_by(BookingStatusHistory.created_at)
    )
    return list((await session.exec(stmt)).all())
