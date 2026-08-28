"""Logique métier des avis.

⚠ LE POINT CRITIQUE DE TOUT LE PROJET

`compute_aggregate()` décide si le site a le droit d'émettre un
aggregateRating en JSON-LD. Trois conditions cumulatives :

1. l'avis est APPROVED (validé par un modérateur),
2. l'avis est is_verified (rattaché à une réservation réelle),
3. il y en a au moins MIN_REVIEWS_FOR_SCHEMA.

Publier une note agrégée calculée sur des avis inventés ou non
vérifiables est le premier motif d'action manuelle Google sur les sites
de tourisme. La sanction retire le site des résultats enrichis, parfois
davantage. Aucune de ces trois conditions ne doit être assouplie.
"""

from datetime import UTC, datetime
from decimal import Decimal
from uuid import UUID

from sqlalchemy import func
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from src.models.booking import Booking
from src.models.enums import BookingStatus, ReviewStatus
from src.models.product import Product
from src.models.review import Review
from src.models.system import AdminUser
from src.schemas.review import ReviewAggregate

# En dessous de ce seuil, une moyenne n'a aucune valeur statistique et
# afficher « 5,0 sur 1 avis » nuit plus qu'autre chose.
MIN_REVIEWS_FOR_SCHEMA = 3


class ReviewError(Exception):
    """Erreur métier. Le routeur la traduit en 400."""


async def verify_booking_reference(
    session: AsyncSession, reference: str, email: str
) -> bool:
    """Vérifie qu'une référence correspond à un voyage réellement effectué.

    Trois conditions : la référence existe, l'email correspond, et la
    réservation est en statut COMPLETED. Un voyage seulement CONFIRMED
    n'a pas encore eu lieu — on ne peut pas en donner un avis vérifié.
    """
    stmt = select(Booking).where(
        Booking.reference == reference.strip().upper(),
        Booking.customer_email == email.lower().strip(),
        Booking.status == BookingStatus.COMPLETED,
        Booking.deleted_at.is_(None),
    )
    return (await session.exec(stmt)).first() is not None


def compute_spam_score(body: str, title: str | None, author_name: str) -> float:
    """Score heuristique de 0 (propre) à 1 (très suspect).

    Simple et volontairement transparent : ce score AIDE le modérateur, il
    ne décide jamais seul. Un avis à 0,9 arrive en tête de file, il n'est
    pas rejeté automatiquement.
    """
    score = 0.0
    text = f"{title or ''} {body}".lower()

    # Liens : un avis authentique n'en contient presque jamais
    link_count = text.count("http") + text.count("www.")
    score += min(0.4, link_count * 0.2)

    # Majuscules excessives
    letters = [c for c in body if c.isalpha()]
    if len(letters) > 20:
        upper_ratio = sum(1 for c in letters if c.isupper()) / len(letters)
        if upper_ratio > 0.5:
            score += 0.2

    # Répétition d'un même caractère
    if any(c * 5 in body for c in "!?.*-=$"):
        score += 0.15

    # Vocabulaire commercial typique du spam
    for term in ("casino", "viagra", "crypto", "bitcoin", "loan", "seo service"):
        if term in text:
            score += 0.3
            break

    # Nom d'auteur sans voyelle : souvent généré
    if len(author_name) > 3 and not any(v in author_name.lower() for v in "aeiouy"):
        score += 0.15

    return round(min(1.0, score), 2)


async def create_review(
    session: AsyncSession,
    *,
    product: Product | None,
    author_name: str,
    author_email: str,
    author_country: str | None,
    rating: int,
    title: str | None,
    body: str,
    locale: str,
    travel_date,
    booking_reference: str | None,
    submitted_ip: str | None,
    user_agent: str | None,
) -> Review:
    email = author_email.lower().strip()

    is_verified = False
    if booking_reference:
        is_verified = await verify_booking_reference(session, booking_reference, email)

    review = Review(
        product_id=product.id if product else None,
        author_name=author_name.strip(),
        author_email=email,
        author_country=author_country.upper() if author_country else None,
        rating=rating,
        title=title.strip() if title else None,
        body=body.strip(),
        locale=locale,
        travel_date=travel_date,
        # TOUJOURS PENDING à la création. Aucun avis ne se publie seul,
        # même vérifié : la modération humaine reste la dernière barrière.
        status=ReviewStatus.PENDING,
        is_verified=is_verified,
        booking_reference=booking_reference.strip().upper() if booking_reference else None,
        submitted_ip=submitted_ip,
        user_agent=user_agent[:500] if user_agent else None,
        spam_score=compute_spam_score(body, title, author_name),
    )

    session.add(review)
    await session.flush()
    return review


async def moderate(
    session: AsyncSession,
    review: Review,
    *,
    new_status: ReviewStatus,
    actor: AdminUser,
    rejection_reason: str | None = None,
    is_verified: bool | None = None,
    is_featured: bool | None = None,
) -> Review:
    if new_status in (ReviewStatus.REJECTED, ReviewStatus.SPAM) and not rejection_reason:
        raise ReviewError("Un motif est obligatoire pour rejeter un avis")

    review.status = new_status
    review.moderated_by = actor.id
    review.moderated_at = datetime.now(UTC)

    if rejection_reason is not None:
        review.rejection_reason = rejection_reason
    if is_verified is not None:
        review.is_verified = is_verified
    if is_featured is not None:
        review.is_featured = is_featured

    if new_status is ReviewStatus.APPROVED:
        # Un avis publié ne doit plus porter de motif de rejet : il
        # resterait visible dans la fiche de modération et induirait
        # l'équipe en erreur.
        review.rejection_reason = None
        if review.published_at is None:
            review.published_at = review.moderated_at

    session.add(review)
    return review


async def compute_aggregate(
    session: AsyncSession, product_id: UUID | None = None
) -> ReviewAggregate:
    """Calcule la note agrégée et son éligibilité au balisage.

    ⚠ La moyenne AFFICHÉE porte sur tous les avis approuvés, mais
    `is_schema_eligible` n'est vrai que si les avis sont aussi vérifiés et
    assez nombreux. Le site peut donc afficher une note sans la déclarer à
    Google — c'est exactement ce qu'il faut au démarrage.
    """
    base = select(Review).where(
        Review.status == ReviewStatus.APPROVED,
        Review.deleted_at.is_(None),
    )
    if product_id is not None:
        base = base.where(Review.product_id == product_id)
    else:
        base = base.where(Review.product_id.is_(None))

    reviews = list((await session.exec(base)).all())

    if not reviews:
        return ReviewAggregate()

    total = len(reviews)
    verified = sum(1 for r in reviews if r.is_verified)
    average = Decimal(sum(r.rating for r in reviews)) / Decimal(total)

    distribution = {str(n): 0 for n in range(1, 6)}
    for r in reviews:
        distribution[str(r.rating)] += 1

    return ReviewAggregate(
        average=average.quantize(Decimal("0.01")),
        count=total,
        verified_count=verified,
        distribution=distribution,
        is_schema_eligible=verified >= MIN_REVIEWS_FOR_SCHEMA,
    )


async def refresh_product_rating(session: AsyncSession, product_id: UUID) -> None:
    """Recalcule rating_average et review_count sur le produit.

    Ces champs sont dénormalisés pour éviter un COUNT à chaque affichage
    de carte. Ils ne sont JAMAIS saisis à la main : cette fonction est
    appelée après chaque modération.
    """
    stmt = (
        select(func.avg(Review.rating), func.count())
        .where(
            Review.product_id == product_id,
            Review.status == ReviewStatus.APPROVED,
            Review.deleted_at.is_(None),
        )
    )
    avg, count = (await session.exec(stmt)).one()

    product = (
        await session.exec(select(Product).where(Product.id == product_id))
    ).first()

    if product:
        product.rating_average = (
            Decimal(avg).quantize(Decimal("0.01")) if avg is not None else None
        )
        product.review_count = count or 0
        session.add(product)
