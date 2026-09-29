"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

type State = "shown" | "hidden";

/** Fades and slides children in on scroll; children stay static under prefers-reduced-motion. */
export function Reveal({ children, className = "" }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<State>("shown");

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (el.getBoundingClientRect().top < window.innerHeight) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setState("shown");
          observer.disconnect();
        }
      },
      { threshold: 0.1 },
    );
    setState("hidden");
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`transition duration-500 ease-out ${state === "hidden" ? "translate-y-4 opacity-0" : "translate-y-0 opacity-100"} ${className}`}
    >
      {children}
    </div>
  );
}
