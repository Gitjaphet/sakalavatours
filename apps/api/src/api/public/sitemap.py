"""Données du sitemap.

Next.js génère le fichier XML lui-même via `sitemap.ts` ; cette route lui
fournit la liste des URL dynamiques (produits, articles, destinations)
avec leurs dates de modification.

⚠ `lastmod` doit refléter une modification RÉELLE du contenu. Une date qui
change à chaque déploiement dilue le signal : Google apprend à l'ignorer,
et tu perds l'intérêt du sitemap sur le contenu qui bouge vraiment.
"""

from datetime import datetime

from pydantic import BaseModel
from sqlmodel import select

from src.api.deps import SessionDep
from src.models.blog import BlogPost
from src.models.enums import ContentStatus
from src.models.product import Product
from src.models.taxonomy import Destination
from fastapi import APIRouter

router = APIRouter(prefix="/sitemap", tags=["sitemap"])


class SitemapEntry(BaseModel):
    path: str
    last_modified: datetime
    priority: float = 0.5
    change_frequency: str = "monthly"


class SitemapResponse(BaseModel):
    entries: list[SitemapEntry]
    total: int


@router.get("", response_model=SitemapResponse)
async def get_sitemap_entries(session: SessionDep) -> SitemapResponse:
    """Toutes les URL indexables du contenu dynamique.

    Ne renvoie QUE ce qui est publié et indexable — un brouillon ou une
    page en noindex dans un sitemap est une contradiction que Google
    signale dans la Search Console.
    """
    entries: list[SitemapEntry] = []

    # ── Produits ───────────────────────────────────────────────────────
    stmt = select(Product).where(
        Product.is_published.is_(True),
        Product.deleted_at.is_(None),
        Product.status == ContentStatus.PUBLISHED,
        Product.is_indexable.is_(True),
    )
    for p in (await session.exec(stmt)).all():
        prefix = "circuits" if p.product_type.value == "circuit" else "excursions"
        entries.append(
            SitemapEntry(
                path=f"/{prefix}/{p.slug}",
                last_modified=p.updated_at,
                priority=p.sitemap_priority,
                change_frequency=p.sitemap_changefreq,
            )
        )

    # ── Articles ───────────────────────────────────────────────────────
    stmt = select(BlogPost).where(
        BlogPost.is_published.is_(True),
        BlogPost.deleted_at.is_(None),
        BlogPost.status == ContentStatus.PUBLISHED,
        BlogPost.is_indexable.is_(True),
    )
    for post in (await session.exec(stmt)).all():
        entries.append(
            SitemapEntry(
                path=f"/blog/{post.slug}",
                # content_updated_at si une révision éditoriale a eu lieu,
                # sinon la date de publication. Jamais updated_at, qui bouge
                # à la moindre correction technique.
                last_modified=post.content_updated_at or post.published_at or post.created_at,
                priority=post.sitemap_priority,
                change_frequency=post.sitemap_changefreq,
            )
        )

    # ── Destinations ───────────────────────────────────────────────────
    stmt = select(Destination).where(
        Destination.is_published.is_(True),
        Destination.deleted_at.is_(None),
        Destination.is_indexable.is_(True),
    )
    for dest in (await session.exec(stmt)).all():
        entries.append(
            SitemapEntry(
                path=f"/destinations/{dest.slug}",
                last_modified=dest.updated_at,
                priority=dest.sitemap_priority,
                change_frequency=dest.sitemap_changefreq,
            )
        )

    return SitemapResponse(entries=entries, total=len(entries))
