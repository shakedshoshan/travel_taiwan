"use client";

import { useEffect, useMemo, useState } from "react";
import {
  X,
  Sparkles,
  Utensils,
  BedDouble,
  Calendar,
} from "lucide-react";
import { getCityBundle } from "@/lib/data/selectors";
import { getCityImages } from "@/lib/data/placeImages";
import { tripActions, useTripStore } from "@/lib/store/useTripStore";
import { BottomSheet } from "./BottomSheet";
import { PlaceCard } from "./PlaceCard";
import type { FoodType, HotelTier } from "@/data/types";

type DrawerTab = "attractions" | "food" | "hotels" | "days";

export function CityDrawer() {
  const store = useTripStore();
  const [activeTab, setActiveTab] = useState<DrawerTab>("attractions");
  const [natureFilter, setNatureFilter] = useState<"all" | "nature" | "urban">(
    "all"
  );
  const [foodTypeFilter, setFoodTypeFilter] = useState<FoodType | "all">("all");
  const [maxFoodPrice, setMaxFoodPrice] = useState<number>(1000);
  const [hotelTierFilter, setHotelTierFilter] = useState<HotelTier | "all">(
    "all"
  );
  const [isSheetSkeleton, setIsSheetSkeleton] = useState(false);

  useEffect(() => {
    if (!store.selectedCityId) return;
    setIsSheetSkeleton(true);
    const t = window.setTimeout(() => setIsSheetSkeleton(false), 140);
    return () => window.clearTimeout(t);
  }, [store.selectedCityId]);

  const bundle = useMemo(() => {
    if (!store.selectedCityId || store.isCityZoomMapOpen) return null;
    return getCityBundle(store.selectedCityId);
  }, [store.selectedCityId, store.isCityZoomMapOpen]);

  if (!bundle) return null;

  const { city, attractions, food, hotels, legs, daysHere } = bundle;
  const cityImages = getCityImages(city.id);

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

  const headerContent = (
    <div className="flex items-start justify-between gap-2">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="font-display text-xl font-black text-slate-900 dark:text-white">
            {city.nameHe}
          </h2>
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            {city.nameEn}
          </span>
          {city.onRoute ? (
            <span className="rounded-full bg-orange-500/15 px-2.5 py-0.5 text-[11px] font-bold text-orange-600 dark:text-orange-300">
              {city.days} ימים במסלול
            </span>
          ) : (
            <span className="rounded-full bg-slate-500/15 px-2.5 py-0.5 text-[11px] font-medium text-slate-600 dark:text-slate-300">
              טיול יום
            </span>
          )}
        </div>
        {city.dates.length > 0 && (
          <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300">
            <Calendar className="h-3.5 w-3.5 text-orange-500" />
            <span>{city.dates.join(" • ")}</span>
          </div>
        )}
      </div>

      <button
        type="button"
        onPointerDown={(e) => e.stopPropagation()}
        onClick={() => tripActions.selectCity(null)}
        className="toy-button flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
        aria-label="סגור חלונית עיר"
      >
        <X className="h-5 w-5" />
      </button>
    </div>
  );

  const peekSummary = (
    <div className="flex items-center justify-between gap-2">
      <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
        ★ {attractions.length} אטרקציות · 🍜 {food.length} אוכל · 🏨{" "}
        {hotels.length} מלונות
      </span>
      <button
        type="button"
        onPointerDown={(e) => e.stopPropagation()}
        onClick={() => tripActions.setSheetSnap("half")}
        className="rounded-xl bg-orange-500 px-3 py-1.5 text-xs font-black text-white"
      >
        הרחב פרטים ▲
      </button>
    </div>
  );

  return (
    <BottomSheet
      isOpen={Boolean(store.selectedCityId)}
      snap={store.sheetSnap === "closed" ? "half" : store.sheetSnap}
      onSnapChange={(nextSnap) => tripActions.setSheetSnap(nextSnap)}
      onClose={() => tripActions.selectCity(null)}
      header={headerContent}
      peekSummary={peekSummary}
      ariaLabel={`מידע על ${city.nameHe}`}
    >
      {/* 4 Tabs + 3D City Diorama Entry */}
      <div className="shrink-0 border-b border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-800 dark:bg-slate-950/60">
        {/* City Photo Gallery Strip from data/images/cities */}
        {cityImages.length > 0 && (
          <div className="fade-edge-scroll no-scrollbar mb-2 flex snap-x snap-mandatory gap-2 overflow-x-auto pb-0.5">
            {cityImages.map((img, idx) => (
              <a
                key={img.file}
                href={img.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                title={img.attribution}
                className={`relative h-24 shrink-0 snap-start overflow-hidden rounded-2xl bg-slate-900 ${
                  cityImages.length === 1 ? "w-full" : "w-56 sm:w-64"
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img.src}
                  alt={`${city.nameHe} ${idx + 1}`}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
                <span className="absolute right-2 bottom-1.5 left-2 truncate text-[9px] font-medium text-slate-200">
                  {img.creditHe}
                </span>
              </a>
            ))}
          </div>
        )}

        <div className="grid grid-cols-4 gap-1">
          <button
            type="button"
            onClick={() => setActiveTab("attractions")}
            className={`flex min-h-[44px] items-center justify-center gap-1 rounded-xl text-xs font-bold transition-all ${
              activeTab === "attractions"
                ? "bg-white text-slate-950 shadow-xs dark:bg-slate-800 dark:text-white"
                : "text-slate-600 hover:text-slate-900 dark:text-slate-300"
            }`}
          >
            <Sparkles className="h-3.5 w-3.5 text-amber-500" />
            <span>אטרקציות ({attractions.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("food")}
            className={`flex min-h-[44px] items-center justify-center gap-1 rounded-xl text-xs font-bold transition-all ${
              activeTab === "food"
                ? "bg-white text-slate-950 shadow-xs dark:bg-slate-800 dark:text-white"
                : "text-slate-600 dark:text-slate-300"
            }`}
          >
            <Utensils className="h-3.5 w-3.5 text-rose-500" />
            <span>אוכל ({food.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("hotels")}
            className={`flex min-h-[44px] items-center justify-center gap-1 rounded-xl text-xs font-bold transition-all ${
              activeTab === "hotels"
                ? "bg-white text-slate-950 shadow-xs dark:bg-slate-800 dark:text-white"
                : "text-slate-600 dark:text-slate-300"
            }`}
          >
            <BedDouble className="h-3.5 w-3.5 text-sky-500" />
            <span>מלונות ({hotels.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("days")}
            className={`flex min-h-[44px] items-center justify-center gap-1 rounded-xl text-xs font-bold transition-all ${
              activeTab === "days"
                ? "bg-white text-slate-950 shadow-xs dark:bg-slate-800 dark:text-white"
                : "text-slate-600 dark:text-slate-300"
            }`}
          >
            <Calendar className="h-3.5 w-3.5 text-emerald-500" />
            <span>ימים ({daysHere.length})</span>
          </button>
        </div>

        <button
          type="button"
          onClick={() => tripActions.enterCityZoomMap(city.id)}
          className="toy-button mt-2 flex min-h-[44px] w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 px-3 text-xs font-black text-slate-950 shadow-sm"
        >
          <span>
            🔍 כניסה למפת יעד 3D פנימית ({attractions.length + food.length + hotels.length}{" "}
            מקומות)
          </span>
        </button>
      </div>

      {/* Scrollable Content Area */}
      <div className="flex-1 space-y-3 overflow-y-auto p-3.5">
        {isSheetSkeleton ? (
          <div className="space-y-3" aria-label="טוען נתוני עיר">
            {[0, 1, 2].map((idx) => (
              <div
                key={idx}
                className="animate-pulse overflow-hidden rounded-3xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-800/50"
              >
                <div className="h-24 w-full rounded-2xl bg-slate-200 dark:bg-slate-700" />
                <div className="mt-3 h-4 w-2/3 rounded bg-slate-200 dark:bg-slate-700" />
                <div className="mt-2 h-3 w-full rounded bg-slate-200 dark:bg-slate-700" />
                <div className="mt-3 flex gap-2">
                  <div className="h-10 flex-1 rounded-2xl bg-slate-200 dark:bg-slate-700" />
                  <div className="h-10 w-12 rounded-2xl bg-slate-200 dark:bg-slate-700" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <>
        {/* TAB 1: ATTRACTIONS */}
        {activeTab === "attractions" && (
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
        )}

        {/* TAB 2: FOOD */}
        {activeTab === "food" && (
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
        )}

        {/* TAB 3: HOTELS */}
        {activeTab === "hotels" && (
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
                <PlaceCard
                  key={hotel.id}
                  place={hotel}
                  compact
                  showHotelBudgetAction
                />
              ))
            )}
          </>
        )}

        {/* TAB 4: DAYS HERE */}
        {activeTab === "days" && (
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
        )}
          </>
        )}
      </div>
    </BottomSheet>
  );
}
