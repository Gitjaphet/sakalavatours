// src/components/providers/RouteLoaderProvider.tsx
"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useTranslations, useLocale } from "next-intl";
import { usePathname } from "@/i18n/navigation";

/** Délai avant affichage : une navigation instantanée ne doit pas faire
 *  clignoter la notification. En dessous de ce seuil, rien ne s'affiche. */
const SHOW_DELAY_MS = 140;

/** Filet de sécurité : si la route ne change jamais (erreur, lien mort),
 *  on retire la notification plutôt que de la laisser tourner à l'infini. */
const SAFETY_TIMEOUT_MS = 8000;

type RouteLoaderContextValue = {
  isLoading: boolean;
  /** À appeler avant une navigation programmatique (changement de langue…) */
  start: () => void;
  stop: () => void;
};

const RouteLoaderContext = createContext<RouteLoaderContextValue | null>(null);

export function useRouteLoader() {
  const ctx = useContext(RouteLoaderContext);
  if (!ctx) {
    throw new Error("useRouteLoader doit être utilisé dans RouteLoaderProvider");
  }
  return ctx;
}

export function RouteLoaderProvider({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(false);
  const pathname = usePathname();
  const locale = useLocale();
  const t = useTranslations("common");
  const reduceMotion = useReducedMotion();

  const showTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const safetyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimers = useCallback(() => {
    if (showTimer.current) clearTimeout(showTimer.current);
    if (safetyTimer.current) clearTimeout(safetyTimer.current);
    showTimer.current = null;
    safetyTimer.current = null;
  }, []);

  const stop = useCallback(() => {
    clearTimers();
    setIsLoading(false);
  }, [clearTimers]);

  const start = useCallback(() => {
    clearTimers();
    showTimer.current = setTimeout(() => setIsLoading(true), SHOW_DELAY_MS);
    safetyTimer.current = setTimeout(() => setIsLoading(false), SAFETY_TIMEOUT_MS);
  }, [clearTimers]);

  /** La nouvelle route est montée → on retire la notification.
   *  `locale` est dans les dépendances car un changement de langue ne modifie
   *  pas le pathname retourné par next-intl (la locale en est retirée). */
  useEffect(() => {
    stop();
  }, [pathname, locale, stop]);

  useEffect(() => clearTimers, [clearTimers]);

  /** Interception globale des clics sur liens internes.
   *  En phase de capture, sans jamais appeler preventDefault : on observe,
   *  on ne détourne pas la navigation. */
  useEffect(() => {
    function onClick(e: MouseEvent) {
      // clic modifié (nouvel onglet, téléchargement…) → navigation externe
      if (e.defaultPrevented) return;
      if (e.button !== 0) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

      const anchor = (e.target as HTMLElement | null)?.closest("a");
      if (!anchor) return;

      const href = anchor.getAttribute("href");
      if (!href) return;

      // liens sortants, protocoles spéciaux, ancres, téléchargements
      if (anchor.target && anchor.target !== "_self") return;
      if (anchor.hasAttribute("download")) return;
      if (/^(mailto:|tel:|https?:\/\/|\/\/)/i.test(href)) return;
      if (href.startsWith("#")) return;

      const url = new URL(anchor.href, window.location.origin);
      if (url.origin !== window.location.origin) return;

      // même page → rien à charger
      if (url.pathname === window.location.pathname && !url.search) return;

      start();
    }

    document.addEventListener("click", onClick, { capture: true });
    return () => document.removeEventListener("click", onClick, { capture: true });
  }, [start]);

  return (
    <RouteLoaderContext.Provider value={{ isLoading, start, stop }}>
      {children}

      {/* ── Barre de progression, haut de page ───────────────────────── */}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            key="route-progress"
            className="pointer-events-none fixed inset-x-0 top-0 z-[100] h-[3px] origin-left bg-gradient-to-r from-[#F4A261] to-[#E76F51]"
            initial={{ scaleX: 0, opacity: 1 }}
            animate={{ scaleX: reduceMotion ? 1 : 0.9 }}
            exit={{ scaleX: 1, opacity: 0 }}
            transition={{
              scaleX: { duration: reduceMotion ? 0 : 2.2, ease: [0.32, 0.72, 0, 1] },
              opacity: { duration: 0.35, ease: [0.32, 0.72, 0, 1] },
            }}
          />
        )}
      </AnimatePresence>

      {/* ── Notification « Chargement… », bas d'écran ────────────────── */}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            key="route-toast"
            role="status"
            aria-live="polite"
            className="pointer-events-none fixed inset-x-0 bottom-[max(1.25rem,env(safe-area-inset-bottom))] z-[100] flex justify-center px-4"
            initial={{ opacity: 0, y: reduceMotion ? 0 : 22, scale: reduceMotion ? 1 : 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: reduceMotion ? 0 : 14, scale: reduceMotion ? 1 : 0.97 }}
            transition={{ duration: 0.42, ease: [0.32, 0.72, 0, 1] }}
          >
            <div className="flex items-center gap-2.5 rounded-full border border-white/12 bg-[#0b2a35]/85 py-2.5 pl-3.5 pr-5 text-[13px] font-medium text-white/90 shadow-[0_18px_45px_-15px_rgba(0,0,0,0.8)] backdrop-blur-xl">
              <span
                aria-hidden="true"
                className="block h-3.5 w-3.5 shrink-0 animate-spin rounded-full border-[2px] border-white/25 border-t-[#F4A261]"
              />
              {t("loading")}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </RouteLoaderContext.Provider>
  );
}