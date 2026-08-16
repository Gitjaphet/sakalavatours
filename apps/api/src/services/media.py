"""Règles métier de la bibliothèque de médias.

Orchestre repository + intégration R2. Ne connaît pas HTTP (pas de
HTTPException ici — c'est le rôle du routeur), lève des exceptions
métier que la route traduira en codes de statut.
"""

from uuid import UUID

from sqlmodel.ext.asyncio.session import AsyncSession

from src.integrations import storage
from src.models.enums import MediaKind
from src.models.media import Media
from src.repositories import media as media_repo
from src.schemas.media import MediaTranslationIn


class MediaValidationError(Exception):
    """Fichier rejeté avant tout traitement — le routeur la traduit en 422."""


def _validate(content_type: str, file_size: int) -> None:
    if content_type not in storage.ALLOWED_IMAGE_TYPES:
        raise MediaValidationError(
            f"Type de fichier non autorisé : {content_type}. "
            f"Autorisés : {', '.join(storage.ALLOWED_IMAGE_TYPES)}"
        )

    from src.core.config import settings

    max_bytes = settings.MAX_UPLOAD_MB * 1024 * 1024
    if file_size > max_bytes:
        raise MediaValidationError(
            f"Fichier trop volumineux ({file_size / 1024 / 1024:.1f} Mo, "
            f"max {settings.MAX_UPLOAD_MB} Mo)"
        )


async def upload_media(
    session: AsyncSession,
    *,
    filename: str,
    content_type: str,
    raw_content: bytes,
    folder: str | None,
    is_public: bool,
    photographer: str | None,
    translations: list[MediaTranslationIn],
) -> Media:
    """Traite, téléverse et enregistre un nouveau média.

    Ordre volontaire : on valide et on traite l'image AVANT de toucher la
    base ou R2 — un fichier invalide ne doit laisser aucune trace nulle
    part. R2 est écrit avant le commit base ; si le commit échouait après
    un upload réussi, on aurait un fichier orphelin sur R2 (inoffensif,
    juste quelques octets perdus) plutôt qu'une ligne en base pointant
    vers un fichier qui n'existe pas (ça, ça casserait l'affichage).
    """
    _validate(content_type, len(raw_content))

    processed, width, height, mime_type = storage.process_image(raw_content)
    key = storage.build_key(folder or "divers", filename, processed)

    await storage.upload(key, processed, mime_type)

    try:
        media = await media_repo.create_media(
            session,
            kind=MediaKind.IMAGE,
            filename=filename,
            storage_path=key,
            mime_type=mime_type,
            file_size=len(processed),
            width=width,
            height=height,
            photographer=photographer,
            folder=folder,
            is_public=is_public,
        )
        await media_repo.add_translations(session, media.id, translations)
        await session.commit()
        await session.refresh(media)
        return media
    except Exception:
        await session.rollback()
        await storage.delete(key)  # évite l'orphelin si la base a échoué
        raise


async def get_media(
    session: AsyncSession, media_id: UUID, locale: str
) -> tuple[Media, str] | None:
    """Un média avec son alt_text dans la langue demandée (repli français)."""
    media = await media_repo.get_by_id(session, media_id)
    if media is None:
        return None

    translations = await media_repo.get_translations(session, media_id)
    by_locale = {t.locale: t.alt_text for t in translations}
    alt = by_locale.get(locale) or by_locale.get("fr") or ""
    return media, alt


async def list_media(
    session: AsyncSession, *, folder: str | None, limit: int, offset: int
) -> tuple[list[Media], int]:
    return await media_repo.list_media(session, folder=folder, limit=limit, offset=offset)


async def get_media_translations(
    session: AsyncSession, media_id: UUID
) -> list[MediaTranslationIn]:
    """Toutes les langues — pour l'écran d'édition admin."""
    rows = await media_repo.get_translations(session, media_id)
    return [
        MediaTranslationIn(locale=t.locale, alt_text=t.alt_text, caption=t.caption, title=t.title)
        for t in rows
    ]


async def delete_media(session: AsyncSession, media_id: UUID) -> bool:
    """Suppression logique uniquement — jamais de suppression physique R2.

    Une image publiée est potentiellement indexée par Google Images ou
    référencée par une URL déjà partagée. On coupe l'accès applicatif
    (deleted_at) sans casser le lien, cohérent avec la règle du projet
    qui interdit toute suppression physique de contenu indexé.
    """
    media = await media_repo.get_by_id(session, media_id)
    if media is None:
        return False

    from datetime import UTC, datetime

    media.deleted_at = datetime.now(UTC)
    session.add(media)
    await session.commit()
    return True
