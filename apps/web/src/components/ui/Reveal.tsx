// src/components/ui/Reveal.tsx
"use client";

import { useEffect, useRef, useState } from "react";

type Direction = "up" | "down" | "left" | "right" | "scale" | "none";

type RevealProps = {
  children: React.ReactNode;
  /** Sens d'entrée du contenu */
  direction?: Direction;
  /** Décalage en ms — utile pour cascader plusieurs blocs */
  delay?: number;
  /** Fraction de l'élément devant être visible pour déclencher (0 → 1) */
  threshold?: number;
  /** false = le contenu se re-cache en sortant du viewport */
  once?: boolean;
  className?: string;
};

export function Reveal({
  children,
  direction = "up",
  delay = 0,
  threshold = 0.12,
  once = true,
  className,
}: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Filet de sécurité : navigateur sans IntersectionObserver
    if (typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          if (once) observer.disconnect();
        } else if (!once) {
          setVisible(false);
        }
      },
      { threshold, rootMargin: "0px 0px -8% 0px" },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [once, threshold]);

  return (
    <div
      ref={ref}
      className={className}
      data-reveal={direction}
      data-visible={visible ? "" : undefined}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </div>
  );
}
