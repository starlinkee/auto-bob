"use client";

import { useCallback, useEffect, useRef } from "react";
import type { KeyboardEvent as ReactKeyboardEvent, PointerEvent as ReactPointerEvent } from "react";
import { SmartImage } from "@/components/SmartImage";

type LightboxItem = { image: { src: string | null; alt: string }; caption?: string };

type LightboxProps = {
  items: LightboxItem[];
  index: number | null;
  onClose: () => void;
  onIndexChange: (i: number) => void;
  slot: string;
};

const SWIPE_DISTANCE = 50;
const FOCUSABLE = "button:not([disabled]), [href], [tabindex]:not([tabindex='-1'])";

const controlClass =
  "flex h-11 w-11 items-center justify-center rounded-full bg-on-charcoal text-ink hover:bg-brand";

export function Lightbox({ items, index, onClose, onIndexChange, slot }: LightboxProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const swipeStart = useRef<number | null>(null);
  const isOpen = index !== null && items.length > 0;

  const step = useCallback(
    (delta: number) => {
      if (index === null || items.length === 0) return;
      onIndexChange((index + delta + items.length) % items.length);
    },
    [index, items.length, onIndexChange],
  );

  // Move focus in on open, give it back to the opener on close, lock page scroll meanwhile.
  useEffect(() => {
    if (!isOpen) return;
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialogRef.current?.querySelector<HTMLElement>("#lightbox-close")?.focus();
    return () => {
      document.body.style.overflow = previousOverflow;
      opener?.focus();
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        step(1);
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        step(-1);
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onClose, step]);

  if (!isOpen || index === null) return null;
  const item = items[index];
  if (!item) return null;

  function trapFocus(event: ReactKeyboardEvent<HTMLDivElement>) {
    if (event.key !== "Tab" || !dialogRef.current) return;
    const focusable = Array.from(dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE));
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (!first || !last) return;
    const active = document.activeElement;
    if (!dialogRef.current.contains(active)) {
      event.preventDefault();
      first.focus();
    } else if (event.shiftKey && active === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus();
    }
  }

  function onPointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (event.pointerType === "touch") swipeStart.current = event.clientX;
  }

  function onPointerUp(event: ReactPointerEvent<HTMLDivElement>) {
    const start = swipeStart.current;
    swipeStart.current = null;
    if (event.pointerType !== "touch" || start === null) return;
    const delta = event.clientX - start;
    if (Math.abs(delta) > SWIPE_DISTANCE) step(delta < 0 ? 1 : -1);
  }

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      id="lightbox"
      aria-label="Image viewer"
      className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-charcoal p-4 text-on-charcoal"
      style={{ touchAction: "pan-y" }}
      onKeyDown={trapFocus}
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      onPointerCancel={() => {
        swipeStart.current = null;
      }}
    >
      <div className="absolute right-4 top-4 flex items-center gap-3">
        <p id="lightbox-counter" aria-live="polite" className="text-sm">
          {index + 1} / {items.length}
        </p>
        <button
          id="lightbox-close"
          type="button"
          aria-label="Close"
          onClick={onClose}
          className={controlClass}
        >
          <svg
            aria-hidden="true"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
      </div>
      <div className="flex w-full max-w-5xl items-center gap-2 sm:gap-4">
        <button
          id="lightbox-prev"
          type="button"
          aria-label="Previous image"
          onClick={() => step(-1)}
          className={`${controlClass} shrink-0`}
        >
          <svg
            aria-hidden="true"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M15 5l-7 7 7 7" />
          </svg>
        </button>
        <div className="min-w-0 flex-1 select-none">
          <SmartImage
            image={item.image}
            slot={slot}
            width={1600}
            height={1067}
            sizes="(min-width: 1024px) 960px, 100vw"
            className="max-h-[70vh] object-contain"
          />
        </div>
        <button
          id="lightbox-next"
          type="button"
          aria-label="Next image"
          onClick={() => step(1)}
          className={`${controlClass} shrink-0`}
        >
          <svg
            aria-hidden="true"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
      <p id="lightbox-caption" className="min-h-6 max-w-3xl text-center">
        {item.caption}
      </p>
    </div>
  );
}
