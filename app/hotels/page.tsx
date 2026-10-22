"use client";

import { useMemo, useState } from "react";
import {
  BedDouble,
  Wallet,
  Calendar,
  ShieldCheck,
  ChevronDown,
} from "lucide-react";
import {
  getAllCities,
  getHotels,
  HOTEL_TIER_META,
} from "@/lib/data/selectors";
import { getCityPrimaryImage } from "@/lib/data/placeImages";
import { PlaceCard } from "@/components/ui/PlaceCard";
import { tripActions, useTripStore } from "@/lib/store/useTripStore";

export default function HotelsPage() {
  const store = useTripStore();
  const cities = getAllCities();
  const allHotels = getHotels();
  const [onlyVerified, setOnlyVerified] = useState(false);

  const citiesWithHotels = useMemo(() => {
    const cityMap = new Map(cities.map((c) => [c.id, c]));
    const uniqueCityIds = Array.from(new Set(allHotels.map((h) => h.cityId)));
    return uniqueCityIds.map((id) => cityMap.get(id)!);
  }, [cities, allHotels]);

  const tripStaySummary = useMemo(() => {
    let minTotal = 0;
    let maxTotal = 0;
    let totalNightsWithHotels = 0;

    for (const city of citiesWithHotels) {
      const nights = city.days;
      if (nights <= 0) continue;
      const chosenId = store.selectedHotels[city.id];
      const cityHotels = allHotels.filter((h) => h.cityId === city.id);
      const chosen =
        cityHotels.find((h) => h.id === chosenId) ?? cityHotels[0];
      if (chosen) {
        totalNightsWithHotels += nights;
        const pMin = chosen.priceMin ?? 0;
        const pMax = chosen.priceMax ?? pMin;
        minTotal += pMin * nights;
        maxTotal += pMax * nights;
      }
    }

    return { minTotal, maxTotal, totalNightsWithHotels };
  }, [citiesWithHotels, allHotels, store.selectedHotels]);

  return (
    <div
      dir="rtl"
      className="mx-auto max-w-5xl px-3.5 pt-16 pb-24 md:px-6 md:pt-20"
    >
      {/* Sticky City Jump Bar */}
      <div
        style={{ top: "calc(3.4rem + env(safe-area-inset-top))" }}
        className="sticky z-30 -mx-3.5 mb-4 border-b border-slate-200/80 bg-background/95 px-3.5 py-2 backdrop-blur-md md:mx-0 md:rounded-3xl md:border dark:border-slate-800"
      >
        <div className="fade-edge-scroll no-scrollbar flex snap-x snap-mandatory items-center gap-1.5 overflow-x-auto pl-4">
          {citiesWithHotels.map((city) => (
            <a
              key={city.id}
              href={`#${city.id}`}
              className="flex min-h-[40px] shrink-0 snap-start items-center gap-1.5 rounded-full bg-white px-3.5 text-xs font-extrabold text-slate-800 shadow-xs hover:bg-orange-500 hover:text-white dark:bg-slate-900 dark:text-slate-200"
            >
              <span>{city.nameHe}</span>
              <span className="text-[10px] opacity-70">({city.days} לילות)</span>
            </a>
          ))}
        </div>
      </div>

      {/* Compact Header & Budget Summary */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-extrabold text-sky-600 dark:text-sky-300">
            <BedDouble className="h-4 w-4" />
            <span>השוואת 37 מלונות והוסטלים ({tripStaySummary.totalNightsWithHotels} לילות)</span>
          </div>
          <h1 className="mt-1 font-display text-xl font-black text-slate-900 md:text-2xl dark:text-white">
            הבחירה הזולה המומלצת ראשונה · איכותי ופינוק בלחיצה
          </h1>
          <div className="mt-1 font-mono text-xs font-bold text-emerald-700 dark:text-emerald-300">
            סה״כ לינה משוער לטיול: NT${tripStaySummary.minTotal.toLocaleString()}–
            {tripStaySummary.maxTotal.toLocaleString()}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setOnlyVerified(!onlyVerified)}
            className={`toy-button flex min-h-[44px] items-center gap-1.5 rounded-2xl px-3.5 text-xs font-bold ${
              onlyVerified
                ? "bg-emerald-600 text-white"
                : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200"
            }`}
          >
            <ShieldCheck className="h-4 w-4" />
            <span>רק מאומתים</span>
          </button>

          <button
            type="button"
            onClick={() => tripActions.setBudgetOpen(true)}
            className="toy-button flex min-h-[44px] items-center gap-1.5 rounded-2xl bg-slate-900 px-3.5 text-xs font-bold text-white dark:bg-amber-400 dark:text-slate-950"
          >
            <Wallet className="h-4 w-4" />
            <span>מחשבון תקציב</span>
          </button>
        </div>
      </div>

      {/* Per-City Sections: Best Cheap Pick First, Quality & Splurge Collapsed */}
      <div className="space-y-6">
        {citiesWithHotels.map((city) => {
          const cityHotels = allHotels.filter(
            (h) => h.cityId === city.id && (!onlyVerified || h.verified)
          );
          if (cityHotels.length === 0) return null;

          const cheapHotels = cityHotels.filter((h) => h.tier === "cheap");
          const qualityHotels = cityHotels.filter((h) => h.tier === "quality");
          const splurgeHotels = cityHotels.filter((h) => h.tier === "splurge");

          // Best cheap pick first (verified first, else first cheap hotel)
          const sortedCheap = [...cheapHotels].sort(
            (a, b) => Number(b.verified) - Number(a.verified)
          );
          const bestCheapPick = sortedCheap[0] ?? null;
          const otherCheap = sortedCheap.slice(1);
          const cityImg = getCityPrimaryImage(city.id);

          return (
            <section
              key={city.id}
              id={city.id}
              className="scroll-mt-32 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm md:p-6 dark:border-slate-800 dark:bg-slate-900"
            >
              {/* City Header with Photo Banner */}
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="relative h-12 w-16 shrink-0 overflow-hidden rounded-2xl bg-slate-900">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={cityImg.src}
                      alt={city.nameHe}
                      title={cityImg.attribution}
                      loading="lazy"
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-display text-xl font-black text-slate-900 dark:text-white">
                      {city.nameHe}
                    </h2>
                    <span className="inline-flex items-center gap-1 rounded-full bg-orange-500/15 px-2.5 py-0.5 text-xs font-extrabold text-orange-700 dark:text-orange-300">
                      <Calendar className="h-3.5 w-3.5" />
                      {city.days} לילות ({city.dates.join(" • ")})
                    </span>
                  </div>
                </div>
              </div>

              {/* 1. Best Cheap Pick First (Expanded) */}
              {bestCheapPick && (
                <div className="mb-3">
                  <div className="mb-2 flex items-center gap-1.5 text-xs font-black text-emerald-700 dark:text-emerald-300">
                    <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
                    <span>הבחירה הזולה המומלצת ב{city.nameHe}:</span>
                  </div>
                  <PlaceCard
                    place={bestCheapPick}
                    showHotelBudgetAction
                  />
                </div>
              )}

              {/* Additional Cheap Options (Collapsed if more than 1) */}
              {otherCheap.length > 0 && (
                <details className="group mb-2.5 rounded-2xl border border-slate-200 bg-slate-50/70 p-3 dark:border-slate-800 dark:bg-slate-800/40">
                  <summary className="flex min-h-[40px] cursor-pointer list-none items-center justify-between text-xs font-extrabold text-emerald-800 dark:text-emerald-300">
                    <span>
                      עוד אפשרויות זולות / הוסטלים ב{city.nameHe} ({otherCheap.length})
                    </span>
                    <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" />
                  </summary>
                  <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {otherCheap.map((h) => (
                      <PlaceCard
                        key={h.id}
                        place={h}
                        compact
                        showHotelBudgetAction
                      />
                    ))}
                  </div>
                </details>
              )}

              {/* 2. Quality Stay Tier (Collapsed by Default) */}
              {qualityHotels.length > 0 && (
                <details className="group mb-2.5 rounded-2xl border border-sky-500/25 bg-sky-500/5 p-3">
                  <summary className="flex min-h-[44px] cursor-pointer list-none items-center justify-between text-xs font-extrabold text-sky-800 dark:text-sky-300">
                    <span>
                      {HOTEL_TIER_META.quality.labelHe} ב{city.nameHe} (
                      {qualityHotels.length})
                    </span>
                    <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" />
                  </summary>
                  <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {qualityHotels.map((h) => (
                      <PlaceCard
                        key={h.id}
                        place={h}
                        compact
                        showHotelBudgetAction
                      />
                    ))}
                  </div>
                </details>
              )}

              {/* 3. Splurge Tier (Collapsed by Default) */}
              {splurgeHotels.length > 0 && (
                <details className="group rounded-2xl border border-amber-500/30 bg-amber-500/5 p-3">
                  <summary className="flex min-h-[44px] cursor-pointer list-none items-center justify-between text-xs font-extrabold text-amber-900 dark:text-amber-300">
                    <span>
                      {HOTEL_TIER_META.splurge.labelHe} ב{city.nameHe} (
                      {splurgeHotels.length})
                    </span>
                    <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" />
                  </summary>
                  <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {splurgeHotels.map((h) => (
                      <PlaceCard
                        key={h.id}
                        place={h}
                        compact
                        showHotelBudgetAction
                      />
                    ))}
                  </div>
                </details>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
