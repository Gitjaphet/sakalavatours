// src/components/home/Hero.tsx
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import {
  AnimatePresence,
  motion,
  useReducedMotion,
  type PanInfo,
} from "framer-motion";
import { Link } from "@/i18n/navigation";
import { heroDestinations } from "@/lib/hero-data";
import DestinationCard from "./DestinationCard";

const AUTOPLAY_MS = 6000;

/** Gouttière unique : titre, cartes et contrôles s'alignent tous dessus */
const CONTAINER = "mx-auto w-full max-w-[1400px] px-5 sm:px-6 lg:px-8 xl:px-20";

/** Cartes visibles : 1 (mobile) → 2 (tablette + mini-desktop) → 3 (desktop) */
const SLOT_VISIBILITY = ["block", "hidden sm:block", "hidden xl:block"] as const;

export default function Hero() {
  const t = useTranslations("hero");
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const reduceMotion = useReducedMotion();
  const draggedRef = useRef(false);

  const total = heroDestinations.length;
  const active = heroDestinations[index];

  const go = useCallback(
    (dir: 1 | -1) => setIndex((i) => (i + dir + total) % total),
    [total],
  );

  useEffect(() => {
    if (paused || reduceMotion) return;
    const timer = setTimeout(() => setIndex((i) => (i + 1) % total), AUTOPLAY_MS);
    return () => clearTimeout(timer);
  }, [index, paused, reduceMotion, total]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go]);

  /** Swipe tactile : seuil de distance OU de vélocité (flick rapide) */
  const onDragEnd = (_: unknown, info: PanInfo) => {
    const { offset, velocity } = info;
    if (offset.x < -60 || velocity.x < -450) go(1);
    else if (offset.x > 60 || velocity.x > 450) go(-1);
    setPaused(false);
    // évite le "clic fantôme" sur la carte à la fin d'un swipe
    setTimeout(() => {
      draggedRef.current = false;
    }, 80);
  };

  const selectDestination = (id: string) => {
    if (draggedRef.current) return;
    setIndex(heroDestinations.findIndex((x) => x.id === id));
  };

  return (
    <section
      aria-roledescription="carrousel"
      aria-label={t("carouselLabel")}
      className="relative isolate flex min-h-[100svh] w-full flex-col overflow-hidden bg-[#0d2f3c] lg:h-svh lg:min-h-[700px]"
    >
      {/* ── Fond ──────────────────────────────────────────────────────── */}
      <AnimatePresence mode="sync">
        <motion.div
          key={active.id}
          className="absolute inset-0 -z-10"
          initial={{ opacity: 0, scale: reduceMotion ? 1 : 1.08 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{
            opacity: { duration: 1, ease: "easeInOut" },
            scale: { duration: 8, ease: "linear" },
          }}
        >
          <Image
            src={active.image}
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover object-[60%_center] lg:object-center"
          />
        </motion.div>
      </AnimatePresence>

      {/* Voile horizontal : utile seulement quand le layout est en 2 colonnes */}
      <div className="pointer-events-none absolute inset-0 -z-10 hidden bg-gradient-to-r from-[#08222b]/95 via-[#08222b]/60 to-[#08222b]/10 lg:block" />
      {/* Voile vertical : renforcé en mobile/tablette pour garantir la lisibilité */}
      <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-t from-[#08222b]/95 via-[#08222b]/75 to-[#08222b]/65 lg:from-[#08222b]/92 lg:via-[#08222b]/45 lg:to-[#08222b]/45" />

      {/* ── Bloc central ──────────────────────────────────────────────── */}
      <div
        className={`${CONTAINER} grid flex-1 grid-cols-1 items-center gap-y-9 pb-8 pt-28 sm:gap-y-12 sm:pt-32 lg:grid-cols-12 lg:gap-x-16 lg:pb-6 lg:pt-36`}
      >
        {/* Colonne gauche */}
        <div className="min-w-0 lg:col-span-5">
          <p className="text-[10px] font-medium uppercase tracking-[0.28em] text-[#F4A261] sm:text-xs">
            {t("eyebrow")}
          </p>

          <div className="relative">
            <AnimatePresence initial={false}>
              <motion.div
                key={active.id}
                className="w-full"
                initial={{ opacity: 0, y: reduceMotion ? 0 : 28 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: reduceMotion ? 0 : -18, position: "absolute", top: 0 }}
                transition={{ duration: 0.6, ease: [0.32, 0.72, 0, 1] }}
              >
                <h1 className="mt-3 pb-2 font-[family-name:var(--font-courgette)] ...">
                  {active.name}
                </h1>

                <p className="mt-3 text-[10px] font-medium uppercase tracking-[0.22em] text-white/75 sm:mt-4 sm:text-[11px]">
                  {t(`destinations.${active.id}.region`)}
                </p>

                <p className="mt-5 max-w-[38ch] text-[15px] leading-relaxed text-white/90 sm:mt-7 sm:text-[17px]">
                  {t(`destinations.${active.id}.description`)}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* ── Boutons d'action ─────────────────────────────────────── */}
          <div
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
            className="mt-7 flex max-w-[420px] flex-col gap-3 sm:mt-9 sm:max-w-[500px] lg:max-w-none 2xl:max-w-[430px]"
          >
            <Link
              href={active.href}
              className="group inline-flex w-full items-center justify-center gap-3 rounded-full bg-gradient-to-r from-[#F4A261] to-[#E76F51] px-7 py-4 text-sm font-semibold text-white shadow-[0_14px_30px_-10px_rgba(231,111,81,0.8)] transition-transform duration-300 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white sm:py-3.5"
            >
              {t("discover")}
              <svg
                viewBox="0 0 24 24"
                className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1"
                aria-hidden="true"
              >
                <path
                  d="M4 12h15M13 6l6 6-6 6"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </Link>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-1 2xl:grid-cols-2">
              <Link
                href="/circuits"
                className="inline-flex items-center justify-center rounded-full bg-white/10 px-5 py-3.5 text-center text-[13px] font-medium text-white/90 ring-1 ring-white/25 backdrop-blur-md transition-colors duration-300 hover:bg-white/20 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white sm:text-sm"
              >
                {t("allCircuits")}
              </Link>

              <Link
                href="/avis"
                className="inline-flex items-center justify-center rounded-full bg-white/10 px-5 py-3.5 text-center text-[13px] font-medium text-white/90 ring-1 ring-white/25 backdrop-blur-md transition-colors duration-300 hover:bg-white/20 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white sm:text-sm"
              >
                {t("reviews")}
              </Link>
            </div>
          </div>
        </div>

        {/* Colonne droite : carrousel de cartes (swipe tactile) */}
        <div className="min-w-0 lg:col-span-7">
          <motion.div
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.14}
            dragMomentum={false}
            onDragStart={() => {
              draggedRef.current = true;
              setPaused(true);
            }}
            onDragEnd={onDragEnd}
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
            className="touch-pan-y"
          >
            <div className="mx-auto flex justify-center gap-4 sm:gap-5 lg:gap-6 2xl:gap-7">
              <AnimatePresence mode="popLayout" initial={false}>
                {Array.from({ length: 3 }, (_, i) => {
                  const d = heroDestinations[(index + i) % total];
                  return (
                    <motion.div
                      key={d.id}
                      layout
                      initial={{ opacity: 0, x: 48, scale: 0.94 }}
                      animate={{ opacity: 1, x: 0, scale: 1 }}
                      exit={{ opacity: 0, x: -48, scale: 0.94 }}
                      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                      className={[
                        SLOT_VISIBILITY[i],
                        "shrink-0",
                        // mobile : 1 carte large
                        "h-[min(54vh,420px)] w-full max-w-[340px]",
                        // tablette (640–1023) : 2 cartes
                        "sm:h-[clamp(360px,50vh,500px)] sm:w-[clamp(240px,42vw,380px)] sm:max-w-none",
                        // mini-desktop / POS (1024–1279) : contraint par la colonne 7/12
                        "lg:h-[clamp(320px,44vh,440px)] lg:w-[clamp(200px,23vw,260px)]",
                        // desktop (≥1280) : 3 cartes
                        "xl:h-[clamp(340px,46vh,460px)] xl:w-[clamp(190px,14vw,270px)]",
                        // grand desktop (≥1536) : cartes plus hautes
                        "2xl:h-[clamp(420px,56vh,560px)]",
                      ].join(" ")}
                    >
                      <DestinationCard
                        destination={d}
                        isActive={i === 0}
                        priority={index === 0 && i === 0}
                        onSelect={() => selectDestination(d.id)}
                      />
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      </div>

      {/* ── Barre de contrôles ────────────────────────────────────────── */}
      <div className={CONTAINER}>
        <div className="flex items-center justify-between gap-4 border-t border-white/15 py-4 sm:gap-6 sm:py-6 lg:py-7">
          <div className="flex items-center gap-4 sm:gap-5">
            <div className="flex items-center gap-2">
              {heroDestinations.map((d, i) => (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => setIndex(i)}
                  aria-label={t("show", { name: d.name })}
                  aria-current={i === index}
                  className="group relative flex h-11 items-center px-1.5 focus-visible:outline-none"
                  style={{ width: i === index ? 60 : 26 }}
                >
                  <span
                    className="relative h-1.5 w-full overflow-hidden rounded-full transition-[width] duration-500 group-focus-visible:ring-2 group-focus-visible:ring-[#F4A261]"
                  >
                    <span className="absolute inset-0 bg-white/25" />
                    {i === index && !reduceMotion && (
                      <motion.span
                        key={`progress-${index}-${paused}`}
                        className="absolute inset-y-0 left-0 bg-gradient-to-r from-[#F4A261] to-[#E76F51]"
                        initial={{ width: "0%" }}
                        animate={{ width: paused ? "0%" : "100%" }}
                        transition={{ duration: AUTOPLAY_MS / 1000, ease: "linear" }}
                      />
                    )}
                  </span>
                </button>
              ))}
            </div>

            <span className="text-[11px] tabular-nums text-white/50 sm:text-xs">
              {String(index + 1).padStart(2, "0")} /{" "}
              {String(total).padStart(2, "0")}
            </span>
          </div>

          <div className="flex items-center gap-2.5 sm:gap-3">
            <button
              type="button"
              onClick={() => go(-1)}
              aria-label={t("prev")}
              className="grid h-11 w-11 place-items-center rounded-full text-white ring-1 ring-white/30 backdrop-blur-md transition hover:bg-white hover:text-[#08222b] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F4A261]"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
                <path
                  d="M20 12H5M11 6l-6 6 6 6"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => go(1)}
              aria-label={t("next")}
              className="grid h-11 w-11 place-items-center rounded-full text-white ring-1 ring-white/30 backdrop-blur-md transition hover:bg-white hover:text-[#08222b] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F4A261]"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
                <path
                  d="M4 12h15M13 6l6 6-6 6"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}