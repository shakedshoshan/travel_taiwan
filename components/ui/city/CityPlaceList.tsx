"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { placeImportance, placesForCityCategory } from "@/lib/data/cityCategory";
import type { CityBundle, EnrichedPlace } from "@/lib/data/selectors";
import {
  getVisiblePlaces,
  subscribeVisiblePlaces,
} from "@/components/3d/markers/markerFrame";
import { tripActions, useTripStore } from "@/lib/store/useTripStore";

function useVisiblePlaceIds() {
  return useSyncExternalStore(
    subscribeVisiblePlaces,
    getVisiblePlaces,
    getVisiblePlaces
  );
}

export function CityPlaceList({ bundle }: { bundle: CityBundle }) {
  const store = useTripStore();
  const visibleIds = useVisiblePlaceIds();
  const [inViewOnly, setInViewOnly] = useState(false);
  const parentRef = useRef<HTMLDivElement>(null);
  const places = placesForCityCategory(bundle, store.cityCategory);
  const visible = new Set(visibleIds);
  const rows = inViewOnly
    ? places.filter((place) => visible.has(place.id))
    : places;

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 56,
    overscan: 8,
  });

  useEffect(() => {
    const selected = rows.findIndex((place) => place.id === store.focusedPlaceId);
    if (selected >= 0) virtualizer.scrollToIndex(selected, { align: "center" });
    // Only jump when the focused place changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store.focusedPlaceId]);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex items-center justify-between px-3 pb-1">
        <span className="text-[11px] font-bold text-slate-500">{rows.length} מקומות</span>
        <button
          type="button"
          onClick={() => setInViewOnly((value) => !value)}
          className={`flex h-11 items-center rounded-full px-3 text-xs font-black ${
            inViewOnly
              ? "bg-sky-600 text-white"
              : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-100"
          }`}
        >
          במפה
        </button>
      </div>
      <div
        ref={parentRef}
        className="sheet-scroll min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-2 pb-2"
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        {rows.length === 0 ? (
          <p className="px-2 py-6 text-center text-sm font-bold text-slate-500">
            אין מקומות בקטגוריה הזו
          </p>
        ) : (
          <div
            className="relative w-full"
            style={{ height: virtualizer.getTotalSize() }}
          >
            {virtualizer.getVirtualItems().map((item) => {
              const place = rows[item.index] as EnrichedPlace;
              const selected = place.id === store.focusedPlaceId;
              return (
                <button
                  key={place.id}
                  type="button"
                  onClick={() => tripActions.focusPlace(place.id, place.cityId)}
                  className={`absolute right-0 left-0 flex h-14 items-center gap-2 rounded-2xl px-3 text-right ${
                    selected
                      ? "bg-amber-100 dark:bg-amber-400/20"
                      : "bg-transparent"
                  }`}
                  style={{ transform: `translateY(${item.start}px)` }}
                >
                  <span className="min-w-0 flex-1 truncate text-sm font-black">
                    {place.name}
                  </span>
                  <span className="shrink-0 text-xs font-black text-amber-600">
                    ★ {placeImportance(place)}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
