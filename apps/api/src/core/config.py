"""Configuration typée, validée au démarrage.

Une variable manquante fait échouer le lancement immédiatement plutôt que
de provoquer un None inexplicable trois heures plus tard.
"""

from functools import lru_cache
from typing import Literal

from pydantic import Field, PostgresDsn, computed_field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    ENVIRONMENT: Literal["development", "staging", "production"] = "development"
    DEBUG: bool = False
    PROJECT_NAME: str = "Sakalava Tours API"
    API_V1_PREFIX: str = "/api/v1"

    POSTGRES_USER: str
    POSTGRES_PASSWORD: str
    POSTGRES_DB: str
    POSTGRES_HOST: str = "localhost"
    POSTGRES_PORT: int = 5432

    REDIS_URL: str = "redis://localhost:6379/0"

    SECRET_KEY: str = Field(min_length=32, description="openssl rand -hex 32")
    ACCESS_TOKEN_MINUTES: int = 15
    REFRESH_TOKEN_DAYS: int = 14

    CORS_ORIGINS: list[str] = []

    DEFAULT_LOCALE: str = "fr"
    SUPPORTED_LOCALES: list[str] = ["fr", "en", "de", "it"]

    # ── Email ──────────────────────────────────────────────────────
    # SMTP_HOST vide = mode console : les emails s'affichent dans les logs
    # au lieu d'être envoyés. Permet de développer sans serveur mail.
    SMTP_HOST: str = ""
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_USE_TLS: bool = True
    EMAIL_FROM: str = "contact@sakalavatours.com"
    EMAIL_FROM_NAME: str = "Sakalava Tours"
    AGENCY_NOTIFY_EMAIL: str = ""
    ADMIN_BASE_URL: str = "http://localhost:3000/admin"
    # Racine du site public, sans locale ni barre finale. Sert à
    # construire les liens envoyés par email.
    PUBLIC_SITE_URL: str = "http://localhost:3000"

    # ── Stockage des médias (Cloudflare R2) ────────────────────────
    # R2 expose une API compatible S3 : boto3 fonctionne tel quel, avec
    # une région fixée à "auto" — R2 ne gère pas les régions AWS.
    R2_ACCOUNT_ID: str = ""
    R2_ACCESS_KEY_ID: str = ""
    R2_SECRET_ACCESS_KEY: str = ""
    R2_BUCKET: str = ""
    R2_ENDPOINT: str = ""
    R2_PUBLIC_URL: str = ""

    # Garde-fous d'upload
    MAX_UPLOAD_MB: int = 12
    IMAGE_MAX_WIDTH: int = 2400
    
    NEXTJS_REVALIDATE_URL: str = ""
    NEXTJS_REVALIDATE_SECRET: str = ""

    @computed_field
    @property
    def DATABASE_URL(self) -> str:
        """URL asynchrone utilisée par l'application."""
        return str(
            PostgresDsn.build(
                scheme="postgresql+psycopg",
                username=self.POSTGRES_USER,
                password=self.POSTGRES_PASSWORD,
                host=self.POSTGRES_HOST,
                port=self.POSTGRES_PORT,
                path=self.POSTGRES_DB,
            )
        )

    @computed_field
    @property
    def is_production(self) -> bool:
        return self.ENVIRONMENT == "production"


@lru_cache
def get_settings() -> Settings:
    """Mise en cache : le fichier .env n'est lu qu'une fois par processus."""
    return Settings()  # type: ignore[call-arg]


settings = get_settings()
