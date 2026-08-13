// src/lib/nav-config.ts
// ─────────────────────────────────────────────────────────────────────────────
// Configuration de navigation et coordonnées de l'entreprise.
//
// RÈGLE : aucun texte affiché ici. Les libellés viennent de
// src/messages/*.json (clé `nav.<key>`), les horaires de `topbar.hours`.
// Seules les données non traduisibles sont admises : URL, numéros, e-mail.
// ─────────────────────────────────────────────────────────────────────────────

/** Clé de traduction (`nav.<key>`) + destination. L'ordre du tableau
 *  détermine l'ordre d'affichage dans la nav et le menu burger. */
export const navLinks = [
  { key: "tours", href: "/circuits" },
  { key: "excursion", href: "/excursions" },
  { key: "apropos", href: "/apropos" },
  { key: "blog", href: "/blog" },
  { key: "galerie", href: "/galerie" },
  { key: "contact", href: "/contact" },
] as const;

export type NavLink = (typeof navLinks)[number];
export type NavKey = NavLink["key"];

/** Sous-ensemble affiché dans le pill compact au scroll (desktop uniquement) */
export const compactNavKeys: readonly NavKey[] = [
  "tours",
  "excursion",
  "blog",
  "galerie",
  "contact",
];

// ─── Coordonnées ─────────────────────────────────────────────────────────────

/** Indicatif pays, isolé pour ne le corriger qu'à un seul endroit */
const COUNTRY_CODE = "261";

export const contactInfo = {
  /** Format local, sans indicatif — sert de base aux liens tel: et wa.me */
  phone: "0322208362",
  /** Format lisible affiché à l'écran */
  phoneDisplay: "+261 32 22 083 62",
  /** Format E.164 — requis par le JSON-LD schema.org/LocalBusiness */
  phoneE164: `+${COUNTRY_CODE}${"0322208362".slice(1)}`,
  email: "sakalavatour@gmail.com",
} as const;

/** Lien tel: prêt à l'emploi — évite de refaire le slice() partout */
export const telHref = `tel:${contactInfo.phoneE164}`;
export const mailtoHref = `mailto:${contactInfo.email}`;

// ─── Identité de l'entreprise (SEO / JSON-LD) ────────────────────────────────

/** Données stables réutilisées par les balises meta, l'Open Graph et le
 *  JSON-LD TravelAgency. À compléter dès que l'adresse exacte est arrêtée. */
export const businessInfo = {
  name: "Sakalava Tours",
  legalName: "Sakalava Tours",
  /** ⚠ Remplacer par le domaine définitif avant la mise en production */
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://sakalavatours.vercel.app",
  logo: "/images/brand/logo.png",
  addressLocality: "Nosy Be",
  addressRegion: "Diana",
  addressCountry: "MG",
  /** Coordonnées approximatives de Nosy Be — à préciser avec l'adresse réelle */
  geo: { lat: -13.3167, lng: 48.2667 },
  priceRange: "$$",
} as const;

// ─── Réseaux sociaux ─────────────────────────────────────────────────────────

/** ⚠ L'ordre compte : ces URL alimentent la propriété `sameAs` du JSON-LD.
 *  Ne laisser ici que des profils qui existent réellement — une URL morte
 *  dans `sameAs` dégrade la confiance accordée au balisage. */
export const socialLinks = [
  {
    key: "facebook",
    href: "https://facebook.com/sakalavatours",
    icon: "brand-facebook",
  },
  {
    key: "instagram",
    href: "https://instagram.com/sakalavatours",
    icon: "brand-instagram",
  },
  {
    key: "whatsapp",
    href: `https://wa.me/${COUNTRY_CODE}${"0322208362".slice(1)}`,
    icon: "brand-whatsapp",
  },
] as const;