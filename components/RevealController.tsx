"use client";

import { useEffect } from "react";

/**
 * Progressive scroll-reveal: adds `.reveal-in` to any `.reveal` element as it
 * enters the viewport. The hidden state is scoped to `.reveal-ready` (set here),
 * so content stays visible if JS never runs. Respects reduced-motion.
 */
export function RevealController() {
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;

    const root = document.documentElement;
    root.classList.add("reveal-ready");

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("reveal-in");
            io.unobserve(entry.target);
          }
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 }
    );

    const els = document.querySelectorAll(".reveal");
    els.forEach((el) => io.observe(el));

    return () => io.disconnect();
  }, []);

  return null;
}
