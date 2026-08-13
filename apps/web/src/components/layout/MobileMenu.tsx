"use client";

import { useEffect } from "react";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { navLinks, contactInfo, socialLinks } from "@/lib/nav-config";
import { LanguageSwitcher } from "./LanguageSwitcher";
import {
  IconX,
  IconPhone,
  IconMail,
  IconBrandFacebook,
  IconBrandInstagram,
  IconBrandWhatsapp,
} from "@tabler/icons-react";

const socialIconMap = {
  "brand-facebook": IconBrandFacebook,
  "brand-instagram": IconBrandInstagram,
  "brand-whatsapp": IconBrandWhatsapp,
};

export function MobileMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
  const t = useTranslations("nav");

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <div
        onClick={onClose}
        className={`fixed inset-0 z-[60] bg-black/40 transition-opacity duration-300 md:hidden ${
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      />

      <div
        className={`fixed top-0 right-0 bottom-0 z-[70] w-[82%] max-w-sm bg-[#FDFAF6] shadow-2xl transition-transform duration-300 ease-out md:hidden flex flex-col ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-black/5">
          <span style={{ fontFamily: "var(--font-courgette)", color: "#1d4e5f" }} className="text-lg">
            Sakalava Tours
          </span>
          <button onClick={onClose} aria-label="Fermer le menu" className="text-[#2B2620]">
            <IconX size={22} />
          </button>
        </div>

        <nav className="flex flex-col px-5 py-4 gap-1 text-[#2B2620]">
          {navLinks.map((link) => (
            <Link
              key={link.key}
              href={link.href}
              onClick={onClose}
              className="py-3 text-base border-b border-black/5 hover:text-[#E63946] transition-colors"
            >
              {t(link.key)}
            </Link>
          ))}
        </nav>

        <Link
          href="/reservation"
          onClick={onClose}
          className="mx-5 mt-2 text-center rounded-full font-medium text-sm py-3"
          style={{ background: "#E63946", color: "#fff" }}
        >
          {t("reserver")}
        </Link>

        <div className="mt-auto px-5 py-5 border-t border-black/5 flex flex-col gap-3 text-sm text-[#2B2620]">
          <a href="tel:+261322208362" className="flex items-center gap-2">
            <IconPhone size={16} className="text-[#1d4e5f]" />
            03 22 20 83 62
          </a>
          <a href={`mailto:${contactInfo.email}`} className="flex items-center gap-2">
            <IconMail size={16} className="text-[#1d4e5f]" />
            {contactInfo.email}
          </a>

          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-4">
              {socialLinks.map(({ key, href, icon }) => {
                const Icon = socialIconMap[icon as keyof typeof socialIconMap];
                return (
                  <a key={key} href={href} target="_blank" rel="noopener noreferrer" aria-label={key} className="text-[#1d4e5f]">
                    <Icon size={20} />
                  </a>
                );
              })}
            </div>
            <LanguageSwitcher />
          </div>
        </div>
      </div>
    </>
  );
}