"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import {
  BedDouble,
  Calendar,
  Sparkles,
  Utensils,
  X,
} from "lucide-react";
import { getCityBundle } from "@/lib/data/selectors";
import { getCityImages } from "@/lib/data/placeImages";
import { tripActions, useTripStore } from "@/lib/store/useTripStore";
import { BottomSheet } from "./BottomSheet";
import {
  CityDrawerTabsContent,
  type DrawerTab,
} from "./drawer/CityDrawerTabsContent";

export function CityDrawer() {
  const store = useTripStore();
  const [activeTab, setActiveTab] = useState<DrawerTab>("attractions");
  const [loadedCityId, setLoadedCityId] = useState<string | null>(
    store.selectedCityId
  );

  useEffect(() => {
    if (!store.selectedCityId) return;
    const targetCity = store.selectedCityId;
    const t = window.setTimeout(() => setLoadedCityId(targetCity), 120);
    return () => window.clearTimeout(t);
  }, [store.selectedCityId]);

  const isSheetSkeleton =
    Boolean(store.selectedCityId) && loadedCityId !== store.selectedCityId;

  const bundle = useMemo(() => {
    if (!store.selectedCityId || store.isCityZoomMapOpen) return null;
    return getCityBundle(store.selectedCityId);
  }, [store.selectedCityId, store.isCityZoomMapOpen]);

  if (!bundle) return null;

  const { city, attractions, food, hotels, daysHere } = bundle;
  const cityImages = getCityImages(city.id);

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
                <Image
                  src={img.src}
                  alt={`${city.nameHe} ${idx + 1}`}
                  fill
                  sizes="256px"
                  className="object-cover transition-transform duration-300 hover:scale-105"
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
          <CityDrawerTabsContent activeTab={activeTab} bundle={bundle} />
        )}
      </div>
    </BottomSheet>
  );
}
