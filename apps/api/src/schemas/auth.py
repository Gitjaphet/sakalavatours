"""Contrats d'API pour l'authentification.

⚠ Ces classes sont des BaseModel Pydantic, PAS des SQLModel table=True.
La séparation est délibérée : un modèle de table renvoyé directement dans
une réponse fait fuiter password_hash, failed_login_count et locked_until.
"""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr, Field

from src.models.enums import AdminRole


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=200)


class TokenPair(BaseModel):
    """Réponse de connexion.

    Le refresh_token est renvoyé ici pour permettre les tests via Swagger,
    mais le routeur le pose AUSSI en cookie httpOnly. En production, c'est
    le cookie qui fait foi côté navigateur : un jeton stocké en
    localStorage est lisible par n'importe quel script injecté.
    """

    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int = Field(description="Durée de validité de l'access, en secondes")


class AdminUserRead(BaseModel):
    """Profil renvoyé à l'utilisateur connecté.

    Contient uniquement ce que l'intéressé peut voir sur lui-même.
    Aucun champ de sécurité (hachage, compteur d'échecs, verrou).
    """

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    email: EmailStr
    full_name: str
    role: AdminRole
    preferred_locale: str
    is_active: bool
    last_login_at: datetime | None = None
    avatar_media_id: UUID | None = None


class ChangePasswordRequest(BaseModel):
    current_password: str = Field(min_length=1, max_length=200)
    new_password: str = Field(
        min_length=12,
        max_length=200,
        description="12 caractères minimum. La longueur prime sur la complexité.",
    )


class MessageResponse(BaseModel):
    message: str
