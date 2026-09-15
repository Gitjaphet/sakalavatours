# Sakalava Tours — API

API backend de [Sakalava Tours](https://sakalavatours.com), agence de voyage basée à Nosy Be, Madagascar. Elle sert de source de vérité pour le catalogue de produits touristiques (circuits, excursions), les réservations, les avis clients, le contenu multilingue (FR/EN/DE/IT) et la médiathèque, consommés par un frontend Next.js séparé.

## Approche / philosophie

Quelques partis pris structurent le code, volontairement plus stricts que la moyenne :

- **Fail fast au démarrage.** Le `lifespan` de FastAPI vérifie que PostgreSQL et Redis répondent avant de servir la moindre requête. Si l'un des deux est injoignable, le processus s'arrête net — sur le VPS, l'orchestrateur relance le conteneur au lieu de le laisser tourner et servir des 500 pendant des heures.
- **Configuration validée, pas devinée.** Toutes les variables d'environnement passent par un `Settings` Pydantic (`pydantic-settings`). Une variable requise manquante fait planter le lancement immédiatement, plutôt que de provoquer un `None` inexpliqué en pleine nuit.
- **Documentation interactive coupée en production.** `/docs`, `/redoc` et `/openapi.json` ne sont montés qu'hors production, pour ne pas exposer toute la surface de l'API — y compris les routes admin.
- **Séparation stricte public / admin.** Chaque domaine métier (products, bookings, reviews, contact, media, taxonomies) a un routeur public et un routeur admin distincts, montés sous des préfixes différents.
- **Contenu multilingue par mixin, pas par colonnes JSON.** Chaque entité de contenu (produits, pages, blog, taxonomies) suit le même patron : une table porteuse + une table `*Translation` par locale, via `TranslationMixin`. Une seule façon de faire, partout.
- **Suppression douce.** `SoftDeleteMixin` équipe les entités sensibles (produits, avis, médias, utilisateurs admin...) : rien ne disparaît réellement de la base par erreur.
- **Continuité SEO.** `SlugHistory` et `Redirect` tracent les changements d'URL pour éviter les liens morts quand un slug change.
- **Traçabilité admin.** `AuditLog` enregistre les actions sensibles côté admin, avec un enum `AuditAction` dédié.
- **Mode dégradé pour l'email en dev.** Si `SMTP_HOST` est vide, les emails s'affichent dans les logs au lieu d'être envoyés — permet de développer sans serveur mail configuré.

## Installation

### Prérequis

- Python 3.12+
- PostgreSQL
- Redis
- Docker (recommandé, `docker-compose.yml` fourni)

### Variables d'environnement

Créer un fichier `.env` à la racine de `apps/api` avec au minimum :

```env
POSTGRES_USER=...
POSTGRES_PASSWORD=...
POSTGRES_DB=...
POSTGRES_HOST=localhost
POSTGRES_PORT=5432

REDIS_URL=redis://localhost:6379/0

SECRET_KEY=...        # openssl rand -hex 32

CORS_ORIGINS=["http://localhost:3000"]
```

Voir `src/core/config.py` pour la liste complète des variables (email/SMTP, stockage Cloudflare R2, revalidation Next.js).

### Avec Docker

```bash
docker compose up --build
```

### Sans Docker

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

alembic upgrade head

uvicorn src.main:app --reload
```

## Utilisation

- Sonde de disponibilité : `GET /health` — vérifie réellement la connexion PostgreSQL et Redis, ne renvoie pas un « ok » inconditionnel.
- Toutes les routes métier sont préfixées par `/api/v1`, puis séparées en `/public/...` et `/admin/...`.
- Documentation interactive (`/docs`, `/redoc`) disponible uniquement hors production.

## Architecture

src/
├── api/
│ ├── public/ # Routes consommées par le site public (produits, réservations, avis, contact, sitemap, redirects)
│ └── admin/ # Routes du back-office (auth, produits, réservations, avis, médias, taxonomies, contact)
├── core/ # Configuration, connexion DB, Redis, sécurité (JWT/hash)
├── integrations/ # Services externes : email (SMTP), messages, stockage (Cloudflare R2)
├── models/ # Entités SQLModel (tables + mixins partagés)
├── repositories/ # Accès données bas niveau
├── schemas/ # Schémas Pydantic d'entrée/sortie de l'API
├── services/ # Logique métier (réservations, produits, avis, audit, revalidation...)
└── scripts/ # Scripts ponctuels (seed de données)


L'authentification admin repose sur JWT (access token courte durée + refresh token, voir `ACCESS_TOKEN_MINUTES` / `REFRESH_TOKEN_DAYS` dans la config).

## Modèle de données

Le schéma repose sur des **mixins partagés** (`src/models/base.py`) combinés selon les besoins de chaque table :

| Mixin | Rôle |
|---|---|
| `UUIDMixin` | Clé primaire UUID |
| `TimestampMixin` | `created_at` / `updated_at` |
| `SoftDeleteMixin` | Suppression douce |
| `SlugMixin` | Slug unique pour l'URL |
| `PublishableMixin` | État publié/brouillon |
| `SeoMixin` / `SeoTechnicalMixin` | Métadonnées SEO |
| `TranslationMixin` | Rattachement à une locale |

Domaines métier :

- **Produits touristiques** (`product.py`) — `Product` + `ProductTranslation`, avec ses entités satellites : `ProductItineraryItem` (+ traduction), `ProductPriceTier`, `ProductFaq`, `ProductHighlight`, `ProductInclusion`, `ProductPackingItem`, `ProductMedia`, `ProductRelated`, `ProductDepartureMonth`.
- **Taxonomies** (`taxonomy.py`) — `Destination`, `Highlight`, `Inclusion`, `PackingItem`, chacune avec sa table de traduction.
- **Blog** (`blog.py`) — `Author`, `BlogCategory`, `BlogPost` (+ traductions), avec tables de liaison `BlogPostProduct` et `BlogPostRelated`.
- **Réservations** (`booking.py`) — `Booking`, `BookingStatusHistory` (historique des transitions), `ContactMessage`.
- **Avis clients** (`review.py`) — `Review`.
- **Médiathèque** (`media.py`) — `Media` (+ traduction), `Gallery` (+ traduction), `GalleryMedia`.
- **Pages CMS** (`page.py`) — `Page`, `PageSection`, `PageSectionItem`, chacune avec sa traduction — pages de contenu construites par sections.
- **Système** (`system.py`) — `AdminUser`, `AuditLog`, `Setting` (+ traduction), `SlugHistory`, `Redirect`, `RevalidationLog`.

Les états métier sont modélisés par des enums dédiés (`enums.py`) : `ProductType`, `ProductFormat`, `TransportMode`, `DifficultyLevel`, `ContentStatus`, `ReviewStatus`, `BookingStatus`, `BookingSource`, `PageSectionType`, `MediaKind`, `AdminRole`, `AuditAction`.

## Migrations

Gérées avec Alembic (`alembic/versions/`). Commandes courantes :

```bash
# Appliquer toutes les migrations en attente
alembic upgrade head

# Générer une nouvelle migration après modification des modèles
alembic revision --autogenerate -m "description du changement"

# Revenir en arrière d'une révision
alembic downgrade -1
```

## Limites connues

- Pas encore de couverture de tests automatisés (`tests/` ne contient qu'un `__init__.py`).

## Roadmap

- À compléter.
