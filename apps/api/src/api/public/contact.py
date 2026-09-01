"""Formulaire de contact du site public.

Trois défenses, identiques au formulaire d'avis :
1. Honeypot — réponse de succès factice, le robot n'apprend rien
2. Rate limit Redis par IP
3. Rate limit Redis par email

Un message de contact n'est jamais publié : il n'y a donc pas de
modération, seulement un suivi de lecture côté agence.
"""

from typing import Annotated

from fastapi import APIRouter, BackgroundTasks, HTTPException, Request, status

from src.api.deps import RedisDep, SessionDep
from src.core.config import settings
from src.integrations import messages
from src.integrations.email import send as send_email
from src.models.booking import ContactMessage
from src.schemas.contact import ContactCreate, ContactSubmitResponse

router = APIRouter(prefix="/contact", tags=["contact"])

IP_LIMIT = 5
IP_WINDOW_SECONDS = 86400

EMAIL_LIMIT = 3
EMAIL_WINDOW_SECONDS = 86400


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
            detail="Vous nous avez déjà écrit récemment. Nous vous répondons au plus vite.",
            headers={"Retry-After": str(ttl)},
        )


@router.post("", response_model=ContactSubmitResponse, status_code=status.HTTP_201_CREATED)
async def submit_contact(
    payload: ContactCreate,
    request: Request,
    session: SessionDep,
    redis: RedisDep,
    background: BackgroundTasks,
) -> ContactSubmitResponse:
    """Enregistre un message et alerte l'agence."""
    # Honeypot : succès factice pour ne rien apprendre au robot
    if payload.website:
        return ContactSubmitResponse()

    ip = _client_ip(request)
    email = payload.email.lower().strip()

    await _check_quota(redis, f"rl:contact:ip:{ip}", IP_LIMIT)
    await _check_quota(redis, f"rl:contact:email:{email}", EMAIL_LIMIT)

    # Le score de spam réutilise l'heuristique des avis : mêmes signaux,
    # mêmes seuils — liens, majuscules, vocabulaire commercial.
    from src.services.review import compute_spam_score

    contact = ContactMessage(
        name=payload.name.strip(),
        email=email,
        phone=payload.phone.strip() if payload.phone else None,
        subject=payload.subject.strip() if payload.subject else None,
        message=payload.message.strip(),
        locale=payload.locale,
        submitted_ip=ip,
        spam_score=compute_spam_score(payload.message, payload.subject, payload.name),
    )

    session.add(contact)
    await session.commit()
    await session.refresh(contact)

    for key, window in (
        (f"rl:contact:ip:{ip}", IP_WINDOW_SECONDS),
        (f"rl:contact:email:{email}", EMAIL_WINDOW_SECONDS),
    ):
        if await redis.incr(key) == 1:
            await redis.expire(key, window)

    if settings.AGENCY_NOTIFY_EMAIL:
        subject, text, html = messages.contact_alert_to_agency(
            name=contact.name,
            email=contact.email,
            phone=contact.phone,
            subject_line=contact.subject,
            message=contact.message,
            contact_id=contact.id,
        )
        background.add_task(
            send_email,
            to=settings.AGENCY_NOTIFY_EMAIL,
            subject=subject,
            text_body=text,
            html_body=html,
        )

    return ContactSubmitResponse()




def contact_alert_to_agency(
    name: str,
    email: str,
    phone: str | None,
    subject_line: str | None,
    message: str,
    contact_id,
) -> tuple[str, str, str]:
    """Notification d'un message reçu via le formulaire de contact.

    Reprend l'intégralité du message : l'agence doit pouvoir répondre
    depuis sa boîte sans ouvrir l'administration.
    """
    label = subject_line or "Sans objet"
    subject = f"[Contact] {label} — {name}"

    text = f"""NOUVEAU MESSAGE DE CONTACT

De      : {name}
Email   : {email}
Téléphone : {phone or "non renseigné"}
Objet   : {label}

{message}

Répondre directement à {email}
Suivi : {settings.ADMIN_BASE_URL}/messages/{contact_id}
"""

    html = _wrap_html(
        "Nouveau message de contact",
        f"""
        <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;background:#FDFAF6;border-radius:12px;padding:16px;margin:0 0 20px;">
          <tr><td style="padding:6px 12px;font-size:14px;color:#666;">De</td>
              <td style="padding:6px 12px;font-size:14px;color:#2B2620;font-weight:600;">{name}</td></tr>
          <tr><td style="padding:6px 12px;font-size:14px;color:#666;">Email</td>
              <td style="padding:6px 12px;font-size:14px;"><a href="mailto:{email}" style="color:#1d4e5f;">{email}</a></td></tr>
          <tr><td style="padding:6px 12px;font-size:14px;color:#666;">Téléphone</td>
              <td style="padding:6px 12px;font-size:14px;color:#2B2620;">{phone or "non renseigné"}</td></tr>
          <tr><td style="padding:6px 12px;font-size:14px;color:#666;">Objet</td>
              <td style="padding:6px 12px;font-size:14px;color:#2B2620;">{label}</td></tr>
        </table>
        <p style="margin:0 0 20px;font-size:15px;line-height:1.7;color:#444;white-space:pre-wrap;">{message}</p>
        <a href="mailto:{email}"
           style="display:inline-block;background:#1d4e5f;color:#fff;text-decoration:none;padding:12px 24px;border-radius:999px;font-size:14px;font-weight:600;">
          Répondre à {name}
        </a>
        """,
    )

    return subject, text, html