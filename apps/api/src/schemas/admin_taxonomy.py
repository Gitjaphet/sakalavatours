"""Contrats d'écriture pour les taxonomies partagées.

Les trois taxonomies (points forts, prestations, à prévoir) partagent le
même patron : code + icône + ordre sur la table parente, libellé traduit
par langue sur la table de traduction. Un seul jeu de schémas les couvre
donc toutes les trois.

`detail` n'existe que sur InclusionTranslation : il est optionnel ici et
simplement ignoré pour les deux autres types.
"""

from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator


class TaxonomyTranslationIn(BaseModel):
    """Libellé d'un élément de taxonomie dans une langue."""

    locale: str = Field(min_length=2, max_length=5)
    label: str = Field(min_length=1, max_length=150)
    detail: str | None = Field(
        default=None,
        max_length=300,
        description="Prestations uniquement — ignoré ailleurs",
    )


class TaxonomyTranslationOut(TaxonomyTranslationIn):
    model_config = ConfigDict(from_attributes=True)
    id: UUID


class TaxonomyCreate(BaseModel):
    """Création d'un élément de taxonomie.

    ⚠ `code` est un identifiant stable référencé par le frontend et par
    les produits existants. Il ne doit jamais être réutilisé pour autre
    chose une fois créé.
    """

    code: str = Field(min_length=1, max_length=60)
    icon: str | None = Field(default=None, max_length=60)
    sort_order: int = 0
    translations: list[TaxonomyTranslationIn] = Field(min_length=1)

    @field_validator("translations")
    @classmethod
    def check_locales_unique(cls, v: list[TaxonomyTranslationIn]):
        locales = [t.locale for t in v]
        if len(locales) != len(set(locales)):
            raise ValueError("Une seule traduction par langue")
        return v


class TaxonomyUpdate(BaseModel):
    """Modification partielle.

    Comme pour les produits : champs absents = inchangés, liste présente =
    REMPLACE intégralement l'existant.
    """

    code: str | None = Field(default=None, min_length=1, max_length=60)
    icon: str | None = Field(default=None, max_length=60)
    sort_order: int | None = None
    translations: list[TaxonomyTranslationIn] | None = None


class TaxonomyOut(BaseModel):
    """Élément de taxonomie avec toutes ses traductions."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    code: str
    icon: str | None = None
    sort_order: int
    translations: list[TaxonomyTranslationOut] = Field(default_factory=list)


class TaxonomyListResponse(BaseModel):
    items: list[TaxonomyOut]
    total: int