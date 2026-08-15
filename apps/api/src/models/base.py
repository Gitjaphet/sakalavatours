"""Mixins réutilisés par tous les modèles.

⚠ Ne JAMAIS utiliser `sa_column=Column(...)` dans un mixin : un objet
Column ne peut être rattaché qu'à une seule table, et toutes les classes
héritantes se partageraient la même instance. On passe donc par `sa_type`
(les types SQLAlchemy sont partageables) et `sa_column_kwargs` (un simple
dictionnaire relu à chaque construction de table).
"""

from datetime import UTC, datetime
from uuid import UUID, uuid4

from sqlalchemy import DateTime, func
from sqlmodel import Field, SQLModel


def utcnow() -> datetime:
    return datetime.now(UTC)


class UUIDMixin(SQLModel):
    """Clé primaire UUID plutôt qu'un entier séquentiel.

    Un ID auto-incrémenté expose le volume d'activité (`/booking/42`
    annonce au monde qu'on a 42 réservations) et complique une future
    réplication.
    """

    id: UUID = Field(default_factory=uuid4, primary_key=True, index=True, nullable=False)


class TimestampMixin(SQLModel):
    """Horodatage géré par PostgreSQL, pas par Python.

    `server_default` et `onupdate` garantissent la cohérence même quand
    une ligne est modifiée hors de l'application (script, psql direct).
    """

    created_at: datetime = Field(
        default_factory=utcnow,
        sa_type=DateTime(timezone=True),
        sa_column_kwargs={"server_default": func.now()},
    )
    updated_at: datetime = Field(
        default_factory=utcnow,
        sa_type=DateTime(timezone=True),
        sa_column_kwargs={"server_default": func.now(), "onupdate": func.now()},
    )


class SoftDeleteMixin(SQLModel):
    """Suppression logique.

    On ne supprime jamais physiquement un contenu indexé par Google : il
    faut conserver son slug pour servir une 301 vers son remplaçant.
    """

    deleted_at: datetime | None = Field(
        default=None,
        index=True,
        sa_type=DateTime(timezone=True),
    )

    @property
    def is_deleted(self) -> bool:
        return self.deleted_at is not None


class SlugMixin(SQLModel):
    """Identifiant d'URL.

    ⚠ RÈGLE ABSOLUE : un slug publié ne change jamais silencieusement.
    Toute modification depuis l'admin écrit une ligne dans `slug_history`,
    qui alimente une redirection 301. Sans ça, un renommage détruit le
    référencement acquis.
    """

    slug: str = Field(max_length=200, unique=True, index=True, nullable=False)


class PublishableMixin(SQLModel):
    """Cycle de publication commun aux contenus éditoriaux."""

    is_published: bool = Field(default=False, index=True)
    published_at: datetime | None = Field(
        default=None,
        index=True,
        sa_type=DateTime(timezone=True),
    )
    sort_order: int = Field(default=0, index=True)


class SeoMixin(SQLModel):
    """Champs SEO éditables depuis l'admin, PAR LANGUE.

    À placer sur les tables de TRADUCTION : un meta_title se rédige dans
    chaque langue, il ne se traduit pas mécaniquement.
    """

    meta_title: str | None = Field(default=None, max_length=70)
    meta_description: str | None = Field(default=None, max_length=180)
    og_title: str | None = Field(default=None, max_length=120)
    og_description: str | None = Field(default=None, max_length=250)


class SeoTechnicalMixin(SQLModel):
    """Contrôle technique de l'indexation, NON traduisible.

    À placer sur la table parente. Permet de sortir une page de l'index ou
    d'ajuster sa priorité au sitemap sans toucher au code.
    """

    is_indexable: bool = Field(default=True)
    canonical_override: str | None = Field(default=None, max_length=500)
    sitemap_priority: float = Field(default=0.5, ge=0.0, le=1.0)
    sitemap_changefreq: str = Field(default="monthly", max_length=20)


class TranslationMixin(SQLModel):
    """Base des tables de traduction.

    Tables séparées plutôt que JSONB : indexation full-text par langue,
    traduction partielle possible, validation stricte des champs.
    """

    locale: str = Field(max_length=5, index=True, nullable=False)
    is_machine_translated: bool = Field(default=False)
