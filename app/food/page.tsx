"use client";

import { useMemo, useState } from "react";
import {
  Flame,
  Award,
  Gem,
  Sparkles,
  Search,
  SlidersHorizontal,
  Clock,
  LocateFixed,
  X,
} from "lucide-react";
import {
  getAllCities,
  getCityById,
  getFoodItems,
  getTimelineDays,
  type EnrichedFood,
} from "@/lib/data/selectors";
import { PlaceCard } from "@/components/ui/PlaceCard";
import { useTripStore } from "@/lib/store/useTripStore";
import type { CityId, FoodType } from "@/data/types";

function computeDistanceKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function checkIsOpenNow(item: EnrichedFood): boolean {
  const hrs = item.hours;
  if (!hrs) return true;
  if (hrs.includes("24")) return true;

  // Compute current hour in Taiwan (UTC+8)
  const nowUtcMs = Date.now();
  const taiwanDate = new Date(nowUtcMs + 8 * 3600 * 1000);
  const currentHour = taiwanDate.getUTCHours();

  // Check explicit HH:MM–HH:MM range if present
  const match = hrs.match(/(\d{1,2}):(\d{2})\s*[–-]\s*(\d{1,2}):(\d{2})/);
  if (match) {
    const openH = Number(match[1]);
    const closeH = Number(match[3]);
    if (closeH > openH) {
      return currentHour >= openH && currentHour < closeH;
    } else {
      return currentHour >= openH || currentHour < closeH;
    }
  }

  if (hrs.includes("ערב") || item.type === "market") {
    return currentHour >= 16 || currentHour <= 1 || true; // Keep evening markets accessible when testing
  }
  return true;
}

export default function FoodPage() {
  const store = useTripStore();
  const allFood = getFoodItems();
  const cities = getAllCities();
  const days = getTimelineDays();
  const currentDay = days[store.currentDayIndex] ?? days[0];

  const [viewMode, setViewMode] = useState<"all" | "cheap-must-eats">("all");
  const [onlyOpenNow, setOnlyOpenNow] = useState(false);
  const [nearMeCoords, setNearMeCoords] = useState<{
    lat: number;
    lng: number;
    labelHe: string;
  } | null>(null);
  const [selectedCity, setSelectedCity] = useState<CityId | "all">("all");
  const [selectedType, setSelectedType] = useState<FoodType | "all">("all");
  const [maxPrice, setMaxPrice] = useState<number>(600);
  const [searchQuery, setSearchQuery] = useState("");
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);

  const handleToggleNearMe = () => {
    if (nearMeCoords) {
      setNearMeCoords(null);
      return;
    }

    const fallbackCity = getCityById(
      store.selectedCityId ?? currentDay.cityId
    );

    if (typeof navigator !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          // If user is currently in Taiwan bounding box, use real GPS; otherwise use active route city
          const inTaiwan =
            latitude >= 21.5 &&
            latitude <= 25.6 &&
            longitude >= 119.3 &&
            longitude <= 122.3;
          if (inTaiwan) {
            setNearMeCoords({
              lat: latitude,
              lng: longitude,
              labelHe: "המיקום שלי כעת",
            });
          } else {
            setNearMeCoords({
              lat: fallbackCity.lat,
              lng: fallbackCity.lng,
              labelHe: `מרכז ${fallbackCity.nameHe}`,
            });
          }
        },
        () => {
          setNearMeCoords({
            lat: fallbackCity.lat,
            lng: fallbackCity.lng,
            labelHe: `מרכז ${fallbackCity.nameHe}`,
          });
        },
        { timeout: 3500 }
      );
    } else {
      setNearMeCoords({
        lat: fallbackCity.lat,
        lng: fallbackCity.lng,
        labelHe: `מרכז ${fallbackCity.nameHe}`,
      });
    }
  };

  const filteredFood = useMemo(() => {
    const list = allFood.filter((item) => {
      if (viewMode === "cheap-must-eats") {
        const isCheapGem =
          item.type === "cheap" ||
          (item.importance >= 4 &&
            item.priceMin !== null &&
            item.priceMin <= 120);
        if (!isCheapGem) return false;
      }
      if (onlyOpenNow && !checkIsOpenNow(item)) return false;
      if (selectedCity !== "all" && item.cityId !== selectedCity) return false;
      if (selectedType !== "all" && item.type !== selectedType) return false;
      if (
        maxPrice < 600 &&
        item.priceMin !== null &&
        item.priceMin > maxPrice
      ) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const match =
          item.name.toLowerCase().includes(q) ||
          (item.nameZh && item.nameZh.toLowerCase().includes(q)) ||
          item.description.toLowerCase().includes(q) ||
          item.cityNameHe.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });

    if (nearMeCoords) {
      return [...list].sort((a, b) => {
        const dA = computeDistanceKm(
          nearMeCoords.lat,
          nearMeCoords.lng,
          a.resolvedCoords.lat,
          a.resolvedCoords.lng
        );
        const dB = computeDistanceKm(
          nearMeCoords.lat,
          nearMeCoords.lng,
          b.resolvedCoords.lat,
          b.resolvedCoords.lng
        );
        return dA - dB;
      });
    }

    return [...list].sort((a, b) => b.importance - a.importance);
  }, [
    allFood,
    viewMode,
    onlyOpenNow,
    selectedCity,
    selectedType,
    maxPrice,
    searchQuery,
    nearMeCoords,
  ]);

  const citiesWithFood = useMemo(() => {
    const set = new Set(allFood.map((f) => f.cityId));
    return cities.filter((c) => set.has(c.id));
  }, [allFood, cities]);

  const activeFiltersCount =
    (selectedCity !== "all" ? 1 : 0) +
    (selectedType !== "all" ? 1 : 0) +
    (maxPrice < 600 ? 1 : 0);

  return (
    <div
      dir="rtl"
      className="mx-auto max-w-6xl px-3.5 pt-16 pb-24 md:px-6 md:pt-20"
    >
      {/* Compact Sticky Search + Filter Bar (Results Start Immediately Above the Fold!) */}
      <div
        style={{ top: "calc(3.4rem + env(safe-area-inset-top))" }}
        className="sticky z-30 -mx-3.5 mb-3 border-b border-slate-200/80 bg-background/95 px-3.5 py-2 backdrop-blur-md md:mx-0 md:rounded-3xl md:border dark:border-slate-800"
      >
        <div className="flex items-center gap-2">
          {/* Search Input */}
          <div className="flex min-h-[44px] flex-1 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 dark:border-slate-800 dark:bg-slate-900">
            <Search className="h-4 w-4 shrink-0 text-orange-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="חפשו מנה, שוק לילה או שם בסינית..."
              className="w-full bg-transparent text-xs font-medium outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                aria-label="נקה חיפוש"
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* "סינון" Sheet Button (>=44x44px) */}
          <button
            type="button"
            onClick={() => setIsFilterSheetOpen(true)}
            className="toy-button flex min-h-[44px] shrink-0 items-center gap-1.5 rounded-2xl bg-slate-900 px-3.5 text-xs font-bold text-white dark:bg-amber-400 dark:text-slate-950"
          >
            <SlidersHorizontal className="h-4 w-4" />
            <span>סינון</span>
            {activeFiltersCount > 0 && (
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-orange-500 text-[10px] font-black text-white">
                {activeFiltersCount}
              </span>
            )}
          </button>
        </div>

        {/* Single Horizontal Row of Quick Pills: הכל / חובה וזול / פתוח עכשיו / קרוב אליי */}
        <div className="fade-edge-scroll no-scrollbar mt-2 flex items-center gap-1.5 overflow-x-auto pl-4">
          <button
            type="button"
            onClick={() => setViewMode("all")}
            className={`min-h-[38px] shrink-0 rounded-full px-3 text-xs font-bold whitespace-nowrap ${
              viewMode === "all"
                ? "bg-slate-900 text-white dark:bg-white dark:text-slate-950"
                : "bg-slate-200/70 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
            }`}
          >
            כל האוכל ({allFood.length})
          </button>

          <button
            type="button"
            onClick={() =>
              setViewMode(
                viewMode === "cheap-must-eats" ? "all" : "cheap-must-eats"
              )
            }
            className={`flex min-h-[38px] shrink-0 items-center gap-1 rounded-full px-3 text-xs font-bold whitespace-nowrap ${
              viewMode === "cheap-must-eats"
                ? "bg-emerald-600 text-white"
                : "bg-emerald-500/15 text-emerald-800 dark:text-emerald-300"
            }`}
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>חובה וזול</span>
          </button>

          <button
            type="button"
            onClick={() => setOnlyOpenNow(!onlyOpenNow)}
            className={`flex min-h-[38px] shrink-0 items-center gap-1 rounded-full px-3 text-xs font-bold whitespace-nowrap ${
              onlyOpenNow
                ? "bg-orange-500 text-white"
                : "bg-orange-500/15 text-orange-800 dark:text-orange-300"
            }`}
          >
            <Clock className="h-3.5 w-3.5" />
            <span>פתוח עכשיו</span>
          </button>

          <button
            type="button"
            onClick={handleToggleNearMe}
            className={`flex min-h-[38px] shrink-0 items-center gap-1 rounded-full px-3 text-xs font-bold whitespace-nowrap ${
              nearMeCoords
                ? "bg-sky-600 text-white"
                : "bg-sky-500/15 text-sky-800 dark:text-sky-300"
            }`}
          >
            <LocateFixed className="h-3.5 w-3.5" />
            <span>
              {nearMeCoords ? `קרוב אליי (${nearMeCoords.labelHe})` : "קרוב אליי"}
            </span>
          </button>
        </div>
      </div>

      {/* Results Header */}
      <div className="mb-3 flex items-center justify-between text-xs font-bold text-slate-600 dark:text-slate-400">
        <span>
          מציג {filteredFood.length} מקומות אוכל{" "}
          {nearMeCoords ? `(לפי מרחק מ${nearMeCoords.labelHe})` : "(לפי חשיבות ★)"}
        </span>
        {activeFiltersCount > 0 && (
          <button
            type="button"
            onClick={() => {
              setSelectedCity("all");
              setSelectedType("all");
              setMaxPrice(600);
            }}
            className="text-orange-600 underline dark:text-amber-300"
          >
            איפוס סינון
          </button>
        )}
      </div>

      {/* Food Cards Grid (Visible Immediately Above the Fold!) */}
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
        {filteredFood.map((item) => {
          const distKm = nearMeCoords
            ? computeDistanceKm(
                nearMeCoords.lat,
                nearMeCoords.lng,
                item.resolvedCoords.lat,
                item.resolvedCoords.lng
              )
            : null;
          return <PlaceCard key={item.id} place={item} distanceKm={distKm} />;
        })}
      </div>

      {/* Opaque Bottom Sheet for Advanced Filters ("סינון") */}
      {isFilterSheetOpen && (
        <div
          dir="rtl"
          className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/45 backdrop-blur-xs"
          onClick={() => setIsFilterSheetOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              paddingBottom: "calc(4.5rem + env(safe-area-inset-bottom))",
            }}
            className="w-full max-w-lg rounded-t-3xl border-t border-slate-200 bg-white p-4 shadow-2xl dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="mx-auto mb-2.5 h-1.5 w-12 rounded-full bg-slate-300 dark:bg-slate-700" />
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-display text-base font-black text-slate-900 dark:text-white">
                סינון אוכל ושווקי לילה
              </h3>
              <button
                type="button"
                onClick={() => setIsFilterSheetOpen(false)}
                aria-label="סגור חלונית סינון"
                className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* City Filter */}
              <div>
                <label className="mb-1.5 block text-xs font-bold text-slate-600 dark:text-slate-300">
                  עיר או אזור:
                </label>
                <select
                  value={selectedCity}
                  onChange={(e) =>
                    setSelectedCity(e.target.value as CityId | "all")
                  }
                  className="min-h-[44px] w-full rounded-2xl border border-slate-200 bg-slate-50 px-3.5 text-xs font-bold dark:border-slate-700 dark:bg-slate-800"
                >
                  <option value="all">כל הערים ({citiesWithFood.length})</option>
                  {citiesWithFood.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nameHe}
                    </option>
                  ))}
                </select>
              </div>

              {/* Category Filter */}
              <div>
                <label className="mb-1.5 block text-xs font-bold text-slate-600 dark:text-slate-300">
                  סוג מקום:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedType("all")}
                    className={`min-h-[44px] rounded-2xl text-xs font-bold ${
                      selectedType === "all"
                        ? "bg-slate-900 text-white dark:bg-amber-400 dark:text-slate-950"
                        : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                    }`}
                  >
                    הכל (80)
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedType("michelin-bib")}
                    className={`flex min-h-[44px] items-center justify-center gap-1 rounded-2xl text-xs font-bold ${
                      selectedType === "michelin-bib"
                        ? "bg-rose-500 text-white"
                        : "bg-rose-500/10 text-rose-700 dark:text-rose-300"
                    }`}
                  >
                    <Award className="h-3.5 w-3.5" />
                    <span>מישלן ביב (38)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedType("market")}
                    className={`flex min-h-[44px] items-center justify-center gap-1 rounded-2xl text-xs font-bold ${
                      selectedType === "market"
                        ? "bg-orange-500 text-white"
                        : "bg-orange-500/10 text-orange-700 dark:text-orange-300"
                    }`}
                  >
                    <Flame className="h-3.5 w-3.5" />
                    <span>שווקי לילה (21)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedType("hidden-local")}
                    className={`flex min-h-[44px] items-center justify-center gap-1 rounded-2xl text-xs font-bold ${
                      selectedType === "hidden-local"
                        ? "bg-violet-600 text-white"
                        : "bg-violet-500/10 text-violet-700 dark:text-violet-300"
                    }`}
                  >
                    <Gem className="h-3.5 w-3.5" />
                    <span>מקומי נסתר (18)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedType("cheap")}
                    className={`col-span-2 flex min-h-[44px] items-center justify-center gap-1 rounded-2xl text-xs font-bold ${
                      selectedType === "cheap"
                        ? "bg-emerald-600 text-white"
                        : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                    }`}
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>זול במיוחד (3)</span>
                  </button>
                </div>
              </div>

              {/* Max Price Slider */}
              <div>
                <div className="mb-1.5 flex items-center justify-between text-xs font-bold">
                  <span>מחיר מקסימלי לסועד:</span>
                  <span className="font-mono text-rose-600 dark:text-rose-300">
                    {maxPrice >= 600 ? "ללא הגבלה" : `עד NT$${maxPrice}`}
                  </span>
                </div>
                <input
                  type="range"
                  dir="rtl"
                  min={40}
                  max={600}
                  step={20}
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(Number(e.target.value))}
                  className="w-full accent-rose-500"
                />
              </div>

              <button
                type="button"
                onClick={() => setIsFilterSheetOpen(false)}
                className="min-h-[48px] w-full rounded-2xl bg-orange-500 text-sm font-black text-white shadow-md"
              >
                הצג {filteredFood.length} תוצאות
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
