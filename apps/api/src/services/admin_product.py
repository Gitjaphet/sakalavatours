"""Écriture des produits depuis le back-office.

Deux principes structurants :

1. TOUT OU RIEN. Créer un produit touche 9 tables. Si l'écriture de
   l'itinéraire échoue, le produit ne doit pas exister à moitié. Aucune
   fonction ne commit en cours de route : le routeur commit une seule
   fois, à la fin.

2. LES LISTES REMPLACENT. Envoyer `highlight_codes` remplace intégralement
   les points forts existants. Pas de fusion implicite : « ajouter » et
   « remplacer » ne doivent pas se ressembler côté API.
"""

from uuid import UUID

from sqlmodel import delete, select
from sqlmodel.ext.asyncio.session import AsyncSession

from src.core.config import settings
from src.models.enums import ContentStatus
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
    ProductTranslation,
)
from src.models.system import AdminUser
from src.models.taxonomy import Highlight, Inclusion, PackingItem
from src.repositories import product as repo
from src.schemas.admin_product import (
    FaqOut,
    InclusionLinkIn,
    ItineraryItemAdminOut,
    ItineraryItemIn,
    ItineraryTranslationOut,
    PriceTierOut,
    ProductAdminDetail,
    ProductCreate,
    ProductTranslationOut,
    ProductUpdate,
)
from src.services import slug as slug_service

ENTITY = "product"

class ProductError(Exception):
    """Erreur métier. Le routeur la traduit en 400."""


async def _codes_to_ids(session: AsyncSession, model, codes: list[str]) -> dict[str, UUID]:
    """Résout des codes de taxonomie en identifiants.

    Lève si un code est inconnu : mieux vaut refuser la requête que de
    créer silencieusement un produit sans ses points forts.
    """
    if not codes:
        return {}

    rows = (await session.exec(select(model).where(model.code.in_(codes)))).all()
    found = {r.code: r.id for r in rows}

    missing = set(codes) - set(found)
    if missing:
        raise ProductError(f"Codes inconnus : {', '.join(sorted(missing))}")

    return found


async def _set_translations(session, product_id: UUID, translations) -> None:
    await session.exec(
        delete(ProductTranslation).where(ProductTranslation.product_id == product_id)
    )
    for t in translations:
        data = t if isinstance(t, dict) else t.model_dump()
        session.add(ProductTranslation(product_id=product_id, **data))


async def _set_highlights(session, product_id: UUID, codes: list[str]) -> None:
    await session.exec(
        delete(ProductHighlight).where(ProductHighlight.product_id == product_id)
    )
    ids = await _codes_to_ids(session, Highlight, codes)
    for order, code in enumerate(codes):
        session.add(
            ProductHighlight(
                product_id=product_id, highlight_id=ids[code], sort_order=order
            )
        )


async def _set_inclusions(session, product_id: UUID, links) -> None:
    await session.exec(
        delete(ProductInclusion).where(ProductInclusion.product_id == product_id)
    )
    normalized = [
        l if isinstance(l, dict) else l.model_dump() for l in links
    ]
    ids = await _codes_to_ids(session, Inclusion, [l["code"] for l in normalized])
    for link in normalized:
        session.add(
            ProductInclusion(
                product_id=product_id,
                inclusion_id=ids[link["code"]],
                is_included=link.get("is_included", True),
                sort_order=link.get("sort_order", 0),
            )
        )


async def _set_packing(session, product_id: UUID, codes: list[str]) -> None:
    await session.exec(
        delete(ProductPackingItem).where(ProductPackingItem.product_id == product_id)
    )
    ids = await _codes_to_ids(session, PackingItem, codes)
    for order, code in enumerate(codes):
        session.add(
            ProductPackingItem(
                product_id=product_id, packing_item_id=ids[code], sort_order=order
            )
        )


async def _set_months(session, product_id: UUID, months: list[int]) -> None:
    await session.exec(
        delete(ProductDepartureMonth).where(
            ProductDepartureMonth.product_id == product_id
        )
    )
    for m in sorted(set(months)):
        session.add(ProductDepartureMonth(product_id=product_id, month=m))


async def _set_gallery(session, product_id: UUID, media_ids: list[UUID]) -> None:
    await session.exec(delete(ProductMedia).where(ProductMedia.product_id == product_id))
    for order, mid in enumerate(dict.fromkeys(media_ids)):
        session.add(ProductMedia(product_id=product_id, media_id=mid, sort_order=order))


async def _set_itinerary(session, product_id: UUID, items) -> None:
    """Supprime puis recrée les étapes.

    Les traductions partent en cascade grâce au ondelete="CASCADE" de la
    clé étrangère — d'où l'importance de l'avoir déclaré au modèle.

    `items` peut être une liste d'objets ItineraryItemIn (venant de
    create(), qui passe payload directement) OU une liste de dicts
    (venant de update(), qui passe par payload.model_dump() plus haut
    dans la pile). On normalise en objets pour ne dépendre que d'une
    seule forme d'accès.
    """
    old = (
        await session.exec(
            select(ProductItineraryItem).where(
                ProductItineraryItem.product_id == product_id
            )
        )
    ).all()
    for item in old:
        await session.exec(
            delete(ProductItineraryTranslation).where(
                ProductItineraryTranslation.item_id == item.id
            )
        )
        await session.delete(item)
    await session.flush()

    for raw in items:
        item_in = raw if isinstance(raw, ItineraryItemIn) else ItineraryItemIn(**raw)
        item = ProductItineraryItem(
            product_id=product_id,
            day_number=item_in.day_number,
            time_label=item_in.time_label,
            sort_order=item_in.sort_order,
            is_optional=item_in.is_optional,
            media_id=item_in.media_id,
            hotel_name=item_in.hotel_name,
            distance_km=item_in.distance_km,
        )
        session.add(item)
        await session.flush()
        for tr in item_in.translations:
            session.add(
                ProductItineraryTranslation(item_id=item.id, **tr.model_dump())
            )


async def _set_price_tiers(session, product_id: UUID, tiers) -> None:
    await session.exec(
        delete(ProductPriceTier).where(ProductPriceTier.product_id == product_id)
    )
    for t in tiers:
        data = t if isinstance(t, dict) else t.model_dump()
        session.add(ProductPriceTier(product_id=product_id, **data))


async def _set_faqs(session, product_id: UUID, faqs) -> None:
    await session.exec(delete(ProductFaq).where(ProductFaq.product_id == product_id))
    for f in faqs:
        data = f if isinstance(f, dict) else f.model_dump()
        session.add(ProductFaq(product_id=product_id, **data))


async def get_admin_detail(session: AsyncSession, product: Product) -> ProductAdminDetail:
    """Fiche complète pour l'édition : toutes les langues, sans repli.

    Contrairement à read_service.get_detail_for_locale, on ne résout rien
    ici — chaque traduction existante est renvoyée telle quelle, groupée
    par entité. C'est au frontend de décider quoi en faire (onglets).
    """
    locales = settings.SUPPORTED_LOCALES

    translations = await repo.get_translations(session, [product.id], locales)
    translations_out = [
        ProductTranslationOut.model_validate(tr)
        for (pid, _loc), tr in translations.items()
        if pid == product.id
    ]

    itinerary_rows = await repo.get_itinerary(session, product.id, locales)
    items_map: dict[UUID, ItineraryItemAdminOut] = {}
    for item, item_tr in itinerary_rows:
        if item.id not in items_map:
            items_map[item.id] = ItineraryItemAdminOut(
                id=item.id,
                day_number=item.day_number,
                time_label=item.time_label,
                sort_order=item.sort_order,
                is_optional=item.is_optional,
                media_id=item.media_id,
                hotel_name=item.hotel_name,
                distance_km=item.distance_km,
                translations=[],
            )
        items_map[item.id].translations.append(
            ItineraryTranslationOut.model_validate(item_tr)
        )
    itinerary_out = sorted(
        items_map.values(), key=lambda i: (i.day_number, i.sort_order)
    )

    faqs = await repo.get_faqs(session, product.id, locales)
    faqs_out = [FaqOut.model_validate(f) for f in faqs]

    tiers = await repo.get_price_tiers(session, product.id)
    tiers_out = [PriceTierOut.model_validate(t) for t in tiers]

    # ── Codes de taxonomie : les tables de liaison ne portent que des UUID ──
    highlight_rows = await repo.get_highlights(session, [product.id], locales)
    highlight_codes = sorted({code for code, *_ in highlight_rows.get(product.id, [])})

    inclusion_rows = await repo.get_inclusions(session, product.id, locales)
    seen_incl: dict[str, tuple[bool, int]] = {}
    for link, incl, _tr in inclusion_rows:
        seen_incl[incl.code] = (link.is_included, link.sort_order)
    inclusions_out = [
        InclusionLinkIn(code=code, is_included=is_incl, sort_order=order)
        for code, (is_incl, order) in sorted(seen_incl.items(), key=lambda kv: kv[1][1])
    ]

    packing_rows = await repo.get_packing_items(session, product.id, locales)
    packing_codes = sorted({pack.code for pack, _tr in packing_rows})

    gallery_ids = await repo.get_gallery_ids(session, product.id)
    departure_months = await repo.get_departure_months(session, product.id)

    return ProductAdminDetail(
        id=product.id,
        slug=product.slug,
        product_type=product.product_type,
        product_format=product.product_format,
        difficulty=product.difficulty,
        status=product.status,
        is_published=product.is_published,
        duration_days=product.duration_days,
        duration_nights=product.duration_nights,
        duration_hours=product.duration_hours,
        departure_time=product.departure_time,
        return_time=product.return_time,
        travel_minutes=product.travel_minutes,
        transport=product.transport,
        group_min=product.group_min,
        group_max=product.group_max,
        hotel_pickup=product.hotel_pickup,
        min_age=product.min_age,
        price_from=product.price_from,
        currency=product.currency,
        deposit_percent=product.deposit_percent,
        destination_id=product.destination_id,
        cover_media_id=product.cover_media_id,
        is_featured=product.is_featured,
        sort_order=product.sort_order,
        is_indexable=product.is_indexable,
        sitemap_priority=product.sitemap_priority,
        translations=translations_out,
        highlight_codes=highlight_codes,
        inclusions=inclusions_out,
        packing_codes=packing_codes,
        departure_months=departure_months,
        gallery_media_ids=gallery_ids,
        itinerary=itinerary_out,
        price_tiers=tiers_out,
        faqs=faqs_out,
    )


async def create(
    session: AsyncSession, payload: ProductCreate, actor: AdminUser
) -> Product:
    # Slug dérivé du titre français, ou de la première traduction fournie
    if payload.slug:
        base = slug_service.slugify(payload.slug)
    else:
        fr = next((t for t in payload.translations if t.locale == "fr"), None)
        base = slug_service.slugify((fr or payload.translations[0]).title)

    if not base:
        raise ProductError("Impossible de dériver un slug valide du titre")

    final_slug = await slug_service.ensure_unique(session, Product, base)

    data = payload.model_dump(
        exclude={
            "slug", "translations", "highlight_codes", "inclusions",
            "packing_codes", "departure_months", "gallery_media_ids",
            "itinerary", "price_tiers", "faqs",
        }
    )
    product = Product(slug=final_slug, **data)
    product.is_published = payload.status == ContentStatus.PUBLISHED

    session.add(product)
    await session.flush()

    await _set_translations(session, product.id, payload.translations)
    await _set_highlights(session, product.id, payload.highlight_codes)
    await _set_inclusions(session, product.id, payload.inclusions)
    await _set_packing(session, product.id, payload.packing_codes)
    await _set_months(session, product.id, payload.departure_months)
    await _set_gallery(session, product.id, payload.gallery_media_ids)
    await _set_itinerary(session, product.id, payload.itinerary)
    await _set_price_tiers(session, product.id, payload.price_tiers)
    await _set_faqs(session, product.id, payload.faqs)

    return product


async def update(
    session: AsyncSession, product: Product, payload: ProductUpdate, actor: AdminUser
) -> Product:
    changes = payload.model_dump(exclude_unset=True)

    # ── Slug : jamais modifié sans enregistrer l'ancien ────────────────
    if "slug" in changes and changes["slug"]:
        new_slug = await slug_service.ensure_unique(
            session, Product, slug_service.slugify(changes["slug"]), exclude_id=product.id
        )
        if new_slug != product.slug:
            await slug_service.record_change(
                session,
                entity_type=ENTITY,
                entity_id=product.id,
                old_slug=product.slug,
                new_slug=new_slug,
                changed_by=actor.id,
            )
            product.slug = new_slug
    changes.pop("slug", None)

    collections = {
        "translations": _set_translations,
        "highlight_codes": _set_highlights,
        "inclusions": _set_inclusions,
        "packing_codes": _set_packing,
        "departure_months": _set_months,
        "gallery_media_ids": _set_gallery,
        "itinerary": _set_itinerary,
        "price_tiers": _set_price_tiers,
        "faqs": _set_faqs,
    }

    for field, setter in collections.items():
        if field in changes:
            value = changes.pop(field)
            if value is not None:
                await setter(session, product.id, value)

    for field, value in changes.items():
        setattr(product, field, value)

    # is_published reste cohérent avec le statut, sauf ordre explicite
    if "status" in changes and "is_published" not in changes:
        product.is_published = product.status == ContentStatus.PUBLISHED

    session.add(product)
    return product
