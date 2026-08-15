"""Moteur asynchrone et fabrique de sessions.

`expire_on_commit=False` est indispensable en async : sans lui, tout accès
à un attribut après un commit déclenche un rechargement paresseux, ce qui
lève le fameux MissingGreenlet.
"""

from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncEngine, async_sessionmaker, create_async_engine
from sqlmodel.ext.asyncio.session import AsyncSession

from src.core.config import settings

engine: AsyncEngine = create_async_engine(
    settings.DATABASE_URL,
    echo=settings.DEBUG,
    pool_size=10,
    max_overflow=20,
    pool_pre_ping=True,  # écarte les connexions mortes après inactivité
    pool_recycle=1800,
)

AsyncSessionFactory = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
)


async def get_session() -> AsyncGenerator[AsyncSession, None]:
    """Dépendance FastAPI : une session par requête, rollback sur erreur."""
    async with AsyncSessionFactory() as session:
        try:
            yield session
        except Exception:
            await session.rollback()
            raise
