"use client";

import { useEffect, useState } from "react";

export interface JumpItem {
  id: string;
  label: string;
  meta?: string;
}

export function CityJumpBar({ items }: { items: JumpItem[] }) {
  const [activeId, setActiveId] = useState(items[0]?.id ?? "");

  useEffect(() => {
    const nodes = items
      .map((item) => document.getElementById(item.id))
      .filter((el): el is HTMLElement => Boolean(el));
    if (nodes.length === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible?.target.id) setActiveId(visible.target.id);
      },
      { rootMargin: "-20% 0px -55% 0px", threshold: [0.1, 0.35, 0.7] }
    );
    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, [items]);

  return (
    <div className="fade-edge-scroll no-scrollbar flex snap-x snap-mandatory items-center gap-1.5 overflow-x-auto pl-4">
      {items.map((item) => {
        const active = item.id === activeId;
        return (
          <a
            key={item.id}
            href={`#${item.id}`}
            className={`flex min-h-11 shrink-0 snap-start items-center gap-1.5 rounded-full px-3.5 text-xs font-extrabold ${
              active
                ? "bg-orange-500 text-white shadow-xs"
                : "bg-white text-slate-800 shadow-xs hover:bg-orange-500 hover:text-white dark:bg-slate-900 dark:text-slate-100"
            }`}
          >
            <span>{item.label}</span>
            {item.meta ? (
              <span className="text-xs opacity-80">{item.meta}</span>
            ) : null}
          </a>
        );
      })}
    </div>
  );
}

export function BackToTop() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 520);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!show) return null;

  return (
    <button
      type="button"
      onClick={() => {
        const reduce = window.matchMedia(
          "(prefers-reduced-motion: reduce)"
        ).matches;
        window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
      }}
      className="fixed left-3 z-30 flex min-h-11 min-w-11 items-center justify-center rounded-full bg-slate-900 px-3 text-xs font-black text-white shadow-lg dark:bg-amber-400 dark:text-slate-950"
      style={{ bottom: "calc(4.75rem + env(safe-area-inset-bottom))" }}
    >
      למעלה
    </button>
  );
}
