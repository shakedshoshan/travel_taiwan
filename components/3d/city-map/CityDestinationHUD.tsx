"use client";

import { useMemo, useState } from "react";
import {
  ArrowRight,
  BedDouble,
  Compass,
  Eye,
  EyeOff,
  Navigation,
  Sparkles,
  Star,
  Trees,
  Utensils,
} from "lucide-react";
import { getAllCities, getCityBundle } from "@/lib/data/selectors";
import { tripActions, useTripStore } from "@/lib/store/useTripStore";
import type { CityId } from "@/data/types";
import {
  computeCityMapNodes,
  matchesCityCategoryFilter,
  type CityCategoryFilter,
} from "./cityMapLayout";
import { FocusedDestinationCard } from "./FocusedDestinationCard";

interface CityDestinationHUDProps {
  cityId: CityId;
  showAllLabels: boolean;
  onToggleAllLabels: () => void;
  categoryFilter: CityCategoryFilter;
  onChangeCategoryFilter: (filter: CityCategoryFilter) => void;
}

export function CityDestinationHUD({
  cityId,
  showAllLabels,
  onToggleAllLabels,
  categoryFilter,
  onChangeCategoryFilter,
}: CityDestinationHUDProps) {
  const store = useTripStore();
  const [showQuickDirectory, setShowQuickDirectory] = useState(true);
  const cities = getAllCities();
  const bundle = useMemo(() => getCityBundle(cityId), [cityId]);
  const allNodes = useMemo(() => computeCityMapNodes(cityId), [cityId]);

  const focusedNode = useMemo(
    () => allNodes.find((n) => n.place.id === store.focusedPlaceId) ?? null,
    [allNodes, store.focusedPlaceId]
  );

  const filteredDirectoryNodes = useMemo(
    () =>
      allNodes.filter((n) => matchesCityCategoryFilter(n, categoryFilter)),
    [allNodes, categoryFilter]
  );

  return (
    <div
      dir="rtl"
      className="pointer-events-none fixed inset-0 z-25 flex flex-col justify-between p-3 md:p-6"
    >
      {/* Top Destination Explorer Bar */}
      <div className="flex flex-wrap items-start justify-between gap-2 pt-14 md:pt-12">
        <div className="glass-panel pointer-events-auto flex flex-wrap items-center gap-2 rounded-3xl border border-amber-400/40 p-2.5 shadow-2xl">
          <button
            type="button"
            onClick={() => tripActions.exitCityZoomMap()}
            className="toy-button flex items-center gap-1.5 rounded-2xl bg-orange-500 px-3.5 py-2 text-xs font-black text-white shadow-md hover:bg-orange-600"
          >
            <ArrowRight className="h-4 w-4" />
            <span>חזרה למפת טייוואן המלאה</span>
          </button>

          <div className="px-2">
            <div className="flex items-center gap-2">
              <Compass className="h-4 w-4 text-amber-500" />
              <span className="font-display text-base font-black text-slate-900 dark:text-white">
                מפת יעד 3D: {bundle.city.nameHe} ({bundle.city.nameEn})
              </span>
            </div>
            <div className="text-[11px] text-slate-600 dark:text-slate-300">
              כל המלונות, המסעדות, שווקי הלילה והאטרקציות פרוסים בתלת-ממד
            </div>
          </div>

          <select
            value={cityId}
            onChange={(e) =>
              tripActions.enterCityZoomMap(e.target.value as CityId)
            }
            aria-label="החלף עיר במפת יעד"
            className="rounded-2xl border border-slate-900/15 bg-white/90 px-3 py-1.5 text-xs font-bold text-slate-900 dark:border-white/15 dark:bg-slate-900 dark:text-white"
          >
            {cities.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nameHe} ({c.nameEn}) {c.onRoute ? `• ${c.days} ימים` : ""}
              </option>
            ))}
          </select>
        </div>

        {/* Category Filter Pills & Show All Labels Toggle */}
        <div className="glass-panel pointer-events-auto flex flex-wrap items-center gap-1.5 rounded-3xl p-2 shadow-xl">
          {(
            [
              ["all", `הכל (${allNodes.length})`, Sparkles],
              ["hotel", `מלונות (${bundle.hotels.length})`, BedDouble],
              ["food", `מסעדות ושווקים (${bundle.food.length})`, Utensils],
              ["attraction", `אטרקציות (${bundle.attractions.length})`, Star],
              [
                "nature",
                `טבע (${bundle.attractions.filter((a) => a.isNature).length})`,
                Trees,
              ],
            ] as const
          ).map(([val, label, Icon]) => (
            <button
              key={val}
              type="button"
              onClick={() => onChangeCategoryFilter(val)}
              className={`toy-button flex items-center gap-1.5 rounded-2xl px-3 py-1.5 text-xs font-extrabold transition-all ${
                categoryFilter === val
                  ? "bg-amber-400 text-slate-950 shadow-sm"
                  : "bg-slate-900/5 text-slate-700 hover:bg-slate-900/10 dark:bg-white/10 dark:text-slate-200"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{label}</span>
            </button>
          ))}

          <button
            type="button"
            onClick={onToggleAllLabels}
            className={`toy-button flex items-center gap-1.5 rounded-2xl border px-3 py-1.5 text-xs font-extrabold transition-all ${
              showAllLabels
                ? "border-emerald-400 bg-emerald-500 text-white"
                : "border-transparent bg-slate-900/5 text-slate-700 dark:bg-white/10 dark:text-slate-200"
            }`}
            title="הצג או הסתר תוויות שם מעל כל המקומות במפה"
          >
            {showAllLabels ? (
              <>
                <Eye className="h-3.5 w-3.5" />
                <span>כל השמות גלויים</span>
              </>
            ) : (
              <>
                <EyeOff className="h-3.5 w-3.5" />
                <span>הצג את כל השמות</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Middle / Bottom Area: Quick Place Directory + Focused Place Inspector Card */}
      <div className="mb-20 flex flex-col items-stretch justify-between gap-3 md:mb-16 md:flex-row md:items-end">
        {/* Right Side: Interactive Directory of All Places in Destination */}
        <div className="glass-panel pointer-events-auto flex max-h-[38vh] w-full flex-col rounded-3xl border border-white/25 p-3 shadow-2xl md:max-h-[52vh] md:w-88">
          <div className="flex items-center justify-between border-b border-slate-900/10 pb-2 dark:border-white/10">
            <div className="flex items-center gap-1.5 text-xs font-black text-slate-900 dark:text-white">
              <Navigation className="h-3.5 w-3.5 text-orange-500" />
              <span>
                נקודות במפת {bundle.city.nameHe} ({filteredDirectoryNodes.length})
              </span>
            </div>
            <button
              type="button"
              onClick={() => setShowQuickDirectory((p) => !p)}
              className="rounded-xl bg-slate-900/5 px-2 py-0.5 text-[11px] font-bold text-slate-600 dark:bg-white/10 dark:text-slate-300"
            >
              {showQuickDirectory ? "מזער" : "הרחב"}
            </button>
          </div>

          {showQuickDirectory && (
            <div className="mt-2 flex-1 space-y-1.5 overflow-y-auto pl-1">
              {filteredDirectoryNodes.map((node) => {
                const isSelected = store.focusedPlaceId === node.place.id;
                return (
                  <button
                    key={node.place.id}
                    type="button"
                    onClick={() =>
                      tripActions.focusPlace(node.place.id, cityId)
                    }
                    className={`flex w-full items-center justify-between gap-2 rounded-2xl border p-2 text-right text-xs transition-all ${
                      isSelected
                        ? "border-amber-400 bg-amber-400/20 font-bold shadow-sm"
                        : "border-slate-900/5 bg-white/70 hover:bg-white dark:border-white/5 dark:bg-slate-900/60 dark:hover:bg-slate-900"
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span
                          className="inline-block h-2.5 w-2.5 shrink-0 rounded-full"
                          style={{ backgroundColor: node.color }}
                        />
                        <span className="truncate font-bold text-slate-900 dark:text-white">
                          {node.place.name}
                        </span>
                      </div>
                      <div className="mt-0.5 flex items-center gap-2 text-[10px] text-slate-500 dark:text-slate-400">
                        <span>{node.badgeText}</span>
                        <span>•</span>
                        <span>~{node.approxDistanceKm} ק״מ מהמרכז</span>
                      </div>
                    </div>
                    <span className="shrink-0 text-[10px] font-bold text-amber-500">
                      {"★".repeat(node.importance)}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Left Side: Focused Place Inspector Card when a pin is clicked */}
        {focusedNode && (
          <FocusedDestinationCard
            focusedNode={focusedNode}
            cityNameHe={bundle.city.nameHe}
          />
        )}
      </div>
    </div>
  );
}
