"""Gestion des taxonomies partagées depuis le back-office.

Un seul jeu de fonctions pour les trois taxonomies : elles partagent
exactement le même patron (parent + table de traduction), seul le couple
de modèles change. Le mapping TAXONOMY_MODELS fait la résolution.

Même principe que pour les produits : aucune fonction ne commit, c'est le
routeur qui commit une fois à la fin.
"""

from uuid import UUID

from sqlmodel import delete, select
from sqlmodel.ext.asyncio.session import AsyncSession

from src.models.taxonomy import (
    Highlight,
    HighlightTranslation,
    Inclusion,
    InclusionTranslation,
    PackingItem,
    PackingItemTranslation,
)
from src.schemas.admin_taxonomy import TaxonomyCreate, TaxonomyUpdate

# Type d'URL → (modèle parent, modèle de traduction, nom de la clé étrangère)
TAXONOMY_MODELS = {
    "highlights": (Highlight, HighlightTranslation, "highlight_id"),
    "inclusions": (Inclusion, InclusionTranslation, "inclusion_id"),
    "packing-items": (PackingItem, PackingItemTranslation, "packing_item_id"),
}

# `detail` n'existe que sur les prestations : on le filtre ailleurs pour
# éviter une erreur SQLModel sur un champ inexistant.
SUPPORTS_DETAIL = {"inclusions"}


class TaxonomyError(Exception):
    """Erreur métier. Le routeur la traduit en 400."""


def resolve(taxonomy_type: str):
    """Retourne (Parent, Translation, fk_name) ou lève si le type est inconnu."""
    entry = TAXONOMY_MODELS.get(taxonomy_type)
    if entry is None:
        raise TaxonomyError(
            f"Type inconnu : {taxonomy_type}. "
            f"Attendu : {', '.join(sorted(TAXONOMY_MODELS))}"
        )
    return entry


async def list_items(session: AsyncSession, taxonomy_type: str) -> list[dict]:
    """Tous les éléments non supprimés, avec leurs traductions."""
    Parent, Translation, fk = resolve(taxonomy_type)

    parents = (
        await session.exec(
            select(Parent)
            .where(Parent.deleted_at.is_(None))
            .order_by(Parent.sort_order, Parent.code)
        )
    ).all()

    if not parents:
        return []

    ids = [p.id for p in parents]
    translations = (
        await session.exec(
            select(Translation).where(getattr(Translation, fk).in_(ids))
        )
    ).all()

    by_parent: dict[UUID, list] = {}
    for tr in translations:
        by_parent.setdefault(getattr(tr, fk), []).append(tr)

    return [
        {
            "id": p.id,
            "code": p.code,
            "icon": p.icon,
            "sort_order": p.sort_order,
            "translations": [
                {
                    "id": tr.id,
                    "locale": tr.locale,
                    "label": tr.label,
                    "detail": getattr(tr, "detail", None),
                }
                for tr in by_parent.get(p.id, [])
            ],
        }
        for p in parents
    ]


async def get_or_404(session: AsyncSession, taxonomy_type: str, item_id: UUID):
    """Retourne l'élément parent, ou None s'il n'existe pas / est supprimé."""
    Parent, _, _ = resolve(taxonomy_type)
    stmt = select(Parent).where(Parent.id == item_id, Parent.deleted_at.is_(None))
    return (await session.exec(stmt)).first()


async def _set_translations(
    session: AsyncSession, taxonomy_type: str, item_id: UUID, translations
) -> None:
    """Remplace intégralement les traductions d'un élément."""
    _, Translation, fk = resolve(taxonomy_type)

    await session.exec(delete(Translation).where(getattr(Translation, fk) == item_id))

    for t in translations:
        data = t if isinstance(t, dict) else t.model_dump()
        payload = {
            "locale": data["locale"],
            "label": data["label"],
        }
        if taxonomy_type in SUPPORTS_DETAIL:
            payload["detail"] = data.get("detail")
        session.add(Translation(**{fk: item_id}, **payload))


async def _check_code_free(
    session: AsyncSession, taxonomy_type: str, code: str, exclude_id: UUID | None = None
) -> None:
    """Le code doit rester unique — la contrainte SQL le garantit, mais on
    lève une erreur métier lisible plutôt qu'un 500 sur violation d'index."""
    Parent, _, _ = resolve(taxonomy_type)
    stmt = select(Parent).where(Parent.code == code)
    if exclude_id is not None:
        stmt = stmt.where(Parent.id != exclude_id)
    existing = (await session.exec(stmt)).first()
    if existing is not None:
        raise TaxonomyError(f"Le code « {code} » est déjà utilisé")


async def create(session: AsyncSession, taxonomy_type: str, payload: TaxonomyCreate):
    Parent, _, _ = resolve(taxonomy_type)

    await _check_code_free(session, taxonomy_type, payload.code)

    item = Parent(
        code=payload.code,
        icon=payload.icon,
        sort_order=payload.sort_order,
    )
    session.add(item)
    await session.flush()

    await _set_translations(session, taxonomy_type, item.id, payload.translations)
    return item


async def update(
    session: AsyncSession, taxonomy_type: str, item, payload: TaxonomyUpdate
):
    changes = payload.model_dump(exclude_unset=True)

    if "code" in changes and changes["code"]:
        await _check_code_free(
            session, taxonomy_type, changes["code"], exclude_id=item.id
        )

    translations = changes.pop("translations", None)
    if translations is not None:
        await _set_translations(session, taxonomy_type, item.id, translations)

    for field, value in changes.items():
        setattr(item, field, value)

    session.add(item)
    return item


async def soft_delete(session: AsyncSession, item) -> None:
    """Suppression LOGIQUE.

    ⚠ Un code supprimé reste référencé par les produits qui l'utilisent
    (product_inclusion et consorts ne sont pas nettoyés) : la fiche produit
    cessera simplement d'afficher cette ligne, sans casser.
    """
    from datetime import UTC, datetime

    item.deleted_at = datetime.now(UTC)
    session.add(item)