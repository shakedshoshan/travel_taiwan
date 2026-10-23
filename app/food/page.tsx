"use client";

import { useMemo, useState } from "react";
import {
  Clock,
  LocateFixed,
  Search,
  SlidersHorizontal,
  Sparkles,
  X,
} from "lucide-react";
import {
  getAllCities,
  getCityById,
  getFoodItems,
  getTimelineDays,
} from "@/lib/data/selectors";
import {
  checkIsOpenNow,
  computeDistanceKm,
  resolveNearMeCoordinates,
} from "@/lib/data/foodAndPlaceMeta";
import { PlaceCard } from "@/components/ui/PlaceCard";
import { FoodFilterSheet } from "@/components/ui/food/FoodFilterSheet";
import { BackToTop, CityJumpBar } from "@/components/ui/CityJumpBar";
import { uniqueImagesForPlaces } from "@/lib/data/placeImages";
import { useTripStore } from "@/lib/store/useTripStore";
import type { CityId, FoodType } from "@/data/types";

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
  const [nearMeDenied, setNearMeDenied] = useState(false);
  const [selectedCity, setSelectedCity] = useState<CityId | "all">("all");
  const [selectedType, setSelectedType] = useState<FoodType | "all">("all");
  const [maxPrice, setMaxPrice] = useState<number>(600);
  const [searchQuery, setSearchQuery] = useState("");
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);

  const handleToggleNearMe = () => {
    if (nearMeCoords || nearMeDenied) {
      setNearMeCoords(null);
      setNearMeDenied(false);
      return;
    }

    const fallbackCity = getCityById(
      store.selectedCityId ?? currentDay.cityId
    );
    resolveNearMeCoordinates(
      fallbackCity,
      (coords) => {
        setNearMeDenied(false);
        setNearMeCoords(coords);
      },
      () => {
        setNearMeCoords(null);
        setNearMeDenied(true);
      }
    );
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

  const foodImages = useMemo(
    () => uniqueImagesForPlaces(filteredFood),
    [filteredFood]
  );

  const citiesWithFood = useMemo(() => {
    const set = new Set(allFood.map((f) => f.cityId));
    return cities.filter((c) => set.has(c.id));
  }, [allFood, cities]);

  const jumpItems = useMemo(() => {
    const present = new Set(filteredFood.map((item) => item.cityId));
    return citiesWithFood
      .filter((city) => present.has(city.id))
      .map((city) => ({ id: `food-${city.id}`, label: city.nameHe }));
  }, [citiesWithFood, filteredFood]);

  const activeFiltersCount =
    (selectedCity !== "all" ? 1 : 0) +
    (selectedType !== "all" ? 1 : 0) +
    (maxPrice < 600 ? 1 : 0);

  return (
    <div
      dir="rtl"
      className="mx-auto max-w-6xl px-3.5 pt-16 pb-24 md:px-6 md:pt-20"
    >
      {/* Compact Sticky Search + Filter Bar */}
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
              className="min-h-11 w-full bg-transparent text-base font-medium outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                aria-label="נקה חיפוש"
                className="flex min-h-11 min-w-11 items-center justify-center text-slate-600 hover:text-slate-900"
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
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-orange-500 text-xs font-black text-white">
                {activeFiltersCount}
              </span>
            )}
          </button>
        </div>

        {/* Single Horizontal Row of Quick Pills */}
        <div className="fade-edge-scroll no-scrollbar mt-2 flex snap-x snap-mandatory items-center gap-1.5 overflow-x-auto pl-4">
          <button
            type="button"
            onClick={() => setViewMode("all")}
            className={`flex min-h-11 shrink-0 snap-start items-center rounded-full px-3 text-xs font-bold whitespace-nowrap ${
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
            className={`flex min-h-11 shrink-0 snap-start items-center gap-1 rounded-full px-3 text-xs font-bold whitespace-nowrap ${
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
            className={`flex min-h-11 shrink-0 snap-start items-center gap-1 rounded-full px-3 text-xs font-bold whitespace-nowrap ${
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
            className={`flex min-h-11 shrink-0 snap-start items-center gap-1 rounded-full px-3 text-xs font-bold whitespace-nowrap ${
              nearMeCoords
                ? "bg-sky-600 text-white"
                : "bg-sky-500/15 text-sky-800 dark:text-sky-300"
            }`}
          >
            <LocateFixed className="h-3.5 w-3.5" />
            <span>
              {nearMeDenied
                ? "הגישה למיקום נדחתה"
                : nearMeCoords
                  ? `קרוב אליי (${nearMeCoords.labelHe})`
                  : "קרוב אליי"}
            </span>
          </button>
        </div>
      </div>

      {jumpItems.length > 1 && (
        <div className="sticky top-[7.5rem] z-20 -mx-3.5 mb-3 bg-background/95 px-3.5 py-1">
          <CityJumpBar items={jumpItems} />
        </div>
      )}

      {/* Results Header */}
      <div className="mb-3 flex items-center justify-between text-xs font-bold text-slate-600 dark:text-slate-400">
        <span>
          מציג {filteredFood.length} מקומות אוכל{" "}
          {nearMeDenied
            ? "· הגישה למיקום נדחתה"
            : nearMeCoords
              ? `(לפי מרחק מ${nearMeCoords.labelHe})`
              : "(לפי חשיבות ★)"}
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

      {/* Food Cards Grid */}
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
        {filteredFood.map((item, index) => {
          const distKm = nearMeCoords
            ? computeDistanceKm(
                nearMeCoords.lat,
                nearMeCoords.lng,
                item.resolvedCoords.lat,
                item.resolvedCoords.lng
              )
            : null;
          const isCityStart =
            filteredFood.findIndex((entry) => entry.cityId === item.cityId) ===
            index;
          return (
            <div
              key={item.id}
              id={isCityStart ? `food-${item.cityId}` : undefined}
              className={isCityStart ? "scroll-mt-40" : undefined}
            >
              <PlaceCard
                place={item}
                distanceKm={distKm}
                image={foodImages.get(item.id) ?? null}
              />
            </div>
          );
        })}
      </div>
      <BackToTop />

      <FoodFilterSheet
        isOpen={isFilterSheetOpen}
        onClose={() => setIsFilterSheetOpen(false)}
        citiesWithFood={citiesWithFood}
        selectedCity={selectedCity}
        onChangeCity={setSelectedCity}
        selectedType={selectedType}
        onChangeType={setSelectedType}
        maxPrice={maxPrice}
        onChangeMaxPrice={setMaxPrice}
        resultsCount={filteredFood.length}
      />
    </div>
  );
}
