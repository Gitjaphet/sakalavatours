"""Formulaire d'avis et affichage public.

⚠ AUCUN AVIS NE SE PUBLIE SEUL.

Tout avis soumis arrive en PENDING, même vérifié par sa référence de
réservation. La modération humaine reste la dernière barrière avant
publication — c'est ce qui protège l'agence d'un avis diffamatoire ou
d'une campagne de dénigrement.
"""

from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, BackgroundTasks, HTTPException, Query, Request, status
from sqlmodel import select

from src.api.deps import RedisDep, SessionDep
from src.integrations import messages
from src.integrations.email import send as send_email
from src.core.config import settings
from src.models.enums import ReviewStatus
from src.models.product import Product
from src.models.review import Review
from src.repositories import product as product_repo
from src.schemas.review import (
    ReviewCreate,
    ReviewListResponse,
    ReviewPublicRead,
    ReviewSubmitResponse,
)
from src.services import review as service

router = APIRouter(prefix="/reviews", tags=["avis"])

IP_LIMIT = 3
IP_WINDOW_SECONDS = 86400

EMAIL_LIMIT = 2
EMAIL_WINDOW_SECONDS = 604800  # 7 jours


def _client_ip(request: Request) -> str:
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


async def _check_quota(redis, key: str, limit: int) -> None:
    raw = await redis.get(key)
    if int(raw or 0) >= limit:
        ttl = max(3600, await redis.ttl(key))
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Vous avez déjà déposé un avis récemment.",
            headers={"Retry-After": str(ttl)},
        )


@router.post("", response_model=ReviewSubmitResponse, status_code=status.HTTP_201_CREATED)
async def submit_review(
    payload: ReviewCreate,
    request: Request,
    session: SessionDep,
    redis: RedisDep,
    background: BackgroundTasks,
) -> ReviewSubmitResponse:
    """Dépose un avis. Publication après modération."""
    # Honeypot : réponse de succès factice pour ne rien apprendre au robot
    if payload.website:
        return ReviewSubmitResponse()

    ip = _client_ip(request)
    email = payload.author_email.lower().strip()

    ip_key = f"rl:review:ip:{ip}"
    email_key = f"rl:review:email:{email}"

    await _check_quota(redis, ip_key, IP_LIMIT)
    await _check_quota(redis, email_key, EMAIL_LIMIT)

    product: Product | None = None
    if payload.product_slug:
        product = await product_repo.get_by_slug(session, payload.product_slug)
        if product is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Produit introuvable"
            )

    review = await service.create_review(
        session,
        product=product,
        author_name=payload.author_name,
        author_email=email,
        author_country=payload.author_country,
        rating=payload.rating,
        title=payload.title,
        body=payload.body,
        locale=payload.locale,
        travel_date=payload.travel_date,
        booking_reference=payload.booking_reference,
        submitted_ip=ip,
        user_agent=request.headers.get("user-agent"),
    )

    await session.commit()

    for key, window in ((ip_key, IP_WINDOW_SECONDS), (email_key, EMAIL_WINDOW_SECONDS)):
        if await redis.incr(key) == 1:
            await redis.expire(key, window)

    # Alerte de modération. Sans elle, un avis peut dormir des semaines
    # en file d'attente sans que personne ne le sache.
    if settings.AGENCY_NOTIFY_EMAIL:
        subject, text, html = messages.review_alert_to_agency(
            author_name=review.author_name,
            rating=review.rating,
            product_title=payload.product_slug or "l'agence",
            review_id=review.id,
        )
        background.add_task(
            send_email,
            to=settings.AGENCY_NOTIFY_EMAIL,
            subject=subject,
            text_body=text,
            html_body=html,
        )

    return ReviewSubmitResponse()


@router.get("", response_model=ReviewListResponse)
async def list_reviews(
    session: SessionDep,
    product_slug: Annotated[
        str | None, Query(description="Vide = avis sur l'agence")
    ] = None,
    locale: Annotated[str | None, Query(max_length=5)] = None,
    limit: Annotated[int, Query(ge=1, le=50)] = 12,
    offset: Annotated[int, Query(ge=0)] = 0,
) -> ReviewListResponse:
    """Avis approuvés, avec la note agrégée.

    ⚠ Regarde `aggregate.is_schema_eligible` avant d'émettre un
    aggregateRating en JSON-LD côté Next.
    """
    from sqlalchemy import func

    product_id: UUID | None = None
    if product_slug:
        product = await product_repo.get_by_slug(session, product_slug)
        if product is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Produit introuvable"
            )
        product_id = product.id

    stmt = select(Review).where(
        Review.status == ReviewStatus.APPROVED,
        Review.deleted_at.is_(None),
    )
    count_stmt = (
        select(func.count())
        .select_from(Review)
        .where(Review.status == ReviewStatus.APPROVED, Review.deleted_at.is_(None))
    )

    if product_id is not None:
        stmt = stmt.where(Review.product_id == product_id)
        count_stmt = count_stmt.where(Review.product_id == product_id)
    else:
        stmt = stmt.where(Review.product_id.is_(None))
        count_stmt = count_stmt.where(Review.product_id.is_(None))

    if locale:
        stmt = stmt.where(Review.locale == locale)
        count_stmt = count_stmt.where(Review.locale == locale)

    # Vérifiés d'abord, puis mis en avant, puis les plus récents
    stmt = stmt.order_by(
        Review.is_verified.desc(),
        Review.is_featured.desc(),
        Review.moderated_at.desc(),
    ).limit(limit).offset(offset)

    reviews = list((await session.exec(stmt)).all())
    total = (await session.exec(count_stmt)).one()

    items = [
        ReviewPublicRead(
            id=r.id,
            # Seul le prénom et l'initiale du nom sont exposés.
            author_name=_shorten_name(r.author_name),
            author_country=r.author_country,
            rating=r.rating,
            title=r.title,
            body=r.body,
            travel_date=r.travel_date,
            is_verified=r.is_verified,
            admin_reply=r.admin_reply,
            published_at=r.moderated_at or r.created_at,
            product_slug=product_slug,
        )
        for r in reviews
    ]

    aggregate = await service.compute_aggregate(session, product_id)

    return ReviewListResponse(
        items=items, total=total, limit=limit, offset=offset, aggregate=aggregate
    )


def _shorten_name(full_name: str) -> str:
    """« Marie Dupont » → « Marie D. »

    Protection de la vie privée : un avis public ne doit pas permettre
    d'identifier son auteur, surtout combiné à une date de voyage.
    """
    parts = full_name.strip().split()
    if len(parts) < 2:
        return full_name
    return f"{parts[0]} {parts[-1][0].upper()}."
