"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
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

function getSheetScrollEl(from: HTMLElement | null): HTMLElement | null {
  return from?.closest<HTMLElement>("[data-sheet-scroll]") ?? null;
}

export function CityPlaceList({ bundle }: { bundle: CityBundle }) {
  const store = useTripStore();
  const visibleIds = useVisiblePlaceIds();
  const [inViewOnly, setInViewOnly] = useState(false);
  const listRootRef = useRef<HTMLDivElement>(null);
  const places = placesForCityCategory(bundle, store.cityCategory);
  const visible = new Set(visibleIds);
  const rows = inViewOnly
    ? places.filter((place) => visible.has(place.id))
    : places;

  const getScrollElement = useCallback(
    () => getSheetScrollEl(listRootRef.current),
    []
  );

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement,
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
    <div ref={listRootRef} className="flex min-h-0 flex-1 flex-col">
      <div className="flex items-center justify-between px-3 pb-2 pt-1">
        <span className="text-xs font-bold text-slate-500">{rows.length} מקומות</span>
        <button
          type="button"
          onClick={() => setInViewOnly((value) => !value)}
          className={`flex min-h-11 items-center rounded-full px-3 text-xs font-black active:scale-[0.97] ${
            inViewOnly
              ? "bg-sky-600 text-white"
              : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-100"
          }`}
        >
          במפה
        </button>
      </div>
      {rows.length === 0 ? (
        <p className="px-3 py-8 text-center text-sm font-bold text-slate-500">
          אין מקומות בקטגוריה הזו — נסו קטגוריה אחרת למעלה
        </p>
      ) : (
        <div
          className="relative w-full px-2 pb-3"
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
                className={`absolute right-2 left-2 flex min-h-11 items-center gap-2 rounded-2xl px-3 text-right active:scale-[0.99] ${
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
  );
}
