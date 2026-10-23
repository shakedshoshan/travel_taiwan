"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import {
  BedDouble,
  Calendar,
  ShieldCheck,
  ChevronDown,
  DoorClosed,
} from "lucide-react";
import {
  getAllCities,
  getHotels,
  HOTEL_TIER_META,
  type EnrichedHotel,
} from "@/lib/data/selectors";
import { getCityPrimaryImage, hasOwnHotelImage } from "@/lib/data/placeImages";
import { nightlyRateForMode, type StayRateMode } from "@/lib/data/lodgingPrice";
import { PlaceCard } from "@/components/ui/PlaceCard";
import { PhotoCreditPopover } from "@/components/ui/PhotoCreditPopover";

export default function HotelsPage() {
  const cities = getAllCities();
  const allHotels = getHotels();
  const [onlyVerified, setOnlyVerified] = useState(false);
  const [budgetMode, setBudgetMode] = useState<StayRateMode>("room");

  const citiesWithHotels = useMemo(() => {
    const cityMap = new Map(cities.map((c) => [c.id, c]));
    const uniqueCityIds = Array.from(new Set(allHotels.map((h) => h.cityId)));
    return uniqueCityIds.map((id) => cityMap.get(id)!);
  }, [cities, allHotels]);

  const tripStaySummary = useMemo(() => {
    let singleTotal = 0;
    let totalNightsWithHotels = 0;
    let skippedNights = 0;

    for (const city of citiesWithHotels) {
      const nights = city.days;
      if (nights <= 0) continue;
      const cityHotels = allHotels.filter((h) => h.cityId === city.id);
      const priced = cityHotels
        .map((hotel) => ({ hotel, rate: nightlyRateForMode(hotel, budgetMode) }))
        .filter((entry): entry is { hotel: EnrichedHotel; rate: number } => entry.rate != null)
        .sort((a, b) => Number(b.hotel.verified) - Number(a.hotel.verified) || a.rate - b.rate);
      const chosen = priced.find((entry) => entry.hotel.tier === "cheap") ?? priced[0];
      if (!chosen) {
        skippedNights += nights;
        continue;
      }
      totalNightsWithHotels += nights;
      singleTotal += chosen.rate * nights;
    }

    return { singleTotal, totalNightsWithHotels, skippedNights };
  }, [citiesWithHotels, allHotels, budgetMode]);

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
              <span className="text-[10px] opacity-75">
                {city.days > 0 ? `(${city.days} לילות)` : "(אופציונלי)"}
              </span>
            </a>
          ))}
        </div>
      </div>

      {/* Compact Header & Bed/Room Budget Widget */}
      <div className="mb-5 flex flex-col gap-3.5 rounded-3xl border border-slate-200 bg-white p-4 shadow-xs md:flex-row md:items-center md:justify-between dark:border-slate-800 dark:bg-slate-900">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-extrabold text-sky-600 dark:text-sky-300">
            <BedDouble className="h-4 w-4" />
            <span>
              השוואת {allHotels.length} מלונות והוסטלים (
              {tripStaySummary.totalNightsWithHotels} לילות במסלול + קנטינג)
            </span>
          </div>
          <h1 className="mt-1 font-display text-xl font-black text-slate-900 md:text-2xl dark:text-white">
            הבחירה הזולה המומלצת ראשונה · איכותי ופינוק בלחיצה
          </h1>

          {/* Single Total Display for Chosen Mode */}
          <div className="mt-2 inline-flex flex-wrap items-center gap-2 rounded-2xl bg-emerald-500/10 px-3.5 py-2 text-xs font-bold text-emerald-900 dark:bg-emerald-500/15 dark:text-emerald-200">
            <span>
              סה״כ לינה משוער ({tripStaySummary.totalNightsWithHotels} לילות ·{" "}
              {budgetMode === "bed" ? "סה״כ לפי מיטה" : "סה״כ לפי חדר"}):
            </span>
            <span className="font-mono text-sm font-black text-emerald-700 dark:text-emerald-300">
              NT${tripStaySummary.singleTotal.toLocaleString()}
            </span>
            {tripStaySummary.skippedNights > 0 && (
              <span className="text-[11px] font-semibold text-emerald-800/80 dark:text-emerald-200/80">
                {tripStaySummary.skippedNights} לילות בלי מחיר{" "}
                {budgetMode === "bed" ? "מיטה" : "חדר"} לא נכללו
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Bed / Room Budget Mode Toggle */}
          <div
            role="group"
            aria-label="בחירת מצב חישוב תקציב לינה"
            className="inline-flex rounded-2xl border border-slate-200 bg-slate-100 p-1 dark:border-slate-700 dark:bg-slate-800"
          >
            <button
              type="button"
              onClick={() => setBudgetMode("bed")}
              className={`flex min-h-11 min-w-11 items-center gap-1.5 rounded-xl px-3 text-xs font-bold transition-all ${
                budgetMode === "bed"
                  ? "bg-white text-slate-950 shadow-xs dark:bg-amber-400 dark:text-slate-950"
                  : "text-slate-600 hover:text-slate-900 dark:text-slate-300"
              }`}
            >
              <BedDouble className="h-3.5 w-3.5" />
              <span>מיטה</span>
            </button>
            <button
              type="button"
              onClick={() => setBudgetMode("room")}
              className={`flex min-h-11 min-w-11 items-center gap-1.5 rounded-xl px-3 text-xs font-bold transition-all ${
                budgetMode === "room"
                  ? "bg-white text-slate-950 shadow-xs dark:bg-amber-400 dark:text-slate-950"
                  : "text-slate-600 hover:text-slate-900 dark:text-slate-300"
              }`}
            >
              <DoorClosed className="h-3.5 w-3.5" />
              <span>חדר</span>
            </button>
          </div>

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
        </div>
      </div>

      {/* Per-City Sections: Best Cheap Pick First, Quality & Splurge Collapsed */}
      <div className="space-y-6">
        {citiesWithHotels.map((city) => {
          const cityHotels = allHotels.filter(
            (h) => h.cityId === city.id && (!onlyVerified || h.verified)
          );
          if (cityHotels.length === 0) {
            if (city.id !== "kenting" && !city.optional) return null;
            return (
              <section
                key={city.id}
                id={city.id}
                className="scroll-mt-32 rounded-3xl border-2 border-dashed border-sky-400/80 bg-sky-500/5 p-4 md:p-6"
              >
                <h2 className="font-display text-xl font-black text-slate-900 dark:text-white">
                  {city.nameHe} (אופציונלי)
                </h2>
                <p className="mt-2 text-sm text-slate-700 dark:text-slate-200">
                  אין מלונות שמורים ליעד הזה
                  {city.note ? `. ${city.note}` : "."}
                </p>
              </section>
            );
          }

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
                    <Image
                      src={cityImg.src}
                      alt={city.nameHe}
                      title={cityImg.attribution}
                      fill
                      sizes="64px"
                      className="object-cover"
                    />
                    <PhotoCreditPopover
                      image={cityImg}
                      positionClass="bottom-0.5 left-0.5 scale-75 origin-bottom-left"
                    />
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-display text-xl font-black text-slate-900 dark:text-white">
                      {city.nameHe}
                    </h2>
                    <span className="inline-flex items-center gap-1 rounded-full bg-orange-500/15 px-2.5 py-0.5 text-xs font-extrabold text-orange-700 dark:text-orange-300">
                      <Calendar className="h-3.5 w-3.5" />
                      {city.days > 0
                        ? `${city.days} לילות (${city.dates.join(" • ")})`
                        : "אופציונלי (1–2 לילות אחרי קאושיונג)"}
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
                    showPhoto={hasOwnHotelImage(bestCheapPick)}
                  />
                </div>
              )}

              {/* Additional Cheap Options (Collapsed if more than 1) */}
              {otherCheap.length > 0 && (
                <details className="group mb-2.5 rounded-2xl border border-slate-200 bg-slate-50/70 p-3 dark:border-slate-800 dark:bg-slate-800/40">
                  <summary className="flex min-h-[40px] cursor-pointer list-none items-center justify-between text-xs font-extrabold text-emerald-800 dark:text-emerald-300">
                    <span>
                      עוד אפשרויות זולות / הוסטלים ב{city.nameHe} (
                      {otherCheap.length})
                    </span>
                    <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" />
                  </summary>
                  <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {otherCheap.map((h) => (
                      <PlaceCard
                        key={h.id}
                        place={h}
                        compact
                        showPhoto={hasOwnHotelImage(h)}
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
                        showPhoto={hasOwnHotelImage(h)}
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
                        showPhoto={hasOwnHotelImage(h)}
                      />
                    ))}
                  </div>
                </details>
              )}
            </section>
          );
        })}
        {!citiesWithHotels.some((city) => city.id === "kenting") && (
          <section
            id="kenting"
            className="scroll-mt-32 rounded-3xl border-2 border-dashed border-sky-400/80 bg-sky-500/5 p-4 md:p-6"
          >
            <h2 className="font-display text-xl font-black text-slate-900 dark:text-white">
              קנטינג (אופציונלי)
            </h2>
            <p className="mt-2 text-sm text-slate-700 dark:text-slate-200">
              אין מלונות שמורים לקנטינג. {cities.find((city) => city.id === "kenting")?.note}
            </p>
          </section>
        )}
      </div>
    </div>
  );
}
