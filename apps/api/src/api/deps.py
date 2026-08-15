"""Dépendances partagées par les routeurs.

C'est ici que la sécurité devient effective : un endpoint sans
`Depends(get_current_user)` est public, quoi qu'en dise sa documentation.
"""

from typing import Annotated

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from redis.asyncio import Redis
from sqlmodel.ext.asyncio.session import AsyncSession

from src.core.database import get_session
from src.core.redis import get_redis
from src.core.security import decode_token
from src.models.enums import AdminRole
from src.models.system import AdminUser
from src.services.auth import get_user_by_id, is_revoked

# auto_error=False : on gère nous-mêmes l'absence d'en-tête, pour renvoyer
# un message cohérent avec le reste plutôt que celui de Starlette.
bearer_scheme = HTTPBearer(auto_error=False)

SessionDep = Annotated[AsyncSession, Depends(get_session)]
RedisDep = Annotated[Redis, Depends(get_redis)]

_CREDENTIALS_ERROR = HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail="Authentification requise ou invalide",
    headers={"WWW-Authenticate": "Bearer"},
)


async def get_current_user(
    session: SessionDep,
    redis: RedisDep,
    credentials: Annotated[
        HTTPAuthorizationCredentials | None, Depends(bearer_scheme)
    ] = None,
) -> AdminUser:
    """Valide le jeton d'accès et charge l'utilisateur.

    Quatre contrôles successifs, dans cet ordre :
    1. signature et expiration du jeton,
    2. absence de révocation (Redis) — c'est ce qui rend la déconnexion
       réellement effective,
    3. existence du compte,
    4. compte actif et non supprimé.
    """
    if credentials is None:
        raise _CREDENTIALS_ERROR

    try:
        payload = decode_token(credentials.credentials, "access")
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Jeton expiré",
            headers={"WWW-Authenticate": "Bearer"},
        ) from None
    except jwt.InvalidTokenError:
        raise _CREDENTIALS_ERROR from None

    if await is_revoked(redis, payload["jti"]):
        raise _CREDENTIALS_ERROR

    from uuid import UUID

    user = await get_user_by_id(session, UUID(payload["sub"]))

    if user is None or not user.is_active or user.deleted_at is not None:
        raise _CREDENTIALS_ERROR

    return user


CurrentUser = Annotated[AdminUser, Depends(get_current_user)]


# ─────────────────────────────────────────────────────────────────────────
# Contrôle des rôles
# ─────────────────────────────────────────────────────────────────────────

# Hiérarchie : un rôle donne accès à tout ce que permettent les rangs
# inférieurs. Évite d'énumérer les rôles autorisés à chaque endpoint.
_ROLE_RANK: dict[AdminRole, int] = {
    AdminRole.VIEWER: 0,
    AdminRole.MODERATOR: 1,
    AdminRole.EDITOR: 2,
    AdminRole.ADMIN: 3,
    AdminRole.OWNER: 4,
}


def require_role(minimum: AdminRole):
    """Fabrique une dépendance exigeant un rang minimal.

    Usage :
        @router.delete("/produits/{id}", dependencies=[Depends(require_role(AdminRole.ADMIN))])
    """

    async def checker(user: CurrentUser) -> AdminUser:
        if _ROLE_RANK[user.role] < _ROLE_RANK[minimum]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Droits insuffisants pour cette opération",
            )
        return user

    return checker
