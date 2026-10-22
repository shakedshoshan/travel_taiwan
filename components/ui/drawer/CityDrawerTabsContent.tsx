"use client";

import { useState } from "react";
import { LocateFixed } from "lucide-react";
import { PlaceCard } from "../PlaceCard";
import {
  computeDistanceKm,
  resolveNearMeCoordinates,
} from "@/lib/data/foodAndPlaceMeta";
import { tripActions, useTripStore } from "@/lib/store/useTripStore";
import type { CityBundle, EnrichedPlace } from "@/lib/data/selectors";
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
  const [natureFilter, setNatureFilter] = useState<"all" | "nature" | "urban">("all");
  const [foodTypeFilter, setFoodTypeFilter] = useState<FoodType | "all">("all");
  const [maxFoodPrice, setMaxFoodPrice] = useState<number>(1000);
  const [hotelTierFilter, setHotelTierFilter] = useState<HotelTier | "all">("all");
  const [sortByNearMe, setSortByNearMe] = useState<boolean>(false);

  const { city, attractions, food, hotels, legs, daysHere } = bundle;
  const activeCoords = store.userCoords ?? {
    lat: city.lat,
    lng: city.lng,
    labelHe: `מרכז ${city.nameHe}`,
  };

  const getDistKm = (p: EnrichedPlace) =>
    computeDistanceKm(
      activeCoords.lat,
      activeCoords.lng,
      p.resolvedCoords.lat,
      p.resolvedCoords.lng
    );

  const handleToggleNearMeSort = () => {
    if (sortByNearMe) {
      setSortByNearMe(false);
      return;
    }
    setSortByNearMe(true);
    if (!store.userCoords) {
      resolveNearMeCoordinates(city, (coords) => tripActions.setUserCoords(coords));
    }
  };

  const filteredAttractions = attractions
    .filter((a) =>
      natureFilter === "nature" ? a.isNature : natureFilter === "urban" ? !a.isNature : true
    )
    .sort((a, b) => (sortByNearMe ? getDistKm(a) - getDistKm(b) : b.importance - a.importance));

  const filteredFood = food
    .filter((f) => {
      if (foodTypeFilter !== "all" && f.type !== foodTypeFilter) return false;
      if (maxFoodPrice < 1000 && f.priceMin !== null && f.priceMin > maxFoodPrice) return false;
      return true;
    })
    .sort((a, b) => (sortByNearMe ? getDistKm(a) - getDistKm(b) : b.importance - a.importance));

  const filteredHotels = hotels
    .filter((h) => (hotelTierFilter === "all" ? true : h.tier === hotelTierFilter))
    .sort((a, b) => (sortByNearMe ? getDistKm(a) - getDistKm(b) : 0));

  const nearMeButton = (
    <button
      type="button"
      onClick={handleToggleNearMeSort}
      className={`flex min-h-[40px] items-center gap-1 rounded-xl px-2.5 text-xs font-bold transition-colors ${
        sortByNearMe
          ? "bg-sky-600 text-white"
          : "bg-sky-500/15 text-sky-800 dark:text-sky-300"
      }`}
    >
      <LocateFixed className="h-3.5 w-3.5" />
      <span>קרוב אליי</span>
    </button>
  );

  const renderPlaceList = (items: EnrichedPlace[], emptyMsg: string) =>
    items.length === 0 ? (
      <div className="rounded-2xl bg-slate-100 p-6 text-center text-sm text-slate-500 dark:bg-slate-800">
        {emptyMsg}
      </div>
    ) : (
      items.map((item) => (
        <PlaceCard
          key={item.id}
          place={item}
          distanceKm={sortByNearMe ? getDistKm(item) : null}
          compact
        />
      ))
    );

  if (activeTab === "attractions") {
    return (
      <>
        <div className="flex flex-wrap items-center justify-between gap-1.5">
          <div className="flex flex-wrap items-center gap-1.5">
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
                    : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-200"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          {nearMeButton}
        </div>
        {renderPlaceList(filteredAttractions, "אין אטרקציות בסינון הנוכחי בעיר זו.")}
      </>
    );
  }

  if (activeTab === "food") {
    return (
      <>
        <div className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-1">
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
                      : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-200"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            {nearMeButton}
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
        {renderPlaceList(filteredFood, "אין מקומות אוכל בסינון זה בעיר זו.")}
      </>
    );
  }

  if (activeTab === "hotels") {
    return (
      <>
        <div className="flex flex-wrap items-center justify-between gap-1">
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
                    : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-200"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          {nearMeButton}
        </div>
        {renderPlaceList(filteredHotels, "אין מלונות שמורים עבור עיר זו.")}
      </>
    );
  }

  return (
    <div className="space-y-3">
      {legs.length === 0 ? (
        <div className="rounded-2xl bg-slate-100 p-5 text-center text-sm text-slate-600 dark:bg-slate-800 dark:text-slate-200">
          {city.note ??
            "עיר זו אינה תחנת לינה ראשית ב-10 מקטעי המסלול, אך ניתן לשלב אותה כטיול יום מערי הבסיס הסמוכות."}
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
            <p className="mt-1.5 text-xs font-medium text-slate-800 dark:text-slate-100">
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
          <h4 className="text-xs font-bold text-slate-500 dark:text-slate-300">
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
