"""Hachage de mots de passe et jetons JWT.

Deux jetons plutôt qu'un seul :

- ACCESS (15 min) — porté à chaque requête. Court par conception : s'il
  fuite, la fenêtre d'exploitation est minuscule.
- REFRESH (14 j) — sert uniquement à obtenir un nouvel access. Stocké en
  cookie httpOnly, jamais accessible au JavaScript.

Chaque jeton porte un `jti` (identifiant unique) qui permet de le révoquer
via Redis — sans lui, un JWT reste valide jusqu'à son expiration même
après une déconnexion ou une compromission.
"""

from datetime import UTC, datetime, timedelta
from typing import Any, Literal
from uuid import UUID, uuid4

import jwt
from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError

from src.core.config import settings

_hasher = PasswordHasher()

ALGORITHM = "HS256"

TokenType = Literal["access", "refresh", "email_verify"]


# ─────────────────────────────────────────────────────────────────────────
# Mots de passe
# ─────────────────────────────────────────────────────────────────────────


def hash_password(plain: str) -> str:
    return _hasher.hash(plain)


def verify_password(plain: str, hashed: str) -> bool:
    try:
        _hasher.verify(hashed, plain)
    except VerifyMismatchError:
        return False
    except Exception:
        # Hachage corrompu ou format inconnu : on refuse, on ne devine pas.
        return False
    return True


def needs_rehash(hashed: str) -> bool:
    """True si le hachage utilise des paramètres obsolètes.

    À vérifier à chaque connexion réussie : permet de renforcer
    progressivement les hachages sans demander aux utilisateurs de changer
    de mot de passe.
    """
    return _hasher.check_needs_rehash(hashed)


# ─────────────────────────────────────────────────────────────────────────
# Jetons
# ─────────────────────────────────────────────────────────────────────────


def _create_token(
    subject: UUID,
    token_type: TokenType,
    expires_delta: timedelta,
    extra: dict[str, Any] | None = None,
) -> tuple[str, str]:
    """Retourne (jeton_encodé, jti).

    Le `jti` est renvoyé séparément pour être stocké côté Redis lors
    d'une révocation.
    """
    now = datetime.now(UTC)
    jti = str(uuid4())

    payload: dict[str, Any] = {
        "sub": str(subject),
        "type": token_type,
        "jti": jti,
        "iat": now,
        "exp": now + expires_delta,
    }
    if extra:
        payload.update(extra)

    encoded = jwt.encode(payload, settings.SECRET_KEY, algorithm=ALGORITHM)
    return encoded, jti


def create_access_token(user_id: UUID, role: str) -> tuple[str, str]:
    """Le rôle est embarqué pour éviter une requête base à chaque appel.

    Contrepartie assumée : un changement de rôle ne prend effet qu'au
    renouvellement du jeton, soit 15 minutes au pire. Pour une révocation
    immédiate, on passe par la liste de révocation Redis.
    """
    return _create_token(
        subject=user_id,
        token_type="access",
        expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_MINUTES),
        extra={"role": role},
    )


def create_refresh_token(user_id: UUID) -> tuple[str, str]:
    return _create_token(
        subject=user_id,
        token_type="refresh",
        expires_delta=timedelta(days=settings.REFRESH_TOKEN_DAYS),
    )


def create_email_verify_token(review_id: UUID) -> tuple[str, str]:
    """Jeton de confirmation d'adresse, envoyé au déposant d'un avis.

    48 heures : assez pour qu'un email passé en indésirable soit
    retrouvé, assez court pour qu'un lien intercepté plus tard ne serve
    à rien. Aucun stockage — la signature suffit à prouver l'origine, et
    email_verified_at témoigne du résultat.
    """
    return _create_token(
        subject=review_id,
        token_type="email_verify",
        expires_delta=timedelta(hours=48),
    )


def decode_token(token: str, expected_type: TokenType) -> dict[str, Any]:
    """Décode et valide un jeton.

    Lève jwt.InvalidTokenError si la signature est invalide, le jeton
    expiré, ou le type inattendu. Ce dernier contrôle est essentiel : sans
    lui, un jeton de rafraîchissement (14 jours) pourrait servir de jeton
    d'accès et annuler tout l'intérêt de la durée courte.
    """
    payload: dict[str, Any] = jwt.decode(
        token,
        settings.SECRET_KEY,
        algorithms=[ALGORITHM],
        options={"require": ["exp", "sub", "type", "jti"]},
    )

    if payload.get("type") != expected_type:
        raise jwt.InvalidTokenError(
            f"Type de jeton inattendu : {payload.get('type')!r}, attendu {expected_type!r}"
        )

    return payload
