"""Client Redis partagé.

Trois usages dans ce projet :
- limitation de débit sur les formulaires publics (avis, contact,
  réservation) — c'est le seul vraiment critique,
- cache des requêtes coûteuses de l'admin,
- verrous courts sur les opérations concurrentes.

`decode_responses=True` renvoie des str plutôt que des bytes : on ne
stocke ici que du texte et des compteurs.
"""

from redis.asyncio import ConnectionPool, Redis

from src.core.config import settings

pool = ConnectionPool.from_url(
    settings.REDIS_URL,
    decode_responses=True,
    max_connections=20,
)


def get_redis() -> Redis:
    """Dépendance FastAPI. Le pool gère les connexions, pas besoin de fermer."""
    return Redis(connection_pool=pool)


async def close_redis() -> None:
    await pool.aclose()
