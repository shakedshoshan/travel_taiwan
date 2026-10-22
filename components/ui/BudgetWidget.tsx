"use client";

import { useMemo } from "react";
import Link from "next/link";
import { X, Wallet, BedDouble, Utensils, AlertCircle } from "lucide-react";
import { getAllCities, getHotels } from "@/lib/data/selectors";
import { tripActions, useTripStore } from "@/lib/store/useTripStore";

const TOTAL_TRIP_DAYS = 33;

export function BudgetWidget() {
  const store = useTripStore();

  const budgetBreakdown = useMemo(() => {
    const routeCities = getAllCities().filter((c) => c.onRoute && c.days > 0);
    const allHotels = getHotels();

    const cityRows = routeCities.map((city) => {
      const cityHotels = allHotels.filter((h) => h.cityId === city.id);
      const chosenId = store.selectedHotels[city.id];
      const chosenHotel =
        cityHotels.find((h) => h.id === chosenId) ?? cityHotels[0] ?? null;

      const nights = city.days;
      const minStay =
        chosenHotel && chosenHotel.priceMin !== null
          ? chosenHotel.priceMin * nights
          : 0;
      const maxStay =
        chosenHotel && chosenHotel.priceMax !== null
          ? chosenHotel.priceMax * nights
          : minStay;

      return {
        city,
        nights,
        cityHotels,
        chosenHotel,
        minStay,
        maxStay,
      };
    });

    const totalHotelsMin = cityRows.reduce((sum, r) => sum + r.minStay, 0);
    const totalHotelsMax = cityRows.reduce((sum, r) => sum + r.maxStay, 0);
    const foodTotal = store.dailyFoodBudget * TOTAL_TRIP_DAYS;

    return {
      cityRows,
      totalHotelsMin,
      totalHotelsMax,
      foodTotal,
      grandMin: totalHotelsMin + foodTotal,
      grandMax: totalHotelsMax + foodTotal,
    };
  }, [store.selectedHotels, store.dailyFoodBudget]);

  if (!store.isBudgetOpen) return null;

  return (
    <div
      dir="rtl"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
      onClick={() => tripActions.setBudgetOpen(false)}
    >
      <div
        className="glass-panel flex max-h-[86vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl bg-white/95 shadow-2xl dark:bg-slate-900/95"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-900/10 px-5 py-4 dark:border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-300">
              <Wallet className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-display text-lg font-extrabold text-slate-900 dark:text-white">
                מחשבון תקציב הטיול (33 ימים)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                מלונות נבחרים × לילות בכל עיר + ממוצע אוכל יומי (ניתן לעריכה)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => tripActions.setBudgetOpen(false)}
            className="rounded-xl bg-slate-900/5 p-2 text-slate-500 hover:bg-slate-900/10 dark:bg-white/10 dark:text-slate-300"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 space-y-4 overflow-y-auto p-5">
          {/* Grand Summary Banner */}
          <div className="grid grid-cols-1 gap-3 rounded-2xl bg-gradient-to-l from-emerald-600 to-teal-600 p-4 text-white sm:grid-cols-3">
            <div>
              <div className="text-xs opacity-85">סה״כ לינה משוער</div>
              <div className="font-mono text-lg font-black">
                NT${budgetBreakdown.totalHotelsMin.toLocaleString()}–
                {budgetBreakdown.totalHotelsMax.toLocaleString()}
              </div>
            </div>
            <div>
              <div className="text-xs opacity-85">
                סה״כ אוכל ({TOTAL_TRIP_DAYS} ימים)
              </div>
              <div className="font-mono text-lg font-black">
                NT${budgetBreakdown.foodTotal.toLocaleString()}
              </div>
            </div>
            <div className="rounded-xl bg-white/15 p-2">
              <div className="text-xs font-bold text-amber-200">
                סה״כ טיול משוער (NT$)
              </div>
              <div className="font-mono text-xl font-black">
                NT${budgetBreakdown.grandMin.toLocaleString()}–
                {budgetBreakdown.grandMax.toLocaleString()}
              </div>
            </div>
          </div>

          {/* Editable Daily Food Budget */}
          <div className="rounded-2xl border border-slate-900/10 bg-slate-900/5 p-3.5 dark:border-white/10 dark:bg-white/5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Utensils className="h-4 w-4 text-orange-500" />
                <span className="text-sm font-bold">
                  תקציב אוכל ממוצע ליום (לנוסע):
                </span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={100}
                  max={5000}
                  step={50}
                  value={store.dailyFoodBudget}
                  onChange={(e) =>
                    tripActions.setDailyFoodBudget(Number(e.target.value))
                  }
                  className="w-24 rounded-xl border border-slate-300 bg-white px-2.5 py-1 text-center font-mono text-sm font-bold dark:border-slate-700 dark:bg-slate-800"
                />
                <span className="font-mono text-xs font-bold text-slate-600 dark:text-slate-300">
                  NT$ / יום
                </span>
              </div>
            </div>
          </div>

          {/* Per-City Hotel Breakdown */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <h4 className="flex items-center gap-1.5 text-sm font-extrabold">
                <BedDouble className="h-4 w-4 text-sky-500" />
                <span>מלונות שנבחרו לפי ערים במסלול:</span>
              </h4>
              <Link
                href="/hotels"
                onClick={() => tripActions.setBudgetOpen(false)}
                className="text-xs font-bold text-orange-600 hover:underline dark:text-amber-300"
              >
                השוואת כל המלונות ←
              </Link>
            </div>

            {budgetBreakdown.cityRows.map(
              ({ city, nights, cityHotels, chosenHotel, minStay, maxStay }) => (
                <div
                  key={city.id}
                  className="rounded-2xl border border-slate-900/10 bg-white/80 p-3 dark:border-white/10 dark:bg-slate-800/70"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <span className="font-display text-sm font-extrabold">
                        {city.nameHe}
                      </span>
                      <span className="mr-2 rounded-full bg-slate-900/5 px-2 py-0.5 text-xs font-bold dark:bg-white/10">
                        {nights} ימים/לילות ({city.dates.join(", ")})
                      </span>
                    </div>

                    {chosenHotel && (
                      <div className="font-mono text-xs font-bold text-emerald-700 dark:text-emerald-300">
                        סה״כ בעיר: NT${minStay.toLocaleString()}
                        {maxStay !== minStay
                          ? `–${maxStay.toLocaleString()}`
                          : ""}
                      </div>
                    )}
                  </div>

                  {cityHotels.length > 0 ? (
                    <div className="mt-2 space-y-1.5">
                      <select
                        value={chosenHotel?.id ?? ""}
                        onChange={(e) =>
                          tripActions.selectHotelForCity(city.id, e.target.value)
                        }
                        className="w-full rounded-xl border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-bold dark:border-slate-700 dark:bg-slate-900"
                      >
                        {cityHotels.map((h) => (
                          <option key={h.id} value={h.id}>
                            [{h.tierHe}] {h.name}
                          </option>
                        ))}
                      </select>

                      {chosenHotel && (
                        <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-600 dark:text-slate-300">
                          <span>{chosenHotel.priceText}</span>
                          {!chosenHotel.verified && (
                            <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold text-amber-700 dark:text-amber-300">
                              <AlertCircle className="h-3 w-3" />
                              לא מאומת
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="mt-1 text-xs text-slate-500">
                      אין מלונות בטבלה עבור יעד זה (הלינה באידאשאו / סאן מון לייק).
                    </p>
                  )}
                </div>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
