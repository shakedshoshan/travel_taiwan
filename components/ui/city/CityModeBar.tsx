"use client";

import { ArrowRight, Search } from "lucide-react";
import { getCityById } from "@/lib/data/selectors";
import { tripActions, useTripStore } from "@/lib/store/useTripStore";

export function CityModeBar() {
  const cityId = useTripStore().selectedCityId;
  if (!cityId) return null;
  const city = getCityById(cityId);

  return (
    <header
      dir="rtl"
      className="pointer-events-none fixed inset-x-0 top-0 z-40 h-14 lg:top-16"
    >
      <div className="pointer-events-auto flex h-14 items-center gap-1 px-2">
        <button
          type="button"
          aria-label="חזרה"
          onClick={() => tripActions.goBack()}
          className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-slate-900 shadow-md dark:bg-slate-900 dark:text-white"
        >
          <ArrowRight className="h-5 w-5" />
        </button>
        <div className="min-w-0 flex-1 text-center">
          <h1 className="truncate text-base leading-5 font-black text-white [text-shadow:0_1px_2px_#0f172a]">
            {city.nameHe}
          </h1>
          <p className="truncate text-[11px] leading-4 font-semibold text-white/90 [text-shadow:0_1px_2px_#0f172a]">
            {city.nameEn}
          </p>
        </div>
        <button
          type="button"
          aria-label="חיפוש"
          onClick={() => tripActions.setSearchOpen(true)}
          className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-slate-900 shadow-md dark:bg-slate-900 dark:text-white"
        >
          <Search className="h-5 w-5 text-orange-500" />
        </button>
      </div>
    </header>
  );
}
