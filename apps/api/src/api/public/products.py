"""Routes publiques des produits.

Consommées par Next.js au moment de la génération statique (ISR). Le
visiteur ne les appelle jamais directement : il reçoit du HTML depuis le
CDN Vercel.

Conséquence pratique : ces endpoints sont appelés quelques fois par heure,
pas des milliers de fois par minute. Inutile de les sur-optimiser.
"""

from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, HTTPException, Path, Query, status

from src.api.deps import SessionDep
from src.core.config import settings
from src.models.enums import ProductType
from src.schemas.product import ProductDetail, ProductListResponse
from src.services import product as service

router = APIRouter(prefix="/products", tags=["produits"])

# Le motif est construit depuis la configuration : ajouter une langue dans
# le .env suffit, aucune route à modifier.
LOCALE_PATTERN = "^(" + "|".join(settings.SUPPORTED_LOCALES) + ")$"

LocaleQuery = Annotated[
    str,
    Query(
        pattern=LOCALE_PATTERN,
        description=f"Langue du contenu. Valeurs : {', '.join(settings.SUPPORTED_LOCALES)}",
    ),
]


@router.get("", response_model=ProductListResponse)
async def list_products(
    session: SessionDep,
    locale: LocaleQuery = settings.DEFAULT_LOCALE,
    product_type: Annotated[
        ProductType | None,
        Query(description="circuit ou excursion. Vide = les deux."),
    ] = None,
    destination_id: Annotated[UUID | None, Query()] = None,
    limit: Annotated[int, Query(ge=1, le=100)] = 24,
    offset: Annotated[int, Query(ge=0)] = 0,
) -> ProductListResponse:
    """Liste paginée des produits publiés.

    Ne renvoie que les champs nécessaires à l'affichage d'une carte —
    l'itinéraire, les prestations et la FAQ sont réservés au détail.
    """
    return await service.list_for_locale(
        session,
        locale,
        product_type=product_type,
        destination_id=destination_id,
        limit=limit,
        offset=offset,
    )


@router.get("/slugs", response_model=list[str])
async def list_slugs(session: SessionDep) -> list[str]:
    """Tous les slugs publiés.

    Alimente `generateStaticParams` côté Next : sans cette route, les
    fiches détail resteraient en rendu dynamique et perdraient le
    bénéfice du CDN.
    """
    from sqlmodel import select

    from src.models.enums import ContentStatus
    from src.models.product import Product

    stmt = select(Product.slug).where(
        Product.is_published.is_(True),
        Product.deleted_at.is_(None),
        Product.status == ContentStatus.PUBLISHED,
    )
    return list((await session.exec(stmt)).all())


@router.get("/{slug}", response_model=ProductDetail)
async def get_product(
    session: SessionDep,
    slug: Annotated[str, Path(min_length=1, max_length=200)],
    locale: LocaleQuery = settings.DEFAULT_LOCALE,
) -> ProductDetail:
    """Fiche complète d'un produit.

    404 si le slug n'existe pas OU si le produit n'est pas publié : on ne
    distingue pas les deux cas, pour ne pas révéler l'existence de
    brouillons.
    """
    detail = await service.get_detail_for_locale(session, slug, locale)

    if detail is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Produit introuvable"
        )

    return detail
