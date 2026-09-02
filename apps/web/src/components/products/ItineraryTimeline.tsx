"use client";

import { useEffect, useRef, useState } from "react";
import type { ComponentType } from "react";
import {
  IconChevronDown,
  IconMapPin,
  IconBed,
  IconToolsKitchen2,
  IconRoute,
} from "@tabler/icons-react";

type MetaIcon = "location" | "hotel" | "meal" | "distance";

const META_ICONS: Record<
  MetaIcon,
  ComponentType<{ size?: number; stroke?: number; className?: string }>
> = {
  location: IconMapPin,
  hotel: IconBed,
  meal: IconToolsKitchen2,
  distance: IconRoute,
};

export type ItineraryStepData = {
  dayLabel: string;
  optionalLabel?: string;
  title: string;
  description?: string | null;
  meta: { icon: MetaIcon; label: string; srLabel: string }[];
};

function TimelineItem({
  step,
  index,
  side,
}: {
  step: ItineraryStepData;
  index: number;
  side: "left" | "right";
}) {
  const ref = useRef<HTMLLIElement>(null);
  const [visible, setVisible] = useState(index === 0);

  useEffect(() => {
    if (index === 0) return;
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2, rootMargin: "0px 0px -60px 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [index]);

  return (
    <li
      ref={ref}
      className={`relative lg:flex lg:items-start lg:gap-10 ${
        side === "right" ? "lg:flex-row-reverse" : ""
      }`}
    >
      {/* Point sur la ligne : à gauche en mobile, centré en desktop */}
      <span
        aria-hidden="true"
        className={`absolute -left-[1.95rem] top-4 h-3 w-3 rounded-full bg-[#F4A261] transition-transform duration-500 lg:left-1/2 lg:top-6 lg:-translate-x-1/2 ${
          visible ? "scale-100" : "scale-0"
        }`}
      />

      <div
        className={`transition-all duration-700 ease-out lg:w-1/2 ${
          visible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
        }`}
      >
        <details
          className="group overflow-hidden rounded-2xl border border-stone-200 bg-white transition-shadow open:shadow-sm"
          open={index === 0}
        >
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 marker:content-none">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#1d4e5f]">
                {step.dayLabel}
                {step.optionalLabel && ` · ${step.optionalLabel}`}
              </p>
              <h3 className="mt-0.5 text-base font-semibold text-stone-900">
                {step.title}
              </h3>
            </div>
            <IconChevronDown
              size={18}
              className="shrink-0 text-stone-400 transition-transform duration-300 group-open:rotate-180"
            />
          </summary>

          <div className="border-t border-stone-100 px-4 pb-4 pt-3">
            {step.description && (
              <p className="whitespace-pre-line text-sm leading-relaxed text-stone-600">
                {step.description}
              </p>
            )}

            {step.meta.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {step.meta.map((m, mi) => {
                  const Icon = META_ICONS[m.icon];
                  return (
                    <span
                      key={mi}
                      className="inline-flex items-center gap-1.5 rounded-full border border-stone-200 bg-stone-50 px-3 py-1.5 text-xs font-medium text-stone-600"
                    >
                      <Icon size={14} stroke={2} className="text-[#1d4e5f]" />
                      <span className="sr-only">{m.srLabel} :</span>
                      {m.label}
                    </span>
                  );
                })}
              </div>
            )}
          </div>
        </details>
      </div>

      {/* Colonne vide de l'autre côté, uniquement en desktop */}
      <div className="hidden lg:block lg:w-1/2" />
    </li>
  );
}

export function ItineraryTimeline({ steps }: { steps: ItineraryStepData[] }) {
  return (
    <ol
      className="relative mt-6 space-y-6 border-l-2 border-[#1d4e5f]/15 pl-6 lg:space-y-10 lg:border-l-0 lg:pl-0 lg:before:absolute lg:before:inset-y-0 lg:before:left-1/2 lg:before:w-px lg:before:-translate-x-1/2 lg:before:bg-[#1d4e5f]/15 lg:before:content-['']"
    >
      {steps.map((step, i) => (
        <TimelineItem
          key={i}
          step={step}
          index={i}
          side={i % 2 === 0 ? "left" : "right"}
        />
      ))}
    </ol>
  );
}
