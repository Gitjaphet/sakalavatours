// src/components/layout/TopBar.tsx
import { contactInfo, socialLinks } from "@/lib/nav-config";
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
  return (
    <div
      className={`flex items-center justify-between gap-3 px-4 py-2 text-[11px] transition-colors duration-300 sm:px-6 sm:text-xs md:px-8 md:py-2.5 md:text-sm ${
        transparent
          ? "bg-black/25 text-white/90 backdrop-blur-[2px] md:bg-transparent md:text-white/80 md:backdrop-blur-none"
          : "bg-[#153e4c] text-[#FDFAF6]/85"
      }`}
    >
      <div className="flex min-w-0 flex-1 items-center gap-3 sm:gap-5">
        <a
          href={`tel:+261${contactInfo.phone.slice(1)}`}
          className="flex shrink-0 items-center gap-1.5 transition-colors hover:text-[#F4A261]"
        >
          <IconPhone size={13} className="shrink-0 text-[#F4A261]" />
          <span className="whitespace-nowrap">{contactInfo.phoneDisplay}</span>
        </a>

        <a
          href={`mailto:${contactInfo.email}`}
          className="flex min-w-0 items-center gap-1.5 transition-colors hover:text-[#F4A261]"
        >
          <IconMail size={13} className="shrink-0 text-[#F4A261]" />
          <span className="truncate">{contactInfo.email}</span>
        </a>

        <span className="hidden shrink-0 items-center gap-1.5 opacity-80 lg:flex">
          <IconClock size={13} />
          {contactInfo.hours}
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