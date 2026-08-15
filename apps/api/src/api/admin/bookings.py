"""Menu Réservations du back-office.

Trois usages distincts :
- le tableau avec ses onglets par statut et ses compteurs,
- la fiche avec sa timeline,
- les transitions et le suivi interne.

Le contrôle des rôles est posé au niveau du ROUTEUR : impossible d'oublier
une route en l'ajoutant plus tard.
"""

from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlalchemy import func
from sqlmodel import select

from src.api.deps import CurrentUser, SessionDep, require_role
from src.models.booking import Booking
from src.models.enums import AdminRole, AuditAction, BookingSource, BookingStatus
from src.schemas.booking import (
    BookingAdminRead,
    BookingHistoryItem,
    BookingListItem,
    BookingListResponse,
    BookingTransitionRequest,
    BookingUpdateRequest,
)
from src.services import audit
from src.services import booking as service
from src.services.booking import BookingError, InvalidTransition, OPEN_STATUSES

router = APIRouter(
    prefix="/bookings",
    tags=["admin · réservations"],
    dependencies=[Depends(require_role(AdminRole.EDITOR))],
)

ENTITY = "booking"


def _client_ip(request: Request) -> str | None:
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else None


async def _get_or_404(session, booking_id: UUID) -> Booking:
    stmt = select(Booking).where(
        Booking.id == booking_id, Booking.deleted_at.is_(None)
    )
    booking = (await session.exec(stmt)).first()
    if booking is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Réservation introuvable"
        )
    return booking


@router.get("", response_model=BookingListResponse)
async def list_bookings(
    session: SessionDep,
    booking_status: Annotated[
        BookingStatus | None,
        Query(alias="status", description="Filtre par statut exact"),
    ] = None,
    only_open: Annotated[
        bool,
        Query(description="Onglet « En cours » : exclut terminées, annulées, expirées"),
    ] = False,
    assigned_to: Annotated[UUID | None, Query()] = None,
    source: Annotated[BookingSource | None, Query()] = None,
    search: Annotated[
        str | None,
        Query(max_length=100, description="Référence, nom ou email du client"),
    ] = None,
    limit: Annotated[int, Query(ge=1, le=100)] = 50,
    offset: Annotated[int, Query(ge=0)] = 0,
) -> BookingListResponse:
    """Tableau des réservations, avec compteurs par statut.

    Les compteurs alimentent les badges des onglets du dashboard et sont
    calculés en UNE requête agrégée plutôt qu'un COUNT par statut.
    """
    base = select(Booking).where(Booking.deleted_at.is_(None))
    count_base = (
        select(func.count()).select_from(Booking).where(Booking.deleted_at.is_(None))
    )

    def apply_filters(stmt):
        if booking_status is not None:
            stmt = stmt.where(Booking.status == booking_status)
        if only_open:
            stmt = stmt.where(Booking.status.in_(list(OPEN_STATUSES)))
        if assigned_to is not None:
            stmt = stmt.where(Booking.assigned_to == assigned_to)
        if source is not None:
            stmt = stmt.where(Booking.source == source)
        if search:
            pattern = f"%{search.lower()}%"
            stmt = stmt.where(
                Booking.reference.ilike(pattern)
                | Booking.customer_name.ilike(pattern)
                | Booking.customer_email.ilike(pattern)
            )
        return stmt

    stmt = apply_filters(base).order_by(Booking.created_at.desc())
    stmt = stmt.limit(limit).offset(offset)

    bookings = list((await session.exec(stmt)).all())
    total = (await session.exec(apply_filters(count_base))).one()

    # Compteurs globaux, indépendants des filtres : les onglets doivent
    # afficher le total réel de chaque statut, pas le total filtré.
    counts_stmt = (
        select(Booking.status, func.count())
        .where(Booking.deleted_at.is_(None))
        .group_by(Booking.status)
    )
    counts = {s.value: c for s, c in (await session.exec(counts_stmt)).all()}
    counts["open"] = sum(counts.get(s.value, 0) for s in OPEN_STATUSES)

    return BookingListResponse(
        items=[BookingListItem.model_validate(b) for b in bookings],
        total=total,
        limit=limit,
        offset=offset,
        counts_by_status=counts,
    )


@router.get("/{booking_id}", response_model=BookingAdminRead)
async def get_booking(booking_id: UUID, session: SessionDep) -> BookingAdminRead:
    booking = await _get_or_404(session, booking_id)
    return BookingAdminRead.model_validate(booking)


@router.get("/{booking_id}/history", response_model=list[BookingHistoryItem])
async def get_history(
    booking_id: UUID, session: SessionDep
) -> list[BookingHistoryItem]:
    """Timeline de la fiche réservation."""
    await _get_or_404(session, booking_id)
    rows = await service.get_history(session, booking_id)
    return [BookingHistoryItem.model_validate(r) for r in rows]


@router.post("/{booking_id}/transition", response_model=BookingAdminRead)
async def change_status(
    booking_id: UUID,
    payload: BookingTransitionRequest,
    session: SessionDep,
    user: CurrentUser,
    request: Request,
) -> BookingAdminRead:
    """Change le statut d'une réservation.

    Refuse toute transition non autorisée par la machine à états, et
    journalise systématiquement l'auteur du changement.
    """
    booking = await _get_or_404(session, booking_id)
    previous = booking.status

    try:
        booking = await service.transition(
            session, booking, payload.to_status, actor=user, note=payload.note
        )
    except InvalidTransition as e:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, detail=str(e)
        ) from None
    except BookingError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail=str(e)
        ) from None

    await audit.log(
        session,
        actor=user,
        action=AuditAction.STATUS_CHANGE,
        entity_type=ENTITY,
        entity_id=booking.id,
        entity_label=f"{booking.reference} : {previous.value} → {booking.status.value}",
        after=booking,
        ip_address=_client_ip(request),
    )
    await session.commit()
    await session.refresh(booking)

    return BookingAdminRead.model_validate(booking)


@router.patch("/{booking_id}", response_model=BookingAdminRead)
async def update_booking(
    booking_id: UUID,
    payload: BookingUpdateRequest,
    session: SessionDep,
    user: CurrentUser,
    request: Request,
) -> BookingAdminRead:
    """Met à jour les champs de SUIVI INTERNE.

    Le statut n'est PAS modifiable ici : il passe obligatoirement par
    /transition, qui contrôle la validité et journalise. C'est ce qui
    empêche de contourner la machine à états.
    """
    booking = await _get_or_404(session, booking_id)
    changes = payload.model_dump(exclude_unset=True)

    for field, value in changes.items():
        setattr(booking, field, value)

    session.add(booking)

    await audit.log(
        session,
        actor=user,
        action=AuditAction.UPDATE,
        entity_type=ENTITY,
        entity_id=booking.id,
        entity_label=booking.reference,
        after=booking,
        ip_address=_client_ip(request),
    )
    await session.commit()
    await session.refresh(booking)

    return BookingAdminRead.model_validate(booking)
