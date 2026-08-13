"use client";

import { useState, useRef, useEffect } from "react";
import { usePathname, useRouter } from "@/i18n/navigation";
import { useLocale } from "next-intl";
import { IconChevronDown } from "@tabler/icons-react";

const locales = [
  { code: "fr", flag: "🇫🇷", label: "Français" },
  { code: "en", flag: "🇬🇧", label: "English" },
  { code: "de", flag: "🇩🇪", label: "Deutsch" },
] as const;

type Props = {
  variant?: "topbar" | "nav";
  /** "up" = le panneau s'ouvre au-dessus (pied de menu burger) */
  direction?: "down" | "up";
};

export function LanguageSwitcher({ variant = "nav", direction = "down" }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();

  const current = locales.find((l) => l.code === locale) ?? locales[0];
  const isUp = direction === "up";

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center gap-1.5 ${
          variant === "topbar" ? "text-xs" : "text-sm text-[#ffff]"
        }`}
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <span>{current.flag}</span>
        {variant === "topbar" && <span>{current.code.toUpperCase()}</span>}
        <IconChevronDown
          size={12}
          className={`transition-transform duration-200 ${
            open ? (isUp ? "rotate-0" : "rotate-180") : isUp ? "rotate-180" : "rotate-0"
          }`}
        />
      </button>

      {open && (
        <div
          role="listbox"
          className={`absolute right-0 z-50 w-36 rounded-lg border border-black/5 bg-[#FDFAF6] py-1.5 shadow-lg ${
            isUp ? "bottom-full mb-2" : "top-full mt-2"
          }`}
        >
          {locales.map((l) => (
            <button
              key={l.code}
              role="option"
              aria-selected={l.code === locale}
              onClick={() => {
                router.replace(pathname, { locale: l.code });
                setOpen(false);
              }}
              className={`mx-1 flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm ${
                l.code === locale
                  ? "bg-[#E63946]/8 text-[#2B2620]"
                  : "text-[#2B2620] hover:bg-black/5"
              }`}
              style={{ width: "calc(100% - 8px)" }}
            >
              <span>{l.flag}</span>
              {l.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}