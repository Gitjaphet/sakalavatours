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

export function LanguageSwitcher({ variant = "nav" }: { variant?: "topbar" | "nav" }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();

  const current = locales.find((l) => l.code === locale) ?? locales[0];

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center gap-1.5 ${variant === "topbar" ? "text-xs" : "text-sm text-[#2B2620]"}`}
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <span>{current.flag}</span>
        {variant === "topbar" && <span>{current.code.toUpperCase()}</span>}
        <IconChevronDown size={12} />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-36 rounded-lg border border-black/5 bg-[#FDFAF6] py-1.5 shadow-lg z-50">
          {locales.map((l) => (
            <button
              key={l.code}
              onClick={() => {
                router.replace(pathname, { locale: l.code });
                setOpen(false);
              }}
              className={`flex w-full items-center gap-2 px-3 py-2 text-sm text-left rounded-md mx-1 ${
                l.code === locale ? "bg-[#E63946]/8 text-[#2B2620]" : "text-[#2B2620] hover:bg-black/5"
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