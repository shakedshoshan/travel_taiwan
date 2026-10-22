"use client";

import { Award, Flame, Gem, Sparkles, X } from "lucide-react";
import type { City, CityId, FoodType } from "@/data/types";

interface FoodFilterSheetProps {
  isOpen: boolean;
  onClose: () => void;
  citiesWithFood: City[];
  selectedCity: CityId | "all";
  onChangeCity: (city: CityId | "all") => void;
  selectedType: FoodType | "all";
  onChangeType: (type: FoodType | "all") => void;
  maxPrice: number;
  onChangeMaxPrice: (price: number) => void;
  resultsCount: number;
}

export function FoodFilterSheet({
  isOpen,
  onClose,
  citiesWithFood,
  selectedCity,
  onChangeCity,
  selectedType,
  onChangeType,
  maxPrice,
  onChangeMaxPrice,
  resultsCount,
}: FoodFilterSheetProps) {
  if (!isOpen) return null;

  return (
    <div
      dir="rtl"
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/45 backdrop-blur-xs"
      onClick={onClose}
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
            onClick={onClose}
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
                onChangeCity(e.target.value as CityId | "all")
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
                onClick={() => onChangeType("all")}
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
                onClick={() => onChangeType("michelin-bib")}
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
                onClick={() => onChangeType("market")}
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
                onClick={() => onChangeType("hidden-local")}
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
                onClick={() => onChangeType("cheap")}
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
              onChange={(e) => onChangeMaxPrice(Number(e.target.value))}
              className="w-full accent-rose-500"
            />
          </div>

          <button
            type="button"
            onClick={onClose}
            className="min-h-[48px] w-full rounded-2xl bg-orange-500 text-sm font-black text-white shadow-md"
          >
            הצג {resultsCount} תוצאות
          </button>
        </div>
      </div>
    </div>
  );
}
