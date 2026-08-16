"""Produits de démonstration — contenu réel ou mock, traduit en 4 langues.

Chaque produit porte ses traductions fr/en/de/it, saisies à la main à
partir du contenu français fourni par l'agence. seed_product() est
générique et gère la création idempotente (destination, image, produit,
traductions, itinéraire, taxonomies liées).

Usage :
    python -m src.scripts.seed_products
"""

import asyncio
from datetime import time
from decimal import Decimal
from typing import TypedDict

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

LOCALES = ("fr", "en", "de", "it")


class ProductTr(TypedDict):
    title: str
    subtitle: str
    region_label: str
    summary: str
    description_html: str
    practical_info: str
    meta_title: str
    meta_description: str


class StepTr(TypedDict):
    title: str
    description: str


class ItineraryStep(TypedDict):
    time_label: str
    is_optional: bool
    tr: dict[str, StepTr]  # locale -> titre/description


class ProductSeed(TypedDict):
    slug: str
    product_type: ProductType
    product_format: ProductFormat
    duration_days: int | None
    duration_nights: int | None
    duration_hours: Decimal | None
    departure_time: time | None
    return_time: time | None
    travel_minutes: int | None
    transport: TransportMode | None
    difficulty: DifficultyLevel
    group_min: int
    group_max: int
    hotel_pickup: bool
    price_from: Decimal
    is_featured: bool
    sort_order: int
    destination_code: str
    destination_names: dict[str, str]  # locale -> nom
    destination_region: str
    destination_lat: float
    destination_lng: float
    cover_filename: str
    cover_alt: dict[str, str]  # locale -> alt
    tr: dict[str, ProductTr]  # locale -> traduction produit
    itinerary: list[ItineraryStep]
    highlight_codes: list[str]
    inclusion_codes: list[str]
    packing_codes: list[str]


PRODUCTS: list[ProductSeed] = []


async def seed_product(s, data: ProductSeed) -> bool:
    existing = (await s.exec(select(Product).where(Product.slug == data["slug"]))).first()
    if existing:
        print(f"  '{data['slug']}' déjà présent — ignoré")
        return False

    # ── Destination ────────────────────────────────────────────────────
    dest = (
        await s.exec(select(Destination).where(Destination.code == data["destination_code"]))
    ).first()
    if dest is None:
        dest = Destination(
            code=data["destination_code"],
            slug=data["destination_code"],
            latitude=data["destination_lat"],
            longitude=data["destination_lng"],
            region=data["destination_region"],
            is_published=True,
        )
        s.add(dest)
        await s.flush()
        for loc in LOCALES:
            s.add(DestinationTranslation(
                destination_id=dest.id, locale=loc, name=data["destination_names"][loc]
            ))

    # ── Image de couverture (mock : réutilise un chemin statique existant) ─
    cover = Media(
        kind=MediaKind.IMAGE,
        filename=data["cover_filename"],
        storage_path=f"/images/hero/{data['cover_filename']}",
        mime_type="image/jpeg",
        file_size=0,
        width=2400,
        height=1600,
        folder=data["product_type"].value + "s",
    )
    s.add(cover)
    await s.flush()
    for loc in LOCALES:
        s.add(MediaTranslation(media_id=cover.id, locale=loc, alt_text=data["cover_alt"][loc]))

    # ── Produit ────────────────────────────────────────────────────────
    product = Product(
        slug=data["slug"],
        product_type=data["product_type"],
        product_format=data["product_format"],
        status=ContentStatus.PUBLISHED,
        is_published=True,
        duration_days=data["duration_days"],
        duration_nights=data["duration_nights"],
        duration_hours=data["duration_hours"],
        departure_time=data["departure_time"],
        return_time=data["return_time"],
        travel_minutes=data["travel_minutes"],
        transport=data["transport"],
        difficulty=data["difficulty"],
        group_min=data["group_min"],
        group_max=data["group_max"],
        hotel_pickup=data["hotel_pickup"],
        price_from=data["price_from"],
        currency="EUR",
        destination_id=dest.id,
        cover_media_id=cover.id,
        is_featured=data["is_featured"],
        sort_order=data["sort_order"],
    )
    s.add(product)
    await s.flush()

    for loc in LOCALES:
        tr = data["tr"][loc]
        s.add(ProductTranslation(
            product_id=product.id,
            locale=loc,
            title=tr["title"],
            subtitle=tr["subtitle"],
            region_label=tr["region_label"],
            summary=tr["summary"],
            description=tr["description_html"],
            practical_info=tr["practical_info"],
            meta_title=tr["meta_title"],
            meta_description=tr["meta_description"],
        ))

    for order, step in enumerate(data["itinerary"]):
        item = ProductItineraryItem(
            product_id=product.id,
            day_number=1,
            time_label=step["time_label"],
            sort_order=order,
            is_optional=step["is_optional"],
        )
        s.add(item)
        await s.flush()
        for loc in LOCALES:
            step_tr = step["tr"][loc]
            s.add(ProductItineraryTranslation(
                item_id=item.id, locale=loc,
                title=step_tr["title"], description=step_tr["description"],
            ))

    for order, code in enumerate(data["highlight_codes"]):
        hl = (await s.exec(select(Highlight).where(Highlight.code == code))).first()
        if hl:
            s.add(ProductHighlight(product_id=product.id, highlight_id=hl.id, sort_order=order))

    for order, code in enumerate(data["inclusion_codes"]):
        inc = (await s.exec(select(Inclusion).where(Inclusion.code == code))).first()
        if inc:
            s.add(ProductInclusion(
                product_id=product.id, inclusion_id=inc.id, is_included=True, sort_order=order
            ))

    for order, code in enumerate(data["packing_codes"]):
        pk = (await s.exec(select(PackingItem).where(PackingItem.code == code))).first()
        if pk:
            s.add(ProductPackingItem(product_id=product.id, packing_item_id=pk.id, sort_order=order))

    await s.commit()
    print(f"  '{data['slug']}' créé — {len(data['itinerary'])} étapes, 4 langues")
    return True


async def main() -> None:
    async with AsyncSessionFactory() as s:
        created = 0
        for data in PRODUCTS:
            if await seed_product(s, data):
                created += 1
        print(f"\n{created}/{len(PRODUCTS)} produit(s) créé(s)")



PRODUCTS.append({
    "slug": "cap-diego",
    "product_type": ProductType.EXCURSION,
    "product_format": ProductFormat.FULL_DAY,
    "duration_days": None,
    "duration_nights": None,
    "duration_hours": Decimal("7.25"),
    "departure_time": time(7, 45),
    "return_time": time(15, 0),
    "travel_minutes": 45,
    "transport": TransportMode.BOAT,
    "difficulty": DifficultyLevel.MODERATE,
    "group_min": 2,
    "group_max": 12,
    "hotel_pickup": True,
    "price_from": Decimal("75.00"),
    "is_featured": False,
    "sort_order": 3,
    "destination_code": "cap-diego",
    "destination_names": {
        "fr": "Cap Diego", "en": "Cap Diego",
        "de": "Cap Diego", "it": "Cap Diego",
    },
    "destination_region": "Diana",
    "destination_lat": -12.2667,
    "destination_lng": 49.3333,
    "cover_filename": "mont-passot.jpg",
    "cover_alt": {
        "fr": "Baobabs et paysage sauvage du Cap Diego, baie d'Antsiranana",
        "en": "Baobabs and wild landscape of Cap Diego, Antsiranana bay",
        "de": "Baobabs und wilde Landschaft von Cap Diego, Bucht von Antsiranana",
        "it": "Baobab e paesaggio selvaggio di Cap Diego, baia di Antsiranana",
    },
    "tr": {
        "fr": {
            "title": "Cap Diego",
            "subtitle": "Sur les traces de l'histoire, au cœur des baobabs",
            "region_label": "Baie d'Antsiranana, Diego Suarez",
            "summary": (
                "Randonnée parmi les baobabs et vestiges militaires du Cap Diego, "
                "au cœur de la baie d'Antsiranana. Histoire, nature sauvage et "
                "panoramas spectaculaires, loin des itinéraires les plus fréquentés."
            ),
            "description_html": (
                "<p>Au cœur de la baie d'Antsiranana, le Cap Diego dévoile un "
                "patrimoine riche et des paysages sauvages d'une grande beauté. "
                "Entre vestiges militaires et majestueux baobabs, partez à la "
                "découverte d'un lieu où l'histoire et la nature se rencontrent, "
                "loin des itinéraires les plus fréquentés.</p>"
            ),
            "practical_info": (
                "Randonnée de 2h30 à 3h selon le rythme du groupe. Prévoir de bonnes "
                "chaussures de marche et de l'eau."
            ),
            "meta_title": "Excursion Cap Diego — Baobabs et histoire | Sakalava Tours",
            "meta_description": (
                "Journée au Cap Diego au départ de Diego Suarez : randonnée parmi "
                "les baobabs, vestiges militaires et panoramas sur la baie "
                "d'Antsiranana. Transfert, guide et déjeuner inclus."
            ),
        },
        "en": {
            "title": "Cap Diego",
            "subtitle": "On the trail of history, amid the baobabs",
            "region_label": "Antsiranana Bay, Diego Suarez",
            "summary": (
                "A hike among the baobabs and military remains of Cap Diego, in "
                "the heart of Antsiranana Bay. History, wild nature and "
                "spectacular views, off the beaten track."
            ),
            "description_html": (
                "<p>In the heart of Antsiranana Bay, Cap Diego reveals a rich "
                "heritage and wild landscapes of great beauty. Between military "
                "remains and majestic baobabs, discover a place where history "
                "and nature meet, away from the busiest routes.</p>"
            ),
            "practical_info": (
                "2h30 to 3h hike depending on group pace. Bring sturdy walking "
                "shoes and water."
            ),
            "meta_title": "Cap Diego Excursion — Baobabs and history | Sakalava Tours",
            "meta_description": (
                "A day at Cap Diego from Diego Suarez: hiking among baobabs, "
                "military remains and views over Antsiranana Bay. Transfer, "
                "guide and lunch included."
            ),
        },
        "de": {
            "title": "Cap Diego",
            "subtitle": "Auf den Spuren der Geschichte, inmitten der Baobabs",
            "region_label": "Bucht von Antsiranana, Diego Suarez",
            "summary": (
                "Wanderung zwischen den Baobabs und militärischen Überresten von "
                "Cap Diego, mitten in der Bucht von Antsiranana. Geschichte, wilde "
                "Natur und spektakuläre Ausblicke, abseits der ausgetretenen Pfade."
            ),
            "description_html": (
                "<p>Im Herzen der Bucht von Antsiranana offenbart Cap Diego ein "
                "reiches Erbe und wilde Landschaften von großer Schönheit. Zwischen "
                "militärischen Überresten und majestätischen Baobabs entdecken Sie "
                "einen Ort, an dem Geschichte und Natur aufeinandertreffen.</p>"
            ),
            "practical_info": (
                "Wanderung von 2,5 bis 3 Stunden je nach Gruppentempo. Festes "
                "Schuhwerk und Wasser mitbringen."
            ),
            "meta_title": "Ausflug Cap Diego — Baobabs und Geschichte | Sakalava Tours",
            "meta_description": (
                "Ein Tag am Cap Diego ab Diego Suarez: Wanderung zwischen Baobabs, "
                "militärischen Überresten und Ausblicken auf die Bucht von "
                "Antsiranana. Transfer, Guide und Mittagessen inklusive."
            ),
        },
        "it": {
            "title": "Cap Diego",
            "subtitle": "Sulle tracce della storia, tra i baobab",
            "region_label": "Baia di Antsiranana, Diego Suarez",
            "summary": (
                "Escursione tra i baobab e i resti militari di Cap Diego, nel "
                "cuore della baia di Antsiranana. Storia, natura selvaggia e "
                "panorami spettacolari, lontano dagli itinerari più battuti."
            ),
            "description_html": (
                "<p>Nel cuore della baia di Antsiranana, Cap Diego rivela un "
                "patrimonio ricco e paesaggi selvaggi di grande bellezza. Tra "
                "resti militari e maestosi baobab, scoprite un luogo dove storia "
                "e natura si incontrano, lontano dagli itinerari più frequentati.</p>"
            ),
            "practical_info": (
                "Escursione di 2h30-3h a seconda del ritmo del gruppo. Portare "
                "scarpe da trekking e acqua."
            ),
            "meta_title": "Escursione Cap Diego — Baobab e storia | Sakalava Tours",
            "meta_description": (
                "Una giornata a Cap Diego da Diego Suarez: escursione tra i "
                "baobab, resti militari e panorami sulla baia di Antsiranana. "
                "Transfer, guida e pranzo inclusi."
            ),
        },
    },
    "itinerary": [
        {
            "time_label": "07h45", "is_optional": False,
            "tr": {
                "fr": {"title": "Départ de votre hôtel", "description": "Prise en charge à votre hôtel par votre guide et votre chauffeur, puis transfert vers le port de Diego Suarez. Traversée d'environ 45 minutes à travers la baie d'Antsiranana."},
                "en": {"title": "Departure from your hotel", "description": "Pick-up at your hotel by your guide and driver, then transfer to the port of Diego Suarez. About a 45-minute crossing of Antsiranana Bay."},
                "de": {"title": "Abfahrt vom Hotel", "description": "Abholung im Hotel durch Ihren Guide und Fahrer, dann Transfer zum Hafen von Diego Suarez. Etwa 45-minütige Überfahrt durch die Bucht von Antsiranana."},
                "it": {"title": "Partenza dall'hotel", "description": "Prelievo in hotel da parte della guida e dell'autista, poi trasferimento al porto di Diego Suarez. Traversata di circa 45 minuti nella baia di Antsiranana."},
            },
        },
        {
            "time_label": "09h00", "is_optional": False,
            "tr": {
                "fr": {"title": "Arrivée au Cap Diego", "description": "Randonnée d'environ 2h30 à 3h à la rencontre des majestueux baobabs, avec votre guide qui vous fait découvrir l'environnement et les points de vue sur la baie."},
                "en": {"title": "Arrival at Cap Diego", "description": "A 2h30 to 3h hike among the majestic baobabs, with your guide sharing the environment and viewpoints over the bay."},
                "de": {"title": "Ankunft am Cap Diego", "description": "2,5- bis 3-stündige Wanderung zu den majestätischen Baobabs, Ihr Guide zeigt Ihnen die Umgebung und die Aussichtspunkte auf die Bucht."},
                "it": {"title": "Arrivo a Cap Diego", "description": "Escursione di 2h30-3h alla scoperta dei maestosi baobab, con la guida che vi mostra l'ambiente e i punti panoramici sulla baia."},
            },
        },
        {
            "time_label": "12h30", "is_optional": False,
            "tr": {
                "fr": {"title": "Déjeuner et détente", "description": "Déjeuner préparé par votre capitaine à la grotte du Mess des Officiers, moment de repos dans un cadre chargé d'histoire."},
                "en": {"title": "Lunch and relaxation", "description": "Lunch prepared by your skipper at the Officers' Mess cave, a moment of rest in a historic setting."},
                "de": {"title": "Mittagessen und Entspannung", "description": "Mittagessen, zubereitet von Ihrem Kapitän, in der Grotte des Offiziersmesse — eine Rastpause an einem geschichtsträchtigen Ort."},
                "it": {"title": "Pranzo e relax", "description": "Pranzo preparato dal capitano presso la grotta del Mess degli Ufficiali, un momento di riposo in un luogo carico di storia."},
            },
        },
        {
            "time_label": "14h00", "is_optional": True,
            "tr": {
                "fr": {"title": "Cimetière français", "description": "Visite du cimetière français, autre témoignage de l'histoire de la région."},
                "en": {"title": "French cemetery", "description": "Visit to the French cemetery, another testimony to the region's history."},
                "de": {"title": "Französischer Friedhof", "description": "Besuch des französischen Friedhofs, ein weiteres Zeugnis der Geschichte der Region."},
                "it": {"title": "Cimitero francese", "description": "Visita al cimitero francese, un'altra testimonianza della storia della regione."},
            },
        },
        {
            "time_label": "15h00", "is_optional": False,
            "tr": {
                "fr": {"title": "Retour à Diego Suarez", "description": "Embarquement pour le retour vers Diego Suarez, puis transfert jusqu'à votre hôtel."},
                "en": {"title": "Return to Diego Suarez", "description": "Boat back to Diego Suarez, then transfer to your hotel."},
                "de": {"title": "Rückkehr nach Diego Suarez", "description": "Rückfahrt mit dem Boot nach Diego Suarez, anschließend Transfer zu Ihrem Hotel."},
                "it": {"title": "Ritorno a Diego Suarez", "description": "Imbarco per il ritorno a Diego Suarez, poi trasferimento in hotel."},
            },
        },
    ],
    "highlight_codes": ["baobabs", "military-heritage", "viewpoint"],
    "inclusion_codes": ["hotel-transfer", "boat", "guide", "lunch"],
    "packing_codes": ["hat", "sunscreen", "camera"],
})



PRODUCTS.append({
    "slug": "montagne-d-ambre",
    "product_type": ProductType.EXCURSION,
    "product_format": ProductFormat.FULL_DAY,
    "duration_days": None,
    "duration_nights": None,
    "duration_hours": Decimal("9.0"),
    "departure_time": time(8, 0),
    "return_time": time(17, 0),
    "travel_minutes": 75,
    "transport": TransportMode.VEHICLE,
    "difficulty": DifficultyLevel.EASY,
    "group_min": 2,
    "group_max": 12,
    "hotel_pickup": True,
    "price_from": Decimal("70.00"),
    "is_featured": False,
    "sort_order": 4,
    "destination_code": "montagne-d-ambre",
    "destination_names": {
        "fr": "Montagne d'Ambre", "en": "Montagne d'Ambre",
        "de": "Montagne d'Ambre", "it": "Montagne d'Ambre",
    },
    "destination_region": "Diana",
    "destination_lat": -12.5167,
    "destination_lng": 49.1667,
    "cover_filename": "lokobe.jpg",
    "cover_alt": {
        "fr": "Forêt humide et cascade de la Montagne d'Ambre",
        "en": "Rainforest and waterfall at Montagne d'Ambre",
        "de": "Regenwald und Wasserfall am Montagne d'Ambre",
        "it": "Foresta pluviale e cascata di Montagne d'Ambre",
    },
    "tr": {
        "fr": {
            "title": "Montagne d'Ambre",
            "subtitle": "Forêt tropicale, cascades sacrées et Joffreville colonial",
            "region_label": "Parc national, Diego Suarez",
            "summary": (
                "Immersion dans la forêt humide de la Montagne d'Ambre : lémuriens, "
                "caméléons et cascades sacrées, suivie d'une halte à Joffreville, "
                "ancien village colonial aux allures d'autrefois."
            ),
            "description_html": (
                "<p>Oasis de fraîcheur dressée au-dessus des plaines arides du Nord, "
                "la Montagne d'Ambre abrite une forêt tropicale humide luxuriante. "
                "Réputé pour sa biodiversité exceptionnelle, ses cascades sacrées et "
                "ses lacs de cratère, ce parc national est un sanctuaire naturel "
                "incontournable.</p><p>Cette immersion se prolonge par la découverte "
                "de Joffreville, ancien havre colonial aux bâtisses de charme.</p>"
            ),
            "practical_info": (
                "Chaussures de marche, vêtement chaud et anti-moustique recommandés."
            ),
            "meta_title": "Excursion Montagne d'Ambre — Parc national | Sakalava Tours",
            "meta_description": (
                "Journée à la Montagne d'Ambre au départ de Diego Suarez : forêt "
                "humide, lémuriens, cascade sacrée et village colonial de "
                "Joffreville. Transport 4x4, guide et déjeuner inclus."
            ),
        },
        "en": {
            "title": "Montagne d'Ambre",
            "subtitle": "Rainforest, sacred waterfalls and colonial Joffreville",
            "region_label": "National Park, Diego Suarez",
            "summary": (
                "Immersion in the rainforest of Montagne d'Ambre: lemurs, "
                "chameleons and sacred waterfalls, followed by a stop in "
                "Joffreville, a charming former colonial village."
            ),
            "description_html": (
                "<p>An oasis of coolness above the arid plains of the North, "
                "Montagne d'Ambre is home to a lush rainforest. Renowned for its "
                "exceptional biodiversity, sacred waterfalls and crater lakes, "
                "this national park is a must-see natural sanctuary.</p>"
                "<p>This immersion continues with a visit to Joffreville, a "
                "former colonial haven with charming buildings.</p>"
            ),
            "practical_info": (
                "Walking shoes, warm clothing and insect repellent recommended."
            ),
            "meta_title": "Montagne d'Ambre Excursion — National Park | Sakalava Tours",
            "meta_description": (
                "A day at Montagne d'Ambre from Diego Suarez: rainforest, lemurs, "
                "sacred waterfall and the colonial village of Joffreville. 4x4 "
                "transport, guide and lunch included."
            ),
        },
        "de": {
            "title": "Montagne d'Ambre",
            "subtitle": "Regenwald, heilige Wasserfälle und koloniales Joffreville",
            "region_label": "Nationalpark, Diego Suarez",
            "summary": (
                "Eintauchen in den Regenwald von Montagne d'Ambre: Lemuren, "
                "Chamäleons und heilige Wasserfälle, gefolgt von einem Halt in "
                "Joffreville, einem charmanten ehemaligen Kolonialdorf."
            ),
            "description_html": (
                "<p>Als kühle Oase über den trockenen Ebenen des Nordens beherbergt "
                "die Montagne d'Ambre einen üppigen Regenwald. Bekannt für seine "
                "außergewöhnliche Artenvielfalt, heilige Wasserfälle und Kraterseen, "
                "ist dieser Nationalpark ein unverzichtbares Naturschutzgebiet.</p>"
                "<p>Diese Erkundung wird durch einen Besuch in Joffreville "
                "fortgesetzt, einem ehemaligen Kolonialort mit charmanten Gebäuden.</p>"
            ),
            "practical_info": (
                "Wanderschuhe, warme Kleidung und Insektenschutzmittel empfohlen."
            ),
            "meta_title": "Ausflug Montagne d'Ambre — Nationalpark | Sakalava Tours",
            "meta_description": (
                "Ein Tag an der Montagne d'Ambre ab Diego Suarez: Regenwald, "
                "Lemuren, heiliger Wasserfall und das Kolonialdorf Joffreville. "
                "4x4-Transport, Guide und Mittagessen inklusive."
            ),
        },
        "it": {
            "title": "Montagne d'Ambre",
            "subtitle": "Foresta pluviale, cascate sacre e Joffreville coloniale",
            "region_label": "Parco nazionale, Diego Suarez",
            "summary": (
                "Immersione nella foresta pluviale di Montagne d'Ambre: lemuri, "
                "camaleonti e cascate sacre, seguita da una tappa a Joffreville, "
                "affascinante ex villaggio coloniale."
            ),
            "description_html": (
                "<p>Oasi di frescura sopra le pianure aride del Nord, Montagne "
                "d'Ambre ospita una lussureggiante foresta pluviale. Rinomato per "
                "la sua eccezionale biodiversità, le cascate sacre e i laghi "
                "craterici, questo parco nazionale è un santuario naturale "
                "imperdibile.</p><p>Questa immersione prosegue con la scoperta di "
                "Joffreville, ex rifugio coloniale dagli edifici affascinanti.</p>"
            ),
            "practical_info": (
                "Si consigliano scarpe da trekking, abbigliamento caldo e "
                "repellente per insetti."
            ),
            "meta_title": "Escursione Montagne d'Ambre — Parco nazionale | Sakalava Tours",
            "meta_description": (
                "Una giornata a Montagne d'Ambre da Diego Suarez: foresta "
                "pluviale, lemuri, cascata sacra e il villaggio coloniale di "
                "Joffreville. Trasporto 4x4, guida e pranzo inclusi."
            ),
        },
    },
    "itinerary": [
        {
            "time_label": "08h00", "is_optional": False,
            "tr": {
                "fr": {"title": "Départ de Diego Suarez", "description": "Prise en charge à votre hôtel en 4x4 et ascension vers les hauteurs, environ 1h15 de route."},
                "en": {"title": "Departure from Diego Suarez", "description": "Pick-up at your hotel by 4x4 and ascent to the highlands, about a 1h15 drive."},
                "de": {"title": "Abfahrt von Diego Suarez", "description": "Abholung im Hotel per 4x4 und Aufstieg in die Höhenlagen, etwa 1 Std. 15 Min. Fahrt."},
                "it": {"title": "Partenza da Diego Suarez", "description": "Prelievo in hotel in 4x4 e salita verso le alture, circa 1h15 di strada."},
            },
        },
        {
            "time_label": "09h15", "is_optional": False,
            "tr": {
                "fr": {"title": "Immersion à la Montagne d'Ambre", "description": "Randonnée guidée sur les sentiers du parc à la recherche de la faune endémique — lémuriens, caméléons — et halte à la Cascade Sacrée."},
                "en": {"title": "Immersion in Montagne d'Ambre", "description": "Guided hike along the park's trails in search of endemic wildlife — lemurs, chameleons — with a stop at the Sacred Waterfall."},
                "de": {"title": "Eintauchen in die Montagne d'Ambre", "description": "Geführte Wanderung auf den Pfaden des Parks auf der Suche nach endemischer Tierwelt — Lemuren, Chamäleons — mit Halt am Heiligen Wasserfall."},
                "it": {"title": "Immersione a Montagne d'Ambre", "description": "Escursione guidata lungo i sentieri del parco alla ricerca della fauna endemica — lemuri, camaleonti — con sosta alla Cascata Sacra."},
            },
        },
        {
            "time_label": "12h30", "is_optional": False,
            "tr": {
                "fr": {"title": "Pause déjeuner à Joffreville", "description": "Repas gourmand préparé avec des produits locaux dans une table d'hôte ou un relais de charme du village."},
                "en": {"title": "Lunch break in Joffreville", "description": "A hearty meal prepared with local produce at a guesthouse or charming village inn."},
                "de": {"title": "Mittagspause in Joffreville", "description": "Köstliches Essen aus lokalen Produkten in einer Gästetafel oder einem charmanten Dorfgasthaus."},
                "it": {"title": "Pausa pranzo a Joffreville", "description": "Pasto gustoso preparato con prodotti locali in una tavola d'ospiti o in una locanda del villaggio."},
            },
        },
        {
            "time_label": "14h00", "is_optional": False,
            "tr": {
                "fr": {"title": "Visite culturelle de Joffreville", "description": "Promenade à pied dans le village pour admirer ses anciennes demeures coloniales, échanger avec les habitants et profiter des points de vue sur la côte."},
                "en": {"title": "Cultural visit of Joffreville", "description": "A walk through the village to admire its old colonial houses, meet locals and enjoy views over the coast."},
                "de": {"title": "Kulturbesuch in Joffreville", "description": "Spaziergang durch das Dorf, um die alten Kolonialhäuser zu bewundern, mit Einheimischen zu sprechen und die Aussicht auf die Küste zu genießen."},
                "it": {"title": "Visita culturale di Joffreville", "description": "Passeggiata nel villaggio per ammirare le antiche case coloniali, incontrare gli abitanti e godersi i panorami sulla costa."},
            },
        },
        {
            "time_label": "15h30", "is_optional": False,
            "tr": {
                "fr": {"title": "Route retour", "description": "Descente vers Diego Suarez avec arrêts photos sur les panoramas de la baie, arrivée prévue vers 17h00."},
                "en": {"title": "Return route", "description": "Descent to Diego Suarez with photo stops over the bay panoramas, arrival expected around 5pm."},
                "de": {"title": "Rückweg", "description": "Abstieg nach Diego Suarez mit Fotostopps an den Panoramen der Bucht, Ankunft gegen 17:00 Uhr."},
                "it": {"title": "Percorso di ritorno", "description": "Discesa verso Diego Suarez con soste fotografiche sui panorami della baia, arrivo previsto verso le 17:00."},
            },
        },
    ],
    "highlight_codes": ["lemurs", "primary-forest", "viewpoint"],
    "inclusion_codes": ["hotel-transfer", "guide", "lunch", "park-entrance"],
    "packing_codes": ["hat", "sunscreen", "camera"],
})
if __name__ == "__main__":
    asyncio.run(main())
