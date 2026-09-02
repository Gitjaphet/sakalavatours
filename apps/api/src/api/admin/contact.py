"""Messages du formulaire de contact.

Pas de modération ici, contrairement aux avis : un message n'est jamais
publié. Le suivi se limite à trois états — lu, répondu, archivé — qui
disent où en est l'agence, pas ce que le visiteur voit.
"""

from datetime import UTC, datetime
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func
from sqlmodel import select

from src.api.deps import CurrentUser, SessionDep, require_role
from src.models.booking import ContactMessage
from src.models.enums import AdminRole
from src.schemas.contact import (
    ContactAdminListResponse,
    ContactAdminRead,
    ContactUpdateRequest,
)

router = APIRouter(
    prefix="/messages",
    tags=["admin · messages"],
    dependencies=[Depends(require_role(AdminRole.MODERATOR))],
)


async def _get_or_404(session, message_id: UUID) -> ContactMessage:
    stmt = select(ContactMessage).where(
        ContactMessage.id == message_id,
        ContactMessage.deleted_at.is_(None),
    )
    message = (await session.exec(stmt)).first()
    if message is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Message introuvable"
        )
    return message


@router.get("", response_model=ContactAdminListResponse)
async def list_messages(
    session: SessionDep,
    is_archived: Annotated[bool | None, Query()] = None,
    is_read: Annotated[bool | None, Query()] = None,
    limit: Annotated[int, Query(ge=1, le=100)] = 50,
    offset: Annotated[int, Query(ge=0)] = 0,
) -> ContactAdminListResponse:
    """Boîte de réception. Les plus récents d'abord."""
    base = select(ContactMessage).where(ContactMessage.deleted_at.is_(None))
    count_base = (
        select(func.count())
        .select_from(ContactMessage)
        .where(ContactMessage.deleted_at.is_(None))
    )

    def apply(stmt):
        if is_archived is not None:
            stmt = stmt.where(ContactMessage.is_archived == is_archived)
        if is_read is not None:
            stmt = stmt.where(ContactMessage.is_read == is_read)
        return stmt

    stmt = (
        apply(base)
        .order_by(ContactMessage.created_at.desc())
        .limit(limit)
        .offset(offset)
    )

    messages = list((await session.exec(stmt)).all())
    total = (await session.exec(apply(count_base))).one()

    # Compteur global des non lus, indépendant du filtre courant : il
    # alimente la pastille de navigation.
    unread = (
        await session.exec(
            count_base.where(
                ContactMessage.is_read.is_(False),
                ContactMessage.is_archived.is_(False),
            )
        )
    ).one()

    return ContactAdminListResponse(
        items=[ContactAdminRead.model_validate(m) for m in messages],
        total=total,
        limit=limit,
        offset=offset,
        unread_count=unread,
    )


@router.get("/{message_id}", response_model=ContactAdminRead)
async def get_message(message_id: UUID, session: SessionDep) -> ContactAdminRead:
    """Ouvre un message et le marque lu.

    Marquage automatique : ouvrir un message, c'est le lire. Demander un
    clic de plus serait une corvée sans bénéfice.
    """
    message = await _get_or_404(session, message_id)

    if not message.is_read:
        message.is_read = True
        session.add(message)
        await session.commit()
        await session.refresh(message)

    return ContactAdminRead.model_validate(message)


@router.patch("/{message_id}", response_model=ContactAdminRead)
async def update_message(
    message_id: UUID,
    payload: ContactUpdateRequest,
    session: SessionDep,
    user: CurrentUser,
) -> ContactAdminRead:
    """Suivi côté agence. Le contenu du message reste intouchable."""
    message = await _get_or_404(session, message_id)

    if payload.is_read is not None:
        message.is_read = payload.is_read
    if payload.is_archived is not None:
        message.is_archived = payload.is_archived
    if payload.mark_replied:
        message.replied_at = datetime.now(UTC)
        message.handled_by = user.id
        # Répondre implique d'avoir lu.
        message.is_read = True

    session.add(message)
    await session.commit()
    await session.refresh(message)

    return ContactAdminRead.model_validate(message)