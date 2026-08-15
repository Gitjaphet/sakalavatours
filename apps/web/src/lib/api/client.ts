/**
 * Client HTTP vers l'API FastAPI.
 *
 * ⚠ APPELS CÔTÉ SERVEUR UNIQUEMENT.
 *
 * Ces fonctions s'exécutent pendant la génération des pages, jamais dans
 * le navigateur du visiteur. C'est ce qui garde les pages en SSG et
 * préserve les scores PageSpeed : le visiteur reçoit du HTML statique
 * depuis le CDN Vercel, il ne touche jamais le VPS.
 *
 * Récupérer du contenu indexable côté client (useEffect + fetch) le
 * rendrait invisible dans le HTML initial et ruinerait le référencement.
 */

/**
 * ⚠ Lecture PARESSEUSE, jamais au niveau du module.
 *
 * Une vérification à l'import ferait échouer `next build` dès la collecte
 * des pages, avec une trace peu lisible. Ici l'erreur remonte à l'appel,
 * où `apiGetSafe` peut la rattraper et laisser le build aboutir.
 */
function getBaseUrl(): string {
  const url = process.env.API_BASE_URL;
  if (!url) {
    throw new Error(
      "API_BASE_URL manquante. Ajoutez-la dans .env.local et dans les variables Vercel.",
    );
  }
  return url;
}

/** Durée de cache par défaut, en secondes. */
export const DEFAULT_REVALIDATE = 3600;

type FetchOptions = {
  /** Secondes avant régénération. 0 = jamais mis en cache. */
  revalidate?: number;
  /** Étiquettes de cache, invalidables via revalidateTag(). */
  tags?: string[];
};

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly path: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/**
 * Requête GET typée.
 *
 * Le paramètre `next` est ce qui maintient les pages en SSG : Next met la
 * réponse en cache et régénère en arrière-plan. Sans lui, chaque page
 * basculerait en rendu dynamique.
 */
export async function apiGet<T>(
  path: string,
  { revalidate = DEFAULT_REVALIDATE, tags = [] }: FetchOptions = {},
): Promise<T> {
  const url = `${getBaseUrl()}${path}`;

  const response = await fetch(url, {
    headers: { Accept: "application/json" },
    next: revalidate === 0 ? { revalidate: 0 } : { revalidate, tags },
  });

  if (!response.ok) {
    throw new ApiError(
      `L'API a répondu ${response.status} sur ${path}`,
      response.status,
      path,
    );
  }

  return response.json() as Promise<T>;
}

/**
 * Variante tolérante aux pannes.
 *
 * Retourne `fallback` si l'API est injoignable, au lieu de faire échouer
 * le build. Indispensable : une maintenance du VPS ne doit pas bloquer un
 * déploiement Vercel ni casser le site en production.
 */
export async function apiGetSafe<T>(
  path: string,
  fallback: T,
  options: FetchOptions = {},
): Promise<T> {
  try {
    return await apiGet<T>(path, options);
  } catch (error) {
    console.error(`[api] échec sur ${path} — repli sur la valeur par défaut`, error);
    return fallback;
  }
}
