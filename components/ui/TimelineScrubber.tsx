"use client";

import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Compass,
  Calendar,
} from "lucide-react";
import { getRouteLegs, getTimelineDays } from "@/lib/data/selectors";
import { tripActions, useTripStore } from "@/lib/store/useTripStore";

export function TimelineScrubber() {
  const store = useTripStore();
  const days = getTimelineDays();
  const legs = getRouteLegs();
  const currentDay = days[store.currentDayIndex] ?? days[0];

  const handleLegClick = (legOrder: number) => {
    const firstDayOfLeg = days.find((d) => d.legOrder === legOrder);
    if (firstDayOfLeg) {
      tripActions.setIsPlaying(false);
      tripActions.setCurrentDayIndex(firstDayOfLeg.dayIndex);
      tripActions.selectCity(firstDayOfLeg.cityId);
    }
  };

  return (
    <div
      dir="rtl"
      className="glass-panel pointer-events-auto mx-auto w-full max-w-4xl rounded-3xl px-4 py-3 text-slate-900 transition-colors dark:text-white"
    >
      {/* Top row: Current leg info + Play controls */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => tripActions.togglePlaying()}
            className="toy-button flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-rose-500 text-white shadow-md shadow-orange-500/30"
            title={store.isPlaying ? "השהה מסלול" : "נגן מסלול על המפה"}
          >
            {store.isPlaying ? (
              <Pause className="h-5 w-5" />
            ) : (
              <Play className="h-5 w-5 fill-current" />
            )}
          </button>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => {
                tripActions.setIsPlaying(false);
                tripActions.setCurrentDayIndex(
                  Math.max(0, store.currentDayIndex - 1)
                );
              }}
              className="toy-button rounded-xl bg-slate-900/5 p-1.5 hover:bg-slate-900/10 dark:bg-white/10 dark:hover:bg-white/20"
              title="יום קודם"
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
              className="toy-button rounded-xl bg-slate-900/5 p-1.5 hover:bg-slate-900/10 dark:bg-white/10 dark:hover:bg-white/20"
              title="יום הבא"
            >
              <SkipBack className="h-4 w-4" />
            </button>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-400/25 px-2.5 py-0.5 text-xs font-extrabold text-amber-800 dark:bg-amber-400/20 dark:text-amber-300">
                <Calendar className="h-3.5 w-3.5" />
                {currentDay.dateShort}.2026 • {currentDay.weekdayHe}
              </span>
              <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                יום {currentDay.dayNumber}/{days.length} (יום{" "}
                {currentDay.dayInLeg} מתוך {currentDay.daysInLeg} במקטע)
              </span>
            </div>
            <div className="mt-0.5 flex items-center gap-2">
              <button
                type="button"
                onClick={() => tripActions.selectCity(currentDay.cityId)}
                className="font-display text-sm font-extrabold text-orange-600 hover:underline dark:text-orange-400"
              >
                מקטע {currentDay.legOrder}: {currentDay.legFocus} (
                {currentDay.legDates})
              </button>
              <span className="hidden text-xs text-slate-500 md:inline dark:text-slate-400">
                • {currentDay.cityNameEn}
              </span>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => tripActions.selectCity(currentDay.cityId)}
          className="toy-button flex items-center gap-1.5 rounded-2xl bg-emerald-500/15 px-3 py-1.5 text-xs font-bold text-emerald-800 hover:bg-emerald-500/25 dark:text-emerald-300"
        >
          <Compass className="h-4 w-4" />
          <span>פתח את {currentDay.cityNameHe}</span>
        </button>
      </div>

      {/* Anchor activity description for the current leg */}
      <div className="mt-1.5 truncate rounded-xl bg-slate-900/5 px-3 py-1 text-xs text-slate-700 dark:bg-white/5 dark:text-slate-300">
        <span className="font-bold text-slate-900 dark:text-white">
          עוגן המקטע:{" "}
        </span>
        {currentDay.legAnchor}
        {currentDay.legNotes && (
          <span className="mr-2 text-amber-700 dark:text-amber-300">
            ({currentDay.legNotes})
          </span>
        )}
      </div>

      {/* Range Slider: 6.11 -> 8.12 */}
      <div className="mt-2.5 flex items-center gap-3">
        <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
          6.11
        </span>
        <input
          type="range"
          min={0}
          max={days.length - 1}
          value={store.currentDayIndex}
          onChange={(e) => {
            tripActions.setIsPlaying(false);
            const nextIdx = Number(e.target.value);
            tripActions.setCurrentDayIndex(nextIdx);
          }}
          className="h-2 flex-1 cursor-pointer appearance-none rounded-full bg-gradient-to-l from-orange-500 via-amber-400 to-emerald-500 accent-orange-600"
          aria-label="ציר זמן הטיול 6 בנובמבר עד 8 בדצמבר"
        />
        <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
          8.12
        </span>
      </div>

      {/* 10 Route Leg Quick Pills */}
      <div className="mt-2 flex items-center gap-1 overflow-x-auto pb-0.5">
        {legs.map((leg) => {
          const isCurrent = currentDay.legOrder === leg.order;
          return (
            <button
              key={leg.id}
              type="button"
              onClick={() => handleLegClick(leg.order)}
              className={`toy-button shrink-0 rounded-xl px-2.5 py-1 text-[11px] font-bold transition-all ${
                isCurrent
                  ? "bg-orange-500 text-white shadow-sm"
                  : "bg-slate-900/5 text-slate-700 hover:bg-slate-900/10 dark:bg-white/10 dark:text-slate-300 dark:hover:bg-white/15"
              }`}
            >
              {leg.order}. {leg.focus} ({leg.dates})
            </button>
          );
        })}
      </div>
    </div>
  );
}
