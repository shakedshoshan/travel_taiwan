"use client";

import { useState } from "react";
import { PlaceCard } from "../PlaceCard";
import { tripActions, useTripStore } from "@/lib/store/useTripStore";
import type { CityBundle } from "@/lib/data/selectors";
import type { FoodType, HotelTier } from "@/data/types";

export type DrawerTab = "attractions" | "food" | "hotels" | "days";

interface CityDrawerTabsContentProps {
  activeTab: DrawerTab;
  bundle: CityBundle;
}

export function CityDrawerTabsContent({
  activeTab,
  bundle,
}: CityDrawerTabsContentProps) {
  const store = useTripStore();
  const [natureFilter, setNatureFilter] = useState<"all" | "nature" | "urban">(
    "all"
  );
  const [foodTypeFilter, setFoodTypeFilter] = useState<FoodType | "all">("all");
  const [maxFoodPrice, setMaxFoodPrice] = useState<number>(1000);
  const [hotelTierFilter, setHotelTierFilter] = useState<HotelTier | "all">(
    "all"
  );

  const { attractions, food, hotels, legs, daysHere } = bundle;

  const filteredAttractions = attractions.filter((a) => {
    if (natureFilter === "nature") return a.isNature;
    if (natureFilter === "urban") return !a.isNature;
    return true;
  });

  const filteredFood = food.filter((f) => {
    if (foodTypeFilter !== "all" && f.type !== foodTypeFilter) return false;
    if (
      maxFoodPrice < 1000 &&
      f.priceMin !== null &&
      f.priceMin > maxFoodPrice
    ) {
      return false;
    }
    return true;
  });

  const filteredHotels = hotels.filter((h) => {
    if (hotelTierFilter !== "all" && h.tier !== hotelTierFilter) return false;
    return true;
  });

  if (activeTab === "attractions") {
    return (
      <>
        <div className="flex items-center gap-1.5">
          {(
            [
              ["all", "הכל"],
              ["nature", "טבע ונוף"],
              ["urban", "עירוני ותרבות"],
            ] as const
          ).map(([val, label]) => (
            <button
              key={val}
              type="button"
              onClick={() => setNatureFilter(val)}
              className={`min-h-[40px] rounded-xl px-3 text-xs font-bold ${
                natureFilter === val
                  ? "bg-slate-900 text-white dark:bg-amber-400 dark:text-slate-950"
                  : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {filteredAttractions.length === 0 ? (
          <div className="rounded-2xl bg-slate-100 p-6 text-center text-sm text-slate-500 dark:bg-slate-800">
            אין אטרקציות בסינון הנוכחי בעיר זו.
          </div>
        ) : (
          filteredAttractions.map((item) => (
            <PlaceCard key={item.id} place={item} compact />
          ))
        )}
      </>
    );
  }

  if (activeTab === "food") {
    return (
      <>
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-1">
            {(
              [
                ["all", "הכל"],
                ["michelin-bib", "מישלן ביב"],
                ["market", "שוק לילה"],
                ["hidden-local", "מקומי נסתר"],
                ["cheap", "זול"],
              ] as const
            ).map(([val, label]) => (
              <button
                key={val}
                type="button"
                onClick={() => setFoodTypeFilter(val)}
                className={`min-h-[40px] rounded-xl px-2.5 text-xs font-bold ${
                  foodTypeFilter === val
                    ? "bg-slate-900 text-white dark:bg-amber-400 dark:text-slate-950"
                    : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="flex items-center justify-between gap-2 rounded-xl bg-slate-100 px-3 py-2 text-xs dark:bg-slate-800">
            <span>סינון מחיר מקסימלי:</span>
            <input
              type="range"
              min={50}
              max={1000}
              step={50}
              value={maxFoodPrice}
              onChange={(e) => setMaxFoodPrice(Number(e.target.value))}
              className="w-28 accent-orange-500"
            />
            <span className="font-mono font-bold">
              {maxFoodPrice >= 1000 ? "ללא הגבלה" : `עד NT$${maxFoodPrice}`}
            </span>
          </div>
        </div>

        {filteredFood.length === 0 ? (
          <div className="rounded-2xl bg-slate-100 p-6 text-center text-sm text-slate-500 dark:bg-slate-800">
            אין מקומות אוכל בסינון זה בעיר זו.
          </div>
        ) : (
          filteredFood.map((item) => (
            <PlaceCard key={item.id} place={item} compact />
          ))
        )}
      </>
    );
  }

  if (activeTab === "hotels") {
    return (
      <>
        <div className="flex flex-wrap items-center gap-1">
          {(
            [
              ["all", "כל הרמות"],
              ["cheap", "זול"],
              ["quality", "איכותי"],
              ["splurge", "פינוק"],
            ] as const
          ).map(([val, label]) => (
            <button
              key={val}
              type="button"
              onClick={() => setHotelTierFilter(val)}
              className={`min-h-[40px] rounded-xl px-2.5 text-xs font-bold ${
                hotelTierFilter === val
                  ? "bg-slate-900 text-white dark:bg-amber-400 dark:text-slate-950"
                  : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {filteredHotels.length === 0 ? (
          <div className="rounded-2xl bg-slate-100 p-6 text-center text-sm text-slate-500 dark:bg-slate-800">
            אין מלונות שמורים עבור עיר זו.
          </div>
        ) : (
          filteredHotels.map((hotel) => (
            <PlaceCard key={hotel.id} place={hotel} compact />
          ))
        )}
      </>
    );
  }

  return (
    <div className="space-y-3">
      {legs.length === 0 ? (
        <div className="rounded-2xl bg-slate-100 p-5 text-center text-sm text-slate-600 dark:bg-slate-800 dark:text-slate-300">
          עיר זו אינה תחנת לינה ראשית ב-10 מקטעי המסלול, אך ניתן לשלב אותה
          כטיול יום מערי הבסיס הסמוכות.
        </div>
      ) : (
        legs.map((leg) => (
          <div
            key={leg.id}
            className="rounded-2xl border border-orange-500/30 bg-orange-500/10 p-3.5"
          >
            <div className="flex items-center justify-between">
              <span className="font-display text-sm font-extrabold text-orange-700 dark:text-orange-300">
                מקטע {leg.order}: {leg.focus}
              </span>
              <span className="rounded-full bg-white px-2.5 py-0.5 text-xs font-bold text-slate-900 dark:bg-slate-900 dark:text-amber-300">
                {leg.dates} ({leg.days} ימים)
              </span>
            </div>
            <p className="mt-1.5 text-xs font-medium text-slate-800 dark:text-slate-200">
              {leg.anchor}
            </p>
            {leg.notes && (
              <p className="mt-1 text-[11px] text-amber-800 dark:text-amber-300">
                הערות: {leg.notes}
              </p>
            )}
          </div>
        ))
      )}

      {daysHere.length > 0 && (
        <div className="space-y-1.5">
          <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400">
            ימים ספציפיים בציר הזמן (לחצו לקפיצה במפה):
          </h4>
          <div className="grid grid-cols-2 gap-1.5">
            {daysHere.map((d) => (
              <button
                key={d.dayIndex}
                type="button"
                onClick={() => tripActions.setCurrentDayIndex(d.dayIndex)}
                className={`min-h-[48px] rounded-xl border p-2 text-right text-xs transition-all ${
                  store.currentDayIndex === d.dayIndex
                    ? "border-orange-500 bg-orange-500 font-bold text-white"
                    : "border-slate-200 bg-slate-50 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-800/60"
                }`}
              >
                <div>
                  יום {d.dayNumber} • {d.dateShort}
                </div>
                <div className="text-[10px] opacity-80">
                  {d.weekdayHe} ({d.legFocus})
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
