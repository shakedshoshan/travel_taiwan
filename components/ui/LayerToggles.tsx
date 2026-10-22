"use client";

import {
  Sparkles,
  Trees,
  Utensils,
  Flame,
  Award,
  Gem,
  BedDouble,
  RotateCcw,
  Sun,
  Moon,
  Box,
} from "lucide-react";
import {
  tripActions,
  useTripStore,
  type LayerToggles as LayerTogglesState,
} from "@/lib/store/useTripStore";

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

  return (
    <div
      dir="rtl"
      className="pointer-events-auto flex flex-wrap items-center gap-1.5"
    >
      <div className="glass-panel flex flex-wrap items-center gap-1.5 rounded-2xl p-1.5">
        {LAYER_CONFIG.map((item) => {
          const Icon = item.icon;
          const active = store.layerToggles[item.key];
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => tripActions.toggleLayer(item.key)}
              className={`toy-button flex items-center gap-1.5 rounded-xl border px-2.5 py-1.5 text-xs font-bold transition-all ${
                active
                  ? `${item.activeClass} shadow-sm`
                  : "border-transparent bg-slate-900/5 text-slate-600 opacity-75 hover:opacity-100 dark:bg-white/10 dark:text-slate-300"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{item.labelHe}</span>
            </button>
          );
        })}
      </div>

      {/* Camera Reset + Day/Night + 2D/3D Controls */}
      <div className="glass-panel flex items-center gap-1.5 rounded-2xl p-1.5">
        <button
          type="button"
          onClick={() => tripActions.toggleNightMode()}
          className={`toy-button flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-xs font-bold ${
            store.isNightMode
              ? "bg-indigo-600 text-amber-200 shadow-sm"
              : "bg-amber-400/25 text-amber-900 dark:text-amber-200"
          }`}
          title="מעבר בין יום ללילה (אורות שווקי לילה)"
        >
          {store.isNightMode ? (
            <>
              <Moon className="h-3.5 w-3.5" />
              <span>מצב לילה</span>
            </>
          ) : (
            <>
              <Sun className="h-3.5 w-3.5" />
              <span>מצב יום</span>
            </>
          )}
        </button>

        <button
          type="button"
          onClick={() => tripActions.setUse2DFallback(!store.use2DFallback)}
          className="toy-button flex items-center gap-1 rounded-xl bg-slate-900/5 px-2.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-900/10 dark:bg-white/10 dark:text-slate-200"
          title="החלף בין מפת 3D למפת 2D"
        >
          <Box className="h-3.5 w-3.5" />
          <span>{store.use2DFallback ? "מפת 3D" : "מפת 2D"}</span>
        </button>

        {(store.selectedCityId || store.focusedPlaceId) && (
          <button
            type="button"
            onClick={() => {
              tripActions.selectCity(null);
              tripActions.focusPlace(null, null);
            }}
            className="toy-button flex items-center gap-1 rounded-xl bg-orange-500 px-2.5 py-1.5 text-xs font-bold text-white shadow-sm"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>מבט על כל האי</span>
          </button>
        )}
      </div>
    </div>
  );
}
