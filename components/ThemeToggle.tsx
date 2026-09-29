"use client";

import { useSyncExternalStore } from "react";

const STORAGE_KEY = "buildrent-theme";

function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  return () => observer.disconnect();
}

const isDark = () => document.documentElement.getAttribute("data-theme") === "dark";

export function ThemeToggle() {
  const dark = useSyncExternalStore(subscribe, isDark, () => false);

  function toggle() {
    const theme = dark ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", theme);
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // Storage unavailable: the choice only lasts for this page.
    }
  }

  return (
    <button
      id="theme-toggle"
      type="button"
      aria-pressed={dark}
      onClick={toggle}
      className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm font-semibold text-ink hover:bg-surface-muted"
    >
      <svg aria-hidden="true" viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
        <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
      </svg>
      <span className="hidden sm:inline">Dark mode</span>
      <span className="sr-only sm:hidden">Dark mode</span>
    </button>
  );
}
