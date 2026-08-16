"""Stockage des fichiers sur Cloudflare R2.

R2 expose une API compatible S3 : boto3 fonctionne sans adaptation, à deux
détails près — la région doit valoir "auto" (R2 n'a pas de régions AWS) et
la signature doit être en v4.

⚠ boto3 est SYNCHRONE. Les appels passent donc par un pool de threads pour
ne pas geler la boucle d'événements pendant l'upload.
"""

import asyncio
import hashlib
import logging
import mimetypes
from datetime import UTC, datetime
from io import BytesIO
from uuid import uuid4

import boto3
from botocore.config import Config

from src.core.config import settings

logger = logging.getLogger("sakalava.storage")

ALLOWED_IMAGE_TYPES = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/avif": ".avif",
}


class StorageError(Exception):
    """Échec de stockage. Le routeur la traduit en 502."""


def _client():
    """Client S3 pointant vers R2.

    Recréé à chaque appel : boto3 met en cache ce qui compte, et un client
    global poserait problème avec plusieurs workers uvicorn.
    """
    if not settings.R2_ENDPOINT:
        raise StorageError("R2 n'est pas configuré (R2_ENDPOINT vide)")

    return boto3.client(
        "s3",
        endpoint_url=settings.R2_ENDPOINT,
        aws_access_key_id=settings.R2_ACCESS_KEY_ID,
        aws_secret_access_key=settings.R2_SECRET_ACCESS_KEY,
        region_name="auto",
        config=Config(signature_version="s3v4", retries={"max_attempts": 3}),
    )


def build_key(folder: str, filename: str, content: bytes) -> str:
    """Chemin de l'objet dans le bucket.

    Format : excursions/2026/08/a3f9c1b2-nosy-iranja.jpg

    L'empreinte du contenu en préfixe rend la clé unique même si deux
    fichiers portent le même nom, et le découpage par année/mois évite
    d'avoir 10 000 objets à plat le jour où la galerie grossit.
    """
    digest = hashlib.sha256(content).hexdigest()[:8]
    now = datetime.now(UTC)

    stem = filename.rsplit(".", 1)[0][:60]
    safe_stem = "".join(c if c.isalnum() or c in "-_" else "-" for c in stem).strip("-")
    ext = "." + filename.rsplit(".", 1)[-1].lower() if "." in filename else ""

    clean_folder = folder.strip("/") or "divers"

    return f"{clean_folder}/{now:%Y/%m}/{digest}-{safe_stem or uuid4().hex[:8]}{ext}"


def _put(key: str, content: bytes, content_type: str) -> None:
    _client().put_object(
        Bucket=settings.R2_BUCKET,
        Key=key,
        Body=content,
        ContentType=content_type,
        # Cache long : la clé change à chaque nouveau contenu (empreinte),
        # donc une image ne peut jamais être servie périmée.
        CacheControl="public, max-age=31536000, immutable",
    )


async def upload(key: str, content: bytes, content_type: str) -> str:
    """Téléverse et retourne l'URL publique."""
    try:
        await asyncio.to_thread(_put, key, content, content_type)
    except Exception as e:
        logger.exception("Échec d'upload sur %s", key)
        raise StorageError(f"Impossible de téléverser le fichier : {e}") from e

    return public_url(key)


def _delete(key: str) -> None:
    _client().delete_object(Bucket=settings.R2_BUCKET, Key=key)


async def delete(key: str) -> None:
    """Supprime un objet.

    Les échecs sont journalisés mais non propagés : un fichier orphelin
    sur R2 coûte quelques octets, alors qu'une suppression bloquée en base
    laisse une entrée fantôme dans l'admin.
    """
    try:
        await asyncio.to_thread(_delete, key)
    except Exception:
        logger.exception("Échec de suppression de %s", key)


def public_url(key: str) -> str:
    return f"{settings.R2_PUBLIC_URL.rstrip('/')}/{key.lstrip('/')}"


def process_image(content: bytes, max_width: int | None = None) -> tuple[bytes, int, int, str]:
    """Redimensionne et convertit en WebP.

    Retourne (contenu, largeur, hauteur, type_mime).

    Trois raisons de traiter à l'upload plutôt qu'à l'affichage :
    - une photo de téléphone fait 4 à 8 Mo, inutile de stocker ça ;
    - les dimensions sont nécessaires au composant <Image> de Next pour
      réserver l'espace et éviter le layout shift ;
    - WebP pèse 25 à 35 % de moins que JPEG à qualité équivalente.

    Les métadonnées EXIF disparaissent au passage — y compris les
    coordonnées GPS, que personne ne veut publier par accident.
    """
    from PIL import Image, ImageOps

    limit = max_width or settings.IMAGE_MAX_WIDTH

    with Image.open(BytesIO(content)) as img:
        # Applique la rotation EXIF : sans ça, les photos prises en
        # portrait s'affichent couchées.
        img = ImageOps.exif_transpose(img)

        if img.mode in ("RGBA", "LA", "P"):
            img = img.convert("RGB")

        if img.width > limit:
            ratio = limit / img.width
            img = img.resize((limit, round(img.height * ratio)), Image.LANCZOS)

        buffer = BytesIO()
        img.save(buffer, format="WEBP", quality=82, method=4)

        return buffer.getvalue(), img.width, img.height, "image/webp"


def guess_content_type(filename: str) -> str:
    return mimetypes.guess_type(filename)[0] or "application/octet-stream"
