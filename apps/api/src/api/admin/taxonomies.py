"""Routes d'administration des taxonomies partagées.

Un seul routeur pour les trois taxonomies : le type est un segment d'URL
(`highlights`, `inclusions`, `packing-items`), résolu en couple de modèles
par le service.

- lecture     : EDITOR et au-dessus
- écriture    : EDITOR et au-dessus
- suppression : ADMIN uniquement
"""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Request, status

from src.api.deps import CurrentUser, SessionDep, require_role
from src.models.enums import AdminRole, AuditAction
from src.schemas.admin_taxonomy import (
    TaxonomyCreate,
    TaxonomyListResponse,
    TaxonomyOut,
    TaxonomyUpdate,
)
from src.schemas.auth import MessageResponse
from src.services import admin_taxonomy as service
from src.services import audit
from src.services.admin_taxonomy import TaxonomyError

router = APIRouter(
    prefix="/taxonomies",
    tags=["admin · taxonomies"],
    dependencies=[Depends(require_role(AdminRole.EDITOR))],
)


def _client_ip(request: Request) -> str | None:
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else None


def _bad_request(exc: TaxonomyError) -> HTTPException:
    return HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))


@router.get("/{taxonomy_type}", response_model=TaxonomyListResponse)
async def list_taxonomy(
    taxonomy_type: str,
    session: SessionDep,
) -> TaxonomyListResponse:
    """Tous les éléments d'une taxonomie, avec leurs traductions."""
    try:
        items = await service.list_items(session, taxonomy_type)
    except TaxonomyError as e:
        raise _bad_request(e) from None

    return TaxonomyListResponse(items=items, total=len(items))


@router.post(
    "/{taxonomy_type}", response_model=TaxonomyOut, status_code=status.HTTP_201_CREATED
)
async def create_taxonomy_item(
    taxonomy_type: str,
    payload: TaxonomyCreate,
    session: SessionDep,
    user: CurrentUser,
    request: Request,
) -> TaxonomyOut:
    try:
        item = await service.create(session, taxonomy_type, payload)
    except TaxonomyError as e:
        raise _bad_request(e) from None

    await audit.log(
        session,
        actor=user,
        action=AuditAction.CREATE,
        entity_type=taxonomy_type,
        entity_id=item.id,
        entity_label=item.code,
        after=item,
        ip_address=_client_ip(request),
    )
    await session.commit()

    items = await service.list_items(session, taxonomy_type)
    created = next((i for i in items if i["id"] == item.id), None)
    if created is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Élément créé mais introuvable",
        )
    return TaxonomyOut(**created)


@router.patch("/{taxonomy_type}/{item_id}", response_model=TaxonomyOut)
async def update_taxonomy_item(
    taxonomy_type: str,
    item_id: UUID,
    payload: TaxonomyUpdate,
    session: SessionDep,
    user: CurrentUser,
    request: Request,
) -> TaxonomyOut:
    try:
        item = await service.get_or_404(session, taxonomy_type, item_id)
    except TaxonomyError as e:
        raise _bad_request(e) from None

    if item is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Élément introuvable"
        )

    try:
        item = await service.update(session, taxonomy_type, item, payload)
    except TaxonomyError as e:
        raise _bad_request(e) from None

    await audit.log(
        session,
        actor=user,
        action=AuditAction.UPDATE,
        entity_type=taxonomy_type,
        entity_id=item.id,
        entity_label=item.code,
        after=item,
        ip_address=_client_ip(request),
    )
    await session.commit()

    items = await service.list_items(session, taxonomy_type)
    updated = next((i for i in items if i["id"] == item_id), None)
    if updated is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Élément introuvable"
        )
    return TaxonomyOut(**updated)


@router.delete(
    "/{taxonomy_type}/{item_id}",
    response_model=MessageResponse,
    dependencies=[Depends(require_role(AdminRole.ADMIN))],
)
async def delete_taxonomy_item(
    taxonomy_type: str,
    item_id: UUID,
    session: SessionDep,
    user: CurrentUser,
    request: Request,
) -> MessageResponse:
    """Suppression LOGIQUE.

    ⚠ Les produits qui référencent ce code ne sont pas nettoyés : la ligne
    cesse simplement d'apparaître sur leur fiche.
    """
    try:
        item = await service.get_or_404(session, taxonomy_type, item_id)
    except TaxonomyError as e:
        raise _bad_request(e) from None

    if item is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Élément introuvable"
        )

    await service.soft_delete(session, item)

    await audit.log(
        session,
        actor=user,
        action=AuditAction.DELETE,
        entity_type=taxonomy_type,
        entity_id=item.id,
        entity_label=item.code,
        before=item,
        ip_address=_client_ip(request),
    )
    await session.commit()

    return MessageResponse(message=f"Élément « {item.code} » supprimé")