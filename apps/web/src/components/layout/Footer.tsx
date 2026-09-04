import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import {
  IconPhone,
  IconMail,
  IconClock,
  IconMapPin,
  IconArrowRight,
  IconBrandFacebook,
  IconBrandInstagram,
  IconBrandWhatsapp,
} from "@tabler/icons-react";
import {
  businessInfo,
  contactInfo,
  footerDestinations,
  footerExplore,
  mailtoHref,
  socialLinks,
  telHref,
} from "@/lib/nav-config";

const socialIconMap = {
  "brand-facebook": IconBrandFacebook,
  "brand-instagram": IconBrandInstagram,
  "brand-whatsapp": IconBrandWhatsapp,
} as const;

/** Trait court sous les titres de colonnes — rappel du trait sous le H1 du hero */
function ColumnTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <h2 className="text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-[#F4A261]">
        {children}
      </h2>
      <span
        aria-hidden="true"
        className="mt-2 block h-0.5 w-8 shrink-0 rounded-full bg-gradient-to-r from-[#F4A261] to-[#E76F51]"
      />
    </div>
  );
}

export async function Footer() {
  const t = await getTranslations("footer");
  const tNav = await getTranslations("nav");
  const tTop = await getTranslations("topbar");
  const year = new Date().getFullYear();

  return (
    <footer className="relative isolate mt-16 overflow-hidden rounded-tl-[2.5rem] bg-[#0d2b32] sm:mt-20 lg:rounded-tl-[4rem]">
      <Image
        src="/images/hero/mont-passot.jpg"
        alt=""
        fill
        sizes="100vw"
        className="object-cover object-center"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[#0d2b32]/[0.92]"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-b from-[#0d2b32] via-[#0d2b32]/85 to-[#0d2b32]"
      />

      <div className="relative">
        <div className="bg-[#E76F51]">
          <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-6 sm:px-6 sm:py-7 lg:flex-row lg:items-center lg:justify-between lg:px-8">
            <div>
              <p className="text-base font-medium text-white sm:text-lg">
                {t("cta.title")}
              </p>
              <p className="mt-1 text-sm text-white/85">{t("cta.text")}</p>
            </div>
            <Link
              href="/contact"
              className="inline-flex w-fit shrink-0 items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-medium text-[#c2451f] transition-transform duration-300 hover:scale-[1.03]"
            >
              {t("cta.button")}
              <IconArrowRight size={16} className="shrink-0" />
            </Link>
          </div>
        </div>

        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-10 px-4 py-12 sm:grid-cols-2 sm:px-6 sm:py-14 lg:grid-cols-[1.4fr_1fr_1fr_1.2fr] lg:gap-8 lg:px-8">
          <div>
            <p className="font-[family-name:var(--font-courgette)] text-2xl text-white">
              {businessInfo.name}
            </p>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-white/65">
              {t("tagline")}
            </p>
            <p className="mt-6 text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-white/45">
              {t("followUs")}
            </p>
            <ul className="mt-3 flex items-center gap-2.5">
              {socialLinks.map(({ key, href, icon }) => {
                const Icon = socialIconMap[icon as keyof typeof socialIconMap];
                return (
                  <li key={key}>
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={key}
                      className="grid h-9 w-9 place-items-center rounded-full bg-white/10 text-white/80 transition-colors duration-300 hover:bg-[#E76F51] hover:text-white"
                    >
                      <Icon size={17} />
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>

          <nav aria-labelledby="footer-explore">
            <ColumnTitle>
              <span id="footer-explore">{t("exploreTitle")}</span>
            </ColumnTitle>
            <ul className="space-y-2.5">
              {footerExplore.map((link) => (
                <li key={link.key}>
                  <Link
                    href={link.href}
                    className="text-sm text-white/70 transition-colors duration-300 hover:text-[#F4A261]"
                  >
                    {link.i18n === "nav" ? tNav(link.key) : t(`links.${link.key}`)}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-labelledby="footer-destinations">
            <ColumnTitle>
              <span id="footer-destinations">{t("destinationsTitle")}</span>
            </ColumnTitle>
            <ul className="space-y-2.5">
              {footerDestinations.map((dest) => (
                <li key={dest.href}>
                  <Link
                    href={dest.href}
                    className="text-sm text-white/70 transition-colors duration-300 hover:text-[#F4A261]"
                  >
                    {dest.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <ColumnTitle>{t("contactTitle")}</ColumnTitle>
            <ul className="space-y-3 text-sm text-white/70">
              <li className="flex items-start gap-2.5">
                <IconMapPin size={16} className="mt-0.5 shrink-0 text-[#7fa3a8]" />
                <span>
                  {businessInfo.addressLocality}, {businessInfo.addressRegion}
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <IconPhone size={16} className="mt-0.5 shrink-0 text-[#7fa3a8]" />
                <a
                  href={telHref}
                  className="transition-colors duration-300 hover:text-[#F4A261]"
                >
                  {contactInfo.phoneDisplay}
                </a>
              </li>
              <li className="flex items-start gap-2.5">
                <IconMail size={16} className="mt-0.5 shrink-0 text-[#7fa3a8]" />
                <a
                  href={mailtoHref}
                  className="break-all transition-colors duration-300 hover:text-[#F4A261]"
                >
                  {contactInfo.email}
                </a>
              </li>
              <li className="flex items-start gap-2.5">
                <IconClock size={16} className="mt-0.5 shrink-0 text-[#7fa3a8]" />
                <span>{tTop("hours")}</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10">
          <div className="mx-auto max-w-6xl px-4 py-5 sm:px-6 lg:px-8">
            <p className="text-center text-xs text-white/45">
              © {year} {businessInfo.name} — {t("rights")}
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}