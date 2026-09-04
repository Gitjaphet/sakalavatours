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
  { key: "galerie", href: "/galerie" },
  { key: "contact", href: "/contact" },
] as const;

export type NavLink = (typeof navLinks)[number];
export type NavKey = NavLink["key"];



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
    /** Domaine cible : sakalavatour.com. Tant qu'il n'est pas branché sur
   *  Vercel, NEXT_PUBLIC_SITE_URL pointe sur l'URL qui répond réellement —
   *  déclarer un domaine qui ne résout pas ferait indexer des liens morts. */
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://sakalavatour.com",
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
// ─── Pied de page ────────────────────────────────────────────────────────────

/** Colonne "Explorer" du footer. Les cles existantes reutilisent nav.<key> ;
 *  avis et reservation exigent leurs propres cles footer.links.<key>. */
export const footerExplore = [
  { key: "tours", href: "/circuits", i18n: "nav" },
  { key: "excursion", href: "/excursions", i18n: "nav" },
  { key: "galerie", href: "/galerie", i18n: "nav" },
  { key: "apropos", href: "/apropos", i18n: "nav" },
  { key: "avis", href: "/avis", i18n: "footer" },
  { key: "reservation", href: "/reservation", i18n: "footer" },
] as const;

/** Colonne "Destinations" : maillage interne vers les fiches produit.
 *  RÈGLE : uniquement des produits au statut published, sinon 404 sur tout le
 *  site. Libelles en dur : un nom de lieu ne se traduit pas.
 *  A mettre a jour a la main quand un nouveau produit phare est publie. */
export const footerDestinations = [
  { label: "Nosy Iranja", href: "/excursions/nosy-iranja" },
  { label: "Nosy Mitsio", href: "/excursions/nosy-mitsio" },
  { label: "Montagne d'Ambre", href: "/excursions/montagne-d-ambre" },
  { label: "Cap Diego", href: "/excursions/cap-diego" },
  { label: "Tour en quad", href: "/excursions/tour-quad-nosy-be" },
] as const;
