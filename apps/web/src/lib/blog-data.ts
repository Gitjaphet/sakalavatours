// src/lib/blog-data.ts
// ─────────────────────────────────────────────────────────────────────────────
// Catalogue des articles de blog — à remplacer par le modèle FastAPI.
//
// ⚠ CONTENU MOCK. Les articles décrivent des réalités de Nosy Be, mais chaque
// affirmation chiffrée (prix, périodes, tarifs de parcs) doit être vérifiée
// avant publication.
//
// RÈGLE : aucun texte affiché ici. Titres et résumés vivent dans
// src/messages/*.json sous la clé `blog.items.<id>`.
// ─────────────────────────────────────────────────────────────────────────────

/** Catégorie éditoriale — sert de filtre (`blog.categories.<key>`) */
export type BlogCategory =
  | "guide-pratique"
  | "faune"
  | "activites"
  | "culture";

export type BlogPost = {
  /** Slug — clé de traduction et URL. Ne jamais le renommer une fois indexé. */
  id: string;

  category: BlogCategory;

  /** ISO 8601 — alimente `datePublished` du JSON-LD BlogPosting */
  publishedAt: string;
  /** ISO 8601 — `dateModified`. Google privilégie le contenu tenu à jour. */
  updatedAt: string;

  /** Temps de lecture estimé en minutes */
  readingMinutes: number;

  /** Mise en avant : un seul article en position vedette sur la liste */
  featured: boolean;

  image: string;
  imageWidth: number;
  imageHeight: number;

  /** Maillage interne : slugs de circuits/excursions cités dans l'article.
   *  C'est le mécanisme qui transforme le trafic informationnel en trafic
   *  commercial — un article sans lien produit ne sert à rien. */
  relatedCircuits: readonly string[];
  relatedExcursions: readonly string[];

  href: string;
};

export const blogPosts: BlogPost[] = [
  {
    id: "quand-partir-nosy-be",
    category: "guide-pratique",
    publishedAt: "2026-05-18",
    updatedAt: "2026-07-30",
    readingMinutes: 9,
    featured: true,
    image: "/images/hero/nosy-iranja.jpg",
    imageWidth: 2400,
    imageHeight: 1600,
    relatedCircuits: ["tours-des-archipels-de-nosy-be"],
    relatedExcursions: ["nosy-iranja", "nosy-tanikely"],
    href: "/blog/quand-partir-nosy-be",
  },
  {
    id: "baleines-a-bosse-nosy-be",
    category: "faune",
    publishedAt: "2026-06-04",
    updatedAt: "2026-06-04",
    readingMinutes: 7,
    featured: false,
    image: "/images/hero/nosy-tanikely.jpg",
    imageWidth: 2400,
    imageHeight: 1600,
    relatedCircuits: [],
    relatedExcursions: ["nosy-sakatia", "nosy-tanikely"],
    href: "/blog/baleines-a-bosse-nosy-be",
  },
  {
    id: "budget-voyage-madagascar",
    category: "guide-pratique",
    publishedAt: "2026-04-22",
    updatedAt: "2026-07-11",
    readingMinutes: 11,
    featured: false,
    image: "/images/hero/lokobe.jpg",
    imageWidth: 2400,
    imageHeight: 1600,
    relatedCircuits: [
      "les-circuits-nord-de-madagascar-11jours-10-nuits",
      "circuit-2-jours-a-lokobe",
    ],
    relatedExcursions: [],
    href: "/blog/budget-voyage-madagascar",
  },
  {
    id: "ou-voir-lemuriens-nosy-be",
    category: "faune",
    publishedAt: "2026-03-15",
    updatedAt: "2026-06-20",
    readingMinutes: 8,
    featured: false,
    image: "/images/hero/lokobe.jpg",
    imageWidth: 2400,
    imageHeight: 1600,
    relatedCircuits: ["randonnees-immersive-a-nosy-komba", "circuit-2-jours-a-lokobe"],
    relatedExcursions: ["reserve-de-lokobe", "nosy-komba-nosy-tanikely"],
    href: "/blog/ou-voir-lemuriens-nosy-be",
  },
  {
    id: "meilleurs-spots-snorkeling-nosy-be",
    category: "activites",
    publishedAt: "2026-02-08",
    updatedAt: "2026-05-29",
    readingMinutes: 6,
    featured: false,
    image: "/images/hero/nosy-tanikely.jpg",
    imageWidth: 2400,
    imageHeight: 1600,
    relatedCircuits: ["tours-des-archipels-de-nosy-be"],
    relatedExcursions: ["nosy-tanikely", "nosy-sakatia", "nosy-iranja"],
    href: "/blog/meilleurs-spots-snorkeling-nosy-be",
  },
  {
    id: "cuisine-sakalava-plats",
    category: "culture",
    publishedAt: "2026-01-19",
    updatedAt: "2026-01-19",
    readingMinutes: 7,
    featured: false,
    image: "/images/hero/mont-passot.jpg",
    imageWidth: 2400,
    imageHeight: 1600,
    relatedCircuits: ["une-experience-authentique"],
    relatedExcursions: ["mangroves-ambatozavavy"],
    href: "/blog/cuisine-sakalava-plats",
  },
  {
    id: "ylang-ylang-nosy-be",
    category: "culture",
    publishedAt: "2025-11-26",
    updatedAt: "2026-04-03",
    readingMinutes: 6,
    featured: false,
    image: "/images/hero/mont-passot.jpg",
    imageWidth: 2400,
    imageHeight: 1600,
    relatedCircuits: ["circuit-sava"],
    relatedExcursions: ["distillerie-ylang-ylang"],
    href: "/blog/ylang-ylang-nosy-be",
  },
  {
    id: "preparer-sejour-nosy-be",
    category: "guide-pratique",
    publishedAt: "2025-10-14",
    updatedAt: "2026-07-02",
    readingMinutes: 10,
    featured: false,
    image: "/images/hero/nosy-iranja.jpg",
    imageWidth: 2400,
    imageHeight: 1600,
    relatedCircuits: ["tours-des-archipels-de-nosy-be"],
    relatedExcursions: ["nosy-iranja"],
    href: "/blog/preparer-sejour-nosy-be",
  },
];

/** Ordre d'affichage : l'article vedette d'abord, puis du plus récent au plus
 *  ancien. La date de mise à jour prime : Google favorise le contenu frais. */
export const blogPostsSorted = [...blogPosts].sort((a, b) => {
  if (a.featured !== b.featured) return a.featured ? -1 : 1;
  return b.updatedAt.localeCompare(a.updatedAt);
});

/** Catégories réellement utilisées, dans l'ordre du catalogue */
export const blogCategories = [
  ...new Set(blogPosts.map((p) => p.category)),
] as BlogCategory[];

export function getBlogPostById(id: string): BlogPost | undefined {
  return blogPosts.find((p) => p.id === id);
}

export function getPostsByCategory(category: BlogCategory): BlogPost[] {
  return blogPostsSorted.filter((p) => p.category === category);
}
