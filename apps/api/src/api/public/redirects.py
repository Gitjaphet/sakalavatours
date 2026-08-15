"""Résolution des anciennes URL.

⚠ PIÈCE FINALE DE LA PROTECTION SEO.

On remplit `slug_history` depuis le début, mais rien ne l'exploitait
jusqu'ici : un slug renommé renvoyait encore un 404. Cette route ferme la
boucle.

Côté Next.js, l'appel se fait dans un `not-found.tsx` ou dans le middleware
avant de rendre la page 404 : si l'API retourne une cible, on émet une 301
permanente au lieu du 404.
"""

from typing import Annotated

from fastapi import APIRouter, Query
from pydantic import BaseModel
from sqlmodel import select

from src.api.deps import SessionDep
from src.models.system import Redirect
from src.services import slug as slug_service

router = APIRouter(prefix="/redirects", tags=["redirections"])


class RedirectResolution(BaseModel):
    """Cible d'une redirection.

    `found=False` signifie qu'un vrai 404 doit être servi — ne jamais
    inventer une redirection vers l'accueil, Google considère ça comme un
    « soft 404 » et le pénalise.
    """

    found: bool = False
    to_path: str | None = None
    status_code: int = 301


@router.get("/resolve", response_model=RedirectResolution)
async def resolve_redirect(
    session: SessionDep,
    path: Annotated[
        str,
        Query(
            max_length=500,
            description="Chemin demandé, sans locale. Ex : /excursions/ancien-slug",
        ),
    ],
) -> RedirectResolution:
    """Cherche une cible pour une URL introuvable.

    Deux sources, dans cet ordre :
    1. `redirect` — redirections manuelles (URL de l'ancien site, campagnes)
    2. `slug_history` — renommages effectués depuis l'admin
    """
    normalized = "/" + path.strip("/")

    # ── 1. Redirection manuelle ────────────────────────────────────────
    stmt = select(Redirect).where(
        Redirect.from_path == normalized,
        Redirect.is_active.is_(True),
    )
    manual = (await session.exec(stmt)).first()

    if manual is not None:
        from datetime import UTC, datetime

        manual.hit_count += 1
        manual.last_hit_at = datetime.now(UTC)
        session.add(manual)
        await session.commit()

        return RedirectResolution(
            found=True, to_path=manual.to_path, status_code=manual.status_code
        )

    # ── 2. Historique des slugs ────────────────────────────────────────
    # Le préfixe détermine le type d'entité : /excursions/x et /circuits/x
    # pointent tous deux vers un `product`.
    segments = [s for s in normalized.split("/") if s]

    if len(segments) == 2:
        prefix, old_slug = segments
        entity_type = {
            "circuits": "product",
            "excursions": "product",
            "blog": "blog_post",
            "galerie": "gallery",
            "destinations": "destination",
        }.get(prefix)

        if entity_type:
            new_slug = await slug_service.resolve(session, entity_type, old_slug)
            if new_slug:
                await session.commit()
                return RedirectResolution(
                    found=True, to_path=f"/{prefix}/{new_slug}", status_code=301
                )

    return RedirectResolution(found=False)
