"use client";

import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Compass,
  Calendar,
  ChevronUp,
  ChevronDown,
  X,
} from "lucide-react";
import { getRouteLegs, getTimelineDays } from "@/lib/data/selectors";
import { tripActions, useTripStore } from "@/lib/store/useTripStore";

export function TimelineScrubber() {
  const store = useTripStore();
  const days = getTimelineDays();
  const legs = getRouteLegs();
  const currentDay = days[store.currentDayIndex] ?? days[0];

  // Hide timeline pill when city sheet is snapped to half or full
  if (
    store.isCityZoomMapOpen ||
    store.sheetSnap === "half" ||
    store.sheetSnap === "full"
  ) {
    return null;
  }

  const progressPct =
    days.length > 1
      ? Math.round((store.currentDayIndex / (days.length - 1)) * 100)
      : 0;

  const handleLegClick = (legOrder: number) => {
    const firstDayOfLeg = days.find((d) => d.legOrder === legOrder);
    if (firstDayOfLeg) {
      tripActions.setIsPlaying(false);
      tripActions.setCurrentDayIndex(firstDayOfLeg.dayIndex);
    }
  };

  return (
    <>
      {/* Collapsed 64px Timeline Pill (Default) */}
      {!store.isTimelineExpanded && (
        <div
          dir="rtl"
          className="glass-panel pointer-events-auto mx-auto flex h-16 max-w-md items-center justify-between gap-2 rounded-full px-2.5 shadow-xl"
        >
          {/* Play/Pause Button (>=44x44px) */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              tripActions.togglePlaying();
            }}
            aria-label={store.isPlaying ? "השהה מסלול" : "נגן מסלול"}
            className="toy-button flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-orange-500 to-amber-500 text-white shadow-md"
          >
            {store.isPlaying ? (
              <Pause className="h-4 w-4" />
            ) : (
              <Play className="h-4 w-4 fill-current" />
            )}
          </button>

          {/* Main Tap Area -> Expands into Timeline Sheet */}
          <button
            type="button"
            onClick={() => tripActions.setTimelineExpanded(true)}
            className="flex min-h-[44px] min-w-0 flex-1 flex-col justify-center px-2 text-right"
          >
            <div className="flex items-center gap-1.5 truncate font-display text-sm font-black text-slate-900 dark:text-white">
              <span>יום {currentDay.dayNumber}</span>
              <span className="text-orange-500">·</span>
              <span>{currentDay.dateShort}</span>
              <span className="text-orange-500">·</span>
              <span className="truncate text-orange-600 dark:text-amber-300">
                {currentDay.cityNameHe}
              </span>
              <span className="text-xs text-slate-400">▶</span>
            </div>
            {/* Mini RTL progress bar starting from right */}
            <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-slate-900/10 dark:bg-white/15">
              <div
                style={{ width: `${Math.max(4, progressPct)}%` }}
                className="h-full rounded-full bg-gradient-to-l from-orange-500 to-amber-400 transition-all duration-300"
              />
            </div>
          </button>

          {/* Expand Chevron (>=44x44px) */}
          <button
            type="button"
            onClick={() => tripActions.setTimelineExpanded(true)}
            aria-label="הרחב ציר זמן"
            className="flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-full text-slate-600 hover:bg-slate-900/5 dark:text-slate-300 dark:hover:bg-white/10"
          >
            <ChevronUp className="h-5 w-5" />
          </button>
        </div>
      )}

      {/* Expanded Opaque Timeline Sheet */}
      {store.isTimelineExpanded && (
        <div
          dir="rtl"
          className="pointer-events-auto fixed inset-0 z-50 flex items-end justify-center bg-slate-950/35 backdrop-blur-xs"
          onClick={() => tripActions.setTimelineExpanded(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              paddingBottom: "calc(4.25rem + env(safe-area-inset-bottom))",
            }}
            className="w-full max-w-2xl rounded-t-3xl border-t border-slate-200 bg-white px-4 pt-2.5 shadow-2xl dark:border-slate-800 dark:bg-slate-900"
          >
            {/* Grab Handle */}
            <div className="mx-auto mb-2 h-1.5 w-12 rounded-full bg-slate-300 dark:bg-slate-700" />

            {/* Top Row: Play + Prev/Next + Day Header + Close */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => tripActions.togglePlaying()}
                  aria-label={store.isPlaying ? "השהה מסלול" : "נגן מסלול"}
                  className="toy-button flex min-h-[44px] min-w-[44px] items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-rose-500 text-white shadow-md"
                >
                  {store.isPlaying ? (
                    <Pause className="h-5 w-5" />
                  ) : (
                    <Play className="h-5 w-5 fill-current" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    tripActions.setIsPlaying(false);
                    tripActions.setCurrentDayIndex(
                      Math.max(0, store.currentDayIndex - 1)
                    );
                  }}
                  aria-label="יום קודם"
                  className="toy-button flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200"
                >
                  <SkipForward className="h-4 w-4" />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    tripActions.setIsPlaying(false);
                    tripActions.setCurrentDayIndex(
                      Math.min(days.length - 1, store.currentDayIndex + 1)
                    );
                  }}
                  aria-label="יום הבא"
                  className="toy-button flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200"
                >
                  <SkipBack className="h-4 w-4" />
                </button>
              </div>

              <div className="min-w-0 flex-1 text-right">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-400/25 px-2.5 py-0.5 text-xs font-extrabold text-amber-900 dark:bg-amber-400/20 dark:text-amber-300">
                    <Calendar className="h-3.5 w-3.5" />
                    יום {currentDay.dayNumber}/{days.length} ·{" "}
                    {currentDay.dateShort} ({currentDay.weekdayHe})
                  </span>
                </div>
                <div className="mt-0.5 truncate font-display text-sm font-black text-slate-900 dark:text-white">
                  מקטע {currentDay.legOrder}: {currentDay.legFocus}
                </div>
              </div>

              <button
                type="button"
                onClick={() => tripActions.setTimelineExpanded(false)}
                aria-label="כווץ ציר זמן"
                className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
              >
                <ChevronDown className="h-5 w-5" />
              </button>
            </div>

            {/* Anchor activity & Open City button */}
            <div className="mt-2.5 flex items-center justify-between gap-2 rounded-2xl bg-slate-100 p-2.5 text-xs dark:bg-slate-800/80">
              <div className="min-w-0 flex-1 text-slate-700 dark:text-slate-200">
                <span className="font-bold text-slate-900 dark:text-white">
                  עוגן המקטע:{" "}
                </span>
                <span>{currentDay.legAnchor}</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  tripActions.setTimelineExpanded(false);
                  tripActions.selectCity(currentDay.cityId, "half");
                }}
                className="toy-button flex min-h-[44px] shrink-0 items-center gap-1.5 rounded-xl bg-emerald-600 px-3 text-xs font-bold text-white"
              >
                <Compass className="h-4 w-4" />
                <span>פתח את {currentDay.cityNameHe}</span>
              </button>
            </div>

            {/* RTL Range Slider: Progress starts from the RIGHT on Day 1 (6.11) and fills LEFT toward 8.12 */}
            <div className="mt-3 flex items-center gap-3">
              <span className="font-mono text-xs font-bold text-slate-600 dark:text-slate-300">
                6.11
              </span>
              <input
                type="range"
                dir="rtl"
                min={0}
                max={days.length - 1}
                value={store.currentDayIndex}
                onChange={(e) => {
                  tripActions.setIsPlaying(false);
                  tripActions.setCurrentDayIndex(Number(e.target.value));
                }}
                style={{
                  background: `linear-gradient(to left, #ff5a36 0%, #f59e0b ${progressPct}%, rgba(148, 163, 184, 0.28) ${progressPct}%, rgba(148, 163, 184, 0.28) 100%)`,
                }}
                className="h-2.5 flex-1 cursor-pointer appearance-none rounded-full accent-orange-600"
                aria-label="ציר זמן הטיול 6 בנובמבר עד 8 בדצמבר"
              />
              <span className="font-mono text-xs font-bold text-slate-600 dark:text-slate-300">
                8.12
              </span>
            </div>

            {/* 10 Route Leg Quick Chips with Snap-Scroll & Edge Fade */}
            <div className="fade-edge-scroll no-scrollbar mt-3 flex snap-x snap-mandatory items-center gap-1.5 overflow-x-auto pb-1 pl-4">
              {legs.map((leg) => {
                const isCurrent = currentDay.legOrder === leg.order;
                return (
                  <button
                    key={leg.id}
                    type="button"
                    onClick={() => handleLegClick(leg.order)}
                    className={`toy-button flex min-h-[44px] shrink-0 snap-start items-center rounded-2xl px-3 text-xs font-bold whitespace-nowrap transition-all ${
                      isCurrent
                        ? "bg-orange-500 text-white shadow-sm"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
                    }`}
                  >
                    {leg.order}. {leg.focus} ({leg.dates})
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
