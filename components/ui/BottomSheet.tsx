"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { SheetSnapPoint } from "@/lib/store/useTripStore";

interface BottomSheetProps {
  isOpen: boolean;
  snap: SheetSnapPoint;
  onSnapChange: (nextSnap: SheetSnapPoint) => void;
  onClose: () => void;
  header: React.ReactNode;
  peekSummary?: React.ReactNode;
  children: React.ReactNode;
  ariaLabel?: string;
}

const SNAP_HEIGHT_VH: Record<Exclude<SheetSnapPoint, "closed">, number> = {
  peek: 20,
  half: 55,
  full: 90,
};

export function BottomSheet({
  isOpen,
  snap,
  onSnapChange,
  onClose,
  header,
  peekSummary,
  children,
  ariaLabel = "חלונית מידע",
}: BottomSheetProps) {
  const dragStartY = useRef<number | null>(null);
  const dragStartTime = useRef<number>(0);
  const [dragOffsetPx, setDragOffsetPx] = useState(0);
  const pushedHistoryRef = useRef(false);

  // Sync with browser History API so mobile Back button closes the sheet
  useEffect(() => {
    if (typeof window === "undefined") return;

    if (isOpen && snap !== "closed" && !pushedHistoryRef.current) {
      window.history.pushState({ taiwanSheetOpen: true }, "");
      pushedHistoryRef.current = true;
    } else if ((!isOpen || snap === "closed") && pushedHistoryRef.current) {
      pushedHistoryRef.current = false;
    }

    const handlePopState = () => {
      if (pushedHistoryRef.current) {
        pushedHistoryRef.current = false;
        onClose();
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [isOpen, snap, onClose]);

  if (!isOpen || snap === "closed") return null;

  const currentVh = SNAP_HEIGHT_VH[snap];

  const handlePointerDown = (e: React.PointerEvent) => {
    dragStartY.current = e.clientY;
    dragStartTime.current = performance.now();
    setDragOffsetPx(0);
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (dragStartY.current === null) return;
    const dy = e.clientY - dragStartY.current;
    setDragOffsetPx(dy);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (dragStartY.current === null) return;
    const dy = e.clientY - dragStartY.current;
    const dt = Math.max(1, performance.now() - dragStartTime.current);
    const velocityY = dy / dt; // px per ms (+ is downward, - is upward)

    dragStartY.current = null;
    setDragOffsetPx(0);

    // Fast swipe down or large drag down
    if (dy > 140 || velocityY > 0.75) {
      if (snap === "full") {
        onSnapChange("half");
      } else if (snap === "half" && dy < 220 && velocityY < 1.1) {
        onSnapChange("peek");
      } else {
        onClose();
      }
      return;
    }

    // Moderate drag down
    if (dy > 48) {
      if (snap === "full") onSnapChange("half");
      else if (snap === "half") onSnapChange("peek");
      else onClose();
      return;
    }

    // Swipe / drag up
    if (dy < -48 || velocityY < -0.55) {
      if (snap === "peek") onSnapChange("half");
      else if (snap === "half") onSnapChange("full");
      return;
    }
  };

  const cycleSnapOnHandleClick = () => {
    if (snap === "peek") onSnapChange("half");
    else if (snap === "half") onSnapChange("full");
    else onSnapChange("half");
  };

  return (
    <AnimatePresence>
      <motion.aside
        dir="rtl"
        role="dialog"
        aria-label={ariaLabel}
        initial={{ y: "100%" }}
        animate={{
          height: `calc(${currentVh}dvh - ${dragOffsetPx}px)`,
          y: 0,
        }}
        exit={{ y: "100%" }}
        transition={
          dragOffsetPx !== 0
            ? { duration: 0 }
            : { type: "spring", damping: 28, stiffness: 300 }
        }
        style={{
          bottom: "calc(3.5rem + env(safe-area-inset-bottom))",
        }}
        className="pointer-events-auto fixed right-0 left-0 z-30 mx-auto flex w-full max-w-xl flex-col overflow-hidden rounded-t-3xl border-t border-slate-200 bg-white text-slate-900 shadow-[0_-16px_48px_rgba(15,23,42,0.28)] dark:border-slate-800 dark:bg-slate-900 dark:text-white"
      >
        {/* Drag Handle + Header Area (Supports Touch Swipe Up/Down) */}
        <div
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          className="shrink-0 cursor-grab touch-none select-none border-b border-slate-200/80 bg-white px-4 pt-2 pb-3 active:cursor-grabbing dark:border-slate-800 dark:bg-slate-900"
        >
          {/* Grab Handle Pill + Snap Switcher */}
          <div className="mb-1.5 flex items-center justify-between">
            <div className="flex items-center gap-1">
              {(
                [
                  ["peek", "הצצה"],
                  ["half", "חצי"],
                  ["full", "מלא"],
                ] as const
              ).map(([pt, label]) => (
                <button
                  key={pt}
                  type="button"
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={() => onSnapChange(pt)}
                  className={`min-h-[28px] rounded-full px-2.5 text-[10px] font-bold transition-colors ${
                    snap === pt
                      ? "bg-orange-500 text-white"
                      : "bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={cycleSnapOnHandleClick}
              aria-label="שנה גובה חלונית"
              className="flex h-6 w-16 items-center justify-center"
            >
              <span className="h-1.5 w-11 rounded-full bg-slate-300 dark:bg-slate-700" />
            </button>

            <div className="w-16" />
          </div>

          {header}

          {snap === "peek" && peekSummary && (
            <div className="mt-1.5">{peekSummary}</div>
          )}
        </div>

        {/* Scrollable Sheet Body (Visible in half and full states) */}
        {snap !== "peek" && (
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-white dark:bg-slate-900">
            {children}
          </div>
        )}
      </motion.aside>
    </AnimatePresence>
  );
}
