"""Accès aux données de la bibliothèque de médias.

Aucune règle métier ici : uniquement des requêtes. Le repository ne sait
pas qu'un média sans alt_text est invalide, il sait insérer une ligne.
C'est le service qui applique les règles.
"""

from datetime import date
from uuid import UUID

from sqlalchemy import func
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from src.models.enums import MediaKind
from src.models.media import Media, MediaTranslation
from src.schemas.media import MediaTranslationIn


async def create_media(
    session: AsyncSession,
    *,
    kind: MediaKind,
    filename: str,
    storage_path: str,
    mime_type: str,
    file_size: int,
    width: int | None = None,
    height: int | None = None,
    blurhash: str | None = None,
    dominant_color: str | None = None,
    photographer: str | None = None,
    taken_at: date | None = None,
    latitude: float | None = None,
    longitude: float | None = None,
    folder: str | None = None,
    is_public: bool = True,
) -> Media:
    """Insère le fichier physique. Ne commit pas — géré par le service."""
    media = Media(
        kind=kind,
        filename=filename,
        storage_path=storage_path,
        mime_type=mime_type,
        file_size=file_size,
        width=width,
        height=height,
        blurhash=blurhash,
        dominant_color=dominant_color,
        photographer=photographer,
        taken_at=taken_at,
        latitude=latitude,
        longitude=longitude,
        folder=folder,
        is_public=is_public,
    )
    session.add(media)
    await session.flush()  # nécessaire pour obtenir media.id avant les traductions
    return media


async def add_translations(
    session: AsyncSession, media_id: UUID, translations: list[MediaTranslationIn]
) -> list[MediaTranslation]:
    """Insère une ligne de traduction par langue fournie."""
    rows = [
        MediaTranslation(media_id=media_id, **t.model_dump())
        for t in translations
    ]
    session.add_all(rows)
    await session.flush()
    return rows


async def list_media(
    session: AsyncSession,
    *,
    folder: str | None = None,
    limit: int = 50,
    offset: int = 0,
) -> tuple[list[Media], int]:
    stmt = select(Media).where(Media.deleted_at.is_(None))
    count_stmt = select(func.count()).select_from(Media).where(Media.deleted_at.is_(None))

    if folder is not None:
        stmt = stmt.where(Media.folder == folder)
        count_stmt = count_stmt.where(Media.folder == folder)

    stmt = stmt.order_by(Media.created_at.desc()).limit(limit).offset(offset)

    items = list((await session.exec(stmt)).all())
    total = (await session.exec(count_stmt)).one()
    return items, total


async def get_by_id(session: AsyncSession, media_id: UUID) -> Media | None:
    stmt = select(Media).where(Media.id == media_id, Media.deleted_at.is_(None))
    return (await session.exec(stmt)).first()


async def get_translations(
    session: AsyncSession, media_id: UUID
) -> list[MediaTranslation]:
    """Toutes les langues d'un média — utilisé par l'écran d'édition admin."""
    stmt = select(MediaTranslation).where(MediaTranslation.media_id == media_id)
    return list((await session.exec(stmt)).all())
