"""Routes d'administration des produits.

Le contrôle des rôles est posé au niveau du ROUTEUR, pas de chaque
endpoint : impossible d'oublier une route en l'ajoutant plus tard.

- lecture       : EDITOR et au-dessus
- écriture      : EDITOR et au-dessus
- suppression   : ADMIN uniquement
"""

from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlmodel import select

from src.api.deps import CurrentUser, SessionDep, require_role
from src.models.enums import AdminRole, AuditAction, ContentStatus, ProductType
from src.models.product import Product, ProductTranslation
from src.schemas.admin_product import (
    ProductAdminDetail,
    ProductAdminListItem,
    ProductAdminListResponse,
    ProductCreate,
    ProductUpdate,
)
from src.schemas.auth import MessageResponse
from src.schemas.product import ProductDetail
from src.services import admin_product as service
from src.services import audit
from src.services import product as read_service
from src.services.admin_product import ProductError
from src.services.revalidation import revalidate_product

router = APIRouter(
    prefix="/products",
    tags=["admin · produits"],
    dependencies=[Depends(require_role(AdminRole.EDITOR))],
)

ENTITY = "product"


def _client_ip(request: Request) -> str | None:
    """IP réelle derrière Traefik.

    X-Forwarded-For contient la chaîne des proxys ; le premier élément est
    le client d'origine.
    """
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else None


async def _get_or_404(session, product_id: UUID) -> Product:
    stmt = select(Product).where(
        Product.id == product_id, Product.deleted_at.is_(None)
    )
    product = (await session.exec(stmt)).first()
    if product is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Produit introuvable"
        )
    return product


@router.get("", response_model=ProductAdminListResponse)
async def list_products(
    session: SessionDep,
    product_type: Annotated[ProductType | None, Query()] = None,
    content_status: Annotated[ContentStatus | None, Query(alias="status")] = None,
    search: Annotated[str | None, Query(max_length=100)] = None,
    limit: Annotated[int, Query(ge=1, le=100)] = 50,
    offset: Annotated[int, Query(ge=0)] = 0,
) -> ProductAdminListResponse:
    """Liste d'administration : inclut les brouillons et les archives."""
    from sqlalchemy import func

    stmt = select(Product).where(Product.deleted_at.is_(None))
    count_stmt = (
        select(func.count()).select_from(Product).where(Product.deleted_at.is_(None))
    )

    if product_type:
        stmt = stmt.where(Product.product_type == product_type)
        count_stmt = count_stmt.where(Product.product_type == product_type)

    if content_status:
        stmt = stmt.where(Product.status == content_status)
        count_stmt = count_stmt.where(Product.status == content_status)

    if search:
        pattern = f"%{search.lower()}%"
        stmt = stmt.where(Product.slug.ilike(pattern))
        count_stmt = count_stmt.where(Product.slug.ilike(pattern))

    stmt = stmt.order_by(Product.sort_order, Product.created_at.desc())
    stmt = stmt.limit(limit).offset(offset)

    products = list((await session.exec(stmt)).all())
    total = (await session.exec(count_stmt)).one()

    # Titres et langues traduites, en une seule requête
    items: list[ProductAdminListItem] = []
    if products:
        ids = [p.id for p in products]
        trs = (
            await session.exec(
                select(ProductTranslation).where(ProductTranslation.product_id.in_(ids))
            )
        ).all()

        by_product: dict[UUID, list[ProductTranslation]] = {}
        for tr in trs:
            by_product.setdefault(tr.product_id, []).append(tr)

        for p in products:
            product_trs = by_product.get(p.id, [])
            fr = next((t for t in product_trs if t.locale == "fr"), None)
            first = fr or (product_trs[0] if product_trs else None)

            item = ProductAdminListItem.model_validate(p)
            item.title = first.title if first else p.slug
            item.translated_locales = sorted(t.locale for t in product_trs)
            items.append(item)

    return ProductAdminListResponse(
        items=items, total=total, limit=limit, offset=offset
    )


@router.post("", response_model=ProductDetail, status_code=status.HTTP_201_CREATED)
async def create_product(
    payload: ProductCreate,
    session: SessionDep,
    user: CurrentUser,
    request: Request,
) -> ProductDetail:
    """Crée un produit avec tout son contenu, en une transaction."""
    try:
        product = await service.create(session, payload, user)
    except ProductError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail=str(e)
        ) from None

    await audit.log(
        session,
        actor=user,
        action=AuditAction.CREATE,
        entity_type=ENTITY,
        entity_id=product.id,
        entity_label=product.slug,
        after=product,
        ip_address=_client_ip(request),
    )
    await session.commit()

    await revalidate_product(product.slug)

    detail = await read_service.get_detail_for_locale(
        session, product.slug, "fr", published_only=False
    )
    return detail  # type: ignore[return-value]


@router.get("/{product_id}", response_model=ProductDetail)
async def get_product(
    product_id: UUID,
    session: SessionDep,
    locale: Annotated[str, Query(max_length=5)] = "fr",
) -> ProductDetail:
    product = await _get_or_404(session, product_id)
    detail = await read_service.get_detail_for_locale(
        session, product.slug, locale, published_only=False
    )

    if detail is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Produit introuvable",
        )
    return detail

@router.get("/{product_id}/translations", response_model=ProductAdminDetail)
async def get_product_translations(
    product_id: UUID,
    session: SessionDep,
) -> ProductAdminDetail:
    """Fiche complète pour l'édition : toutes les langues, sans repli."""
    product = await _get_or_404(session, product_id)
    return await service.get_admin_detail(session, product)


@router.patch("/{product_id}", response_model=ProductDetail)
async def update_product(
    product_id: UUID,
    payload: ProductUpdate,
    session: SessionDep,
    user: CurrentUser,
    request: Request,
) -> ProductDetail:
    """Modification partielle.

    Les champs absents de la requête restent inchangés. Les listes
    présentes REMPLACENT intégralement l'existant.
    """
    product = await _get_or_404(session, product_id)

    # Copie AVANT modification, pour le journal d'audit
    before = Product.model_validate(product.model_dump())

    try:
        product = await service.update(session, product, payload, user)
    except ProductError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail=str(e)
        ) from None

    await audit.log(
        session,
        actor=user,
        action=AuditAction.UPDATE,
        entity_type=ENTITY,
        entity_id=product.id,
        entity_label=product.slug,
        before=before,
        after=product,
        ip_address=_client_ip(request),
    )
    await session.commit()
    await session.refresh(product)

    if before.slug != product.slug:
        await revalidate_product(before.slug)
    await revalidate_product(product.slug)

    detail = await read_service.get_detail_for_locale(
        session, product.slug, "fr", published_only=False
    )
    return detail  # type: ignore[return-value]


@router.delete(
    "/{product_id}",
    response_model=MessageResponse,
    dependencies=[Depends(require_role(AdminRole.ADMIN))],
)
async def delete_product(
    product_id: UUID,
    session: SessionDep,
    user: CurrentUser,
    request: Request,
) -> MessageResponse:
    """Suppression LOGIQUE.

    ⚠ Le produit disparaît du site mais son slug reste réservé. Une
    suppression physique casserait une URL indexée par Google et
    transformerait les liens entrants en 404.
    """
    from datetime import UTC, datetime

    product = await _get_or_404(session, product_id)

    product.deleted_at = datetime.now(UTC)
    product.is_published = False
    product.status = ContentStatus.ARCHIVED
    session.add(product)

    await audit.log(
        session,
        actor=user,
        action=AuditAction.DELETE,
        entity_type=ENTITY,
        entity_id=product.id,
        entity_label=product.slug,
        before=product,
        ip_address=_client_ip(request),
    )
    await session.commit()

    await revalidate_product(product.slug)

    return MessageResponse(message=f"Produit « {product.slug} » archivé")
