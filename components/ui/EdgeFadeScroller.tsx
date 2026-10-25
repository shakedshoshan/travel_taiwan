"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { revealChipById, revealChipStart, snapChipRow, syncChipClip } from "./snapChips";

interface EdgeFadeScrollerProps {
  children: ReactNode;
  /** First active chip, scrolled into view once per session. */
  initialChipId?: string | null;
  /** Chip to reveal after the user toggles it. */
  focusChipId?: string | null;
  sessionKey?: string;
}

function maskForEdges(fadeRight: boolean, fadeLeft: boolean): string {
  if (fadeRight && fadeLeft) {
    return "linear-gradient(to left, transparent 0px, #000 8px, #000 calc(100% - 8px), transparent 100%)";
  }
  if (fadeRight) {
    return "linear-gradient(to left, transparent 0px, #000 8px, #000 100%)";
  }
  if (fadeLeft) {
    return "linear-gradient(to left, #000 0px, #000 calc(100% - 8px), transparent 100%)";
  }
  return "none";
}

export function EdgeFadeScroller({
  children,
  initialChipId = null,
  focusChipId = null,
  sessionKey = "tw-layer-chip-seen",
}: EdgeFadeScrollerProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [mask, setMask] = useState("none");

  const alignCutChips = useCallback(() => {
    snapChipRow(scrollerRef.current);
  }, []);

  const updateMask = useCallback(() => {
    const el = scrollerRef.current;
    const first = el?.firstElementChild;
    const last = el?.lastElementChild;
    if (!el || !first || !last) {
      setMask("none");
      return;
    }
    const box = el.getBoundingClientRect();
    const fadeRight = first.getBoundingClientRect().right > box.right + 1;
    const fadeLeft = last.getBoundingClientRect().left < box.left - 1;
    setMask(maskForEdges(fadeRight, fadeLeft));
  }, []);

  const scrollChip = useCallback((chipId: string | null) => {
    const el = scrollerRef.current;
    if (!el || !chipId) return;
    revealChipById(el, chipId);
    requestAnimationFrame(updateMask);
  }, [updateMask]);

  useEffect(() => {
    revealChipStart(scrollerRef.current);
    const later = window.setTimeout(() => revealChipStart(scrollerRef.current), 350);
    const el = scrollerRef.current;
    if (!el) return () => window.clearTimeout(later);
    const onScrollEnd = () => {
      alignCutChips();
      updateMask();
    };
    const onScroll = () => {
      syncChipClip(el);
      updateMask();
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    el.addEventListener("scrollend", onScrollEnd);
    const observer = new ResizeObserver(onScrollEnd);
    observer.observe(el);
    return () => {
      window.clearTimeout(later);
      el.removeEventListener("scroll", onScroll);
      el.removeEventListener("scrollend", onScrollEnd);
      observer.disconnect();
    };
  }, [alignCutChips, updateMask, children]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.sessionStorage.getItem(sessionKey)) return;
    scrollChip(initialChipId);
    window.sessionStorage.setItem(sessionKey, "1");
  }, [initialChipId, scrollChip, sessionKey]);

  useEffect(() => {
    if (!focusChipId) return;
    scrollChip(focusChipId);
  }, [focusChipId, scrollChip]);

  return (
    <div
      ref={scrollerRef}
      dir="rtl"
      className="no-scrollbar flex min-w-0 flex-1 items-center gap-2 overflow-x-auto py-0.5"
      style={{
        maskImage: mask,
        WebkitMaskImage: mask,
      }}
      onScroll={updateMask}
    >
      {children}
    </div>
  );
}
