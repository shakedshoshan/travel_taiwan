"use client";

import React, { useCallback } from "react";
import type { SheetSnapPoint } from "@/lib/store/useTripStore";
import { sheetHeightCss } from "@/lib/ui/bottomSheetSnap";
import { useBottomSheetTransform } from "@/components/ui/useBottomSheetTransform";

interface BottomSheetProps {
  isOpen: boolean;
  snap: SheetSnapPoint;
  onSnapChange: (nextSnap: SheetSnapPoint) => void;
  onClose: () => void;
  children: React.ReactNode;
  /** Sticky header under the grab handle (chips, titles). */
  header?: React.ReactNode;
  /** Always-visible city / context strip (shown at every snap). */
  banner?: React.ReactNode;
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
  banner,
  ariaLabel = "חלונית עיר",
}: BottomSheetProps) {
  const activeSnap = snap === "closed" ? ("peek" as const) : snap;

  const { sheetRef, beginDrag, handleGrabTap } = useBottomSheetTransform({
    snap: activeSnap,
    onSnapChange,
    onClose,
  });

  const onGrabPointerDown = useCallback(
    (event: React.PointerEvent) => {
      if (event.pointerType === "mouse" && event.button !== 0) return;
      if (shouldIgnoreDragStart(event.target)) return;
      event.preventDefault();
      event.stopPropagation();
      beginDrag(event.clientY, event.pointerId);
    },
    [beginDrag]
  );

  if (!isOpen || snap === "closed") return null;

  return (
    <aside
      ref={sheetRef}
      dir="rtl"
      role="dialog"
      aria-label={ariaLabel}
      data-bottom-sheet
      style={{
        height: sheetHeightCss(),
        bottom: 0,
        paddingBottom: "env(safe-area-inset-bottom)",
        willChange: "transform",
      }}
      className="pointer-events-auto fixed right-0 left-0 z-50 mx-auto flex w-full max-w-xl flex-col overflow-hidden rounded-t-[1.75rem] border-t border-[color:var(--border-strong)] bg-[var(--surface)] text-[var(--foreground)] shadow-[0_-16px_48px_rgba(15,23,42,0.18)] dark:shadow-[0_-16px_48px_rgba(0,0,0,0.45)]"
    >
      <div
        data-sheet-grab
        onPointerDown={onGrabPointerDown}
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
          <span className="h-1.5 w-14 rounded-full bg-[color:var(--border-strong)]" />
        </button>
      </div>

      {banner}

      {header ? <div className="shrink-0">{header}</div> : null}

      <div
        data-sheet-scroll
        style={{ touchAction: "pan-y", WebkitOverflowScrolling: "touch" }}
        className="sheet-scroll flex min-h-0 flex-1 flex-col overflow-hidden overscroll-y-contain"
      >
        {children}
      </div>
    </aside>
  );
}
