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
      className={`hidden items-center justify-between px-8 py-2.5 text-sm transition-colors duration-300 md:flex ${
        transparent ? "bg-transparent text-white/80" : "bg-[#153e4c] text-[#FDFAF6]/85"
      }`}
    >
      <div className="flex items-center gap-5">
        <a
          href={`tel:+261${contactInfo.phone.slice(1)}`}
          className="flex items-center gap-1.5 transition-colors hover:text-[#F4A261]"
        >
          <IconPhone size={13} className="text-[#F4A261]" />
          {contactInfo.phoneDisplay}
        </a>

        <a
          href={`mailto:${contactInfo.email}`}
          className="flex items-center gap-1.5 transition-colors hover:text-[#F4A261]"
        >
          <IconMail size={13} className="text-[#F4A261]" />
          {contactInfo.email}
        </a>

        <span className="flex items-center gap-1.5 opacity-80">
          <IconClock size={13} />
          {contactInfo.hours}
        </span>
      </div>

      <div className="flex items-center gap-3.5">
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