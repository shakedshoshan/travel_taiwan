"use client";

import Link from "next/link";
import { MapPinned } from "lucide-react";
import { CITY_TRANSIT_GUIDE_HE } from "@/lib/data/cityTransitGuides";
import { getCityById } from "@/lib/data/selectors";

export function OptionalDetourCard() {
  const city = getCityById("kenting");

  return (
    <article
      dir="rtl"
      className="rounded-3xl border-2 border-dashed border-sky-400 bg-sky-500/5 p-4 shadow-xs"
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-sky-500 px-2.5 py-1 text-[11px] font-black text-white">
          אופציונלי
        </span>
        <h2 className="font-display text-lg font-black text-slate-900 dark:text-white">
          {city.nameHe}
        </h2>
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-300">
          סטייה מקאושיונג
        </span>
      </div>
      <p className="mt-2 text-xs leading-relaxed text-slate-700 dark:text-slate-200">
        {CITY_TRANSIT_GUIDE_HE.kenting}
      </p>
      <Link
        href="/?city=kenting"
        className="toy-button mt-3 inline-flex min-h-[44px] items-center gap-1.5 rounded-2xl bg-slate-900 px-4 text-xs font-black text-white dark:bg-amber-400 dark:text-slate-950"
      >
        <MapPinned className="h-4 w-4" />
        <span>פתח את {city.nameHe} במפה</span>
      </Link>
    </article>
  );
}
