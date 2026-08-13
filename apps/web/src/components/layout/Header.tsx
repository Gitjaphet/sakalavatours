// src/components/layout/Header.tsx
"use client";

import { useState, useEffect } from "react";
import { Link, usePathname } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { TopBar } from "./TopBar";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { navLinks, compactNavKeys } from "@/lib/nav-config";
import { IconPhone, IconMenu2 } from "@tabler/icons-react";
import { MobileMenu } from "./MobileMenu";
import Image from "next/image";

/** Déclenchement de la capsule : assez bas pour ne pas clignoter au moindre scroll */
const SCROLL_THRESHOLD = 48;

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const t = useTranslations("nav");

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > SCROLL_THRESHOLD);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /** Seule la home a un hero plein écran sous la nav */
  const isHome = pathname === "/";
  const overlay = isHome && !scrolled;

  const visibleLinks = scrolled
    ? navLinks.filter((l) => (compactNavKeys as readonly string[]).includes(l.key))
    : navLinks;

  return (
    <>
      {/* Voile de lisibilité : la nav blanche doit tenir même sur le sable clair */}
      <div
        aria-hidden="true"
        className={`pointer-events-none fixed inset-x-0 top-0 z-30 h-44 bg-gradient-to-b from-black/55 via-black/20 to-transparent transition-opacity duration-300 ${
          overlay ? "opacity-100" : "opacity-0"
        }`}
      />

      <div
        className={`fixed left-0 right-0 top-0 z-50 transition-transform duration-300 ${
          scrolled ? "-translate-y-full" : "translate-y-0"
        }`}
      >
        <TopBar transparent={overlay} />
      </div>

      <header
        className={`fixed left-0 right-0 z-40 flex justify-center transition-all duration-300 ${
          scrolled ? "top-3" : "top-0 md:top-9"
        }`}
      >
        <div
          className={`flex items-center justify-between transition-all duration-300 ${
            scrolled
              ? "w-auto gap-5 rounded-full bg-[#FDFAF6]/95 px-5 py-2 shadow-lg shadow-black/10 backdrop-blur-md"
              : overlay
                ? "w-full gap-6 bg-transparent px-6 py-4 md:w-[min(1120px,92vw)]"
                : "w-full rounded-none bg-[#FDFAF6] px-6 py-3.5 shadow-sm md:w-[min(1120px,92vw)] md:rounded-b-xl"
          }`}
        >
          <Link
            href="/"
            aria-label="Sakalava Tours — retour à l'accueil"
            className="block shrink-0"
            >
            <span
                className={`relative block transition-all duration-300 ${
                scrolled ? "h-9 w-[108px]" : "h-12 w-[144px] md:h-14 md:w-[168px]"
                }`}
            >
                <Image
                src="/images/brand/logo.png"
                alt=""
                fill
                sizes="180px"
                priority
                className={`object-contain object-left transition-opacity duration-300 ${
                    overlay ? "opacity-100" : "opacity-0"
                }`}
                />
                <Image
                src="/images/brand/logo.png"
                alt="Sakalava Tours"
                fill
                sizes="180px"
                priority
                className={`object-contain object-left transition-opacity duration-300 ${
                    overlay ? "opacity-0" : "opacity-100"
                }`}
                />
            </span>
            </Link>

          <nav
            className={`hidden items-center gap-6 text-sm transition-colors duration-300 md:flex ${
              overlay ? "text-white/85" : "text-[#2B2620]"
            }`}
          >
            {visibleLinks.map((link) => (
              <Link
                key={link.key}
                href={link.href}
                className={`relative py-1 transition-colors after:absolute after:inset-x-0 after:-bottom-0.5 after:h-px after:origin-left after:scale-x-0 after:transition-transform after:duration-300 hover:after:scale-x-100 ${
                  overlay
                    ? "hover:text-white after:bg-[#F4A261]"
                    : "hover:text-[#E63946] after:bg-[#E63946]"
                }`}
              >
                {t(link.key)}
              </Link>
            ))}
          </nav>

          {scrolled && (
            <>
              <span className="hidden h-4 w-px bg-black/10 md:block" />
              <div className="hidden items-center gap-2.5 text-[#1d4e5f] md:flex">
                <a href="tel:+261322208362" aria-label="Appeler Sakalava Tours">
                  <IconPhone size={16} />
                </a>
                <LanguageSwitcher />
              </div>
            </>
          )}

          <Link
            href="/reservation"
            className={`whitespace-nowrap rounded-full text-sm font-medium transition-all duration-300 ${
              overlay ? "shadow-[0_10px_25px_-8px_rgba(231,111,81,0.9)] hover:-translate-y-0.5" : ""
            }`}
            style={
              scrolled
                ? { background: "#E63946", color: "#fff", padding: "8px 16px" }
                : overlay
                  ? {
                      background: "linear-gradient(135deg,#F4A261,#E76F51)",
                      color: "#fff",
                      padding: "10px 22px",
                    }
                  : {
                      background: "linear-gradient(135deg,#F4A261,#E76F51)",
                      color: "#4A1B0C",
                      padding: "10px 20px",
                    }
            }
          >
            {t("reserver")}
          </Link>

          <button
            onClick={() => setMobileOpen(true)}
            className={`transition-colors duration-300 md:hidden ${
              overlay ? "text-white" : "text-[#1d4e5f]"
            }`}
            aria-label="Ouvrir le menu"
          >
            <IconMenu2 size={22} />
          </button>
        </div>
      </header>

      <MobileMenu open={mobileOpen} onClose={() => setMobileOpen(false)} />

      {/*
        Sur la home, le hero passe SOUS la nav : aucun espaceur.
        Ailleurs, hauteur fixe (jamais h-0, sinon le contenu saute au scroll).
      */}
      {!isHome && <div className="h-[110px] md:h-[126px]" />}
    </>
  );
}