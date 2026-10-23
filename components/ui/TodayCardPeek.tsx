"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { DateRange, LtrText } from "@/components/ui/bidi";
import { getTripSpan } from "@/lib/data/tripSpan";
import type { TimelineDay } from "@/lib/data/selectors";

const COLLAPSE_KEY = "tw-today-card-collapsed";

function readCollapsedFlag(): boolean {
  try {
    return window.localStorage.getItem(COLLAPSE_KEY) === "1";
  } catch {
    return false;
  }
}

export function useTodayCardCollapse() {
  const stored = useSyncExternalStore(
    () => () => {},
    readCollapsedFlag,
    () => false
  );
  const [forceOpen, setForceOpen] = useState(false);

  useEffect(() => {
    const mark = window.setTimeout(() => {
      try {
        window.localStorage.setItem(COLLAPSE_KEY, "1");
      } catch {
        // Ignore private-mode storage failures.
      }
    }, 1200);
    return () => window.clearTimeout(mark);
  }, []);

  const dismiss = () => {
    try {
      window.localStorage.setItem(COLLAPSE_KEY, "1");
    } catch {
      // Ignore private-mode storage failures.
    }
    setForceOpen(false);
  };

  return {
    ready: true,
    collapsed: stored && !forceOpen,
    expand: () => setForceOpen(true),
    dismiss,
  };
}

export function TodayCardPeek({
  status,
  day,
  onExpand,
  onDismiss,
}: {
  status: { statusTextHe: string };
  day: TimelineDay;
  onExpand: () => void;
  onDismiss: () => void;
}) {
  const startY = useRef<number | null>(null);

  return (
    <div
      dir="rtl"
      className="pointer-events-auto fixed inset-x-3 z-50"
      style={{ bottom: "calc(4.75rem + env(safe-area-inset-bottom))" }}
    >
      <div
        role="dialog"
        aria-label="כרטיס היום"
        className="h-[120px] overflow-hidden rounded-3xl border border-slate-200 bg-white px-3 pt-2 shadow-2xl dark:border-slate-800 dark:bg-slate-900"
        onPointerDown={(event) => {
          startY.current = event.clientY;
        }}
        onPointerUp={(event) => {
          if (startY.current == null) return;
          const dy = event.clientY - startY.current;
          startY.current = null;
          if (dy > 36) onDismiss();
        }}
      >
        <div className="mx-auto mb-1.5 h-1 w-10 rounded-full bg-slate-300 dark:bg-slate-600" />
        <p className="truncate text-sm font-black text-slate-900 dark:text-white">
          {status.statusTextHe}
        </p>
        <p className="mt-0.5 truncate text-xs font-bold text-slate-700 dark:text-slate-200">
          {day.cityNameHe} · <DateRange>{day.legDates}</DateRange>
        </p>
        <button
          type="button"
          onClick={onExpand}
          className="mt-1.5 flex min-h-11 items-center text-xs font-black text-orange-700 dark:text-amber-300"
        >
          פתח כרטיס
        </button>
      </div>
    </div>
  );
}

export function TripRecap() {
  const span = getTripSpan();
  return (
    <div className="rounded-2xl bg-slate-50 p-3 dark:bg-slate-800/70">
      <p className="font-display text-base font-black text-slate-900 dark:text-white">
        סיכום הטיול
      </p>
      <p className="mt-1 font-bold text-slate-700 dark:text-slate-200">
        <LtrText>{span.dayCount}</LtrText> ימים ·{" "}
        <LtrText>{span.legCount}</LtrText> מקטעים ·{" "}
        <DateRange>{span.dateRange}</DateRange>
      </p>
      <p className="mt-2 leading-relaxed text-slate-800 dark:text-slate-100">
        {span.routeCityNamesHe.join(" · ")}
      </p>
    </div>
  );
}
