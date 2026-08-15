"""Blog éditorial.

Le blog capte du trafic informationnel EN AMONT de la décision d'achat
(« quand partir à Nosy Be », « combien coûte un voyage à Madagascar »),
là où les concurrents locaux sont absents. Sa valeur ne vient pas des
articles eux-mêmes mais de `BlogPostProduct` : sans lien vers les fiches
produit, ce trafic ne se convertit jamais.

Le corps de l'article vit dans `BlogPostTranslation.body`, chargé
uniquement sur la page détail — jamais dans la liste, pour ne pas
alourdir la réponse.
"""

from datetime import datetime
from uuid import UUID

from sqlalchemy import DateTime
from sqlmodel import Field, SQLModel, UniqueConstraint

from src.models.base import (
    PublishableMixin,
    SeoMixin,
    SeoTechnicalMixin,
    SlugMixin,
    SoftDeleteMixin,
    TimestampMixin,
    TranslationMixin,
    UUIDMixin,
)
from src.models.enums import ContentStatus


class Author(UUIDMixin, TimestampMixin, SoftDeleteMixin, SlugMixin, table=True):
    """Signataire des articles.

    Google valorise l'E-E-A-T (expérience, expertise, autorité, fiabilité).
    Un article signé par une personne réelle, avec une biographie qui
    établit sa connaissance du terrain, pèse davantage qu'un texte anonyme
    — surtout sur des sujets de conseil de voyage.
    """

    __tablename__ = "author"

    email: str | None = Field(default=None, max_length=255)
    avatar_media_id: UUID | None = Field(default=None, foreign_key="media.id")
    admin_user_id: UUID | None = Field(default=None, foreign_key="admin_user.id")

    # Alimente la propriété `sameAs` du schema.org Person
    website_url: str | None = Field(default=None, max_length=300)
    facebook_url: str | None = Field(default=None, max_length=300)
    instagram_url: str | None = Field(default=None, max_length=300)

    is_active: bool = Field(default=True)


class AuthorTranslation(UUIDMixin, TimestampMixin, TranslationMixin, table=True):
    __tablename__ = "author_translation"
    __table_args__ = (UniqueConstraint("author_id", "locale", name="uq_author_translation"),)

    author_id: UUID = Field(foreign_key="author.id", index=True, ondelete="CASCADE")

    display_name: str = Field(max_length=150)
    role_label: str | None = Field(
        default=None, max_length=150, description="Ex. « Guide et fondateur »"
    )
    bio: str | None = Field(default=None, max_length=1500)


class BlogCategory(
    UUIDMixin,
    TimestampMixin,
    SoftDeleteMixin,
    SlugMixin,
    PublishableMixin,
    SeoTechnicalMixin,
    table=True,
):
    """Catégorie éditoriale — guide pratique, faune, activités, culture.

    Publiable et indexable : chaque catégorie mérite sa page listing, qui
    capte des requêtes de tête et distribue l'autorité vers les articles.
    """

    __tablename__ = "blog_category"

    code: str = Field(max_length=60, unique=True, index=True)
    color: str | None = Field(default=None, max_length=9)
    cover_media_id: UUID | None = Field(default=None, foreign_key="media.id")


class BlogCategoryTranslation(
    UUIDMixin, TimestampMixin, TranslationMixin, SeoMixin, table=True
):
    __tablename__ = "blog_category_translation"
    __table_args__ = (
        UniqueConstraint("category_id", "locale", name="uq_blog_category_translation"),
    )

    category_id: UUID = Field(foreign_key="blog_category.id", index=True, ondelete="CASCADE")

    name: str = Field(max_length=150)
    description: str | None = Field(default=None, max_length=800)


class BlogPost(
    UUIDMixin,
    TimestampMixin,
    SoftDeleteMixin,
    SlugMixin,
    PublishableMixin,
    SeoTechnicalMixin,
    table=True,
):
    __tablename__ = "blog_post"

    status: ContentStatus = Field(default=ContentStatus.DRAFT, index=True)

    category_id: UUID | None = Field(default=None, foreign_key="blog_category.id", index=True)
    author_id: UUID | None = Field(default=None, foreign_key="author.id", index=True)
    cover_media_id: UUID | None = Field(default=None, foreign_key="media.id")

    # ── Dates ──────────────────────────────────────────────────────────
    # `content_updated_at` est distinct de `updated_at` : corriger une
    # coquille ne doit pas faire croire à Google que l'article a été
    # révisé. Seule une mise à jour éditoriale réelle le touche, et c'est
    # elle qui alimente `dateModified` du JSON-LD.
    content_updated_at: datetime | None = Field(
        default=None, index=True, sa_type=DateTime(timezone=True)
    )

    reading_minutes: int | None = Field(default=None)
    is_featured: bool = Field(default=False, index=True)
    view_count: int = Field(default=0)


class BlogPostTranslation(
    UUIDMixin, TimestampMixin, TranslationMixin, SeoMixin, table=True
):
    """Contenu de l'article, par langue.

    Un article peut n'exister que dans certaines langues : la page listing
    d'une locale ne montre que les traductions publiées. Mieux vaut un
    blog de 4 articles en italien qu'un blog de 12 articles dont 8 en
    français sur la version italienne.
    """

    __tablename__ = "blog_post_translation"
    __table_args__ = (UniqueConstraint("post_id", "locale", name="uq_blog_post_translation"),)

    post_id: UUID = Field(foreign_key="blog_post.id", index=True, ondelete="CASCADE")

    title: str = Field(max_length=250)
    excerpt: str = Field(max_length=600, description="Résumé affiché sur la carte")
    body: str | None = Field(default=None, description="Corps complet, en HTML")

    is_published: bool = Field(
        default=False,
        index=True,
        description="Publication PAR LANGUE, indépendante de l'article parent",
    )


class BlogPostProduct(SQLModel, table=True):
    """Maillage article → fiche produit.

    C'est le mécanisme qui rend le blog rentable. Un article « Quand
    partir à Nosy Be » capte un lecteur six mois avant son voyage ; sans
    lien vers les excursions, cette visite ne vaut rien.
    """

    __tablename__ = "blog_post_product"

    post_id: UUID = Field(foreign_key="blog_post.id", primary_key=True, ondelete="CASCADE")
    product_id: UUID = Field(foreign_key="product.id", primary_key=True, ondelete="CASCADE")
    sort_order: int = Field(default=0)


class BlogPostRelated(SQLModel, table=True):
    """Articles liés — « À lire aussi »."""

    __tablename__ = "blog_post_related"

    post_id: UUID = Field(foreign_key="blog_post.id", primary_key=True, ondelete="CASCADE")
    related_post_id: UUID = Field(
        foreign_key="blog_post.id", primary_key=True, ondelete="CASCADE"
    )
    sort_order: int = Field(default=0)
