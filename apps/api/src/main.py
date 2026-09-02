"""Application FastAPI.

Le `lifespan` vérifie PostgreSQL et Redis AU DÉMARRAGE. Si l'un des deux
est injoignable, le processus s'arrête immédiatement plutôt que de servir
des 500 pendant des heures — sur le VPS, l'orchestrateur relancera le
conteneur au lieu de le laisser tourner cassé.
"""

import logging
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from src.core.config import settings
from src.core.database import engine
from src.core.redis import close_redis, get_redis
from src.api.admin import auth as admin_auth
from src.api.public import products as public_products
from src.api.admin import products as admin_products
from src.api.public import bookings as public_bookings
from src.api.admin import contact as admin_contact
from src.api.public import contact as public_contact
from src.api.admin import bookings as admin_bookings
from src.api.public import reviews as public_reviews
from src.api.admin import reviews as admin_reviews
from src.api.public import redirects as public_redirects
from src.api.public import sitemap as public_sitemap
from src.api.admin import media as admin_media
from src.api.admin import taxonomies as admin_taxonomies


# Uvicorn ne configure que ses propres loggers. Sans cette ligne, tous les
# logger.info() de l'application sont avalés silencieusement — y compris
# les confirmations et les échecs d'envoi d'email.
logging.basicConfig(
    level=logging.DEBUG if settings.DEBUG else logging.INFO,
    format="%(asctime)s  %(levelname)-8s %(name)s  %(message)s",
    datefmt="%H:%M:%S",
)


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    # ── Démarrage ──────────────────────────────────────────────────────
    async with engine.connect() as conn:
        await conn.execute(text("SELECT 1"))

    redis = get_redis()
    await redis.ping()

    yield

    # ── Arrêt ──────────────────────────────────────────────────────────
    await engine.dispose()
    await close_redis()


app = FastAPI(
    title=settings.PROJECT_NAME,
    version="0.1.0",
    lifespan=lifespan,
    # La documentation interactive est coupée en production : elle
    # exposerait toute la surface de l'API, y compris les routes admin.
    docs_url=None if settings.is_production else "/docs",
    redoc_url=None if settings.is_production else "/redoc",
    openapi_url=None if settings.is_production else "/openapi.json",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PATCH", "PUT", "DELETE"],
    allow_headers=["*"],
)


@app.get("/health", tags=["système"])
async def health() -> dict[str, str]:
    """Sonde de disponibilité.

    Vérifie réellement les dépendances plutôt que de renvoyer un « ok »
    inconditionnel : une sonde qui répond toujours vrai ne sert à rien.
    """
    async with engine.connect() as conn:
        await conn.execute(text("SELECT 1"))

    redis = get_redis()
    await redis.ping()

    return {
        "status": "healthy",
        "environment": settings.ENVIRONMENT,
        "database": "connected",
        "redis": "connected",
    }


app.include_router(admin_auth.router, prefix=f"{settings.API_V1_PREFIX}/admin")
app.include_router(public_products.router, prefix=f"{settings.API_V1_PREFIX}/public")
app.include_router(admin_products.router, prefix=f"{settings.API_V1_PREFIX}/admin")
app.include_router(public_bookings.router, prefix=f"{settings.API_V1_PREFIX}/public")
app.include_router(admin_bookings.router, prefix=f"{settings.API_V1_PREFIX}/admin")
app.include_router(public_reviews.router, prefix=f"{settings.API_V1_PREFIX}/public")
app.include_router(public_contact.router, prefix=f"{settings.API_V1_PREFIX}/public")
app.include_router(admin_contact.router, prefix=f"{settings.API_V1_PREFIX}/admin")
app.include_router(admin_reviews.router, prefix=f"{settings.API_V1_PREFIX}/admin")
app.include_router(public_redirects.router, prefix=f"{settings.API_V1_PREFIX}/public")
app.include_router(public_sitemap.router, prefix=f"{settings.API_V1_PREFIX}/public")
app.include_router(admin_media.router, prefix=f"{settings.API_V1_PREFIX}/admin")
app.include_router(admin_taxonomies.router, prefix=f"{settings.API_V1_PREFIX}/admin")
