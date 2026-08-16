"""Assemblage des produits pour l'API publique.

C'est ici que vit LA règle qui n'a sa place ni dans le repository ni dans
le routeur : la chaîne de repli de langue.

Un voyageur italien qui consulte une excursion non traduite doit voir le
contenu en français plutôt qu'une page vide. Mais le frontend doit le
SAVOIR, pour afficher discrètement « traduction en cours » — d'où le
drapeau `is_fallback` et le champ `content_locale`.
"""

from uuid import UUID

from sqlmodel.ext.asyncio.session import AsyncSession

from src.core.config import settings
from src.integrations import storage
from src.models.enums import ProductType
from src.models.product import Product, ProductTranslation
from src.repositories import product as repo
from src.schemas.product import (
    FaqOut,
    InclusionOut,
    ItineraryItemOut,
    LabelOut,
    MediaOut,
    PriceTierOut,
    ProductDetail,
    ProductListItem,
    ProductListResponse,
)


def locale_chain(requested: str) -> list[str]:
    """Ordre de préférence des langues.

    La langue demandée d'abord, la langue par défaut ensuite. On ne va pas
    au-delà : proposer de l'allemand à un italien parce que le français
    manque serait pire que rien.
    """
    if requested == settings.DEFAULT_LOCALE:
        return [requested]
    return [requested, settings.DEFAULT_LOCALE]


def _pick_translation(
    translations: dict[tuple[UUID, str], ProductTranslation],
    product_id: UUID,
    chain: list[str],
) -> tuple[ProductTranslation | None, str, bool]:
    """Retourne (traduction, locale_utilisée, est_un_repli)."""
    for i, loc in enumerate(chain):
        tr = translations.get((product_id, loc))
        if tr is not None:
            return tr, loc, i > 0
    return None, chain[0], False


def _media_out(media_map: dict, media_id: UUID | None) -> MediaOut | None:
    if media_id is None or media_id not in media_map:
        return None
    media, alt = media_map[media_id]
    return MediaOut(
        id=media.id,
        url=storage.public_url(media.storage_path),
        width=media.width,
        height=media.height,
        blurhash=media.blurhash,
        alt_text=alt,
    )


def _dedup_by_locale(
    rows: list[tuple[str, str, str | None, str]], chain: list[str]
) -> list[LabelOut]:
    """Garde une seule traduction par code, selon l'ordre de la chaîne."""
    best: dict[str, tuple[int, str, str | None]] = {}
    order: list[str] = []

    for code, label, icon, loc in rows:
        rank = chain.index(loc) if loc in chain else len(chain)
        if code not in best:
            order.append(code)
            best[code] = (rank, label, icon)
        elif rank < best[code][0]:
            best[code] = (rank, label, icon)

    return [LabelOut(code=c, label=best[c][1], icon=best[c][2]) for c in order]


def _base_item(
    product: Product,
    tr: ProductTranslation | None,
    content_locale: str,
    is_fallback: bool,
    cover: MediaOut | None,
    highlights: list[LabelOut],
) -> dict:
    """Champs communs à la carte et à la fiche."""
    return {
        "id": product.id,
        "slug": product.slug,
        "product_type": product.product_type,
        "product_format": product.product_format,
        "difficulty": product.difficulty,
        "title": tr.title if tr else product.slug,
        "subtitle": tr.subtitle if tr else None,
        "region_label": tr.region_label if tr else None,
        "summary": tr.summary if tr else "",
        "duration_days": product.duration_days,
        "duration_nights": product.duration_nights,
        "duration_hours": product.duration_hours,
        "departure_time": product.departure_time,
        "return_time": product.return_time,
        "travel_minutes": product.travel_minutes,
        "transport": product.transport,
        "group_min": product.group_min,
        "group_max": product.group_max,
        "hotel_pickup": product.hotel_pickup,
        "price_from": product.price_from,
        "currency": product.currency,
        "rating_average": product.rating_average,
        "review_count": product.review_count,
        "is_featured": product.is_featured,
        "cover": cover,
        "highlights": highlights,
        "is_fallback": is_fallback,
        "content_locale": content_locale,
    }


async def list_for_locale(
    session: AsyncSession,
    locale: str,
    *,
    product_type: ProductType | None = None,
    destination_id: UUID | None = None,
    limit: int = 24,
    offset: int = 0,
) -> ProductListResponse:
    chain = locale_chain(locale)

    products, total = await repo.list_products(
        session,
        product_type=product_type,
        destination_id=destination_id,
        limit=limit,
        offset=offset,
    )

    if not products:
        return ProductListResponse(items=[], total=total, limit=limit, offset=offset)

    ids = [p.id for p in products]

    # Trois requêtes groupées pour N produits, jamais 3×N.
    translations = await repo.get_translations(session, ids, chain)
    media_map = await repo.get_media(
        session, [p.cover_media_id for p in products], chain
    )
    highlights_map = await repo.get_highlights(session, ids, chain)

    items: list[ProductListItem] = []
    for p in products:
        tr, loc, fallback = _pick_translation(translations, p.id, chain)
        items.append(
            ProductListItem(
                **_base_item(
                    p,
                    tr,
                    loc,
                    fallback,
                    _media_out(media_map, p.cover_media_id),
                    _dedup_by_locale(highlights_map.get(p.id, []), chain),
                )
            )
        )

    return ProductListResponse(items=items, total=total, limit=limit, offset=offset)


async def get_detail_for_locale(
    session: AsyncSession, slug: str, locale: str
) -> ProductDetail | None:
    chain = locale_chain(locale)

    product = await repo.get_by_slug(session, slug)
    if product is None:
        return None

    translations = await repo.get_translations(session, [product.id], chain)
    tr, loc, fallback = _pick_translation(translations, product.id, chain)

    gallery_ids = await repo.get_gallery_ids(session, product.id)
    media_map = await repo.get_media(
        session, [product.cover_media_id, *gallery_ids], chain
    )
    highlights_map = await repo.get_highlights(session, [product.id], chain)

    # ── Itinéraire : une entrée par étape, langue prioritaire ──────────
    seen_items: set[UUID] = set()
    itinerary: list[ItineraryItemOut] = []
    for item, item_tr in await repo.get_itinerary(session, product.id, chain):
        if item.id in seen_items:
            continue
        seen_items.add(item.id)
        itinerary.append(
            ItineraryItemOut(
                day_number=item.day_number,
                time_label=item.time_label,
                title=item_tr.title,
                description=item_tr.description,
                is_optional=item.is_optional,
            )
        )

    # ── Prestations : incluses ET non incluses ─────────────────────────
    seen_incl: set[str] = set()
    inclusions: list[InclusionOut] = []
    for link, incl, incl_tr in await repo.get_inclusions(session, product.id, chain):
        if incl.code in seen_incl:
            continue
        seen_incl.add(incl.code)
        inclusions.append(
            InclusionOut(
                code=incl.code,
                label=incl_tr.label,
                icon=incl.icon,
                is_included=link.is_included,
                detail=incl_tr.detail,
            )
        )

    seen_pack: set[str] = set()
    packing: list[LabelOut] = []
    for pack, pack_tr in await repo.get_packing_items(session, product.id, chain):
        if pack.code in seen_pack:
            continue
        seen_pack.add(pack.code)
        packing.append(LabelOut(code=pack.code, label=pack_tr.label, icon=pack.icon))

    # ── FAQ : uniquement dans la langue effective, pas de mélange ──────
    all_faqs = await repo.get_faqs(session, product.id, chain)
    faq_locale = next((l for l in chain if any(f.locale == l for f in all_faqs)), None)
    faqs = [
        FaqOut(question=f.question, answer=f.answer)
        for f in all_faqs
        if f.locale == faq_locale
    ]

    tiers = [
        PriceTierOut(
            label_code=t.label_code,
            price=t.price,
            min_pax=t.min_pax,
            max_pax=t.max_pax,
            is_private=t.is_private,
        )
        for t in await repo.get_price_tiers(session, product.id)
    ]

    gallery = [m for mid in gallery_ids if (m := _media_out(media_map, mid))]

    return ProductDetail(
        **_base_item(
            product,
            tr,
            loc,
            fallback,
            _media_out(media_map, product.cover_media_id),
            _dedup_by_locale(highlights_map.get(product.id, []), chain),
        ),
        description=tr.description if tr else None,
        practical_info=tr.practical_info if tr else None,
        meta_title=tr.meta_title if tr else None,
        meta_description=tr.meta_description if tr else None,
        itinerary=itinerary,
        inclusions=inclusions,
        packing_items=packing,
        faqs=faqs,
        price_tiers=tiers,
        gallery=gallery,
        departure_months=await repo.get_departure_months(session, product.id),
        related_slugs=await repo.get_related_slugs(session, product.id),
    )
