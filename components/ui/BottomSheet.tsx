"use client";

import React, { useCallback, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { SheetSnapPoint } from "@/lib/store/useTripStore";
import {
  decideSheetSnapAfterDrag,
  nextSheetSnapOnTap,
  sheetHeightCss,
} from "@/lib/ui/bottomSheetSnap";

interface BottomSheetProps {
  isOpen: boolean;
  snap: SheetSnapPoint;
  onSnapChange: (nextSnap: SheetSnapPoint) => void;
  onClose: () => void;
  children: React.ReactNode;
  /** Sticky header under the grab handle (chips, titles). Dragging here also moves the sheet. */
  header?: React.ReactNode;
  ariaLabel?: string;
}

function shouldIgnoreDragStart(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (target.closest("[data-sheet-grab]")) return false;
  return Boolean(
    target.closest(
      "button, a, input, select, textarea, label, [data-sheet-no-drag]"
    )
  );
}

export function BottomSheet({
  isOpen,
  snap,
  onSnapChange,
  onClose,
  children,
  header,
  ariaLabel = "חלונית עיר",
}: BottomSheetProps) {
  const dragStartY = useRef<number | null>(null);
  const dragStartTime = useRef(0);
  const dragMovedRef = useRef(false);
  const [dragOffsetPx, setDragOffsetPx] = useState(0);

  const activeSnap =
    snap === "closed" ? ("peek" as const) : snap;

  const cleanupWindowDrag = useRef<(() => void) | null>(null);

  const finishDrag = useCallback(
    (clientY: number) => {
      if (dragStartY.current === null) return;
      const dy = clientY - dragStartY.current;
      const dt = Math.max(1, performance.now() - dragStartTime.current);
      const velocityY = dy / dt;
      dragStartY.current = null;
      setDragOffsetPx(0);
      document.documentElement.classList.remove("sheet-dragging");

      const next = decideSheetSnapAfterDrag(activeSnap, dy, velocityY);
      if (next === "closed") onClose();
      else if (next !== activeSnap) onSnapChange(next);
    },
    [activeSnap, onClose, onSnapChange]
  );

  const beginDrag = useCallback(
    (event: React.PointerEvent) => {
      if (event.pointerType === "mouse" && event.button !== 0) return;
      if (shouldIgnoreDragStart(event.target)) return;

      event.preventDefault();
      event.stopPropagation();

      cleanupWindowDrag.current?.();
      dragStartY.current = event.clientY;
      dragStartTime.current = performance.now();
      dragMovedRef.current = false;
      setDragOffsetPx(0);
      document.documentElement.classList.add("sheet-dragging");

      const onMove = (e: PointerEvent) => {
        if (dragStartY.current === null) return;
        if (e.pointerId !== event.pointerId) return;
        e.preventDefault();
        const dy = e.clientY - dragStartY.current;
        if (Math.abs(dy) > 6) dragMovedRef.current = true;
        setDragOffsetPx(dy);
      };

      const onEnd = (e: PointerEvent) => {
        if (e.pointerId !== event.pointerId) return;
        cleanupWindowDrag.current?.();
        finishDrag(e.clientY);
      };

      const cleanup = () => {
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onEnd);
        window.removeEventListener("pointercancel", onEnd);
        cleanupWindowDrag.current = null;
      };
      cleanupWindowDrag.current = cleanup;

      window.addEventListener("pointermove", onMove, { passive: false });
      window.addEventListener("pointerup", onEnd);
      window.addEventListener("pointercancel", onEnd);
    },
    [finishDrag]
  );

  const handleGrabTap = () => {
    if (dragMovedRef.current) {
      dragMovedRef.current = false;
      return;
    }
    const next = nextSheetSnapOnTap(activeSnap);
    if (next === "closed") onClose();
    else onSnapChange(next);
  };

  if (!isOpen || snap === "closed") return null;

  const translateY =
    dragOffsetPx > 0 ? dragOffsetPx : Math.min(0, dragOffsetPx);

  return (
    <AnimatePresence>
      <motion.aside
        dir="rtl"
        role="dialog"
        aria-label={ariaLabel}
        data-bottom-sheet
        initial={{ y: "110%" }}
        animate={{ y: translateY }}
        exit={{ y: "110%" }}
        transition={
          dragOffsetPx !== 0
            ? { duration: 0 }
            : { type: "spring", damping: 32, stiffness: 360 }
        }
        style={{
          height: sheetHeightCss(activeSnap),
          bottom: 0,
          paddingBottom: "env(safe-area-inset-bottom)",
        }}
        className="pointer-events-auto fixed right-0 left-0 z-50 mx-auto flex w-full max-w-xl flex-col overflow-hidden rounded-t-3xl border-t border-slate-200 bg-white text-slate-900 shadow-[0_-12px_40px_rgba(15,23,42,0.22)] dark:border-slate-800 dark:bg-slate-950 dark:text-white"
      >
        <div
          data-sheet-grab
          onPointerDown={beginDrag}
          className="flex min-h-11 shrink-0 cursor-grab touch-none items-center justify-center active:cursor-grabbing"
        >
          <button
            type="button"
            onClick={handleGrabTap}
            aria-label={
              activeSnap === "peek"
                ? "פתח חלונית למעלה"
                : activeSnap === "half"
                  ? "הרחב חלונית"
                  : "כווץ חלונית"
            }
            className="flex min-h-11 w-full items-center justify-center"
          >
            <span className="h-1.5 w-12 rounded-full bg-slate-300 dark:bg-slate-600" />
          </button>
        </div>

        {header ? (
          <div className="shrink-0">{header}</div>
        ) : null}

        <div
          data-sheet-scroll
          style={{ touchAction: "pan-y" }}
          className="flex min-h-0 flex-1 flex-col overflow-hidden overscroll-y-contain"
        >
          {children}
        </div>
      </motion.aside>
    </AnimatePresence>
  );
}
