"use client";

import { ArrowRight } from "lucide-react";
import type { CityBundle } from "@/lib/data/selectors";
import { citySheetEmoji, citySheetSubtitle } from "@/lib/ui/citySheetDisplay";
import { tripActions } from "@/lib/store/useTripStore";

export function CitySheetCityBanner({
  bundle,
  compact = false,
}: {
  bundle: CityBundle;
  compact?: boolean;
}) {
  const { city } = bundle;
  const emoji = citySheetEmoji(city.id);

  return (
    <div
      dir="rtl"
      className="shrink-0 border-b border-slate-200/90 bg-white/95 px-2 pb-2 backdrop-blur-md dark:border-slate-800 dark:bg-slate-950/95"
    >
      <div className="flex items-center gap-2">
        <button
          type="button"
          aria-label="חזרה למפת האי"
          onClick={() => tripActions.goBack()}
          className="flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-900 active:scale-[0.97] dark:bg-slate-800 dark:text-white"
        >
          <ArrowRight className="h-5 w-5" />
        </button>
        <div className="min-w-0 flex-1 text-right">
          {!compact ? (
            <p className="text-[10px] font-extrabold tracking-wide text-orange-600 uppercase dark:text-amber-400">
              עיר נוכחית
            </p>
          ) : null}
          <h2 className="truncate font-display text-lg leading-6 font-black text-slate-900 dark:text-white">
            <span aria-hidden="true" className="me-1.5">
              {emoji}
            </span>
            {city.nameHe}
          </h2>
          {!compact ? (
            <p className="truncate text-[11px] font-semibold text-slate-500 dark:text-slate-400">
              {citySheetSubtitle(city)}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
