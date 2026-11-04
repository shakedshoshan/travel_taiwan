"use client";

import { ArrowRight, Search } from "lucide-react";
import { getCityById } from "@/lib/data/selectors";
import { citySheetEmoji } from "@/lib/ui/citySheetDisplay";
import { tripActions, useTripStore } from "@/lib/store/useTripStore";

export function CityModeBar() {
  const cityId = useTripStore().selectedCityId;
  if (!cityId) return null;
  const city = getCityById(cityId);

  return (
    <header
      dir="rtl"
      style={{ paddingTop: "max(0.25rem, env(safe-area-inset-top))" }}
      className="pointer-events-none fixed inset-x-0 top-0 z-40 px-2 max-lg:hidden lg:top-16"
    >
      <div className="glass-panel pointer-events-auto mx-auto flex h-12 max-w-xl items-center gap-1 rounded-2xl px-2 shadow-lg">
        <button
          type="button"
          aria-label="חזרה"
          onClick={() => tripActions.goBack()}
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-white"
        >
          <ArrowRight className="h-5 w-5" />
        </button>
        <div className="min-w-0 flex-1 text-center">
          <p className="text-[10px] font-bold text-orange-600 dark:text-amber-400">
            {citySheetEmoji(city.id)} {city.nameHe}
          </p>
          <h1 className="truncate text-sm leading-5 font-black text-slate-900 dark:text-white">
            {city.nameEn}
          </h1>
        </div>
        <button
          type="button"
          aria-label="חיפוש"
          onClick={() => tripActions.setSearchOpen(true)}
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800"
        >
          <Search className="h-5 w-5 text-orange-500" />
        </button>
      </div>
    </header>
  );
}
