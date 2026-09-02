"""Accès aux données des produits.

Aucune règle métier ici : uniquement des requêtes. Le repository ne sait
pas ce qu'est une « langue de repli », il sait charger des traductions.
C'est le service qui décide quoi en faire.

Toutes les fonctions chargent en LOT (plusieurs produits d'un coup) pour
éviter le problème N+1 : afficher 15 cartes ne doit pas déclencher
15 requêtes de traduction.
"""

from uuid import UUID

from sqlalchemy import case, func
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from src.models.enums import ContentStatus, ProductType
from src.models.media import Media, MediaTranslation
from src.models.product import (
    Product,
    ProductDepartureMonth,
    ProductFaq,
    ProductHighlight,
    ProductInclusion,
    ProductItineraryItem,
    ProductItineraryTranslation,
    ProductMedia,
    ProductPackingItem,
    ProductPriceTier,
    ProductRelated,
    ProductTranslation,
)
from src.models.taxonomy import (
    Highlight,
    HighlightTranslation,
    Inclusion,
    InclusionTranslation,
    PackingItem,
    PackingItemTranslation,
)


def _published(stmt):
    """Filtre commun : publié, non supprimé, statut PUBLISHED.

    Centralisé pour qu'aucune requête publique n'oublie une des trois
    conditions — un brouillon exposé publiquement est vite arrivé.
    """
    return stmt.where(
        Product.is_published.is_(True),
        Product.deleted_at.is_(None),
        Product.status == ContentStatus.PUBLISHED,
    )


async def list_products(
    session: AsyncSession,
    *,
    product_type: ProductType | None = None,
    destination_id: UUID | None = None,
    limit: int = 24,
    offset: int = 0,
) -> tuple[list[Product], int]:
    stmt = _published(select(Product))
    count_stmt = _published(select(func.count()).select_from(Product))

    if product_type is not None:
        stmt = stmt.where(Product.product_type == product_type)
        count_stmt = count_stmt.where(Product.product_type == product_type)

    if destination_id is not None:
        stmt = stmt.where(Product.destination_id == destination_id)
        count_stmt = count_stmt.where(Product.destination_id == destination_id)

    stmt = (
        stmt.order_by(
            Product.is_featured.desc(),
            Product.sort_order,
            Product.price_from.desc(),
        )
        .limit(limit)
        .offset(offset)
    )

    products = list((await session.exec(stmt)).all())
    total = (await session.exec(count_stmt)).one()
    return products, total


async def get_by_slug(
    session: AsyncSession, slug: str, *, published_only: bool = True
) -> Product | None:
    stmt = select(Product).where(Product.slug == slug, Product.deleted_at.is_(None))
    if published_only:
        stmt = _published(stmt)
    return (await session.exec(stmt)).first()


async def get_translations(
    session: AsyncSession, product_ids: list[UUID], locales: list[str]
) -> dict[tuple[UUID, str], ProductTranslation]:
    """Retourne {(product_id, locale): traduction} en une requête."""
    if not product_ids:
        return {}

    stmt = select(ProductTranslation).where(
        ProductTranslation.product_id.in_(product_ids),
        ProductTranslation.locale.in_(locales),
    )
    return {(r.product_id, r.locale): r for r in (await session.exec(stmt)).all()}


async def get_media(
    session: AsyncSession, media_ids: list[UUID], locales: list[str]
) -> dict[UUID, tuple[Media, str]]:
    """Retourne {media_id: (media, alt_text)}.

    L'alt est résolu selon l'ordre de `locales` : la première langue
    disponible gagne.
    """
    ids = [m for m in media_ids if m is not None]
    if not ids:
        return {}

    stmt = select(Media).where(Media.id.in_(ids), Media.deleted_at.is_(None))
    medias = {m.id: m for m in (await session.exec(stmt)).all()}

    alt_stmt = select(MediaTranslation).where(
        MediaTranslation.media_id.in_(ids),
        MediaTranslation.locale.in_(locales),
    )
    alts = {
        (t.media_id, t.locale): t.alt_text for t in (await session.exec(alt_stmt)).all()
    }

    result: dict[UUID, tuple[Media, str]] = {}
    for mid, media in medias.items():
        alt = next((alts[(mid, loc)] for loc in locales if (mid, loc) in alts), "")
        result[mid] = (media, alt)
    return result


async def get_highlights(
    session: AsyncSession, product_ids: list[UUID], locales: list[str]
) -> dict[UUID, list[tuple[str, str, str | None, str]]]:
    """Retourne {product_id: [(code, label, icon, locale), …]}.

    La locale est conservée pour que le service puisse départager quand
    plusieurs traductions reviennent.
    """
    if not product_ids:
        return {}

    stmt = (
        select(ProductHighlight, Highlight, HighlightTranslation)
        .join(Highlight, Highlight.id == ProductHighlight.highlight_id)
        .join(HighlightTranslation, HighlightTranslation.highlight_id == Highlight.id)
        .where(
            ProductHighlight.product_id.in_(product_ids),
            HighlightTranslation.locale.in_(locales),
            Highlight.deleted_at.is_(None),
        )
        .order_by(ProductHighlight.sort_order)
    )

    grouped: dict[UUID, list[tuple[str, str, str | None, str]]] = {}
    for link, hl, tr in (await session.exec(stmt)).all():
        grouped.setdefault(link.product_id, []).append(
            (hl.code, tr.label, hl.icon, tr.locale)
        )
    return grouped


async def get_itinerary(
    session: AsyncSession, product_id: UUID, locales: list[str]
) -> list[tuple[ProductItineraryItem, ProductItineraryTranslation]]:
    stmt = (
        select(ProductItineraryItem, ProductItineraryTranslation)
        .join(
            ProductItineraryTranslation,
            ProductItineraryTranslation.item_id == ProductItineraryItem.id,
        )
        .where(
            ProductItineraryItem.product_id == product_id,
            ProductItineraryTranslation.locale.in_(locales),
        )
        # Même règle que pour les taxonomies : la meilleure locale d'abord,
        # sinon la déduplication côté service garde une langue au hasard.
        .order_by(
            ProductItineraryItem.day_number,
            ProductItineraryItem.sort_order,
            case(
                {loc: i for i, loc in enumerate(locales)},
                value=ProductItineraryTranslation.locale,
                else_=len(locales),
            ),
        )
    )
    return list((await session.exec(stmt)).all())


async def get_inclusions(
    session: AsyncSession, product_id: UUID, locales: list[str]
) -> list[tuple[ProductInclusion, Inclusion, InclusionTranslation]]:
    stmt = (
        select(ProductInclusion, Inclusion, InclusionTranslation)
        .join(Inclusion, Inclusion.id == ProductInclusion.inclusion_id)
        .join(InclusionTranslation, InclusionTranslation.inclusion_id == Inclusion.id)
        .where(
            ProductInclusion.product_id == product_id,
            InclusionTranslation.locale.in_(locales),
            Inclusion.deleted_at.is_(None),
        )
        # Trie par priorité de locale : la déduplication côté service garde
        # la première ligne, il faut donc que ce soit la meilleure langue.
        .order_by(
            ProductInclusion.sort_order,
            case(
                {loc: i for i, loc in enumerate(locales)},
                value=InclusionTranslation.locale,
                else_=len(locales),
            ),
        )
    )
    return list((await session.exec(stmt)).all())


async def get_packing_items(
    session: AsyncSession, product_id: UUID, locales: list[str]
) -> list[tuple[PackingItem, PackingItemTranslation]]:
    stmt = (
        select(PackingItem, PackingItemTranslation)
        .join(ProductPackingItem, ProductPackingItem.packing_item_id == PackingItem.id)
        .join(
            PackingItemTranslation,
            PackingItemTranslation.packing_item_id == PackingItem.id,
        )
        .where(
            ProductPackingItem.product_id == product_id,
            PackingItemTranslation.locale.in_(locales),
            PackingItem.deleted_at.is_(None),
        )
        # Même règle que pour les inclusions : la meilleure locale d'abord.
        .order_by(
            ProductPackingItem.sort_order,
            case(
                {loc: i for i, loc in enumerate(locales)},
                value=PackingItemTranslation.locale,
                else_=len(locales),
            ),
        )
    )
    return list((await session.exec(stmt)).all())


async def get_faqs(
    session: AsyncSession, product_id: UUID, locales: list[str]
) -> list[ProductFaq]:
    stmt = (
        select(ProductFaq)
        .where(ProductFaq.product_id == product_id, ProductFaq.locale.in_(locales))
        .order_by(ProductFaq.sort_order)
    )
    return list((await session.exec(stmt)).all())


async def get_price_tiers(
    session: AsyncSession, product_id: UUID
) -> list[ProductPriceTier]:
    stmt = (
        select(ProductPriceTier)
        .where(ProductPriceTier.product_id == product_id)
        .order_by(ProductPriceTier.sort_order)
    )
    return list((await session.exec(stmt)).all())


async def get_departure_months(session: AsyncSession, product_id: UUID) -> list[int]:
    stmt = select(ProductDepartureMonth).where(
        ProductDepartureMonth.product_id == product_id
    )
    return sorted(m.month for m in (await session.exec(stmt)).all())


async def get_gallery_ids(session: AsyncSession, product_id: UUID) -> list[UUID]:
    stmt = (
        select(ProductMedia)
        .where(ProductMedia.product_id == product_id)
        .order_by(ProductMedia.sort_order)
    )
    return [g.media_id for g in (await session.exec(stmt)).all()]


async def get_related_slugs(session: AsyncSession, product_id: UUID) -> list[str]:
    stmt = (
        select(Product.slug)
        .join(ProductRelated, ProductRelated.related_product_id == Product.id)
        .where(
            ProductRelated.product_id == product_id,
            Product.is_published.is_(True),
            Product.deleted_at.is_(None),
        )
        .order_by(ProductRelated.sort_order)
    )
    return list((await session.exec(stmt)).all())
