"""Configuration Alembic pour SQLModel en mode asynchrone.

Deux points à comprendre :

1. L'import explicite de TOUS les modules de modèles est obligatoire.
   SQLModel.metadata ne connaît que les classes réellement importées ;
   un module oublié ici produit une migration qui SUPPRIME ses tables.

2. `compare_type=True` détecte les changements de type de colonne.
   Désactivé par défaut, ce qui fait rater les modifications de longueur
   de champ (varchar(100) → varchar(200)).
"""

import asyncio
from logging.config import fileConfig

from alembic import context
from sqlalchemy.engine import Connection
from sqlalchemy.ext.asyncio import async_engine_from_config
from sqlmodel import SQLModel

from src.core.config import settings

# ⚠ Ces imports semblent inutilisés — ils ne le sont pas.
# Ils peuplent SQLModel.metadata. Toute nouvelle famille de modèles
# doit être ajoutée ici, sinon Alembic croira qu'elle a été supprimée.
import src.models  # noqa: F401 — peuple SQLModel.metadata

config = context.config
config.set_main_option("sqlalchemy.url", settings.DATABASE_URL)

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = SQLModel.metadata


def run_migrations_offline() -> None:
    context.configure(
        url=settings.DATABASE_URL,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        compare_type=True,
        compare_server_default=True,
    )
    with context.begin_transaction():
        context.run_migrations()


def do_run_migrations(connection: Connection) -> None:
    context.configure(
        connection=connection,
        target_metadata=target_metadata,
        compare_type=True,
        compare_server_default=True,
    )
    with context.begin_transaction():
        context.run_migrations()


async def run_async_migrations() -> None:
    connectable = async_engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=None,
    )
    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)
    await connectable.dispose()


def run_migrations_online() -> None:
    asyncio.run(run_async_migrations())


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
