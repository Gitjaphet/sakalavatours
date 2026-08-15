"""Logique d'authentification.

Aucune dépendance à FastAPI ici : ce service doit rester appelable depuis
un routeur, un script ou un test sans modification. Il lève des exceptions
métier, que la couche API traduit en codes HTTP.
"""

from datetime import UTC, datetime, timedelta
from uuid import UUID

from redis.asyncio import Redis
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from src.core.config import settings
from src.core.security import (
    create_access_token,
    create_refresh_token,
    hash_password,
    needs_rehash,
    verify_password,
)
from src.models.system import AdminUser

# Verrouillage progressif : 5 tentatives, puis 15 minutes de blocage.
MAX_FAILED_ATTEMPTS = 5
LOCKOUT_MINUTES = 15

# Préfixe des clés Redis de révocation
REVOKED_PREFIX = "revoked_jti:"


class AuthError(Exception):
    """Échec d'authentification.

    Message volontairement identique pour un email inconnu et un mot de
    passe erroné : distinguer les deux permettrait d'énumérer les comptes
    existants.
    """


class AccountLockedError(AuthError):
    pass


class InactiveAccountError(AuthError):
    pass


async def authenticate(
    session: AsyncSession, email: str, password: str
) -> AdminUser:
    result = await session.exec(select(AdminUser).where(AdminUser.email == email))
    user = result.first()

    if user is None:
        # On hache quand même une valeur bidon : sans ça, la réponse est
        # plus rapide pour un email inconnu que pour un mot de passe faux,
        # ce qui permet d'énumérer les comptes par mesure du temps.
        hash_password("dummy-password-to-equalize-timing")
        raise AuthError("Identifiants invalides")

    now = datetime.now(UTC)

    if user.locked_until and user.locked_until > now:
        remaining = int((user.locked_until - now).total_seconds() / 60) + 1
        raise AccountLockedError(f"Compte verrouillé, réessayez dans {remaining} minutes")

    if not user.is_active or user.deleted_at is not None:
        raise InactiveAccountError("Compte désactivé")

    if not verify_password(password, user.password_hash):
        user.failed_login_count += 1
        if user.failed_login_count >= MAX_FAILED_ATTEMPTS:
            user.locked_until = now + timedelta(minutes=LOCKOUT_MINUTES)
            user.failed_login_count = 0
        session.add(user)
        await session.commit()
        raise AuthError("Identifiants invalides")

    # Connexion réussie
    user.failed_login_count = 0
    user.locked_until = None
    user.last_login_at = now

    # Renforcement transparent si les paramètres argon2 ont évolué
    if needs_rehash(user.password_hash):
        user.password_hash = hash_password(password)

    session.add(user)
    await session.commit()
    await session.refresh(user)
    return user


def issue_tokens(user: AdminUser) -> tuple[str, str, str, str]:
    """Retourne (access, access_jti, refresh, refresh_jti)."""
    access, access_jti = create_access_token(user.id, user.role.value)
    refresh, refresh_jti = create_refresh_token(user.id)
    return access, access_jti, refresh, refresh_jti


async def revoke_token(redis: Redis, jti: str, ttl_seconds: int) -> None:
    """Inscrit un jeton en liste de révocation.

    Le TTL correspond à la durée de vie restante du jeton : inutile de
    garder l'entrée après son expiration naturelle, Redis nettoie seul.
    """
    if ttl_seconds > 0:
        await redis.setex(f"{REVOKED_PREFIX}{jti}", ttl_seconds, "1")


async def is_revoked(redis: Redis, jti: str) -> bool:
    return await redis.exists(f"{REVOKED_PREFIX}{jti}") > 0


async def change_password(
    session: AsyncSession, user: AdminUser, current: str, new: str
) -> None:
    if not verify_password(current, user.password_hash):
        raise AuthError("Mot de passe actuel incorrect")

    if current == new:
        raise AuthError("Le nouveau mot de passe doit être différent de l'ancien")

    user.password_hash = hash_password(new)
    user.password_changed_at = datetime.now(UTC)
    session.add(user)
    await session.commit()


async def get_user_by_id(session: AsyncSession, user_id: UUID) -> AdminUser | None:
    result = await session.exec(select(AdminUser).where(AdminUser.id == user_id))
    return result.first()
