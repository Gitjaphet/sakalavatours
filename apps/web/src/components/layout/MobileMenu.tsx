// src/components/layout/MobileMenu.tsx
"use client";

import { useEffect } from "react";
import Image from "next/image";
import { Link, usePathname } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { navLinks, contactInfo, socialLinks } from "@/lib/nav-config";
import { LanguageSwitcher } from "./LanguageSwitcher";
import {
  IconX,
  IconPhone,
  IconMail,
  IconClock,
  IconRoute,
  IconCompass,
  IconInfoCircle,
  IconArticle,
  IconPhoto,
  IconMessageCircle,
  IconMapPin,
  IconBrandFacebook,
  IconBrandInstagram,
  IconBrandWhatsapp,
  type Icon as TablerIcon,
} from "@tabler/icons-react";

const socialIconMap = {
  "brand-facebook": IconBrandFacebook,
  "brand-instagram": IconBrandInstagram,
  "brand-whatsapp": IconBrandWhatsapp,
};

/** Icône par entrée de nav. Plusieurs alias par entrée : si tes clés
 *  dans nav-config diffèrent, ajoute-les ici — le fallback évite tout crash. */
const navIconMap: Record<string, TablerIcon> = {
  circuits: IconRoute,
  tours: IconRoute,
  excursion: IconCompass,
  excursions: IconCompass,
  apropos: IconInfoCircle,
  "a-propos": IconInfoCircle,
  about: IconInfoCircle,
  blog: IconArticle,
  galerie: IconPhoto,
  gallery: IconPhoto,
  contact: IconMessageCircle,
};

export function MobileMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
  const t = useTranslations("nav");
  const pathname = usePathname();

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <>
      <div
        onClick={onClose}
        aria-hidden="true"
        className={`fixed inset-0 z-[60] bg-black/45 backdrop-blur-[2px] transition-opacity duration-300 lg:hidden ${
          open ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="Menu de navigation"
        className={`fixed bottom-0 right-0 top-0 z-[70] flex w-[86%] max-w-[340px] flex-col overflow-y-auto overscroll-contain bg-white pb-[env(safe-area-inset-bottom)] shadow-2xl transition-transform duration-300 ease-out lg:hidden ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* ── Bloc marque ─────────────────────────────────────────────── */}
        <div className="flex items-start justify-between gap-3 px-5 pb-5 pt-6">
          <div className="min-w-0">
            <span className="relative block h-9 w-[132px]">
              <Image
                src="/images/brand/logo.png"
                alt="Sakalava Tours"
                fill
                sizes="140px"
                className="object-contain object-left"
              />
            </span>
            <p className="mt-2 text-[11px] leading-snug text-[#2B2620]/50">
              Visitez les trésors de Madagascar autrement
            </p>
          </div>

          <button
            onClick={onClose}
            aria-label="Fermer le menu"
            className="-mr-2 -mt-1 grid h-10 w-10 shrink-0 place-items-center rounded-full text-[#2B2620]/70 transition-colors hover:bg-black/5 hover:text-[#2B2620]"
          >
            <IconX size={22} />
          </button>
        </div>

        {/* ── Navigation principale ───────────────────────────────────── */}
        <nav className="flex flex-col gap-0.5 px-3">
          {navLinks.map((link) => {
            const Icon = navIconMap[link.key] ?? IconMapPin;
            const isActive =
              pathname === link.href || pathname.startsWith(`${link.href}/`);

            return (
              <Link
                key={link.key}
                href={link.href}
                onClick={onClose}
                aria-current={isActive ? "page" : undefined}
                className={`flex items-center gap-3.5 rounded-xl px-3 py-3 text-[15px] transition-colors ${
                  isActive
                    ? "bg-[#E63946]/8 font-semibold text-[#E63946]"
                    : "font-medium text-[#2B2620] hover:bg-black/[0.04]"
                }`}
              >
                <Icon
                  size={21}
                  stroke={1.7}
                  className={isActive ? "text-[#E63946]" : "text-[#2B2620]/45"}
                />
                {t(link.key)}
              </Link>
            );
          })}
        </nav>

        {/* ── CTA ─────────────────────────────────────────────────────── */}
        <Link
          href="/reservation"
          onClick={onClose}
          className="mx-5 mt-5 rounded-full py-3.5 text-center text-sm font-semibold text-white shadow-[0_12px_28px_-12px_rgba(231,111,81,0.95)]"
          style={{ background: "linear-gradient(135deg,#F4A261,#E76F51)" }}
        >
          {t("reserver")}
        </Link>

        {/* ── Contact : groupe secondaire discret ─────────────────────── */}
        <div className="mt-8 flex flex-col gap-3.5 px-6">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#2B2620]/35">
            Nous contacter
          </p>

          <a
            href={`tel:+261${contactInfo.phone.slice(1)}`}
            className="flex items-center gap-3 text-[13px] text-[#2B2620]/70 transition-colors hover:text-[#1d4e5f]"
          >
            <IconPhone size={17} stroke={1.7} className="shrink-0 text-[#2B2620]/35" />
            {contactInfo.phoneDisplay}
          </a>

          <a
            href={`mailto:${contactInfo.email}`}
            className="flex min-w-0 items-center gap-3 text-[13px] text-[#2B2620]/70 transition-colors hover:text-[#1d4e5f]"
          >
            <IconMail size={17} stroke={1.7} className="shrink-0 text-[#2B2620]/35" />
            <span className="truncate">{contactInfo.email}</span>
          </a>

          <span className="flex items-center gap-3 text-[13px] text-[#2B2620]/70">
            <IconClock size={17} stroke={1.7} className="shrink-0 text-[#2B2620]/35" />
            {contactInfo.hours}
          </span>
        </div>

        {/* ── Pied ────────────────────────────────────────────────────── */}
        <div className="mt-auto px-6 pb-7 pt-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {socialLinks.map(({ key, href, icon }) => {
                const Icon = socialIconMap[icon as keyof typeof socialIconMap];
                return (
                  <a
                    key={key}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={key}
                    className="text-[#2B2620]/45 transition-colors hover:text-[#1d4e5f]"
                  >
                    <Icon size={19} stroke={1.7} />
                  </a>
                );
              })}
            </div>
            <LanguageSwitcher direction="up" />
          </div>

          <p className="mt-6 text-center text-[10px] tracking-wide text-[#2B2620]/25">
            © {new Date().getFullYear()} Sakalava Tours
          </p>
        </div>
      </div>
    </>
  );
}