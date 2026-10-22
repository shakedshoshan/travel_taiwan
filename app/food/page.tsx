"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  UtensilsCrossed,
  Flame,
  Award,
  Gem,
  Sparkles,
  Heart,
  CheckCircle2,
  ExternalLink,
  AlertCircle,
  Search,
} from "lucide-react";
import {
  buildGoogleMapsUrl,
  FOOD_TYPE_META,
  getAllCities,
  getFoodItems,
} from "@/lib/data/selectors";
import { tripActions, useTripStore } from "@/lib/store/useTripStore";
import type { CityId, FoodType } from "@/data/types";

export default function FoodPage() {
  const store = useTripStore();
  const allFood = getFoodItems();
  const cities = getAllCities();

  const [viewMode, setViewMode] = useState<"all" | "cheap-must-eats">("all");
  const [selectedCity, setSelectedCity] = useState<CityId | "all">("all");
  const [selectedType, setSelectedType] = useState<FoodType | "all">("all");
  const [maxPrice, setMaxPrice] = useState<number>(600);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredFood = useMemo(() => {
    return allFood
      .filter((item) => {
        if (viewMode === "cheap-must-eats") {
          // Cheap must-eats: explicit 'cheap' type OR (high importance >= 4 and priceMin <= 120)
          const isCheapGem =
            item.type === "cheap" ||
            (item.importance >= 4 &&
              item.priceMin !== null &&
              item.priceMin <= 120);
          if (!isCheapGem) return false;
        }
        if (selectedCity !== "all" && item.cityId !== selectedCity)
          return false;
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
      })
      .sort((a, b) => b.importance - a.importance);
  }, [allFood, viewMode, selectedCity, selectedType, maxPrice, searchQuery]);

  // Cities that have at least one food item
  const citiesWithFood = useMemo(() => {
    const set = new Set(allFood.map((f) => f.cityId));
    return cities.filter((c) => set.has(c.id));
  }, [allFood, cities]);

  return (
    <div
      dir="rtl"
      className="mx-auto max-w-7xl px-4 pt-28 pb-20 md:px-6 md:pt-24"
    >
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-500/15 px-3 py-1 text-xs font-extrabold text-rose-600 dark:text-rose-300">
            <UtensilsCrossed className="h-3.5 w-3.5" />
            מדריך האוכל של טייוואן • 80 המלצות מדויקות
          </span>
          <h1 className="mt-2 font-display text-3xl font-black tracking-tight text-slate-900 md:text-4xl dark:text-white">
            אוכל רחוב, מישלן ביב ושווקי לילה
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            38 מישלן ביב • 21 שווקי לילה • 18 מקומיים נסתרים • 3 מציאות זולות במיוחד
          </p>
        </div>

        {/* Toggle between All Food and "Cheap Must-Eats" */}
        <div className="glass-panel flex items-center gap-1.5 rounded-2xl p-1.5">
          <button
            type="button"
            onClick={() => setViewMode("all")}
            className={`toy-button rounded-xl px-4 py-2 text-xs font-extrabold ${
              viewMode === "all"
                ? "bg-slate-900 text-white dark:bg-amber-400 dark:text-slate-950"
                : "text-slate-700 dark:text-slate-200"
            }`}
          >
            כל האוכל ({allFood.length})
          </button>
          <button
            type="button"
            onClick={() => setViewMode("cheap-must-eats")}
            className={`toy-button flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-extrabold ${
              viewMode === "cheap-must-eats"
                ? "bg-gradient-to-l from-emerald-500 to-teal-500 text-white shadow-md"
                : "text-emerald-700 dark:text-emerald-300"
            }`}
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>חובה וזול (Cheap Must-Eats)</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="glass-panel mb-6 space-y-4 rounded-3xl p-4 md:p-5">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {/* Search Input */}
          <div className="flex items-center gap-2 rounded-2xl border border-slate-900/10 bg-white/80 px-3.5 py-2 dark:border-white/10 dark:bg-slate-800/80">
            <Search className="h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="חפשו מנה, שוק לילה או שם בסינית..."
              className="w-full bg-transparent text-xs font-medium outline-none"
            />
          </div>

          {/* City Select */}
          <select
            value={selectedCity}
            onChange={(e) =>
              setSelectedCity(e.target.value as CityId | "all")
            }
            className="rounded-2xl border border-slate-900/10 bg-white/80 px-3.5 py-2 text-xs font-bold dark:border-white/10 dark:bg-slate-800/80"
          >
            <option value="all">כל הערים ({citiesWithFood.length})</option>
            {citiesWithFood.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nameHe} ({c.nameEn})
              </option>
            ))}
          </select>

          {/* Max Price Slider */}
          <div className="flex items-center justify-between gap-3 rounded-2xl border border-slate-900/10 bg-white/80 px-3.5 py-2 text-xs dark:border-white/10 dark:bg-slate-800/80">
            <span className="font-bold">מחיר מקסימלי:</span>
            <input
              type="range"
              min={40}
              max={600}
              step={20}
              value={maxPrice}
              onChange={(e) => setMaxPrice(Number(e.target.value))}
              className="w-28 accent-rose-500"
            />
            <span className="font-mono font-bold text-rose-600 dark:text-rose-300">
              {maxPrice >= 600 ? "הכל" : `עד NT$${maxPrice}`}
            </span>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setSelectedType("all")}
            className={`rounded-xl px-3 py-1.5 text-xs font-bold ${
              selectedType === "all"
                ? "bg-slate-900 text-white dark:bg-white dark:text-slate-950"
                : "bg-slate-900/5 text-slate-700 dark:bg-white/10 dark:text-slate-300"
            }`}
          >
            הכל (80)
          </button>
          <button
            type="button"
            onClick={() => setSelectedType("michelin-bib")}
            className={`flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-bold ${
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
            className={`flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-bold ${
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
            className={`flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-bold ${
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
            className={`flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-bold ${
              selectedType === "cheap"
                ? "bg-emerald-600 text-white"
                : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
            }`}
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>זול (3)</span>
          </button>
        </div>
      </div>

      {/* Results Count */}
      <div className="mb-4 text-xs font-bold text-slate-500 dark:text-slate-400">
        מציג {filteredFood.length} מקומות אוכל (ממוינים לפי חשיבות ★)
      </div>

      {/* Food Cards Grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredFood.map((item) => {
          const meta = FOOD_TYPE_META[item.type];
          const isFav = store.favorites.includes(item.id);
          const isDone = store.donePlaces.includes(item.id);

          return (
            <div
              key={item.id}
              className="glass-panel flex flex-col justify-between rounded-3xl p-5 transition-transform hover:-translate-y-1"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span
                      className={`rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${meta.bgClass}`}
                    >
                      {meta.labelHe}
                    </span>
                    <span className="rounded-full bg-slate-900/5 px-2.5 py-0.5 text-[11px] font-bold text-slate-700 dark:bg-white/10 dark:text-slate-300">
                      {item.cityNameHe}
                    </span>
                    <span className="text-xs font-bold text-amber-500">
                      {"★".repeat(item.importance)}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => tripActions.toggleFavorite(item.id)}
                      className={`rounded-xl p-1.5 ${
                        isFav ? "text-rose-500" : "text-slate-400"
                      }`}
                    >
                      <Heart
                        className={`h-4 w-4 ${isFav ? "fill-current" : ""}`}
                      />
                    </button>
                    <button
                      type="button"
                      onClick={() => tripActions.toggleDone(item.id)}
                      className={`rounded-xl p-1.5 ${
                        isDone ? "text-emerald-600" : "text-slate-400"
                      }`}
                    >
                      <CheckCircle2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <Link
                  href={`/place/${item.id}`}
                  className="mt-2 block font-display text-lg font-extrabold text-slate-900 hover:text-orange-600 dark:text-white dark:hover:text-amber-300"
                >
                  {item.name}
                </Link>

                <p className="mt-2 text-xs leading-relaxed text-slate-700 dark:text-slate-300">
                  {item.description}
                </p>
              </div>

              <div className="mt-4 space-y-2.5 border-t border-slate-900/10 pt-3 dark:border-white/10">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  {item.priceText && (
                    <span className="rounded-lg bg-emerald-500/15 px-2.5 py-0.5 font-mono font-bold text-emerald-800 dark:text-emerald-300">
                      {item.priceText}
                    </span>
                  )}
                  {!item.priceVerified && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold text-amber-800 dark:text-amber-300">
                      <AlertCircle className="h-3 w-3" />
                      מחיר לא מאומת
                    </span>
                  )}
                </div>

                {item.hours && (
                  <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-600 dark:text-slate-400">
                    <span className="font-bold">שעות פתיחה:</span>
                    <span>{item.hours}</span>
                    {!item.hoursVerified && (
                      <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold text-amber-800 dark:text-amber-300">
                        לא מאומת
                      </span>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-between pt-1 text-xs">
                  <Link
                    href={`/place/${item.id}`}
                    className="font-bold text-orange-600 hover:underline dark:text-amber-300"
                  >
                    פרטים ומיקום במפה ←
                  </Link>
                  <a
                    href={buildGoogleMapsUrl(item)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-slate-500 hover:text-slate-900 dark:text-slate-400"
                  >
                    <span>Google Maps</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
