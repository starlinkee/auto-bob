"use client";

import Link from "next/link";
import { NAV_ITEMS } from "@/lib/nav";
import { useEffect, useRef, useState } from "react";

export function HeaderNav() {
  const [open, setOpen] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        toggleRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <>
      <button
        ref={toggleRef}
        id="nav-toggle"
        type="button"
        aria-expanded={open}
        aria-controls="primary-nav"
        aria-label="Menu"
        onClick={() => setOpen((value) => !value)}
        className="order-3 inline-flex size-11 items-center justify-center rounded-md border-2 border-ink text-ink lg:hidden"
      >
        <svg
          aria-hidden="true"
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        >
          {open ? <path d="M6 6l12 12M18 6 6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
        </svg>
      </button>
      <nav
        id="primary-nav"
        aria-label="Primary"
        className={`${open ? "block" : "hidden"} absolute inset-x-0 top-full border-b border-border bg-surface px-4 py-2 shadow-md lg:static lg:order-2 lg:block lg:border-0 lg:bg-transparent lg:p-0 lg:shadow-none`}
      >
        <ul className="flex flex-col lg:flex-row lg:gap-2">
          {NAV_ITEMS.map((item) => (
            <li key={item.id}>
              <Link
                id={item.id}
                href={item.href}
                onClick={() => setOpen(false)}
                className="block px-3 py-3 font-semibold text-ink hover:text-body lg:py-2"
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </>
  );
}
