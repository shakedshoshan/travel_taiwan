"use client";

import { LocateFixed } from "lucide-react";
import { tripActions, useTripStore } from "@/lib/store/useTripStore";

export function MapNavigationPad() {
  const store = useTripStore();

  const hiddenBySheet =
    store.sheetSnap === "half" ||
    store.sheetSnap === "full" ||
    store.isTimelineExpanded;

  if (hiddenBySheet) return null;

  return (
    <div dir="rtl" className="pointer-events-auto">
      {/* Single 44x44px Recenter FAB — native touch gestures handle pan/zoom/rotate/tilt */}
      <button
        type="button"
        onClick={() => {
          tripActions.selectCity(null);
          tripActions.focusPlace(null, null);
          tripActions.dispatchCameraCommand("reset");
        }}
        aria-label="מרכז מפה לכל האי"
        title="מרכז מפה לכל האי"
        className="glass-panel toy-button flex min-h-[48px] min-w-[48px] items-center justify-center rounded-2xl text-slate-900 shadow-xl hover:bg-amber-400 hover:text-slate-950 dark:text-white dark:hover:bg-amber-400 dark:hover:text-slate-950"
      >
        <LocateFixed className="h-5 w-5 text-orange-500" />
      </button>
    </div>
  );
}
