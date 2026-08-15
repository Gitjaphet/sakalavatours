"""Gestion des identifiants d'URL.

⚠ PIÈCE CRITIQUE POUR LE RÉFÉRENCEMENT.

Quand un slug change depuis l'admin, l'ancien DOIT être conservé pour
servir une redirection 301. Sans ça, un simple renommage transforme une
page indexée par Google en 404, et tous les liens entrants sont perdus.

Les slugs des circuits viennent de l'ancien site et portent déjà des liens
existants : ils ne doivent jamais devenir des impasses.
"""

import re
import unicodedata
from uuid import UUID

from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from src.models.system import SlugHistory


def slugify(text: str, max_length: int = 200) -> str:
    """Transforme un titre en slug.

    Utilisé uniquement comme SUGGESTION à la création. Un slug existant
    n'est jamais régénéré automatiquement depuis le titre — c'est
    précisément ce qui casserait les URL indexées.
    """
    # Décompose les accents puis retire les diacritiques : « Forêt » → « Foret »
    normalized = unicodedata.normalize("NFKD", text)
    ascii_text = normalized.encode("ascii", "ignore").decode("ascii").lower()

    cleaned = re.sub(r"[^a-z0-9]+", "-", ascii_text).strip("-")
    cleaned = re.sub(r"-{2,}", "-", cleaned)

    return cleaned[:max_length].rstrip("-")


async def ensure_unique(
    session: AsyncSession, model, candidate: str, exclude_id: UUID | None = None
) -> str:
    """Ajoute un suffixe numérique si le slug est déjà pris.

    « nosy-iranja » → « nosy-iranja-2 » → « nosy-iranja-3 »…
    """
    base = candidate
    suffix = 1

    while True:
        stmt = select(model).where(model.slug == candidate)
        if exclude_id is not None:
            stmt = stmt.where(model.id != exclude_id)

        if (await session.exec(stmt)).first() is None:
            return candidate

        suffix += 1
        candidate = f"{base}-{suffix}"


async def record_change(
    session: AsyncSession,
    *,
    entity_type: str,
    entity_id: UUID,
    old_slug: str,
    new_slug: str,
    changed_by: UUID | None = None,
) -> None:
    """Enregistre l'ancien slug pour la redirection 301.

    À appeler AVANT le commit du changement, dans la même transaction :
    si l'enregistrement échoue, le renommage doit échouer aussi.
    """
    if old_slug == new_slug:
        return

    session.add(
        SlugHistory(
            entity_type=entity_type,
            entity_id=entity_id,
            old_slug=old_slug,
            new_slug=new_slug,
            changed_by=changed_by,
        )
    )

    # Les anciennes entrées pointant vers l'ancien slug doivent suivre :
    # sans ça, une double modification créerait une chaîne de redirections
    # (A → B → C), pénalisée par Google et lente pour le visiteur.
    stmt = select(SlugHistory).where(
        SlugHistory.entity_type == entity_type,
        SlugHistory.entity_id == entity_id,
        SlugHistory.new_slug == old_slug,
    )
    for row in (await session.exec(stmt)).all():
        row.new_slug = new_slug
        session.add(row)


async def resolve(
    session: AsyncSession, entity_type: str, old_slug: str
) -> str | None:
    """Retourne le slug actuel d'une ancienne URL, ou None.

    Consommé par la route publique de redirection.
    """
    stmt = select(SlugHistory).where(
        SlugHistory.entity_type == entity_type,
        SlugHistory.old_slug == old_slug,
    )
    row = (await session.exec(stmt)).first()

    if row is None:
        return None

    row.hit_count += 1
    from datetime import UTC, datetime

    row.last_hit_at = datetime.now(UTC)
    session.add(row)

    return row.new_slug
