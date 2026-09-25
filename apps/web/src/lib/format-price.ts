// src/lib/format-price.ts
// Formatage de prix partage par toutes les cartes produit.
// Renvoie null si le prix est absent, invalide ou nul : la carte n'affiche
// alors aucun badge plutot qu'un "0 €" trompeur.

export function formatPrice(
  amount: string | number | null | undefined,
  currency: string,
  locale: string,
): string | null {
  const value = Number(amount);
  if (!Number.isFinite(value) || value <= 0) return null;

  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(value);
  } catch {
    // Code devise inconnu du navigateur : repli lisible
    return `${Math.round(value)} ${currency}`;
  }
}
