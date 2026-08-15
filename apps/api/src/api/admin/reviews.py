"""File de modération des avis.

⚠ TROIS RÈGLES POUR L'AGENCE

1. Ne jamais supprimer un avis négatif. Une note de 5,0 sur 200 avis est
   un signal de fraude aux yeux de Google comme des visiteurs ; 4,6 est
   infiniment plus crédible. Le champ `admin_reply` sert à répondre.

2. `is_verified` ne passe à true que si la réalité du voyage est établie
   — référence de réservation valide, ou vérification manuelle. C'est ce
   drapeau qui autorise le balisage aggregateRating.

3. Un rejet exige toujours un motif. Une modération doit pouvoir se
   justifier.
"""

from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlalchemy import func
from sqlmodel import select

from src.api.deps import CurrentUser, SessionDep, require_role
from src.models.enums import AdminRole, AuditAction, ReviewStatus
from src.models.review import Review
from src.schemas.review import (
    ReviewAdminListResponse,
    ReviewAdminRead,
    ReviewModerateRequest,
    ReviewReplyRequest,
)
from src.services import audit
from src.services import review as service
from src.services.review import ReviewError

router = APIRouter(
    prefix="/reviews",
    tags=["admin · avis"],
    # MODERATOR suffit : un modérateur n'a pas besoin de toucher au catalogue.
    dependencies=[Depends(require_role(AdminRole.MODERATOR))],
)

ENTITY = "review"


def _client_ip(request: Request) -> str | None:
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else None


async def _get_or_404(session, review_id: UUID) -> Review:
    stmt = select(Review).where(Review.id == review_id, Review.deleted_at.is_(None))
    review = (await session.exec(stmt)).first()
    if review is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Avis introuvable"
        )
    return review


@router.get("", response_model=ReviewAdminListResponse)
async def list_reviews(
    session: SessionDep,
    review_status: Annotated[ReviewStatus | None, Query(alias="status")] = None,
    product_id: Annotated[UUID | None, Query()] = None,
    min_rating: Annotated[int | None, Query(ge=1, le=5)] = None,
    max_rating: Annotated[int | None, Query(ge=1, le=5)] = None,
    limit: Annotated[int, Query(ge=1, le=100)] = 50,
    offset: Annotated[int, Query(ge=0)] = 0,
) -> ReviewAdminListResponse:
    """File de modération.

    Tri par score de spam décroissant : les avis suspects remontent en
    tête, ce qui accélère le travail du modérateur.
    """
    base = select(Review).where(Review.deleted_at.is_(None))
    count_base = (
        select(func.count()).select_from(Review).where(Review.deleted_at.is_(None))
    )

    def apply(stmt):
        if review_status is not None:
            stmt = stmt.where(Review.status == review_status)
        if product_id is not None:
            stmt = stmt.where(Review.product_id == product_id)
        if min_rating is not None:
            stmt = stmt.where(Review.rating >= min_rating)
        if max_rating is not None:
            stmt = stmt.where(Review.rating <= max_rating)
        return stmt

    stmt = (
        apply(base)
        .order_by(Review.spam_score.desc().nullslast(), Review.created_at.desc())
        .limit(limit)
        .offset(offset)
    )

    reviews = list((await session.exec(stmt)).all())
    total = (await session.exec(apply(count_base))).one()

    counts_stmt = (
        select(Review.status, func.count())
        .where(Review.deleted_at.is_(None))
        .group_by(Review.status)
    )
    counts = {s.value: c for s, c in (await session.exec(counts_stmt)).all()}

    return ReviewAdminListResponse(
        items=[ReviewAdminRead.model_validate(r) for r in reviews],
        total=total,
        limit=limit,
        offset=offset,
        counts_by_status=counts,
    )


@router.get("/{review_id}", response_model=ReviewAdminRead)
async def get_review(review_id: UUID, session: SessionDep) -> ReviewAdminRead:
    review = await _get_or_404(session, review_id)
    return ReviewAdminRead.model_validate(review)


@router.post("/{review_id}/moderate", response_model=ReviewAdminRead)
async def moderate_review(
    review_id: UUID,
    payload: ReviewModerateRequest,
    session: SessionDep,
    user: CurrentUser,
    request: Request,
) -> ReviewAdminRead:
    """Approuve, rejette ou marque comme spam.

    Recalcule ensuite la note du produit : les champs rating_average et
    review_count sont dénormalisés et ne doivent jamais diverger.
    """
    review = await _get_or_404(session, review_id)
    previous = review.status

    try:
        review = await service.moderate(
            session,
            review,
            new_status=payload.status,
            actor=user,
            rejection_reason=payload.rejection_reason,
            is_verified=payload.is_verified,
            is_featured=payload.is_featured,
        )
    except ReviewError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail=str(e)
        ) from None

    if review.product_id is not None:
        await service.refresh_product_rating(session, review.product_id)

    await audit.log(
        session,
        actor=user,
        action=AuditAction.STATUS_CHANGE,
        entity_type=ENTITY,
        entity_id=review.id,
        entity_label=f"{review.author_name} : {previous.value} → {review.status.value}",
        after=review,
        ip_address=_client_ip(request),
    )
    await session.commit()
    await session.refresh(review)

    return ReviewAdminRead.model_validate(review)


@router.post("/{review_id}/reply", response_model=ReviewAdminRead)
async def reply_to_review(
    review_id: UUID,
    payload: ReviewReplyRequest,
    session: SessionDep,
    user: CurrentUser,
    request: Request,
) -> ReviewAdminRead:
    """Réponse publique de l'agence.

    Répondre à un avis mitigé est la meilleure réaction possible : c'est
    visible par les futurs clients et démontre le sérieux de l'agence.
    Bien plus efficace que de le faire disparaître.
    """
    from datetime import UTC, datetime

    review = await _get_or_404(session, review_id)

    review.admin_reply = payload.admin_reply.strip()
    review.admin_replied_at = datetime.now(UTC)
    session.add(review)

    await audit.log(
        session,
        actor=user,
        action=AuditAction.UPDATE,
        entity_type=ENTITY,
        entity_id=review.id,
        entity_label=f"Réponse à l'avis de {review.author_name}",
        after=review,
        ip_address=_client_ip(request),
    )
    await session.commit()
    await session.refresh(review)

    return ReviewAdminRead.model_validate(review)
