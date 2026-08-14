// src/components/layout/LanguageSwitcher.tsx
"use client";

import { useState, useRef, useEffect, useTransition } from "react";
import { usePathname, useRouter } from "@/i18n/navigation";
import { useLocale } from "next-intl";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { IconChevronDown } from "@tabler/icons-react";
import { useRouteLoader } from "@/components/providers/RouteLoaderProvider";

const locales = [
  { code: "fr", flag: "🇫🇷", label: "Français" },
  { code: "en", flag: "🇬🇧", label: "English" },
  { code: "de", flag: "🇩🇪", label: "Deutsch" },
  { code: "it", flag: "🇮🇹", label: "Italiano" },
] as const;

type Props = {
  variant?: "topbar" | "nav";
  /** "up" = le panneau s'ouvre au-dessus (pied de menu burger) */
  direction?: "down" | "up";
};

export function LanguageSwitcher({ variant = "nav", direction = "down" }: Props) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const ref = useRef<HTMLDivElement>(null);
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const { start } = useRouteLoader();

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

  /** Navigation programmatique : le loader ne peut pas la détecter seul,
   *  on le déclenche donc explicitement. */
  const switchTo = (code: (typeof locales)[number]["code"]) => {
    setOpen(false);
    if (code === locale) return;
    start();
    startTransition(() => {
      router.replace(pathname, { locale: code });
    });
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        disabled={isPending}
        className={`flex items-center gap-1.5 transition-opacity duration-300 disabled:opacity-50 ${
          variant === "topbar" ? "text-xs" : "text-sm text-[#2B2620]"
        }`}
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <span>{current.flag}</span>
        {variant === "topbar" && <span>{current.code.toUpperCase()}</span>}
        <IconChevronDown
          size={12}
          className="transition-transform duration-300"
          style={{
            transform: `rotate(${isUp ? (open ? 0 : 180) : open ? 180 : 0}deg)`,
            transitionTimingFunction: "var(--ease-ios)",
          }}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            role="listbox"
            initial={{
              opacity: 0,
              y: reduceMotion ? 0 : isUp ? 8 : -8,
              scale: reduceMotion ? 1 : 0.97,
            }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{
              opacity: 0,
              y: reduceMotion ? 0 : isUp ? 6 : -6,
              scale: reduceMotion ? 1 : 0.98,
            }}
            transition={{ duration: 0.26, ease: [0.32, 0.72, 0, 1] }}
            style={{ transformOrigin: isUp ? "bottom right" : "top right" }}
            className={`absolute right-0 z-50 w-36 rounded-lg border border-black/5 bg-[#FDFAF6] py-1.5 shadow-lg ${
              isUp ? "bottom-full mb-2" : "top-full mt-2"
            }`}
          >
            {locales.map((l) => (
              <button
                key={l.code}
                role="option"
                aria-selected={l.code === locale}
                onClick={() => switchTo(l.code)}
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
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}