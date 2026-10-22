"use client";

import {
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  RotateCw,
  Hand,
  Orbit,
  Compass,
  Home,
} from "lucide-react";
import { tripActions, useTripStore } from "@/lib/store/useTripStore";

export function MapNavigationPad() {
  const store = useTripStore();

  return (
    <div
      dir="rtl"
      className="glass-panel pointer-events-auto flex flex-col gap-2 rounded-3xl p-2.5 text-slate-800 shadow-xl dark:text-slate-100"
    >
      {/* Drag Mode Switcher: Pan (Move) vs 3D Rotate */}
      <div className="grid grid-cols-2 gap-1 rounded-2xl bg-slate-900/5 p-1 dark:bg-white/10">
        <button
          type="button"
          onClick={() => tripActions.setMapDragMode("pan")}
          className={`flex items-center justify-center gap-1 rounded-xl px-2 py-1.5 text-[11px] font-extrabold transition-all ${
            store.mapDragMode === "pan"
              ? "bg-orange-500 text-white shadow-xs"
              : "text-slate-600 hover:text-slate-900 dark:text-slate-300"
          }`}
          title="גרירה עם העכבר מזיזה את המפה לכל כיוון"
        >
          <Hand className="h-3.5 w-3.5" />
          <span>הזזה</span>
        </button>

        <button
          type="button"
          onClick={() => tripActions.setMapDragMode("rotate")}
          className={`flex items-center justify-center gap-1 rounded-xl px-2 py-1.5 text-[11px] font-extrabold transition-all ${
            store.mapDragMode === "rotate"
              ? "bg-orange-500 text-white shadow-xs"
              : "text-slate-600 hover:text-slate-900 dark:text-slate-300"
          }`}
          title="גרירה עם העכבר מסובבת את זווית התלת-ממד"
        >
          <Orbit className="h-3.5 w-3.5" />
          <span>סיבוב</span>
        </button>
      </div>

      {/* Directional D-Pad for Moving Across the Map */}
      <div className="grid grid-cols-3 gap-1 place-items-center">
        <div />
        <button
          type="button"
          onClick={() => tripActions.dispatchCameraCommand("pan-north")}
          className="toy-button flex h-8 w-8 items-center justify-center rounded-xl bg-slate-900/8 hover:bg-orange-500 hover:text-white dark:bg-white/10 dark:hover:bg-orange-500"
          title="הזז צפונה (W / חץ למעלה)"
        >
          <ArrowUp className="h-4 w-4" />
        </button>
        <div />

        <button
          type="button"
          onClick={() => tripActions.dispatchCameraCommand("pan-east")}
          className="toy-button flex h-8 w-8 items-center justify-center rounded-xl bg-slate-900/8 hover:bg-orange-500 hover:text-white dark:bg-white/10 dark:hover:bg-orange-500"
          title="הזז מזרחה (D / חץ ימינה)"
        >
          <ArrowRight className="h-4 w-4" />
        </button>

        <button
          type="button"
          onClick={() => {
            tripActions.selectCity(null);
            tripActions.focusPlace(null, null);
            tripActions.dispatchCameraCommand("reset");
          }}
          className="toy-button flex h-8 w-8 items-center justify-center rounded-xl bg-amber-400/25 text-amber-900 hover:bg-amber-400 hover:text-slate-950 dark:text-amber-300"
          title="איפוס מבט לכל האי"
        >
          <Home className="h-4 w-4" />
        </button>

        <button
          type="button"
          onClick={() => tripActions.dispatchCameraCommand("pan-west")}
          className="toy-button flex h-8 w-8 items-center justify-center rounded-xl bg-slate-900/8 hover:bg-orange-500 hover:text-white dark:bg-white/10 dark:hover:bg-orange-500"
          title="הזז מערבה (A / חץ שמאלה)"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>

        <div />
        <button
          type="button"
          onClick={() => tripActions.dispatchCameraCommand("pan-south")}
          className="toy-button flex h-8 w-8 items-center justify-center rounded-xl bg-slate-900/8 hover:bg-orange-500 hover:text-white dark:bg-white/10 dark:hover:bg-orange-500"
          title="הזז דרומה (S / חץ למטה)"
        >
          <ArrowDown className="h-4 w-4" />
        </button>
        <div />
      </div>

      {/* Zoom + Rotate + Tilt Row */}
      <div className="grid grid-cols-5 gap-1 border-t border-slate-900/10 pt-1.5 dark:border-white/10">
        <button
          type="button"
          onClick={() => tripActions.dispatchCameraCommand("zoom-in")}
          className="toy-button flex h-8 items-center justify-center rounded-xl bg-slate-900/8 hover:bg-slate-900/15 dark:bg-white/10"
          title="זום פנימה (+)"
        >
          <ZoomIn className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={() => tripActions.dispatchCameraCommand("zoom-out")}
          className="toy-button flex h-8 items-center justify-center rounded-xl bg-slate-900/8 hover:bg-slate-900/15 dark:bg-white/10"
          title="זום החוצה (-)"
        >
          <ZoomOut className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={() => tripActions.dispatchCameraCommand("rotate-left")}
          className="toy-button flex h-8 items-center justify-center rounded-xl bg-slate-900/8 hover:bg-slate-900/15 dark:bg-white/10"
          title="סובב שמאלה (Q)"
        >
          <RotateCcw className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={() => tripActions.dispatchCameraCommand("rotate-right")}
          className="toy-button flex h-8 items-center justify-center rounded-xl bg-slate-900/8 hover:bg-slate-900/15 dark:bg-white/10"
          title="סובב ימינה (E)"
        >
          <RotateCw className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={() => tripActions.dispatchCameraCommand("tilt-toggle")}
          className="toy-button flex h-8 items-center justify-center rounded-xl bg-slate-900/8 hover:bg-slate-900/15 dark:bg-white/10"
          title="החלף זווית מבט (מבט על / מבט אלכסוני)"
        >
          <Compass className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
