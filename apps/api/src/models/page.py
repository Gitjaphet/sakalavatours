"""Pages éditoriales composables.

Une page (/apropos, /contact, /galerie) n'est pas un gabarit figé mais une
suite de sections ordonnées. L'admin peut réordonner, masquer ou ajouter
un bloc sans redéploiement.

La limite du système : `PageSectionType` est une énumération, et chaque
valeur correspond à un composant React côté Next. Ajouter un TYPE de
section demande donc du code ; ajouter, réordonner ou modifier une
section existante, non. C'est le bon compromis — un éditeur totalement
libre produirait des pages incohérentes avec l'identité visuelle.
"""

from uuid import UUID

from sqlmodel import Field, UniqueConstraint

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
from src.models.enums import ContentStatus, PageSectionType


class Page(
    UUIDMixin,
    TimestampMixin,
    SoftDeleteMixin,
    SlugMixin,
    PublishableMixin,
    SeoTechnicalMixin,
    table=True,
):
    __tablename__ = "page"

    status: ContentStatus = Field(default=ContentStatus.DRAFT, index=True)

    is_system: bool = Field(
        default=False,
        description=(
            "Page structurelle (/apropos, /contact) dont le slug est "
            "référencé par la navigation. Suppression interdite depuis l'admin."
        ),
    )

    hero_media_id: UUID | None = Field(default=None, foreign_key="media.id")


class PageTranslation(UUIDMixin, TimestampMixin, TranslationMixin, SeoMixin, table=True):
    __tablename__ = "page_translation"
    __table_args__ = (UniqueConstraint("page_id", "locale", name="uq_page_translation"),)

    page_id: UUID = Field(foreign_key="page.id", index=True, ondelete="CASCADE")

    title: str = Field(max_length=200, description="Le <h1> de la page")
    eyebrow: str | None = Field(
        default=None, max_length=120, description="Surtitre au-dessus du <h1>"
    )
    intro: str | None = Field(default=None, max_length=800)

    breadcrumb_label: str | None = Field(
        default=None, max_length=100, description="Libellé court du fil d'Ariane"
    )

    is_published: bool = Field(default=False, index=True)


class PageSection(UUIDMixin, TimestampMixin, table=True):
    """Bloc composant une page."""

    __tablename__ = "page_section"

    page_id: UUID = Field(foreign_key="page.id", index=True, ondelete="CASCADE")

    section_type: PageSectionType = Field(index=True)
    sort_order: int = Field(default=0, index=True)
    is_visible: bool = Field(default=True)

    anchor: str | None = Field(
        default=None,
        max_length=60,
        description="Ancre HTML, ex. 'nos-valeurs' — permet les liens profonds",
    )

    media_id: UUID | None = Field(default=None, foreign_key="media.id")
    gallery_id: UUID | None = Field(default=None, foreign_key="gallery.id")

    background_variant: str | None = Field(
        default=None,
        max_length=40,
        description="cream | lagoon | white — choisi parmi la charte, pas libre",
    )

    cta_url: str | None = Field(default=None, max_length=300)


class PageSectionTranslation(UUIDMixin, TimestampMixin, TranslationMixin, table=True):
    __tablename__ = "page_section_translation"
    __table_args__ = (
        UniqueConstraint("section_id", "locale", name="uq_page_section_translation"),
    )

    section_id: UUID = Field(foreign_key="page_section.id", index=True, ondelete="CASCADE")

    eyebrow: str | None = Field(default=None, max_length=120)
    title: str | None = Field(default=None, max_length=250)
    subtitle: str | None = Field(default=None, max_length=500)
    body: str | None = Field(default=None, description="Contenu riche, en HTML")
    cta_label: str | None = Field(default=None, max_length=100)


class PageSectionItem(UUIDMixin, TimestampMixin, table=True):
    """Élément répétable d'une section.

    Une section VALUES contient trois items (Authenticité, Respect,
    Partage), une section FAQ en contient six, une section STATS quatre.
    Plutôt que d'inventer une table par type, un item générique porte les
    champs communs.
    """

    __tablename__ = "page_section_item"

    section_id: UUID = Field(foreign_key="page_section.id", index=True, ondelete="CASCADE")

    sort_order: int = Field(default=0)
    icon: str | None = Field(default=None, max_length=60)
    media_id: UUID | None = Field(default=None, foreign_key="media.id")
    numeric_value: str | None = Field(
        default=None, max_length=40, description="Pour STATS : « 15 », « 2–12 »"
    )
    link_url: str | None = Field(default=None, max_length=300)


class PageSectionItemTranslation(UUIDMixin, TimestampMixin, TranslationMixin, table=True):
    __tablename__ = "page_section_item_translation"
    __table_args__ = (
        UniqueConstraint("item_id", "locale", name="uq_page_section_item_translation"),
    )

    item_id: UUID = Field(
        foreign_key="page_section_item.id", index=True, ondelete="CASCADE"
    )

    title: str | None = Field(default=None, max_length=250)
    body: str | None = Field(default=None)
    label: str | None = Field(
        default=None, max_length=150, description="Pour STATS : « Destinations »"
    )
