// src/components/layout/TopBar.tsx
"use client";

import { useTranslations } from "next-intl";
import { contactInfo, socialLinks, telHref, mailtoHref } from "@/lib/nav-config";
import { LanguageSwitcher } from "./LanguageSwitcher";
import {
  IconPhone,
  IconMail,
  IconClock,
  IconBrandFacebook,
  IconBrandInstagram,
  IconBrandWhatsapp,
} from "@tabler/icons-react";

const socialIconMap = {
  "brand-facebook": IconBrandFacebook,
  "brand-instagram": IconBrandInstagram,
  "brand-whatsapp": IconBrandWhatsapp,
};

type Props = {
  /** true = posée sur le hero : plus de fond, texte blanc */
  transparent?: boolean;
};

export function TopBar({ transparent = false }: Props) {
  const t = useTranslations("topbar");

  return (
    <div
      className={`flex items-center justify-between gap-3 px-4 py-3 text-xs transition-colors duration-300 sm:gap-4 sm:px-6 sm:text-[13px] md:px-8 md:py-2.5 md:text-sm ${
        transparent
          ? "bg-black/25 text-white/90 backdrop-blur-[2px] md:bg-transparent md:text-white/80 md:backdrop-blur-none"
          : "bg-[#153e4c] text-[#FDFAF6]/85"
      }`}
    >
      <div className="flex min-w-0 flex-1 items-center gap-3 sm:gap-5">
        
        <a
          href={telHref}
          className="flex shrink-0 items-center gap-2 py-0.5 transition-colors hover:text-[#F4A261]"
        >
          <IconPhone size={15} className="shrink-0 text-[#F4A261]" />
          <span className="whitespace-nowrap">{contactInfo.phoneDisplay}</span>
        </a>

        <a
          href={mailtoHref}
          className="flex min-w-0 items-center gap-2 py-0.5 transition-colors hover:text-[#F4A261]"
        >
          <IconMail size={15} className="shrink-0 text-[#F4A261]" />
          <span className="truncate">{contactInfo.email}</span>
        </a>

        <span className="hidden shrink-0 items-center gap-2 opacity-80 lg:flex">
          <IconClock size={15} />
          {t("hours")}
        </span>
      </div>

      <div className="hidden shrink-0 items-center gap-3.5 md:flex">
        <div className="flex items-center gap-3">
          {socialLinks.map(({ key, href, icon }) => {
            const Icon = socialIconMap[icon as keyof typeof socialIconMap];
            return (
              
              <a
                key={key}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={key}
                className="opacity-85 transition-opacity hover:opacity-100"
              >
                <Icon size={16} />
              </a>
            );
          })}
        </div>
        <span className="h-3 w-px bg-white/25" />
        <LanguageSwitcher variant="topbar" />
      </div>
    </div>
  );
}