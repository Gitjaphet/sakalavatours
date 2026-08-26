"""Notifie le frontend Next.js qu'un contenu a changé.

Best-effort : un échec de revalidation ne doit JAMAIS faire échouer une
écriture en base. Le pire cas acceptable reste l'ancien cache ISR (jusqu'à
`revalidate = 3600` côté Next.js), jamais une donnée perdue ou un 500 sur
une sauvegarde admin.
"""

import logging

import httpx

from src.core.config import settings

logger = logging.getLogger(__name__)

REVALIDATE_TIMEOUT_SECONDS = 5.0


async def revalidate_product(slug: str) -> None:
    """Invalide le cache ISR d'un produit (et des listes) sur le frontend.

    Appelée après un create/update/delete réussi. Ne lève jamais : les
    erreurs sont journalisées, pas propagées.
    """
    if not settings.NEXTJS_REVALIDATE_URL or not settings.NEXTJS_REVALIDATE_SECRET:
        logger.warning(
            "Revalidation ignorée : NEXTJS_REVALIDATE_URL/SECRET non configurés"
        )
        return

    try:
        async with httpx.AsyncClient(timeout=REVALIDATE_TIMEOUT_SECONDS) as client:
            response = await client.post(
                settings.NEXTJS_REVALIDATE_URL,
                json={"slug": slug},
                headers={"x-revalidate-secret": settings.NEXTJS_REVALIDATE_SECRET},
            )
            if response.status_code != 200:
                logger.error(
                    "Revalidation échouée pour %s : %s %s",
                    slug,
                    response.status_code,
                    response.text,
                )
    except httpx.HTTPError as exc:
        logger.error("Revalidation impossible pour %s : %s", slug, exc)