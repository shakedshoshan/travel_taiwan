"use client";

import React, { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { SheetSnapPoint } from "@/lib/store/useTripStore";

interface BottomSheetProps {
  isOpen: boolean;
  snap: SheetSnapPoint;
  onSnapChange: (nextSnap: SheetSnapPoint) => void;
  onClose: () => void;
  children: React.ReactNode;
  ariaLabel?: string;
}

function snapHeight(snap: Exclude<SheetSnapPoint, "closed">): string {
  if (snap === "peek") return "120px";
  if (snap === "half") return "50dvh";
  return "85dvh";
}

export function BottomSheet({
  isOpen,
  snap,
  onSnapChange,
  onClose,
  children,
  ariaLabel = "חלונית עיר",
}: BottomSheetProps) {
  const dragStartY = useRef<number | null>(null);
  const dragStartTime = useRef(0);
  const [dragOffsetPx, setDragOffsetPx] = useState(0);

  if (!isOpen || snap === "closed") return null;

  const handlePointerDown = (event: React.PointerEvent) => {
    dragStartY.current = event.clientY;
    dragStartTime.current = performance.now();
    setDragOffsetPx(0);
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: React.PointerEvent) => {
    if (dragStartY.current === null) return;
    setDragOffsetPx(event.clientY - dragStartY.current);
  };

  const handlePointerUp = (event: React.PointerEvent) => {
    if (dragStartY.current === null) return;
    const dy = event.clientY - dragStartY.current;
    const dt = Math.max(1, performance.now() - dragStartTime.current);
    const velocityY = dy / dt;
    dragStartY.current = null;
    setDragOffsetPx(0);

    if (dy > 72 || velocityY > 0.7) {
      if (snap === "full") onSnapChange("half");
      else if (snap === "half") onSnapChange("peek");
      else onClose();
      return;
    }
    if (dy < -36 || velocityY < -0.45) {
      if (snap === "peek") onSnapChange("half");
      else if (snap === "half") onSnapChange("full");
    }
  };

  return (
    <AnimatePresence>
      <motion.aside
        dir="rtl"
        role="dialog"
        aria-label={ariaLabel}
        initial={{ y: "110%" }}
        animate={{ y: dragOffsetPx > 0 ? dragOffsetPx : 0 }}
        exit={{ y: "110%" }}
        transition={
          dragOffsetPx !== 0
            ? { duration: 0 }
            : { type: "spring", damping: 30, stiffness: 340 }
        }
        style={{
          height: snapHeight(snap),
          bottom: 0,
          paddingBottom: "env(safe-area-inset-bottom)",
        }}
        className="pointer-events-auto fixed right-0 left-0 z-30 mx-auto flex w-full max-w-xl flex-col overflow-hidden rounded-t-3xl border-t border-slate-200 bg-white text-slate-900 shadow-[0_-12px_40px_rgba(15,23,42,0.22)] dark:border-slate-800 dark:bg-slate-950 dark:text-white"
      >
        <div
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          className="flex h-5 shrink-0 cursor-grab touch-none items-center justify-center active:cursor-grabbing"
          aria-hidden="true"
        >
          <span className="h-1 w-10 rounded-full bg-slate-300 dark:bg-slate-600" />
        </div>
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">{children}</div>
      </motion.aside>
    </AnimatePresence>
  );
}
