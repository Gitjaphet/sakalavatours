# Sakalava Tours — Web

Frontend Next.js du site [sakalavatours.com](https://sakalavatours.com), vitrine et espace de réservation de l'agence de voyage Sakalava Tours à Nosy Be, Madagascar. Consomme l'API [sakalavatours-api](../api) pour le catalogue produits, les réservations, les avis clients et le contenu CMS, en multilingue (FR/EN/DE/IT).

## Approche / philosophie

- **BFF (Backend For Frontend) via les routes API Next.js.** `app/api/admin/*` et `app/api/stripe/*` ne contiennent pas de logique métier : elles font relais vers l'API FastAPI, ce qui garde les secrets (clés, tokens) hors du bundle client et permet de gérer l'authentification admin par cookies plutôt que par un token exposé côté navigateur.
- **Lecture publique tolérante, lecture critique stricte.** `getProducts()` (liste) utilise `apiGetSafe` : si l'API est injoignable, la page s'affiche vide plutôt que de faire échouer le build Vercel. `getProduct()` (fiche détail) ne rattrape que le 404 — une autre erreur remonte volontairement, car mieux vaut un build en échec qu'une fiche produit vide servie à un visiteur.
- **Contrat de types manuel avec le backend.** Les types dans `lib/api/*.ts` et `types/api.d.ts` reflètent exactement les schémas Pydantic de l'API. C'est un choix assumé plutôt qu'un contrat généré automatiquement — voir Limites connues.
- **Revalidation par tags, pas par intervalle fixe.** Chaque appel API (`getProducts`, `getProduct`...) passe des `tags` (`["products", "product:{slug}"]`). Le webhook `app/api/revalidate` déclenché par le back-office FastAPI invalide précisément les pages concernées, sans attendre un ISR à intervalle.
- **SEO structuré en JSON-LD.** Le dossier `lib/schema/` (`touristTrip`, `travelAgency`, `faqPage`, `breadcrumb`, `videoObject`) construit les données structurées schema.org à partir du contenu de l'API — pas de balisage statique déconnecté du contenu réel.
- **i18n au niveau du routing.** `next-intl` avec un segment `[locale]` : chaque page publique existe nativement dans les 4 langues supportées, avec fallback de contenu géré côté API (`is_fallback` / `content_locale` dans les réponses produits).
- **Paiement Stripe séparé client/serveur.** `lib/stripe/client.ts` (Stripe.js navigateur) et `lib/stripe/server.ts` (création de session, clé secrète) ne partagent aucun code — impossible d'exposer accidentellement la clé secrète au bundle client.

## Installation

### Prérequis

- Node.js 20+
- npm

### Variables d'environnement

Créer un fichier `.env.local` à la racine de `apps/web`. Les noms exacts sont définis dans `lib/api/client.ts` et `proxy.ts` — a minima, prévoir :

- l'URL de base de l'API FastAPI consommée par `apiGet` / `apiGetSafe`
- les clés Stripe (publique pour `lib/stripe/client.ts`, secrète pour `lib/stripe/server.ts`)
- le secret partagé avec le webhook `app/api/revalidate` (doit correspondre à `NEXTJS_REVALIDATE_SECRET` côté API)

### Lancer le projet

```bash
npm install
npm run dev
```

Build de production :

```bash
npm run build
npm run start
```

Lint :

```bash
npm run lint
```

## Utilisation

- Pages publiques sous `app/[locale]/...` : accueil, circuits, excursions, à propos, blog, galerie, avis, contact, réservation.
- Back-office sous `app/admin/...`, protégé par `RequireAuth` / `AuthContext`, authentifié via les routes `app/api/admin/auth/*` (login, refresh, me, logout).
- Toute écriture admin (produits, réservations, avis, médias, taxonomies, messages) passe par une route `app/api/admin/*` qui relaie vers l'API FastAPI.

## Architecture

```
src/
├── app/
│   ├── admin/          # Back-office : dashboard, produits, réservations, avis, médias, taxonomies, messages
│   ├── api/
│   │   ├── admin/       # Relais BFF vers l'API FastAPI (auth, bookings, media, messages, products, reviews, taxonomies)
│   │   ├── bookings/    # Création de réservation (public)
│   │   ├── contact/     # Formulaire de contact (public)
│   │   ├── revalidate/  # Webhook appelé par le back-office FastAPI
│   │   ├── reviews/     # Soumission + vérification d'avis (public)
│   │   └── stripe/      # checkout + webhook
│   └── [locale]/        # Pages publiques (une arborescence par langue via next-intl)
├── components/          # Organisés par domaine : admin, booking, circuits, contact, excursions, home, layout, products, reviews, ui
├── i18n/                # Configuration next-intl (routing, navigation, request)
├── lib/
│   ├── api/             # Client HTTP + un module par ressource (products, circuits, bookings, reviews, contact, admin-*)
│   ├── schema/           # Générateurs de données structurées JSON-LD (schema.org)
│   ├── stripe/            # Client (navigateur) et serveur (clé secrète), strictement séparés
│   └── constants/          # Enums partagés avec le backend (product-enums.ts)
├── messages/             # Traductions next-intl (fr, en, de, it)
└── proxy.ts              # Point d'entrée du proxy vers l'API (remplace le middleware historique)
```

## Contrats d'API (types miroir)

Chaque ressource métier a son module dans `lib/api/` avec ses types TypeScript, recopiés à la main depuis les schémas Pydantic de l'API :

- `products.ts` / `admin-products.ts` — catalogue public et gestion admin des circuits/excursions
- `circuits.ts` — vue spécialisée circuits
- `bookings.ts` / `admin-bookings.ts` — réservations, historique de statut, transitions
- `reviews.ts` / `admin-reviews.ts` — avis publics et modération
- `contact.ts` — messages de contact
- `admin-messages.ts` — gestion admin des messages
- `admin-taxonomies.ts` — destinations, points forts, inclusions, à prévoir
- `client.ts` — wrapper HTTP commun (`apiGet`, `apiGetSafe`, `ApiError`)
- `product-transform.ts` — normalisation des réponses API vers les formats attendus par les composants

## Limites connues

- Les types de `lib/api/*.ts` et `types/api.d.ts` sont maintenus à la main en miroir des schémas Pydantic de l'API — aucune génération automatique (pas d'OpenAPI codegen). Une modification d'un schéma côté backend sans répercussion ici casse silencieusement le typage, pas le build.
- `getRelatedProducts()` fait un appel HTTP par slug lié (2 à 4 en pratique) plutôt qu'un endpoint batch — accepté tant que le nombre reste faible.
- Le rendu multilingue dépend du fallback de contenu côté API (`is_fallback`) : une page peut afficher du contenu dans une autre langue que celle demandée sans que ce soit visuellement signalé partout.

## Roadmap

<!-- à compléter -->
