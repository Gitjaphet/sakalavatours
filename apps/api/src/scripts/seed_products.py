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

PRODUCTS.append({
    "slug": "les-circuits-nord-de-madagascar-11jours-10-nuits",
    "product_type": ProductType.CIRCUIT,
    "product_format": ProductFormat.MULTI_DAY,
    "duration_days": 11, "duration_nights": 10,
    "duration_hours": None, "departure_time": None, "return_time": None,
    "travel_minutes": None, "transport": TransportMode.MIXED,
    "difficulty": DifficultyLevel.MODERATE,
    "group_min": 2, "group_max": 8, "hotel_pickup": True,
    "price_from": Decimal("890.00"), "is_featured": True, "sort_order": 5,
    "destination_code": "nord-madagascar",
    "destination_names": {"fr": "Nord de Madagascar", "en": "Northern Madagascar", "de": "Norden Madagaskars", "it": "Nord del Madagascar"},
    "destination_region": "Diana & SAVA", "destination_lat": -13.0, "destination_lng": 49.0,
    "cover_filename": "baobab.jpeg",
    "cover_alt": {"fr": "Paysage du nord de Madagascar", "en": "Landscape of northern Madagascar", "de": "Landschaft im Norden Madagaskars", "it": "Paesaggio del nord del Madagascar"},
    "tr": {
        "fr": {"title": "Le Nord de Madagascar", "subtitle": "Notre itinéraire le plus complet", "region_label": "Diana & SAVA",
               "summary": "Onze jours pour traverser tout le nord : tsingy rouges, baie de Diego, plantations de vanille et archipel de Nosy Be.",
               "description_html": "<p>Un circuit complet à travers le nord de Madagascar, entre nature, culture et littoral.</p>",
               "practical_info": "Circuit modéré, adapté à la plupart des niveaux de forme physique.",
               "meta_title": "Circuit 11 jours Nord Madagascar | Sakalava Tours", "meta_description": "Onze jours pour découvrir le nord de Madagascar : tsingy, baie de Diego, vanille et archipel de Nosy Be."},
        "en": {"title": "Northern Madagascar", "subtitle": "Our most complete itinerary", "region_label": "Diana & SAVA",
               "summary": "Eleven days across the whole north: red tsingy, Diego bay, vanilla plantations and the Nosy Be archipelago.",
               "description_html": "<p>A complete tour of northern Madagascar, between nature, culture and coastline.</p>",
               "practical_info": "Moderate tour, suitable for most fitness levels.",
               "meta_title": "11-Day Northern Madagascar Tour | Sakalava Tours", "meta_description": "Eleven days to discover northern Madagascar: tsingy, Diego bay, vanilla and the Nosy Be archipelago."},
        "de": {"title": "Norden Madagaskars", "subtitle": "Unsere umfassendste Reiseroute", "region_label": "Diana & SAVA",
               "summary": "Elf Tage durch den gesamten Norden: rote Tsingy, Bucht von Diego, Vanilleplantagen und das Nosy-Be-Archipel.",
               "description_html": "<p>Eine umfassende Reise durch den Norden Madagaskars zwischen Natur, Kultur und Küste.</p>",
               "practical_info": "Moderate Rundreise, für die meisten Fitnesslevel geeignet.",
               "meta_title": "11-tägige Rundreise Norden Madagaskars | Sakalava Tours", "meta_description": "Elf Tage, um den Norden Madagaskars zu entdecken: Tsingy, Bucht von Diego, Vanille und das Nosy-Be-Archipel."},
        "it": {"title": "Nord del Madagascar", "subtitle": "Il nostro itinerario più completo", "region_label": "Diana & SAVA",
               "summary": "Undici giorni per attraversare tutto il nord: tsingy rossi, baia di Diego, piantagioni di vaniglia e arcipelago di Nosy Be.",
               "description_html": "<p>Un tour completo del nord del Madagascar, tra natura, cultura e costa.</p>",
               "practical_info": "Tour moderato, adatto alla maggior parte dei livelli di forma fisica.",
               "meta_title": "Tour 11 giorni Nord Madagascar | Sakalava Tours", "meta_description": "Undici giorni per scoprire il nord del Madagascar: tsingy, baia di Diego, vaniglia e arcipelago di Nosy Be."},
    },
    "itinerary": [
        {"time_label": "Jour 1", "is_optional": False, "tr": {
            "fr": {"title": "Départ et mise en route", "description": "Accueil et transfert vers la première étape du circuit."},
            "en": {"title": "Departure and start", "description": "Welcome and transfer to the first stage of the tour."},
            "de": {"title": "Abfahrt und Start", "description": "Empfang und Transfer zur ersten Etappe der Rundreise."},
            "it": {"title": "Partenza e avvio", "description": "Accoglienza e trasferimento alla prima tappa del tour."},
        }},
        {"time_label": "Jour 11", "is_optional": False, "tr": {
            "fr": {"title": "Retour", "description": "Dernière matinée libre, puis transfert retour."},
            "en": {"title": "Return", "description": "Free last morning, then transfer back."},
            "de": {"title": "Rückkehr", "description": "Letzter freier Vormittag, dann Rücktransfer."},
            "it": {"title": "Ritorno", "description": "Ultima mattinata libera, poi trasferimento di ritorno."},
        }},
    ],
    "highlight_codes": ["primary-forest", "white-sandbank", "sunset"],
    "inclusion_codes": ["hotel-transfer", "guide", "lunch"],
    "packing_codes": ["hat", "sunscreen", "camera"],
})

PRODUCTS.append({
    "slug": "circuit-nature-traditions-du-nord-8-jours-7-nuits",
    "product_type": ProductType.CIRCUIT,
    "product_format": ProductFormat.MULTI_DAY,
    "duration_days": 8, "duration_nights": 7,
    "duration_hours": None, "departure_time": None, "return_time": None,
    "travel_minutes": None, "transport": TransportMode.MIXED,
    "difficulty": DifficultyLevel.MODERATE,
    "group_min": 2, "group_max": 8, "hotel_pickup": True,
    "price_from": Decimal("690.00"), "is_featured": False, "sort_order": 6,
    "destination_code": "diana-nord",
    "destination_names": {"fr": "Diana", "en": "Diana", "de": "Diana", "it": "Diana"},
    "destination_region": "Diana", "destination_lat": -12.8, "destination_lng": 49.2,
    "cover_filename": "mont-passot.jpg",
    "cover_alt": {"fr": "Réserve naturelle et village sakalava", "en": "Nature reserve and sakalava village", "de": "Naturreservat und Sakalava-Dorf", "it": "Riserva naturale e villaggio sakalava"},
    "tr": {
        "fr": {"title": "Nature & Traditions du Nord", "subtitle": "Réserves naturelles et villages sakalava", "region_label": "Diana, Madagascar",
               "summary": "Huit jours entre réserves naturelles et villages sakalava, rencontres avec les artisans et nuits chez l'habitant.",
               "description_html": "<p>Un circuit entre nature préservée et traditions locales dans la région Diana.</p>",
               "practical_info": "Circuit modéré, marche quotidienne modérée.",
               "meta_title": "Circuit 8 jours Nature & Traditions | Sakalava Tours", "meta_description": "Huit jours entre réserves naturelles et villages sakalava dans le nord de Madagascar."},
        "en": {"title": "Nature & Traditions of the North", "subtitle": "Nature reserves and sakalava villages", "region_label": "Diana, Madagascar",
               "summary": "Eight days between nature reserves and sakalava villages, meeting craftspeople and staying with locals.",
               "description_html": "<p>A tour between preserved nature and local traditions in the Diana region.</p>",
               "practical_info": "Moderate tour, moderate daily walking.",
               "meta_title": "8-Day Nature & Traditions Tour | Sakalava Tours", "meta_description": "Eight days between nature reserves and sakalava villages in northern Madagascar."},
        "de": {"title": "Natur & Traditionen des Nordens", "subtitle": "Naturreservate und Sakalava-Dörfer", "region_label": "Diana, Madagaskar",
               "summary": "Acht Tage zwischen Naturreservaten und Sakalava-Dörfern, Begegnungen mit Handwerkern und Übernachtungen bei Einheimischen.",
               "description_html": "<p>Eine Rundreise zwischen unberührter Natur und lokalen Traditionen in der Region Diana.</p>",
               "practical_info": "Moderate Rundreise, moderate tägliche Wanderungen.",
               "meta_title": "8-tägige Rundreise Natur & Traditionen | Sakalava Tours", "meta_description": "Acht Tage zwischen Naturreservaten und Sakalava-Dörfern im Norden Madagaskars."},
        "it": {"title": "Natura & Tradizioni del Nord", "subtitle": "Riserve naturali e villaggi sakalava", "region_label": "Diana, Madagascar",
               "summary": "Otto giorni tra riserve naturali e villaggi sakalava, incontri con artigiani e notti in famiglia.",
               "description_html": "<p>Un tour tra natura incontaminata e tradizioni locali nella regione Diana.</p>",
               "practical_info": "Tour moderato, cammino giornaliero moderato.",
               "meta_title": "Tour 8 giorni Natura & Tradizioni | Sakalava Tours", "meta_description": "Otto giorni tra riserve naturali e villaggi sakalava nel nord del Madagascar."},
    },
    "itinerary": [
        {"time_label": "Jour 1", "is_optional": False, "tr": {
            "fr": {"title": "Départ et mise en route", "description": "Accueil et transfert vers la première réserve naturelle."},
            "en": {"title": "Departure and start", "description": "Welcome and transfer to the first nature reserve."},
            "de": {"title": "Abfahrt und Start", "description": "Empfang und Transfer zum ersten Naturreservat."},
            "it": {"title": "Partenza e avvio", "description": "Accoglienza e trasferimento alla prima riserva naturale."},
        }},
        {"time_label": "Jour 8", "is_optional": False, "tr": {
            "fr": {"title": "Retour", "description": "Dernière matinée libre, puis transfert retour."},
            "en": {"title": "Return", "description": "Free last morning, then transfer back."},
            "de": {"title": "Rückkehr", "description": "Letzter freier Vormittag, dann Rücktransfer."},
            "it": {"title": "Ritorno", "description": "Ultima mattinata libera, poi trasferimento di ritorno."},
        }},
    ],
    "highlight_codes": ["primary-forest", "lemurs", "fishing-village"],
    "inclusion_codes": ["hotel-transfer", "guide", "lunch"],
    "packing_codes": ["hat", "sunscreen", "camera"],
})

PRODUCTS.append({
    "slug": "circuit-sava",
    "product_type": ProductType.CIRCUIT,
    "product_format": ProductFormat.MULTI_DAY,
    "duration_days": 6, "duration_nights": 5,
    "duration_hours": None, "departure_time": None, "return_time": None,
    "travel_minutes": None, "transport": TransportMode.VEHICLE,
    "difficulty": DifficultyLevel.MODERATE,
    "group_min": 2, "group_max": 8, "hotel_pickup": True,
    "price_from": Decimal("590.00"), "is_featured": False, "sort_order": 7,
    "destination_code": "sava",
    "destination_names": {"fr": "SAVA", "en": "SAVA", "de": "SAVA", "it": "SAVA"},
    "destination_region": "SAVA", "destination_lat": -14.3, "destination_lng": 50.2,
    "cover_filename": "nosy-tanikely.jpg",
    "cover_alt": {"fr": "Route de la vanille, région SAVA", "en": "Vanilla route, SAVA region", "de": "Vanilleroute, SAVA-Region", "it": "Strada della vaniglia, regione SAVA"},
    "tr": {
        "fr": {"title": "Circuit SAVA", "subtitle": "La route de la vanille", "region_label": "Sambava, Antalaha, Vohémar, Andapa",
               "summary": "La route de la vanille et du parc de Marojejy, une région préservée entre océan Indien et forêt humide.",
               "description_html": "<p>Un circuit dans la région SAVA, entre plantations de vanille et nature préservée.</p>",
               "practical_info": "Circuit modéré, routes parfois longues entre les étapes.",
               "meta_title": "Circuit SAVA — Route de la vanille | Sakalava Tours", "meta_description": "Un circuit dans la région SAVA de Madagascar, entre vanille, océan et forêt humide."},
        "en": {"title": "SAVA Tour", "subtitle": "The vanilla route", "region_label": "Sambava, Antalaha, Vohémar, Andapa",
               "summary": "The vanilla route and Marojejy park, a region still untouched by mass tourism between ocean and rainforest.",
               "description_html": "<p>A tour of the SAVA region, between vanilla plantations and preserved nature.</p>",
               "practical_info": "Moderate tour, roads can be long between stages.",
               "meta_title": "SAVA Tour — Vanilla Route | Sakalava Tours", "meta_description": "A tour of Madagascar's SAVA region, between vanilla, ocean and rainforest."},
        "de": {"title": "SAVA-Rundreise", "subtitle": "Die Vanilleroute", "region_label": "Sambava, Antalaha, Vohémar, Andapa",
               "summary": "Die Vanilleroute und der Marojejy-Park, eine noch unberührte Region zwischen Indischem Ozean und Regenwald.",
               "description_html": "<p>Eine Rundreise durch die Region SAVA, zwischen Vanilleplantagen und unberührter Natur.</p>",
               "practical_info": "Moderate Rundreise, teils lange Fahrten zwischen den Etappen.",
               "meta_title": "SAVA-Rundreise — Vanilleroute | Sakalava Tours", "meta_description": "Eine Rundreise durch die Region SAVA Madagaskars, zwischen Vanille, Ozean und Regenwald."},
        "it": {"title": "Tour SAVA", "subtitle": "La strada della vaniglia", "region_label": "Sambava, Antalaha, Vohémar, Andapa",
               "summary": "La strada della vaniglia e il parco di Marojejy, una regione ancora incontaminata tra oceano e foresta pluviale.",
               "description_html": "<p>Un tour nella regione SAVA, tra piantagioni di vaniglia e natura incontaminata.</p>",
               "practical_info": "Tour moderato, strade a volte lunghe tra le tappe.",
               "meta_title": "Tour SAVA — Strada della vaniglia | Sakalava Tours", "meta_description": "Un tour nella regione SAVA del Madagascar, tra vaniglia, oceano e foresta pluviale."},
    },
    "itinerary": [
        {"time_label": "Jour 1", "is_optional": False, "tr": {
            "fr": {"title": "Départ et mise en route", "description": "Accueil et transfert vers Sambava."},
            "en": {"title": "Departure and start", "description": "Welcome and transfer to Sambava."},
            "de": {"title": "Abfahrt und Start", "description": "Empfang und Transfer nach Sambava."},
            "it": {"title": "Partenza e avvio", "description": "Accoglienza e trasferimento a Sambava."},
        }},
        {"time_label": "Jour 6", "is_optional": False, "tr": {
            "fr": {"title": "Retour", "description": "Dernière matinée libre, puis transfert retour."},
            "en": {"title": "Return", "description": "Free last morning, then transfer back."},
            "de": {"title": "Rückkehr", "description": "Letzter freier Vormittag, dann Rücktransfer."},
            "it": {"title": "Ritorno", "description": "Ultima mattinata libera, poi trasferimento di ritorno."},
        }},
    ],
    "highlight_codes": ["primary-forest", "mangrove", "viewpoint"],
    "inclusion_codes": ["hotel-transfer", "guide", "lunch"],
    "packing_codes": ["hat", "sunscreen", "camera"],
})

PRODUCTS.append({
    "slug": "tours-des-archipels-de-nosy-be",
    "product_type": ProductType.CIRCUIT,
    "product_format": ProductFormat.MULTI_DAY,
    "duration_days": 4, "duration_nights": 3,
    "duration_hours": None, "departure_time": None, "return_time": None,
    "travel_minutes": None, "transport": TransportMode.BOAT,
    "difficulty": DifficultyLevel.EASY,
    "group_min": 2, "group_max": 8, "hotel_pickup": True,
    "price_from": Decimal("450.00"), "is_featured": True, "sort_order": 8,
    "destination_code": "archipel-nosy-be",
    "destination_names": {"fr": "Archipel de Nosy Be", "en": "Nosy Be Archipelago", "de": "Nosy-Be-Archipel", "it": "Arcipelago di Nosy Be"},
    "destination_region": "Diana", "destination_lat": -13.35, "destination_lng": 48.25,
    "cover_filename": "nosy-iranja.jpg",
    "cover_alt": {"fr": "Navigation entre les îles de l'archipel de Nosy Be", "en": "Sailing between the islands of the Nosy Be archipelago", "de": "Segeln zwischen den Inseln des Nosy-Be-Archipels", "it": "Navigazione tra le isole dell'arcipelago di Nosy Be"},
    "tr": {
        "fr": {"title": "Tour des archipels de Nosy Be", "subtitle": "Navigation entre trois îles", "region_label": "Archipel de Nosy Be",
               "summary": "Quatre jours de navigation entre Nosy Iranja, Nosy Komba et Nosy Sakatia. Snorkeling, bancs de sable et couchers de soleil en boutre.",
               "description_html": "<p>Un circuit maritime à travers les plus belles îles de l'archipel de Nosy Be.</p>",
               "practical_info": "Circuit facile, adapté à tous niveaux.",
               "meta_title": "Circuit 4 jours Archipel Nosy Be | Sakalava Tours", "meta_description": "Quatre jours de navigation entre les îles de l'archipel de Nosy Be."},
        "en": {"title": "Nosy Be Archipelago Tour", "subtitle": "Sailing between three islands", "region_label": "Nosy Be Archipelago",
               "summary": "Four days sailing between Nosy Iranja, Nosy Komba and Nosy Sakatia. Snorkeling, sandbanks and sunsets aboard a dhow.",
               "description_html": "<p>A maritime tour through the most beautiful islands of the Nosy Be archipelago.</p>",
               "practical_info": "Easy tour, suitable for all levels.",
               "meta_title": "4-Day Nosy Be Archipelago Tour | Sakalava Tours", "meta_description": "Four days sailing between the islands of the Nosy Be archipelago."},
        "de": {"title": "Nosy-Be-Archipel-Rundreise", "subtitle": "Segeln zwischen drei Inseln", "region_label": "Nosy-Be-Archipel",
               "summary": "Vier Tage Segeln zwischen Nosy Iranja, Nosy Komba und Nosy Sakatia. Schnorcheln, Sandbänke und Sonnenuntergänge an Bord einer Dhau.",
               "description_html": "<p>Eine Bootstour durch die schönsten Inseln des Nosy-Be-Archipels.</p>",
               "practical_info": "Leichte Rundreise, für alle Niveaus geeignet.",
               "meta_title": "4-tägige Nosy-Be-Archipel-Rundreise | Sakalava Tours", "meta_description": "Vier Tage Segeln zwischen den Inseln des Nosy-Be-Archipels."},
        "it": {"title": "Tour degli arcipelaghi di Nosy Be", "subtitle": "Navigazione tra tre isole", "region_label": "Arcipelago di Nosy Be",
               "summary": "Quattro giorni di navigazione tra Nosy Iranja, Nosy Komba e Nosy Sakatia. Snorkeling, banchi di sabbia e tramonti su un dhow.",
               "description_html": "<p>Un tour marittimo tra le isole più belle dell'arcipelago di Nosy Be.</p>",
               "practical_info": "Tour facile, adatto a tutti i livelli.",
               "meta_title": "Tour 4 giorni Arcipelago Nosy Be | Sakalava Tours", "meta_description": "Quattro giorni di navigazione tra le isole dell'arcipelago di Nosy Be."},
    },
    "itinerary": [
        {"time_label": "Jour 1", "is_optional": False, "tr": {
            "fr": {"title": "Départ vers Nosy Iranja", "description": "Embarquement et navigation vers le premier îlot."},
            "en": {"title": "Departure to Nosy Iranja", "description": "Boarding and sailing to the first islet."},
            "de": {"title": "Abfahrt nach Nosy Iranja", "description": "Einschiffung und Fahrt zur ersten Insel."},
            "it": {"title": "Partenza per Nosy Iranja", "description": "Imbarco e navigazione verso il primo isolotto."},
        }},
        {"time_label": "Jour 4", "is_optional": False, "tr": {
            "fr": {"title": "Retour à Nosy Be", "description": "Dernière matinée en mer, puis retour au port."},
            "en": {"title": "Return to Nosy Be", "description": "Last morning at sea, then return to port."},
            "de": {"title": "Rückkehr nach Nosy Be", "description": "Letzter Vormittag auf See, dann Rückkehr zum Hafen."},
            "it": {"title": "Ritorno a Nosy Be", "description": "Ultima mattinata in mare, poi ritorno al porto."},
        }},
    ],
    "highlight_codes": ["white-sandbank", "snorkeling", "sunset"],
    "inclusion_codes": ["boat", "guide", "lunch"],
    "packing_codes": ["swimsuit", "sunscreen", "camera"],
})

PRODUCTS.append({
    "slug": "une-experience-authentique",
    "product_type": ProductType.CIRCUIT,
    "product_format": ProductFormat.MULTI_DAY,
    "duration_days": 3, "duration_nights": 2,
    "duration_hours": None, "departure_time": None, "return_time": None,
    "travel_minutes": None, "transport": TransportMode.MIXED,
    "difficulty": DifficultyLevel.EASY,
    "group_min": 2, "group_max": 8, "hotel_pickup": True,
    "price_from": Decimal("340.00"), "is_featured": False, "sort_order": 9,
    "destination_code": "nosy-be-environs",
    "destination_names": {"fr": "Nosy Be & environs", "en": "Nosy Be & surroundings", "de": "Nosy Be & Umgebung", "it": "Nosy Be e dintorni"},
    "destination_region": "Diana", "destination_lat": -13.32, "destination_lng": 48.26,
    "cover_filename": "nosy-tanikely.jpg",
    "cover_alt": {"fr": "Vie de village près de Nosy Be", "en": "Village life near Nosy Be", "de": "Dorfleben bei Nosy Be", "it": "Vita di villaggio vicino a Nosy Be"},
    "tr": {
        "fr": {"title": "Une expérience authentique", "subtitle": "Au rythme des villages", "region_label": "Nosy Be & environs",
               "summary": "Trois jours au rythme des villages : pêche au lever du jour, cuisine sakalava et veillée musicale, loin des sentiers touristiques.",
               "description_html": "<p>Un séjour immersif au cœur de la vie locale autour de Nosy Be.</p>",
               "practical_info": "Circuit facile, hébergement chez l'habitant.",
               "meta_title": "Circuit 3 jours Expérience authentique | Sakalava Tours", "meta_description": "Trois jours d'immersion dans la vie locale autour de Nosy Be."},
        "en": {"title": "An Authentic Experience", "subtitle": "At the pace of the villages", "region_label": "Nosy Be & surroundings",
               "summary": "Three days at the pace of the villages: dawn fishing, sakalava cooking and a musical evening, off the tourist trail.",
               "description_html": "<p>An immersive stay in local life around Nosy Be.</p>",
               "practical_info": "Easy tour, homestay accommodation.",
               "meta_title": "3-Day Authentic Experience Tour | Sakalava Tours", "meta_description": "Three days immersed in local life around Nosy Be."},
        "de": {"title": "Ein authentisches Erlebnis", "subtitle": "Im Rhythmus der Dörfer", "region_label": "Nosy Be & Umgebung",
               "summary": "Drei Tage im Rhythmus der Dörfer: Fischfang bei Sonnenaufgang, Sakalava-Küche und ein musikalischer Abend, abseits der Touristenpfade.",
               "description_html": "<p>Ein immersiver Aufenthalt im lokalen Leben rund um Nosy Be.</p>",
               "practical_info": "Leichte Rundreise, Unterkunft bei Einheimischen.",
               "meta_title": "3-tägige authentische Erlebnisreise | Sakalava Tours", "meta_description": "Drei Tage eingetaucht in das lokale Leben rund um Nosy Be."},
        "it": {"title": "Un'esperienza autentica", "subtitle": "Al ritmo dei villaggi", "region_label": "Nosy Be e dintorni",
               "summary": "Tre giorni al ritmo dei villaggi: pesca all'alba, cucina sakalava e serata musicale, lontano dai sentieri turistici.",
               "description_html": "<p>Un soggiorno immersivo nella vita locale intorno a Nosy Be.</p>",
               "practical_info": "Tour facile, alloggio in famiglia.",
               "meta_title": "Tour 3 giorni Esperienza autentica | Sakalava Tours", "meta_description": "Tre giorni immersi nella vita locale intorno a Nosy Be."},
    },
    "itinerary": [
        {"time_label": "Jour 1", "is_optional": False, "tr": {
            "fr": {"title": "Arrivée au village", "description": "Accueil par la famille d'accueil et découverte du quotidien."},
            "en": {"title": "Arrival at the village", "description": "Welcome by the host family and discovery of daily life."},
            "de": {"title": "Ankunft im Dorf", "description": "Empfang durch die Gastfamilie und Einblick in den Alltag."},
            "it": {"title": "Arrivo al villaggio", "description": "Accoglienza da parte della famiglia ospitante e scoperta della vita quotidiana."},
        }},
        {"time_label": "Jour 3", "is_optional": False, "tr": {
            "fr": {"title": "Retour", "description": "Dernière matinée avec la famille, puis transfert retour."},
            "en": {"title": "Return", "description": "Last morning with the family, then transfer back."},
            "de": {"title": "Rückkehr", "description": "Letzter Vormittag bei der Familie, dann Rücktransfer."},
            "it": {"title": "Ritorno", "description": "Ultima mattinata con la famiglia, poi trasferimento di ritorno."},
        }},
    ],
    "highlight_codes": ["fishing-village", "sunset"],
    "inclusion_codes": ["guide", "lunch"],
    "packing_codes": ["hat", "sunscreen", "camera"],
})

PRODUCTS.append({
    "slug": "randonnees-immersive-a-nosy-komba",
    "product_type": ProductType.CIRCUIT,
    "product_format": ProductFormat.MULTI_DAY,
    "duration_days": 2, "duration_nights": 1,
    "duration_hours": None, "departure_time": None, "return_time": None,
    "travel_minutes": None, "transport": TransportMode.BOAT,
    "difficulty": DifficultyLevel.SPORTY,
    "group_min": 2, "group_max": 8, "hotel_pickup": True,
    "price_from": Decimal("220.00"), "is_featured": False, "sort_order": 10,
    "destination_code": "nosy-komba",
    "destination_names": {"fr": "Nosy Komba", "en": "Nosy Komba", "de": "Nosy Komba", "it": "Nosy Komba"},
    "destination_region": "Diana", "destination_lat": -13.45, "destination_lng": 48.35,
    "cover_filename": "lokobe.jpg",
    "cover_alt": {"fr": "Sentier de randonnée sur l'île de Nosy Komba", "en": "Hiking trail on Nosy Komba island", "de": "Wanderweg auf der Insel Nosy Komba", "it": "Sentiero escursionistico sull'isola di Nosy Komba"},
    "tr": {
        "fr": {"title": "Randonnée immersive à Nosy Komba", "subtitle": "L'île aux lémuriens", "region_label": "Nosy Komba, Nosy Be",
               "summary": "Deux jours de marche sur l'île aux lémuriens, du village de Ampangorina au sommet. Nuit chez l'habitant et rencontre avec les brodeuses.",
               "description_html": "<p>Une randonnée immersive à travers l'île de Nosy Komba, entre nature et rencontres locales.</p>",
               "practical_info": "Circuit sportif, bonne condition physique recommandée.",
               "meta_title": "Randonnée 2 jours Nosy Komba | Sakalava Tours", "meta_description": "Deux jours de randonnée immersive sur l'île de Nosy Komba."},
        "en": {"title": "Immersive Hike on Nosy Komba", "subtitle": "The lemur island", "region_label": "Nosy Komba, Nosy Be",
               "summary": "Two days of hiking on the lemur island, from the village of Ampangorina to the summit. Homestay night and meeting embroiderers.",
               "description_html": "<p>An immersive hike across Nosy Komba island, between nature and local encounters.</p>",
               "practical_info": "Sporty tour, good physical condition recommended.",
               "meta_title": "2-Day Nosy Komba Hike | Sakalava Tours", "meta_description": "Two days of immersive hiking on Nosy Komba island."},
        "de": {"title": "Immersive Wanderung auf Nosy Komba", "subtitle": "Die Lemureninsel", "region_label": "Nosy Komba, Nosy Be",
               "summary": "Zwei Wandertage auf der Lemureninsel, vom Dorf Ampangorina bis zum Gipfel. Übernachtung bei Einheimischen und Begegnung mit Stickerinnen.",
               "description_html": "<p>Eine immersive Wanderung über die Insel Nosy Komba, zwischen Natur und lokalen Begegnungen.</p>",
               "practical_info": "Sportliche Rundreise, gute körperliche Verfassung empfohlen.",
               "meta_title": "2-tägige Wanderung Nosy Komba | Sakalava Tours", "meta_description": "Zwei Tage immersive Wanderung auf der Insel Nosy Komba."},
        "it": {"title": "Escursione immersiva a Nosy Komba", "subtitle": "L'isola dei lemuri", "region_label": "Nosy Komba, Nosy Be",
               "summary": "Due giorni di cammino sull'isola dei lemuri, dal villaggio di Ampangorina alla vetta. Notte in famiglia e incontro con le ricamatrici.",
               "description_html": "<p>Un'escursione immersiva attraverso l'isola di Nosy Komba, tra natura e incontri locali.</p>",
               "practical_info": "Tour sportivo, si raccomanda buona condizione fisica.",
               "meta_title": "Escursione 2 giorni Nosy Komba | Sakalava Tours", "meta_description": "Due giorni di escursione immersiva sull'isola di Nosy Komba."},
    },
    "itinerary": [
        {"time_label": "Jour 1", "is_optional": False, "tr": {
            "fr": {"title": "Ampangorina et montée", "description": "Débarquement au village puis ascension vers le sommet de l'île."},
            "en": {"title": "Ampangorina and ascent", "description": "Landing at the village then ascent to the island's summit."},
            "de": {"title": "Ampangorina und Aufstieg", "description": "Anlandung im Dorf, dann Aufstieg zum Gipfel der Insel."},
            "it": {"title": "Ampangorina e salita", "description": "Sbarco al villaggio, poi salita verso la vetta dell'isola."},
        }},
        {"time_label": "Jour 2", "is_optional": False, "tr": {
            "fr": {"title": "Rencontre des brodeuses et retour", "description": "Visite de l'atelier de broderie puis retour vers Nosy Be."},
            "en": {"title": "Meeting embroiderers and return", "description": "Visit to the embroidery workshop then return to Nosy Be."},
            "de": {"title": "Begegnung mit Stickerinnen und Rückkehr", "description": "Besuch der Stickerei-Werkstatt, dann Rückkehr nach Nosy Be."},
            "it": {"title": "Incontro con le ricamatrici e ritorno", "description": "Visita al laboratorio di ricamo, poi ritorno a Nosy Be."},
        }},
    ],
    "highlight_codes": ["lemurs", "viewpoint"],
    "inclusion_codes": ["boat", "guide", "lunch"],
    "packing_codes": ["hat", "sunscreen", "camera"],
})

PRODUCTS.append({
    "slug": "circuit-2-jours-a-lokobe",
    "product_type": ProductType.CIRCUIT,
    "product_format": ProductFormat.MULTI_DAY,
    "duration_days": 2, "duration_nights": 1,
    "duration_hours": None, "departure_time": None, "return_time": None,
    "travel_minutes": None, "transport": TransportMode.PIROGUE,
    "difficulty": DifficultyLevel.MODERATE,
    "group_min": 2, "group_max": 6, "hotel_pickup": True,
    "price_from": Decimal("250.00"), "is_featured": True, "sort_order": 11,
    "destination_code": "lokobe",
    "destination_names": {"fr": "Réserve de Lokobe", "en": "Lokobe Reserve", "de": "Lokobe-Reservat", "it": "Riserva di Lokobe"},
    "destination_region": "Diana", "destination_lat": -13.4, "destination_lng": 48.32,
    "cover_filename": "lokobe.jpg",
    "cover_alt": {"fr": "Forêt primaire de la réserve de Lokobe", "en": "Primary forest of the Lokobe reserve", "de": "Urwald des Lokobe-Reservats", "it": "Foresta primaria della riserva di Lokobe"},
    "tr": {
        "fr": {"title": "2 jours à Lokobe", "subtitle": "La dernière forêt primaire de l'île", "region_label": "Réserve intégrale, Nosy Be",
               "summary": "La dernière forêt primaire de l'île, en pirogue traditionnelle. Deux jours pour observer lémuriens macaco, boas et caméléons avec un guide du village.",
               "description_html": "<p>Une immersion de deux jours dans la réserve intégrale de Lokobe, accessible uniquement en pirogue.</p>",
               "practical_info": "Circuit modéré, accès exclusivement en pirogue traditionnelle.",
               "meta_title": "Circuit 2 jours Lokobe | Sakalava Tours", "meta_description": "Deux jours dans la réserve de Lokobe, dernière forêt primaire de Nosy Be."},
        "en": {"title": "2 Days at Lokobe", "subtitle": "The island's last primary forest", "region_label": "Strict Nature Reserve, Nosy Be",
               "summary": "The island's last primary forest, reached by traditional dugout canoe. Two days to observe macaco lemurs, boas and chameleons with a village guide.",
               "description_html": "<p>A two-day immersion in the Lokobe strict nature reserve, accessible only by dugout canoe.</p>",
               "practical_info": "Moderate tour, access exclusively by traditional dugout canoe.",
               "meta_title": "2-Day Lokobe Tour | Sakalava Tours", "meta_description": "Two days in the Lokobe reserve, Nosy Be's last primary forest."},
        "de": {"title": "2 Tage in Lokobe", "subtitle": "Der letzte Urwald der Insel", "region_label": "Vollnaturreservat, Nosy Be",
               "summary": "Der letzte Urwald der Insel, erreichbar mit traditionellem Einbaum. Zwei Tage, um Macaco-Lemuren, Boas und Chamäleons mit einem Dorfguide zu beobachten.",
               "description_html": "<p>Ein zweitägiges Eintauchen in das Vollnaturreservat Lokobe, nur mit dem Einbaum erreichbar.</p>",
               "practical_info": "Moderate Rundreise, Zugang ausschließlich mit traditionellem Einbaum.",
               "meta_title": "2-tägige Lokobe-Rundreise | Sakalava Tours", "meta_description": "Zwei Tage im Lokobe-Reservat, dem letzten Urwald von Nosy Be."},
        "it": {"title": "2 giorni a Lokobe", "subtitle": "L'ultima foresta primaria dell'isola", "region_label": "Riserva integrale, Nosy Be",
               "summary": "L'ultima foresta primaria dell'isola, raggiungibile in piroga tradizionale. Due giorni per osservare lemuri macaco, boa e camaleonti con una guida del villaggio.",
               "description_html": "<p>Un'immersione di due giorni nella riserva integrale di Lokobe, accessibile solo in piroga.</p>",
               "practical_info": "Tour moderato, accesso esclusivamente in piroga tradizionale.",
               "meta_title": "Tour 2 giorni Lokobe | Sakalava Tours", "meta_description": "Due giorni nella riserva di Lokobe, ultima foresta primaria di Nosy Be."},
    },
    "itinerary": [
        {"time_label": "Jour 1", "is_optional": False, "tr": {
            "fr": {"title": "Traversée en pirogue", "description": "Départ en pirogue traditionnelle vers la réserve, installation et première marche d'observation."},
            "en": {"title": "Dugout canoe crossing", "description": "Departure by traditional dugout canoe to the reserve, settling in and first observation walk."},
            "de": {"title": "Überfahrt mit dem Einbaum", "description": "Abfahrt mit traditionellem Einbaum zum Reservat, Ankunft und erste Beobachtungswanderung."},
            "it": {"title": "Traversata in piroga", "description": "Partenza in piroga tradizionale verso la riserva, sistemazione e prima passeggiata di osservazione."},
        }},
        {"time_label": "Jour 2", "is_optional": False, "tr": {
            "fr": {"title": "Observation matinale et retour", "description": "Marche d'observation au lever du jour, puis retour en pirogue vers Nosy Be."},
            "en": {"title": "Morning observation and return", "description": "Early morning observation walk, then return by dugout canoe to Nosy Be."},
            "de": {"title": "Morgenbeobachtung und Rückkehr", "description": "Beobachtungswanderung im Morgengrauen, dann Rückkehr mit dem Einbaum nach Nosy Be."},
            "it": {"title": "Osservazione mattutina e ritorno", "description": "Passeggiata di osservazione all'alba, poi ritorno in piroga a Nosy Be."},
        }},
    ],
    "highlight_codes": ["primary-forest", "lemurs"],
    "inclusion_codes": ["guide", "lunch"],
    "packing_codes": ["hat", "sunscreen", "camera"],
})
if __name__ == "__main__":
    asyncio.run(main())
