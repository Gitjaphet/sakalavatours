// apps/web/src/components/layout/FloatingActions.tsx
"use client";

import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { IconBrandWhatsapp, IconCalendarPlus } from "@tabler/icons-react";
import { contactInfo } from "@/lib/nav-config";

/** Pages ou les boutons flottants seraient redondants ou genants :
 *  le formulaire de reservation et la page contact portent deja l'action. */
const ROUTES_MASQUEES: readonly string[] = ["/reservation", "/contact"];

/** Transforme le dernier segment d'URL en libelle lisible.
 *  "/excursions/nosy-iranja" donne "Nosy iranja".
 *  Retourne null hors fiche produit — on utilise alors le message generique. */
function nomProduitDepuisChemin(pathname: string): string | null {
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length < 2) return null;
  if (segments[0] !== "excursions" && segments[0] !== "circuits") return null;
  const slug = segments[1];
  const mots = slug.replace(/-/g, " ").trim();
  if (!mots) return null;
  return mots.charAt(0).toUpperCase() + mots.slice(1);
}

export function FloatingActions() {
  const t = useTranslations("floating");
  const pathname = usePathname();

  if (ROUTES_MASQUEES.some((r) => pathname === r || pathname.startsWith(`${r}/`))) {
    return null;
  }

  const produit = nomProduitDepuisChemin(pathname);
  const message = produit
    ? t("waProduct", { page: produit })
    : t("waDefault");

  const numero = `${"261"}${contactInfo.phone.slice(1)}`;
  const waHref = `https://wa.me/${numero}?text=${encodeURIComponent(message)}`;

  return (
    <>
      {/* Desktop : pastilles empilees, libelle revele au survol */}
      <div className="pointer-events-none fixed bottom-6 right-6 z-40 hidden flex-col items-end gap-3 lg:flex">
        <Link
          href="/reservation"
          className="group pointer-events-auto flex h-12 items-center gap-2 rounded-full bg-[#E76F51] pl-3.5 pr-3.5 text-white shadow-lg transition-[padding] duration-300 hover:pr-5"
        >
          <IconCalendarPlus size={22} className="shrink-0" />
          <span className="max-w-0 overflow-hidden whitespace-nowrap text-sm opacity-0 transition-all duration-300 group-hover:max-w-[9rem] group-hover:opacity-100">
            {t("reserve")}
          </span>
        </Link>

        <a
          href={waHref}
          target="_blank"
          rel="noopener noreferrer"
          className="group pointer-events-auto flex h-14 items-center gap-2.5 rounded-full bg-[#25D366] pl-4 pr-4 text-white shadow-lg shadow-[#25D366]/30 transition-[padding] duration-300 hover:pr-5"
        >
          <IconBrandWhatsapp size={26} className="shrink-0" />
          <span className="max-w-0 overflow-hidden whitespace-nowrap text-sm font-medium opacity-0 transition-all duration-300 group-hover:max-w-[10rem] group-hover:opacity-100">
            {t("whatsapp")}
          </span>
        </a>
      </div>

      {/* Mobile : barre basse dans la zone du pouce */}
      <div className="fixed inset-x-3 bottom-3 z-40 flex gap-2 rounded-full border border-black/5 bg-white/85 p-1.5 shadow-[0_6px_24px_rgba(0,0,0,0.14)] backdrop-blur-md lg:hidden">
        <a
          href={waHref}
          target="_blank"
          rel="noopener noreferrer"
          className="flex h-11 flex-1 items-center justify-center gap-2 rounded-full bg-[#25D366] text-sm font-medium text-white"
        >
          <IconBrandWhatsapp size={19} className="shrink-0" />
          WhatsApp
        </a>
        <Link
          href="/reservation"
          className="flex h-11 flex-1 items-center justify-center gap-2 rounded-full bg-[#E76F51] text-sm font-medium text-white"
        >
          <IconCalendarPlus size={18} className="shrink-0" />
          {t("reserve")}
        </Link>
      </div>
    </>
  );
}
