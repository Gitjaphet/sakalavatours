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
from src.schemas.admin_product import ProductCreate, ProductUpdate
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
        session.add(ProductTranslation(product_id=product_id, **t.model_dump()))


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
    ids = await _codes_to_ids(session, Inclusion, [l.code for l in links])
    for link in links:
        session.add(
            ProductInclusion(
                product_id=product_id,
                inclusion_id=ids[link.code],
                is_included=link.is_included,
                sort_order=link.sort_order,
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

    for item_in in items:
        item = ProductItineraryItem(
            product_id=product_id,
            day_number=item_in.day_number,
            time_label=item_in.time_label,
            sort_order=item_in.sort_order,
            is_optional=item_in.is_optional,
            media_id=item_in.media_id,
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
        session.add(ProductPriceTier(product_id=product_id, **t.model_dump()))


async def _set_faqs(session, product_id: UUID, faqs) -> None:
    await session.exec(delete(ProductFaq).where(ProductFaq.product_id == product_id))
    for f in faqs:
        session.add(ProductFaq(product_id=product_id, **f.model_dump()))


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
