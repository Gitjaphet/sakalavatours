"""Routes admin de la bibliothèque de médias."""

import json
from uuid import UUID

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from pydantic import ValidationError
from sqlmodel.ext.asyncio.session import AsyncSession

from src.api.deps import require_role
from src.core.database import get_session
from src.integrations import storage
from src.models.enums import AdminRole
from src.schemas.media import MediaAdminRead, MediaTranslationIn
from src.services import media as media_service

router = APIRouter(prefix="/media", tags=["admin:media"])


def _to_admin_read(media, translations: list[MediaTranslationIn], locale: str = "fr") -> MediaAdminRead:
    by_locale = {t.locale: t for t in translations}
    current = by_locale.get(locale) or by_locale.get("fr")
    return MediaAdminRead(
        id=media.id,
        kind=media.kind.value,
        url=storage.public_url(media.storage_path),
        width=media.width,
        height=media.height,
        blurhash=media.blurhash,
        alt_text=current.alt_text if current else "",
        caption=current.caption if current else None,
        title=current.title if current else None,
        filename=media.filename,
        file_size=media.file_size,
        mime_type=media.mime_type,
        folder=media.folder,
        is_public=media.is_public,
        photographer=media.photographer,
        created_at=media.created_at,
        translations=translations,
    )


@router.post("", response_model=MediaAdminRead, dependencies=[Depends(require_role(AdminRole.EDITOR))])
async def upload_media(
    file: UploadFile = File(...),
    translations_json: str = Form(...),
    folder: str | None = Form(default=None),
    is_public: bool = Form(default=True),
    photographer: str | None = Form(default=None),
    session: AsyncSession = Depends(get_session),
):
    try:
        raw_translations = json.loads(translations_json)
        translations = [MediaTranslationIn(**t) for t in raw_translations]
    except (json.JSONDecodeError, ValidationError, TypeError) as e:
        raise HTTPException(422, f"translations_json invalide : {e}") from e

    if not translations:
        raise HTTPException(422, "Au moins une traduction (alt_text) est requise")

    raw_content = await file.read()

    try:
        media = await media_service.upload_media(
            session,
            filename=file.filename or "upload",
            content_type=file.content_type or storage.guess_content_type(file.filename or ""),
            raw_content=raw_content,
            folder=folder,
            is_public=is_public,
            photographer=photographer,
            translations=translations,
        )
    except media_service.MediaValidationError as e:
        raise HTTPException(422, str(e)) from e
    except storage.StorageError as e:
        raise HTTPException(502, str(e)) from e

    return _to_admin_read(media, translations)


@router.get("", response_model=list[MediaAdminRead], dependencies=[Depends(require_role(AdminRole.EDITOR))])
async def list_media(
    folder: str | None = None,
    limit: int = 50,
    offset: int = 0,
    session: AsyncSession = Depends(get_session),
):
    items, _total = await media_service.list_media(session, folder=folder, limit=limit, offset=offset)
    results = []
    for item in items:
        translations = await media_service.get_media_translations(session, item.id)
        results.append(_to_admin_read(item, translations))
    return results


@router.delete("/{media_id}", dependencies=[Depends(require_role(AdminRole.EDITOR))])
async def delete_media(media_id: UUID, session: AsyncSession = Depends(get_session)):
    deleted = await media_service.delete_media(session, media_id)
    if not deleted:
        raise HTTPException(404, "Média introuvable")
    return {"deleted": True}
