"""Produits de démonstration — contenu réel fourni par l'agence.

⚠ Volontairement en FRANÇAIS UNIQUEMENT.

Deux raisons : traduire un programme horaire complet en 4 langues se fait
depuis l'admin, pas dans un script ; et ça permet de VÉRIFIER le repli de
langue — une requête en italien doit renvoyer le français avec
is_fallback=true.

Usage :
    python -m src.scripts.seed_products
"""

import asyncio
from datetime import time
from decimal import Decimal

from sqlmodel import select

import src.models  # noqa: F401
from src.core.database import AsyncSessionFactory
from src.models.enums import (
    ContentStatus,
    DifficultyLevel,
    MediaKind,
    ProductFormat,
    ProductType,
    TransportMode,
)
from src.models.media import Media, MediaTranslation
from src.models.product import (
    Product,
    ProductHighlight,
    ProductInclusion,
    ProductItineraryItem,
    ProductItineraryTranslation,
    ProductPackingItem,
    ProductTranslation,
)
from src.models.taxonomy import (
    Destination,
    DestinationTranslation,
    Highlight,
    Inclusion,
    PackingItem,
)

SLUG = "nosy-iranja"

ITINERARY = [
    ("07h30", "Départ de votre hôtel",
     "Départ de votre hôtel en direction du port, puis embarquement à bord de "
     "notre bateau pour rejoindre Nosy Iranja. La navigation dure environ 1h30, "
     "selon les conditions de mer.", False),
    ("09h30", "Arrivée à Nosy Iranja",
     "Première découverte de l'île et de son célèbre banc de sable blanc. "
     "Profitez de ce moment pour vous promener, prendre vos photos et admirer "
     "les différentes nuances de bleu qui entourent les deux îlots.", False),
    ("10h30", "Découverte de l'île",
     "Accompagné de votre guide, partez à la découverte de Nosy Iranja. Vous "
     "pourrez découvrir le village de pêcheurs, observer la vie locale et, selon "
     "les conditions et le temps disponible, rejoindre le phare pour profiter "
     "d'une belle vue panoramique sur les deux îlots et l'océan.", True),
    ("12h30", "Déjeuner aux saveurs locales",
     "Déjeuner dans un cadre agréable à l'ombre des cocotiers. Au menu, selon "
     "les arrivages : produits de la mer frais, poisson grillé, crevettes, "
     "accompagnements locaux, crudités et fruits tropicaux.", False),
    ("14h00", "Baignade et snorkeling",
     "Place à la détente dans les eaux cristallines de Nosy Iranja. Masque, tuba "
     "et palmes à disposition pour découvrir les fonds marins et observer les "
     "poissons tropicaux. La présence de tortues marines est connue dans la "
     "région, mais leur observation dépend des conditions et de la chance.", True),
    ("15h00", "Dernier moment sur l'île",
     "Temps libre pour profiter de la plage, vous baigner ou simplement vous "
     "détendre avant le départ. C'est aussi le moment idéal pour prendre "
     "quelques dernières photos du banc de sable.", False),
    ("15h30", "Retour vers Nosy Be",
     "Embarquement et départ de Nosy Iranja. Profitez une dernière fois des "
     "paysages de l'archipel pendant la navigation retour.", False),
    ("17h00", "Arrivée à Nosy Be",
     "Retour à votre hôtel, avec les souvenirs d'une belle journée passée entre "
     "mer, nature et découverte de la vie locale.", False),
]

HIGHLIGHT_CODES = ["white-sandbank", "fishing-village", "lighthouse", "snorkeling"]
INCLUSION_CODES = ["hotel-transfer", "boat", "guide", "lunch", "water", "snorkel-gear"]
PACKING_CODES = ["swimsuit", "towel", "sunscreen", "hat", "sunglasses", "camera"]


async def main() -> None:
    async with AsyncSessionFactory() as s:
        existing = (await s.exec(select(Product).where(Product.slug == SLUG))).first()
        if existing:
            print(f"Produit '{SLUG}' déjà présent — rien à faire.")
            return

        # ── Destination ────────────────────────────────────────────────
        dest = (
            await s.exec(select(Destination).where(Destination.code == "nosy-iranja"))
        ).first()
        if dest is None:
            dest = Destination(
                code="nosy-iranja",
                slug="nosy-iranja",
                latitude=-13.6167,
                longitude=47.8333,
                region="Diana",
                is_published=True,
            )
            s.add(dest)
            await s.flush()
            for loc, name in [
                ("fr", "Nosy Iranja"), ("en", "Nosy Iranja"),
                ("de", "Nosy Iranja"), ("it", "Nosy Iranja"),
            ]:
                s.add(DestinationTranslation(
                    destination_id=dest.id, locale=loc, name=name
                ))

        # ── Image de couverture ────────────────────────────────────────
        cover = Media(
            kind=MediaKind.IMAGE,
            filename="nosy-iranja.jpg",
            storage_path="/images/hero/nosy-iranja.jpg",
            mime_type="image/jpeg",
            file_size=0,
            width=2400,
            height=1600,
            folder="excursions",
        )
        s.add(cover)
        await s.flush()
        s.add(MediaTranslation(
            media_id=cover.id, locale="fr",
            alt_text="Banc de sable blanc reliant les deux îlots de Nosy Iranja",
        ))

        # ── Produit ────────────────────────────────────────────────────
        product = Product(
            slug=SLUG,
            product_type=ProductType.EXCURSION,
            product_format=ProductFormat.FULL_DAY,
            status=ContentStatus.PUBLISHED,
            is_published=True,
            duration_hours=Decimal("9.5"),
            departure_time=time(7, 30),
            return_time=time(17, 0),
            travel_minutes=90,
            transport=TransportMode.BOAT,
            difficulty=DifficultyLevel.EASY,
            group_min=2,
            group_max=12,
            hotel_pickup=True,
            price_from=Decimal("85.00"),
            currency="EUR",
            destination_id=dest.id,
            cover_media_id=cover.id,
            is_featured=True,
            sort_order=1,
        )
        s.add(product)
        await s.flush()

        s.add(ProductTranslation(
            product_id=product.id,
            locale="fr",
            title="Nosy Iranja",
            subtitle="Un joyau de l'océan Indien",
            region_label="Archipel de Nosy Be",
            summary=(
                "Deux îlots reliés par un magnifique banc de sable blanc qui se "
                "dévoile à marée descendante. Village de pêcheurs, montée au phare "
                "et snorkeling dans des eaux turquoise."
            ),
            description=(
                "<p>À environ 1h30 de navigation de Nosy Be, Nosy Iranja vous invite "
                "à découvrir l'un des paysages les plus emblématiques de la région. "
                "L'archipel est composé de deux îlots reliés par un magnifique banc "
                "de sable blanc, qui apparaît davantage lorsque la marée descend.</p>"
                "<p>Entre eaux turquoise, plages de sable blanc, village de pêcheurs, "
                "découverte du phare et snorkeling, cette journée vous permet de "
                "profiter de Nosy Iranja tout en prenant le temps de découvrir son "
                "environnement et sa vie locale.</p>"
            ),
            practical_info=(
                "Les horaires et le déroulement des activités peuvent être adaptés "
                "en fonction des conditions météorologiques, de l'état de la mer et "
                "des horaires de marée."
            ),
            meta_title="Excursion Nosy Iranja à la journée | Sakalava Tours",
            meta_description=(
                "Journée à Nosy Iranja au départ de Nosy Be : banc de sable blanc, "
                "village de pêcheurs, phare et snorkeling. Transfert, guide et "
                "déjeuner inclus."
            ),
        ))

        # ── Programme ──────────────────────────────────────────────────
        for order, (label, title, desc, optional) in enumerate(ITINERARY):
            item = ProductItineraryItem(
                product_id=product.id,
                day_number=1,
                time_label=label,
                sort_order=order,
                is_optional=optional,
            )
            s.add(item)
            await s.flush()
            s.add(ProductItineraryTranslation(
                item_id=item.id, locale="fr", title=title, description=desc
            ))

        # ── Liaisons taxonomiques ──────────────────────────────────────
        for order, code in enumerate(HIGHLIGHT_CODES):
            hl = (await s.exec(select(Highlight).where(Highlight.code == code))).first()
            if hl:
                s.add(ProductHighlight(
                    product_id=product.id, highlight_id=hl.id, sort_order=order
                ))

        for order, code in enumerate(INCLUSION_CODES):
            inc = (await s.exec(select(Inclusion).where(Inclusion.code == code))).first()
            if inc:
                s.add(ProductInclusion(
                    product_id=product.id, inclusion_id=inc.id,
                    is_included=True, sort_order=order,
                ))

        for order, code in enumerate(PACKING_CODES):
            pk = (await s.exec(select(PackingItem).where(PackingItem.code == code))).first()
            if pk:
                s.add(ProductPackingItem(
                    product_id=product.id, packing_item_id=pk.id, sort_order=order
                ))

        await s.commit()
        print(f"Produit '{SLUG}' créé — {len(ITINERARY)} étapes, "
              f"{len(HIGHLIGHT_CODES)} points forts, {len(INCLUSION_CODES)} prestations")


if __name__ == "__main__":
    asyncio.run(main())
