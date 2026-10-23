"use client";

import { useState } from "react";
import {
  Sparkles,
  Trees,
  Utensils,
  Flame,
  Award,
  Gem,
  BedDouble,
  Layers,
  X,
  Box,
  Check,
} from "lucide-react";
import {
  tripActions,
  useTripStore,
  type LayerToggles as LayerTogglesState,
} from "@/lib/store/useTripStore";
import { EdgeFadeScroller } from "./EdgeFadeScroller";

const LAYER_CONFIG: ReadonlyArray<{
  key: keyof LayerTogglesState;
  labelHe: string;
  icon: typeof Sparkles;
  activeClass: string;
}> = [
  {
    key: "attractions",
    labelHe: "אטרקציות ★",
    icon: Sparkles,
    activeClass: "bg-amber-400 text-slate-950 border-amber-300",
  },
  {
    key: "nature",
    labelHe: "טבע ונוף",
    icon: Trees,
    activeClass: "bg-emerald-500 text-white border-emerald-400",
  },
  {
    key: "markets",
    labelHe: "שווקי לילה",
    icon: Flame,
    activeClass: "bg-orange-500 text-white border-orange-400",
  },
  {
    key: "michelinBib",
    labelHe: "מישלן ביב",
    icon: Award,
    activeClass: "bg-rose-500 text-white border-rose-400",
  },
  {
    key: "hiddenLocal",
    labelHe: "מקומי נסתר",
    icon: Gem,
    activeClass: "bg-violet-500 text-white border-violet-400",
  },
  {
    key: "food",
    labelHe: "אוכל זול",
    icon: Utensils,
    activeClass: "bg-teal-500 text-white border-teal-400",
  },
  {
    key: "hotels",
    labelHe: "מלונות",
    icon: BedDouble,
    activeClass: "bg-sky-500 text-white border-sky-400",
  },
];

export function LayerToggles() {
  const store = useTripStore();
  const [focusChipId, setFocusChipId] = useState<string | null>(null);
  const firstActiveId =
    LAYER_CONFIG.find((item) => store.layerToggles[item.key])?.key ?? null;

  const hiddenBySheet =
    store.isCityZoomMapOpen ||
    store.sheetSnap === "half" ||
    store.sheetSnap === "full";

  if (hiddenBySheet) return null;

  const activeCount = Object.values(store.layerToggles).filter(Boolean).length;

  return (
    <>
      <div
        dir="rtl"
        className="pointer-events-auto flex w-full max-w-full items-center gap-2"
      >
        {/* "שכבות" Sheet Trigger Pill (>=44x44px) */}
        <button
          type="button"
          onClick={() => tripActions.setLayersSheetOpen(!store.isLayersSheetOpen)}
          aria-label="פתח הגדרות שכבות מפה"
          className="glass-panel toy-button flex min-h-[44px] shrink-0 items-center gap-1.5 rounded-2xl px-3 text-xs font-extrabold text-slate-900 shadow-md dark:text-white"
        >
          <Layers className="h-4 w-4 text-orange-500" />
          <span>שכבות</span>
          <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-orange-500/15 px-1 text-xs font-black text-orange-600 dark:bg-amber-400/20 dark:text-amber-300">
            {activeCount}
          </span>
        </button>

        <EdgeFadeScroller initialChipId={firstActiveId} focusChipId={focusChipId}>
          {LAYER_CONFIG.map((item) => {
            const Icon = item.icon;
            const active = store.layerToggles[item.key];
            return (
              <button
                key={item.key}
                type="button"
                data-chip-id={item.key}
                onClick={() => {
                  tripActions.toggleLayer(item.key);
                  setFocusChipId(item.key);
                }}
                className={`toy-button flex min-h-[44px] min-w-[44px] shrink-0 snap-start items-center gap-1.5 rounded-2xl border px-3 text-xs font-bold whitespace-nowrap shadow-sm transition-all ${
                  active
                    ? `${item.activeClass}`
                    : "border-white/50 bg-white/85 text-slate-600 opacity-85 dark:border-white/10 dark:bg-slate-900/85 dark:text-slate-300"
                }`}
              >
                <Icon className="h-3.5 w-3.5 shrink-0" />
                <span>{item.labelHe}</span>
              </button>
            );
          })}
        </EdgeFadeScroller>
      </div>

      {/* Small Opaque Bottom Sheet for "שכבות" */}
      {store.isLayersSheetOpen && (
        <div
          dir="rtl"
          className="pointer-events-auto fixed inset-0 z-50 flex items-end justify-center bg-slate-950/45 backdrop-blur-xs"
          onClick={() => tripActions.setLayersSheetOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ paddingBottom: "calc(1.25rem + env(safe-area-inset-bottom))" }}
            className="w-full max-w-lg rounded-t-3xl border-t border-slate-200 bg-white p-4 shadow-2xl dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-slate-300 dark:bg-slate-700" />
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="h-5 w-5 text-orange-500" />
                <h3 className="font-display text-base font-black text-slate-900 dark:text-white">
                  שכבות ותצוגת מפה
                </h3>
              </div>
              <button
                type="button"
                onClick={() => tripActions.setLayersSheetOpen(false)}
                aria-label="סגור חלונית שכבות"
                className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mb-3 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => tripActions.setAllLayers(true)}
                className="min-h-[44px] flex-1 rounded-2xl bg-slate-900 px-3 text-xs font-bold text-white dark:bg-amber-400 dark:text-slate-950"
              >
                הצג את כל השכבות
              </button>
              <button
                type="button"
                onClick={() => tripActions.setAllLayers(false)}
                className="min-h-[44px] flex-1 rounded-2xl bg-slate-100 px-3 text-xs font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-200"
              >
                נקה שכבות (ערים בלבד)
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {LAYER_CONFIG.map((item) => {
                const Icon = item.icon;
                const active = store.layerToggles[item.key];
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => tripActions.toggleLayer(item.key)}
                    className={`flex min-h-[44px] items-center justify-between rounded-2xl border px-3 text-xs font-bold transition-all ${
                      active
                        ? `${item.activeClass}`
                        : "border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-300"
                    }`}
                  >
                    <span className="flex items-center gap-1.5">
                      <Icon className="h-4 w-4 shrink-0" />
                      <span>{item.labelHe}</span>
                    </span>
                    {active && <Check className="h-4 w-4 shrink-0" />}
                  </button>
                );
              })}
            </div>

            <div className="mt-3 border-t border-slate-200 pt-3 dark:border-slate-800">
              <button
                type="button"
                onClick={() => tripActions.setUse2DFallback(!store.use2DFallback)}
                className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-2xl bg-slate-100 px-4 text-xs font-bold text-slate-800 dark:bg-slate-800 dark:text-slate-200"
              >
                <Box className="h-4 w-4 text-orange-500" />
                <span>
                  {store.use2DFallback
                    ? "חזור למפת תלת-ממד (3D)"
                    : "עבור למפת דו-ממד קלה (2D)"}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
