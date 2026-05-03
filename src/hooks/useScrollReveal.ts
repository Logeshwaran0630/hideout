"use client";
import { useEffect, useRef } from "react";

export function useScrollReveal(className = "fade-up") {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const classNames = className.split(/\s+/).filter(Boolean);
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) el.classList.add(...classNames);
      },
      { threshold: 0.15 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [className]);
  return ref;
}