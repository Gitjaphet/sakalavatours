"""Routes d'authentification du back-office."""

from datetime import UTC, datetime
from typing import Annotated

import jwt
from fastapi import APIRouter, Cookie, HTTPException, Response, status

from src.api.deps import CurrentUser, RedisDep, SessionDep
from src.core.config import settings
from src.core.security import decode_token
from src.schemas.auth import (
    AdminUserRead,
    ChangePasswordRequest,
    LoginRequest,
    MessageResponse,
    TokenPair,
)
from src.services.auth import (
    AccountLockedError,
    AuthError,
    InactiveAccountError,
    authenticate,
    change_password,
    get_user_by_id,
    is_revoked,
    issue_tokens,
    revoke_token,
)

router = APIRouter(prefix="/auth", tags=["authentification"])

REFRESH_COOKIE = "sakalava_refresh"


def _set_refresh_cookie(response: Response, token: str) -> None:
    """Pose le jeton de rafraîchissement en cookie httpOnly.

    httpOnly  : inaccessible au JavaScript, donc à l'abri d'un XSS.
    secure    : HTTPS uniquement en production.
    samesite  : 'lax' protège du CSRF tout en survivant à une navigation
                depuis un lien externe.
    """
    response.set_cookie(
        key=REFRESH_COOKIE,
        value=token,
        httponly=True,
        secure=settings.is_production,
        samesite="lax",
        max_age=settings.REFRESH_TOKEN_DAYS * 24 * 3600,
        path="/",
    )


@router.post("/login", response_model=TokenPair)
async def login(
    payload: LoginRequest,
    response: Response,
    session: SessionDep,
) -> TokenPair:
    try:
        user = await authenticate(session, payload.email, payload.password)
    except AccountLockedError as e:
        raise HTTPException(status_code=status.HTTP_423_LOCKED, detail=str(e)) from None
    except InactiveAccountError as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e)) from None
    except AuthError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail=str(e)
        ) from None

    access, _, refresh, _ = issue_tokens(user)
    _set_refresh_cookie(response, refresh)

    return TokenPair(
        access_token=access,
        refresh_token=refresh,
        expires_in=settings.ACCESS_TOKEN_MINUTES * 60,
    )


@router.post("/refresh", response_model=TokenPair)
async def refresh_tokens(
    response: Response,
    session: SessionDep,
    redis: RedisDep,
    sakalava_refresh: Annotated[str | None, Cookie()] = None,
) -> TokenPair:
    """Échange un jeton de rafraîchissement contre une nouvelle paire.

    Rotation systématique : l'ancien refresh est révoqué à l'usage. Si un
    jeton volé est utilisé après le légitime, il sera déjà en liste de
    révocation et l'attaque échouera.
    """
    if sakalava_refresh is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Jeton de rafraîchissement absent",
        )

    try:
        payload = decode_token(sakalava_refresh, "refresh")
    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Jeton de rafraîchissement invalide",
        ) from None

    if await is_revoked(redis, payload["jti"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Jeton de rafraîchissement révoqué",
        )

    from uuid import UUID

    user = await get_user_by_id(session, UUID(payload["sub"]))
    if user is None or not user.is_active or user.deleted_at is not None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Compte indisponible"
        )

    remaining = int(payload["exp"] - datetime.now(UTC).timestamp())
    await revoke_token(redis, payload["jti"], remaining)

    access, _, new_refresh, _ = issue_tokens(user)
    _set_refresh_cookie(response, new_refresh)

    return TokenPair(
        access_token=access,
        refresh_token=new_refresh,
        expires_in=settings.ACCESS_TOKEN_MINUTES * 60,
    )


@router.post("/logout", response_model=MessageResponse)
async def logout(
    response: Response,
    redis: RedisDep,
    sakalava_refresh: Annotated[str | None, Cookie()] = None,
) -> MessageResponse:
    """Révoque le jeton de rafraîchissement et efface le cookie.

    L'access reste techniquement valide jusqu'à son expiration (15 min au
    pire) : c'est le compromis assumé des JWT. Pour une coupure immédiate,
    il faudrait révoquer aussi son jti — faisable si le besoin se présente.
    """
    if sakalava_refresh:
        try:
            payload = decode_token(sakalava_refresh, "refresh")
            remaining = int(payload["exp"] - datetime.now(UTC).timestamp())
            await revoke_token(redis, payload["jti"], remaining)
        except jwt.InvalidTokenError:
            pass  # jeton déjà invalide : rien à révoquer

    response.delete_cookie(REFRESH_COOKIE, path="/")
    return MessageResponse(message="Déconnexion effectuée")


@router.get("/me", response_model=AdminUserRead)
async def read_me(user: CurrentUser) -> AdminUserRead:
    return AdminUserRead.model_validate(user)


@router.post("/change-password", response_model=MessageResponse)
async def change_own_password(
    payload: ChangePasswordRequest,
    user: CurrentUser,
    session: SessionDep,
) -> MessageResponse:
    try:
        await change_password(session, user, payload.current_password, payload.new_password)
    except AuthError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail=str(e)
        ) from None

    return MessageResponse(message="Mot de passe modifié")
