"""Données de départ.

Idempotent : relançable sans créer de doublons. Chaque insertion vérifie
d'abord l'existence par son `code` ou sa `key`, qui sont uniques.

Usage :
    python -m src.scripts.seed
"""

import asyncio
import os
import secrets

from sqlmodel import select

import src.models  # noqa: F401 — peuple SQLModel.metadata (50 tables)
from src.core.database import AsyncSessionFactory
from src.core.security import hash_password
from src.models.enums import AdminRole
from src.models.system import AdminUser, Setting
from src.models.taxonomy import (
    Highlight,
    HighlightTranslation,
    Inclusion,
    InclusionTranslation,
    PackingItem,
    PackingItemTranslation,
)

LOCALES = ("fr", "en", "de", "it")

HIGHLIGHTS: dict[str, tuple[str, dict[str, str]]] = {
    "white-sandbank": ("IconBeach", {
        "fr": "Banc de sable blanc", "en": "White sandbank",
        "de": "Weiße Sandbank", "it": "Banco di sabbia bianca",
    }),
    "fishing-village": ("IconHome", {
        "fr": "Village de pêcheurs", "en": "Fishing village",
        "de": "Fischerdorf", "it": "Villaggio di pescatori",
    }),
    "lighthouse": ("IconBuildingLighthouse", {
        "fr": "Phare & panorama", "en": "Lighthouse & views",
        "de": "Leuchtturm & Aussicht", "it": "Faro e panorama",
    }),
    "snorkeling": ("IconScubaMask", {
        "fr": "Snorkeling", "en": "Snorkelling",
        "de": "Schnorcheln", "it": "Snorkeling",
    }),
    "sea-turtles": ("IconFish", {
        "fr": "Tortues marines", "en": "Sea turtles",
        "de": "Meeresschildkröten", "it": "Tartarughe marine",
    }),
    "lemurs": ("IconPaw", {
        "fr": "Lémuriens", "en": "Lemurs",
        "de": "Lemuren", "it": "Lemuri",
    }),
    "baobabs": ("IconTree", {
        "fr": "Baobabs majestueux", "en": "Majestic baobabs",
        "de": "Majestätische Baobabs", "it": "Baobab maestosi",
    }),
    "military-heritage": ("IconBuildingCastle", {
        "fr": "Patrimoine militaire", "en": "Military heritage",
        "de": "Militärisches Erbe", "it": "Patrimonio militare",
    }),
    "viewpoint": ("IconMountain", {
        "fr": "Point de vue", "en": "Viewpoint",
        "de": "Aussichtspunkt", "it": "Punto panoramico",
    }),
    "mangrove": ("IconTree", {
        "fr": "Mangrove", "en": "Mangroves",
        "de": "Mangroven", "it": "Mangrovie",
    }),
    "sunset": ("IconSunset", {
        "fr": "Coucher de soleil", "en": "Sunset",
        "de": "Sonnenuntergang", "it": "Tramonto",
    }),
    "primary-forest": ("IconTrees", {
        "fr": "Forêt primaire", "en": "Primary forest",
        "de": "Urwald", "it": "Foresta primaria",
    }),
}

INCLUSIONS: dict[str, tuple[str, dict[str, str]]] = {
    "hotel-transfer": ("IconBus", {
        "fr": "Transfert hôtel", "en": "Hotel transfer",
        "de": "Hoteltransfer", "it": "Transfer hotel",
    }),
    "boat": ("IconSailboat", {
        "fr": "Transport en bateau", "en": "Boat transport",
        "de": "Bootstransport", "it": "Trasporto in barca",
    }),
    "guide": ("IconUserCheck", {
        "fr": "Guide local", "en": "Local guide",
        "de": "Lokaler Guide", "it": "Guida locale",
    }),
    "lunch": ("IconToolsKitchen2", {
        "fr": "Déjeuner", "en": "Lunch",
        "de": "Mittagessen", "it": "Pranzo",
    }),
    "snack": ("IconCoffee", {
        "fr": "Collation", "en": "Snack",
        "de": "Imbiss", "it": "Spuntino",
    }),
    "water": ("IconBottle", {
        "fr": "Eau minérale", "en": "Mineral water",
        "de": "Mineralwasser", "it": "Acqua minerale",
    }),
    "snorkel-gear": ("IconScubaMask", {
        "fr": "Masque, tuba et palmes", "en": "Mask, snorkel and fins",
        "de": "Maske, Schnorchel und Flossen", "it": "Maschera, boccaglio e pinne",
    }),
    "park-entrance": ("IconTicket", {
        "fr": "Entrée du parc", "en": "Park entrance",
        "de": "Parkeintritt", "it": "Ingresso al parco",
    }),
}

PACKING: dict[str, tuple[str, dict[str, str]]] = {
    "swimsuit": ("IconShirt", {
        "fr": "Maillot de bain", "en": "Swimsuit",
        "de": "Badebekleidung", "it": "Costume da bagno",
    }),
    "towel": ("IconWash", {
        "fr": "Serviette", "en": "Towel",
        "de": "Handtuch", "it": "Asciugamano",
    }),
    "sunscreen": ("IconSun", {
        "fr": "Crème solaire", "en": "Sunscreen",
        "de": "Sonnencreme", "it": "Crema solare",
    }),
    "hat": ("IconHat", {
        "fr": "Chapeau ou casquette", "en": "Hat or cap",
        "de": "Hut oder Kappe", "it": "Cappello o berretto",
    }),
    "sunglasses": ("IconSunglasses", {
        "fr": "Lunettes de soleil", "en": "Sunglasses",
        "de": "Sonnenbrille", "it": "Occhiali da sole",
    }),
    "camera": ("IconCamera", {
        "fr": "Appareil photo", "en": "Camera",
        "de": "Kamera", "it": "Macchina fotografica",
    }),
}

# Remplacent le nav-config.ts codé en dur côté Next.
SETTINGS: list[tuple[str, str, str]] = [
    ("business.name", "Sakalava Tours", "identity"),
    ("business.founding_year", "2019", "identity"),
    ("business.locality", "Nosy Be", "identity"),
    ("business.region", "Diana", "identity"),
    ("business.country", "MG", "identity"),
    ("business.latitude", "-13.3167", "identity"),
    ("business.longitude", "48.2667", "identity"),
    ("contact.phone", "+261322208362", "contact"),
    ("contact.phone_display", "+261 32 22 083 62", "contact"),
    ("contact.email", "sakalavatour@gmail.com", "contact"),
    ("contact.whatsapp", "261322208362", "contact"),
    ("social.facebook", "https://facebook.com/sakalavatours", "social"),
    ("social.instagram", "https://instagram.com/sakalavatours", "social"),
]


async def seed_taxonomy(session, model, trans_model, fk_name, data) -> int:
    created = 0
    for order, (code, (icon, labels)) in enumerate(data.items()):
        result = await session.exec(select(model).where(model.code == code))
        if result.first():
            continue
        item = model(code=code, icon=icon, sort_order=order)
        session.add(item)
        await session.flush()
        for locale in LOCALES:
            session.add(
                trans_model(**{fk_name: item.id}, locale=locale, label=labels[locale])
            )
        created += 1
    return created


async def main() -> None:
    async with AsyncSessionFactory() as session:
        email = os.getenv("SEED_ADMIN_EMAIL", "admin@sakalavatours.com")
        result = await session.exec(select(AdminUser).where(AdminUser.email == email))

        if result.first():
            print(f"Compte admin déjà présent : {email}")
        else:
            # Mot de passe aléatoire affiché UNE SEULE FOIS. Ne jamais coder
            # un mot de passe par défaut : celui qu'on oublie de changer est
            # la première porte d'entrée d'une intrusion.
            password = os.getenv("SEED_ADMIN_PASSWORD") or secrets.token_urlsafe(16)
            session.add(
                AdminUser(
                    email=email,
                    password_hash=hash_password(password),
                    full_name="Administrateur",
                    role=AdminRole.OWNER,
                    is_active=True,
                )
            )
            print("=" * 62)
            print("  Compte administrateur créé")
            print(f"  Email        : {email}")
            print(f"  Mot de passe : {password}")
            print("  ⚠ Notez-le maintenant, il ne sera plus jamais affiché.")
            print("=" * 62)

        n1 = await seed_taxonomy(
            session, Highlight, HighlightTranslation, "highlight_id", HIGHLIGHTS
        )
        n2 = await seed_taxonomy(
            session, Inclusion, InclusionTranslation, "inclusion_id", INCLUSIONS
        )
        n3 = await seed_taxonomy(
            session, PackingItem, PackingItemTranslation, "packing_item_id", PACKING
        )

        n4 = 0
        for key, value, group in SETTINGS:
            result = await session.exec(select(Setting).where(Setting.key == key))
            if result.first():
                continue
            session.add(Setting(key=key, value=value, group=group, is_public=True))
            n4 += 1

        await session.commit()

        print(
            f"{n1} points forts, {n2} prestations, "
            f"{n3} affaires à prévoir, {n4} réglages"
        )


if __name__ == "__main__":
    asyncio.run(main())
