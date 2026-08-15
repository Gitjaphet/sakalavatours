"""Point d'entrée unique des modèles.

Importer ce paquet suffit à peupler SQLModel.metadata avec les 50 tables.
Sans ça, chaque script devrait lister les modules dont il dépend — et un
oubli produit une NoReferencedTableError au premier flush, ou pire, une
migration Alembic qui supprime les tables manquantes.

⚠ Toute nouvelle famille de modèles doit être ajoutée ici.
"""

from src.models import (  # noqa: F401
    base,
    blog,
    booking,
    enums,
    media,
    page,
    product,
    review,
    system,
    taxonomy,
)
