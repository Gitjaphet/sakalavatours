"""Formulaire de réservation du site public.

⚠ PREMIER ENDPOINT PUBLIC EN ÉCRITURE.

Trois défenses en couches :
1. Rate limit Redis par IP  — bride le volume brut
2. Rate limit Redis par email — bride le harcèlement ciblé
3. Honeypot — élimine les robots naïfs sans gêner personne

Le honeypot mérite une explication : le formulaire contient un champ
`website` masqué en CSS. Un humain ne le voit pas et ne le remplit jamais ;
un robot remplit tout. Si le champ est renseigné, on renvoie une réponse
de SUCCÈS factice — signaler le rejet apprendrait au robot à s'adapter.
"""

from typing import Annotated

from fastapi import APIRouter, BackgroundTasks, HTTPException, Request, status
from sqlmodel import select

from src.api.deps import RedisDep, SessionDep
from src.core.config import settings
from src.integrations import messages
from src.integrations.email import send as send_email
from src.models.enums import BookingSource
from src.models.product import Product, ProductTranslation
from src.repositories import product as product_repo
from src.schemas.booking import BookingCreate, BookingPublicRead
from src.services import booking as service
from src.services.booking import BookingError

router = APIRouter(prefix="/bookings", tags=["réservations"])

# Fenêtres de limitation
IP_LIMIT = 5
IP_WINDOW_SECONDS = 3600

EMAIL_LIMIT = 3
EMAIL_WINDOW_SECONDS = 86400


def _client_ip(request: Request) -> str:
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


async def _check_rate_limit(redis, key: str, limit: int) -> None:
    """Vérifie le quota SANS l'incrémenter.

    L'incrément se fait après la création réussie : une requête rejetée
    pour date invalide ne doit pas consommer le quota d'un visiteur
    légitime qui se corrige.
    """
    raw = await redis.get(key)
    count = int(raw) if raw else 0

    if count >= limit:
        ttl = max(60, await redis.ttl(key))
        minutes = max(1, ttl // 60)
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Trop de demandes. Réessayez dans {minutes} minutes.",
            headers={"Retry-After": str(ttl)},
        )


@router.post(
    "",
    response_model=BookingPublicRead,
    status_code=status.HTTP_201_CREATED,
)
async def create_booking(
    payload: BookingCreate,
    request: Request,
    session: SessionDep,
    redis: RedisDep,
    background: BackgroundTasks,
) -> BookingPublicRead:
    """Enregistre une demande de réservation.

    Ne réserve rien fermement : crée une demande en statut NEW, que
    l'agence traite depuis le dashboard.
    """
    # ── Honeypot ───────────────────────────────────────────────────────
    # Réponse de succès factice : le robot croit avoir réussi et ne
    # cherche pas à contourner.
    if payload.website:
        return BookingPublicRead(
            reference="SKT-0000-0000",
            status="new",  # type: ignore[arg-type]
            product_title="",
            requested_date=payload.requested_date,
            adults=payload.adults,
            children=payload.children,
        )

    ip = _client_ip(request)
    email = payload.customer_email.lower().strip()

    ip_key = f"rl:booking:ip:{ip}"
    email_key = f"rl:booking:email:{email}"

    await _check_rate_limit(redis, ip_key, IP_LIMIT)
    await _check_rate_limit(redis, email_key, EMAIL_LIMIT)

    product = await product_repo.get_by_slug(session, payload.product_slug)

    try:
        booking = await service.create_from_request(
            session,
            product=product,
            customer_name=payload.customer_name.strip(),
            customer_email=email,
            customer_phone=payload.customer_phone,
            customer_country=payload.customer_country,
            preferred_locale=payload.preferred_locale,
            hotel_name=payload.hotel_name,
            requested_date=payload.requested_date,
            alternative_date=payload.alternative_date,
            adults=payload.adults,
            children=payload.children,
            customer_message=payload.customer_message,
            source=BookingSource.WEBSITE,
            utm_source=payload.utm_source,
            utm_medium=payload.utm_medium,
            utm_campaign=payload.utm_campaign,
            referrer_url=payload.referrer_url,
            landing_page=payload.landing_page,
            submitted_ip=ip,
        )
    except BookingError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail=str(e)
        ) from None

    # Titre traduit dans la langue du client, figé dans le snapshot
    if product is not None:
        tr_stmt = select(ProductTranslation).where(
            ProductTranslation.product_id == product.id,
            ProductTranslation.locale.in_([payload.preferred_locale, "fr"]),
        )
        translations = (await session.exec(tr_stmt)).all()
        chosen = next(
            (t for t in translations if t.locale == payload.preferred_locale),
            translations[0] if translations else None,
        )
        if chosen:
            booking.product_title = chosen.title
            session.add(booking)

    await session.commit()
    await session.refresh(booking)

    # Quota consommé UNIQUEMENT sur une création réussie
    for key, window in ((ip_key, IP_WINDOW_SECONDS), (email_key, EMAIL_WINDOW_SECONDS)):
        if await redis.incr(key) == 1:
            await redis.expire(key, window)

    # ── Notifications ──────────────────────────────────────────────
    # BackgroundTasks exécute ces fonctions APRÈS l'envoi de la réponse :
    # le visiteur n'attend pas les 2 à 5 secondes du dialogue SMTP.
    # Et si l'envoi échoue, la réservation reste enregistrée.
    subject, text, html = messages.booking_confirmation_to_customer(booking)
    background.add_task(
        send_email,
        to=booking.customer_email,
        subject=subject,
        text_body=text,
        html_body=html,
    )

    if settings.AGENCY_NOTIFY_EMAIL:
        subject, text, html = messages.booking_alert_to_agency(booking)
        background.add_task(
            send_email,
            to=settings.AGENCY_NOTIFY_EMAIL,
            subject=subject,
            text_body=text,
            html_body=html,
            # Répondre à l'alerte écrit directement au client.
            reply_to=booking.customer_email,
        )

    return BookingPublicRead(
        reference=booking.reference,
        status=booking.status,
        product_title=booking.product_title,
        requested_date=booking.requested_date,
        adults=booking.adults,
        children=booking.children,
    )
