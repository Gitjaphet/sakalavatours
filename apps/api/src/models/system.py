"""Administration, configuration et intégrité SEO.

Trois responsabilités distinctes :
- qui a le droit de faire quoi (AdminUser, AuditLog),
- ce qui est configurable sans code (Setting),
- ce qui protège le référencement acquis (Redirect, SlugHistory).
"""

from datetime import datetime
from uuid import UUID

from sqlalchemy import DateTime
from sqlmodel import Field, UniqueConstraint

from src.models.base import SoftDeleteMixin, TimestampMixin, UUIDMixin
from src.models.enums import AdminRole, AuditAction


class AdminUser(UUIDMixin, TimestampMixin, SoftDeleteMixin, table=True):
    """Compte du back-office.

    ⚠ `password_hash` contient un hachage argon2, jamais un mot de passe.
    Ce champ ne sort d'aucun schéma de réponse, même admin.
    """

    __tablename__ = "admin_user"

    email: str = Field(max_length=255, unique=True, index=True)
    password_hash: str = Field(max_length=255, description="PRIVÉ — argon2")

    full_name: str = Field(max_length=150)
    role: AdminRole = Field(default=AdminRole.VIEWER, index=True)
    preferred_locale: str = Field(default="fr", max_length=5)

    is_active: bool = Field(default=True, index=True)

    # ── Sécurité ───────────────────────────────────────────────────────
    # `failed_login_count` et `locked_until` implémentent le verrouillage
    # après N tentatives — première défense contre le bourrinage.
    last_login_at: datetime | None = Field(default=None, sa_type=DateTime(timezone=True))
    last_login_ip: str | None = Field(default=None, max_length=45)
    failed_login_count: int = Field(default=0)
    locked_until: datetime | None = Field(default=None, sa_type=DateTime(timezone=True))
    password_changed_at: datetime | None = Field(
        default=None, sa_type=DateTime(timezone=True)
    )

    avatar_media_id: UUID | None = Field(default=None, foreign_key="media.id")


class AuditLog(UUIDMixin, TimestampMixin, table=True):
    """Journal des écritures du back-office.

    Chaque modification enregistre l'état avant et après. Indispensable
    pour comprendre une régression de contenu ou justifier une décision
    de modération.

    Pas de SoftDeleteMixin : un journal d'audit ne se supprime pas.
    """

    __tablename__ = "audit_log"

    actor_id: UUID | None = Field(default=None, foreign_key="admin_user.id", index=True)
    actor_email: str | None = Field(
        default=None,
        max_length=255,
        description="Copié à l'écriture — survit à la suppression du compte",
    )

    action: AuditAction = Field(index=True)
    entity_type: str = Field(max_length=80, index=True, description="product, review…")
    entity_id: UUID | None = Field(default=None, index=True)
    entity_label: str | None = Field(
        default=None, max_length=250, description="Titre lisible au moment de l'action"
    )

    changes_before: str | None = Field(default=None, description="JSON sérialisé")
    changes_after: str | None = Field(default=None, description="JSON sérialisé")

    ip_address: str | None = Field(default=None, max_length=45)
    user_agent: str | None = Field(default=None, max_length=500)


class Setting(UUIDMixin, TimestampMixin, table=True):
    """Configuration éditable sans redéploiement.

    Remplace le `nav-config.ts` codé en dur : téléphone, email, horaires,
    réseaux sociaux, coordonnées géographiques. Chaque changement déclenche
    une revalidation Next.
    """

    __tablename__ = "setting"

    key: str = Field(max_length=100, unique=True, index=True)
    value: str | None = Field(default=None)
    value_type: str = Field(
        default="string", max_length=20, description="string | int | bool | json"
    )
    group: str = Field(default="general", max_length=60, index=True)
    is_public: bool = Field(
        default=True, description="False = secret technique, jamais exposé par l'API"
    )
    description: str | None = Field(default=None, max_length=300)


class SettingTranslation(UUIDMixin, TimestampMixin, table=True):
    """Valeurs traduisibles — horaires, slogan, mentions."""

    __tablename__ = "setting_translation"
    __table_args__ = (UniqueConstraint("setting_id", "locale", name="uq_setting_translation"),)

    setting_id: UUID = Field(foreign_key="setting.id", index=True, ondelete="CASCADE")
    locale: str = Field(max_length=5, index=True)
    value: str | None = Field(default=None)


class SlugHistory(UUIDMixin, TimestampMixin, table=True):
    """Anciens slugs d'une entité.

    ⚠ PIÈCE MAÎTRESSE DE LA PROTECTION SEO.

    Quand un slug change depuis l'admin, l'ancien est enregistré ici et
    l'API sert une 301 vers le nouveau. Sans ce mécanisme, un simple
    renommage détruit tout le référencement acquis sur cette URL et
    transforme un lien entrant en 404.

    Les slugs des circuits viennent de l'ancien site et portent des liens
    existants : ils ne doivent jamais devenir des impasses.
    """

    __tablename__ = "slug_history"

    entity_type: str = Field(max_length=80, index=True)
    entity_id: UUID = Field(index=True)

    old_slug: str = Field(max_length=200, index=True)
    new_slug: str = Field(max_length=200)

    changed_by: UUID | None = Field(default=None, foreign_key="admin_user.id")
    hit_count: int = Field(
        default=0, description="Nombre de redirections servies — mesure l'utilité"
    )
    last_hit_at: datetime | None = Field(default=None, sa_type=DateTime(timezone=True))


class Redirect(UUIDMixin, TimestampMixin, table=True):
    """Redirections manuelles.

    Complète SlugHistory : sert aux URL de l'ancien site sans équivalent
    direct, et aux campagnes (`/promo-ete` → une fiche produit).
    """

    __tablename__ = "redirect"

    from_path: str = Field(max_length=500, unique=True, index=True)
    to_path: str = Field(max_length=500)
    status_code: int = Field(default=301, description="301 permanent, 302 temporaire")
    locale: str | None = Field(
        default=None, max_length=5, description="NULL = toutes les langues"
    )
    is_active: bool = Field(default=True, index=True)
    note: str | None = Field(default=None, max_length=300)

    hit_count: int = Field(default=0)
    last_hit_at: datetime | None = Field(default=None, sa_type=DateTime(timezone=True))


class RevalidationLog(UUIDMixin, TimestampMixin, table=True):
    """Journal des appels au webhook de revalidation Next.js.

    Quand une revalidation échoue, le contenu reste figé sur le CDN sans
    que personne ne le sache. Ce journal rend le problème visible.
    """

    __tablename__ = "revalidation_log"

    tag: str = Field(max_length=100, index=True, description="products, blog, pages…")
    triggered_by: UUID | None = Field(default=None, foreign_key="admin_user.id")
    entity_type: str | None = Field(default=None, max_length=80)
    entity_id: UUID | None = Field(default=None)

    is_success: bool = Field(default=False, index=True)
    response_status: int | None = Field(default=None)
    error_message: str | None = Field(default=None, max_length=500)
    duration_ms: int | None = Field(default=None)
