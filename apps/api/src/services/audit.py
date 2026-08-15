"""Journal des écritures du back-office.

Chaque modification enregistre l'état avant et après. Sert à comprendre
une régression de contenu, à justifier une décision de modération, et à
retrouver qui a changé quoi quand plusieurs personnes administrent.

Le journal ne se supprime jamais.
"""

import json
from typing import Any
from uuid import UUID

from sqlmodel import SQLModel
from sqlmodel.ext.asyncio.session import AsyncSession

from src.models.enums import AuditAction
from src.models.system import AdminUser, AuditLog

# Champs à ne JAMAIS écrire dans le journal, même en cas de modification.
_REDACTED = {"password_hash", "password", "new_password", "current_password"}


def snapshot(instance: SQLModel | None) -> str | None:
    """Sérialise un modèle en JSON, champs sensibles expurgés."""
    if instance is None:
        return None

    data: dict[str, Any] = {}
    for key, value in instance.model_dump().items():
        if key in _REDACTED:
            data[key] = "***"
        elif isinstance(value, UUID):
            data[key] = str(value)
        else:
            data[key] = value

    return json.dumps(data, default=str, ensure_ascii=False)


async def log(
    session: AsyncSession,
    *,
    actor: AdminUser | None,
    action: AuditAction,
    entity_type: str,
    entity_id: UUID | None = None,
    entity_label: str | None = None,
    before: SQLModel | None = None,
    after: SQLModel | None = None,
    ip_address: str | None = None,
) -> None:
    """Ajoute une entrée au journal.

    N'appelle pas commit : l'entrée fait partie de la même transaction que
    la modification qu'elle décrit. Si l'une échoue, l'autre aussi.
    """
    session.add(
        AuditLog(
            actor_id=actor.id if actor else None,
            # L'email est COPIÉ, pas référencé : il doit survivre à la
            # suppression du compte pour que le journal reste lisible.
            actor_email=actor.email if actor else None,
            action=action,
            entity_type=entity_type,
            entity_id=entity_id,
            entity_label=entity_label,
            changes_before=snapshot(before),
            changes_after=snapshot(after),
            ip_address=ip_address,
        )
    )
