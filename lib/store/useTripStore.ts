"use client";

import { useSyncExternalStore } from "react";
import type { CityId } from "@/data/types";
import {
  DEFAULT_STATE,
  STORAGE_KEY,
  type CameraCommandType,
  type LayerToggles,
  type MapDragMode,
  type SheetSnapPoint,
  type TripStoreState,
} from "./tripStoreTypes";

export type {
  CameraCommandType,
  LayerToggles,
  MapDragMode,
  SheetSnapPoint,
  TripStoreState,
};

let state: TripStoreState = DEFAULT_STATE;
let hydratedFromStorage = false;
const listeners = new Set<() => void>();

function emitChange() {
  for (const listener of listeners) {
    listener();
  }
}

function persistToStorage(next: TripStoreState) {
  if (typeof window === "undefined") return;
  try {
    const payload = {
      isNightMode: next.isNightMode,
    };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // Ignore storage quota errors
  }
}

function hydrateOnce() {
  if (hydratedFromStorage || typeof window === "undefined") return;
  hydratedFromStorage = true;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<TripStoreState>;
      state = {
        ...state,
        isNightMode:
          typeof parsed.isNightMode === "boolean"
            ? parsed.isNightMode
            : state.isNightMode,
      };
    }

    if (
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      state = { ...state, prefersReducedMotion: true };
    }
  } catch {
    // Ignore malformed localStorage
  }
}

function setState(
  updater:
    | Partial<TripStoreState>
    | ((prev: TripStoreState) => Partial<TripStoreState>),
  shouldPersist = false
) {
  hydrateOnce();
  const patch = typeof updater === "function" ? updater(state) : updater;
  state = { ...state, ...patch };
  if (shouldPersist) {
    persistToStorage(state);
  }
  emitChange();
}

export const tripActions = {
  hydrate() {
    const before = state;
    hydrateOnce();
    if (before !== state) {
      emitChange();
    }
  },

  toggleNightMode() {
    setState((prev) => ({ isNightMode: !prev.isNightMode }), true);
  },

  setNightMode(isNightMode: boolean) {
    setState({ isNightMode }, true);
  },

  selectCity(cityId: CityId | null, initialSnap: SheetSnapPoint = "half") {
    setState((prev) => ({
      selectedCityId: cityId,
      focusedPlaceId: null,
      sheetSnap: cityId === null ? "closed" : initialSnap,
      isTimelineExpanded: false,
      isLayersSheetOpen: false,
      isCityZoomMapOpen: cityId === null ? false : prev.isCityZoomMapOpen,
    }));
  },

  setSheetSnap(sheetSnap: SheetSnapPoint) {
    setState((prev) => ({
      sheetSnap,
      selectedCityId: sheetSnap === "closed" ? null : prev.selectedCityId,
      focusedPlaceId: sheetSnap === "closed" ? null : prev.focusedPlaceId,
    }));
  },

  setTimelineExpanded(isTimelineExpanded: boolean) {
    setState({
      isTimelineExpanded,
      isLayersSheetOpen: false,
    });
  },

  setLayersSheetOpen(isLayersSheetOpen: boolean) {
    setState({
      isLayersSheetOpen,
      isTimelineExpanded: false,
    });
  },

  enterCityZoomMap(cityId: CityId) {
    setState({
      selectedCityId: cityId,
      focusedPlaceId: null,
      sheetSnap: "closed",
      isTimelineExpanded: false,
      isLayersSheetOpen: false,
      isCityZoomMapOpen: true,
    });
  },

  exitCityZoomMap() {
    setState({
      isCityZoomMapOpen: false,
      focusedPlaceId: null,
    });
  },

  focusPlace(placeId: string | null, cityId?: CityId | null) {
    setState((prev) => {
      const nextCityId = cityId !== undefined ? cityId : prev.selectedCityId;
      return {
        focusedPlaceId: placeId,
        selectedCityId: nextCityId,
        sheetSnap:
          placeId || nextCityId
            ? prev.sheetSnap === "closed"
              ? "half"
              : prev.sheetSnap
            : "closed",
      };
    });
  },

  setCurrentDayIndex(dayIndex: number) {
    setState({
      currentDayIndex: Math.max(0, Math.min(32, Math.round(dayIndex))),
    });
  },

  setUse2DFallback(use2DFallback: boolean) {
    setState({ use2DFallback });
  },

  setSearchOpen(isSearchOpen: boolean) {
    setState({ isSearchOpen });
  },

  setMapDragMode(mapDragMode: MapDragMode) {
    setState({ mapDragMode });
  },

  toggleMapDragMode() {
    setState((prev) => ({
      mapDragMode: prev.mapDragMode === "pan" ? "rotate" : "pan",
    }));
  },

  dispatchCameraCommand(type: CameraCommandType) {
    setState((prev) => {
      const next2D = { ...prev.map2DView };
      if (type === "pan-north") next2D.y += 65;
      else if (type === "pan-south") next2D.y -= 65;
      else if (type === "pan-east") next2D.x -= 65;
      else if (type === "pan-west") next2D.x += 65;
      else if (type === "zoom-in")
        next2D.zoom = Math.min(3.5, next2D.zoom * 1.25);
      else if (type === "zoom-out")
        next2D.zoom = Math.max(0.65, next2D.zoom / 1.25);
      else if (type === "reset") {
        next2D.x = 0;
        next2D.y = 0;
        next2D.zoom = 1;
      }

      return {
        map2DView: next2D,
        cameraCommand: {
          type,
          seq: (prev.cameraCommand?.seq ?? 0) + 1,
        },
      };
    });
  },

  setMap2DView(patch: Partial<{ x: number; y: number; zoom: number }>) {
    setState((prev) => ({
      map2DView: { ...prev.map2DView, ...patch },
    }));
  },

  toggleLayer(layer: keyof LayerToggles) {
    setState((prev) => ({
      layerToggles: {
        ...prev.layerToggles,
        [layer]: !prev.layerToggles[layer],
      },
    }));
  },

  setAllLayers(enabled: boolean) {
    setState({
      layerToggles: {
        attractions: enabled,
        nature: enabled,
        food: enabled,
        markets: enabled,
        michelinBib: enabled,
        hiddenLocal: enabled,
        hotels: enabled,
      },
    });
  },
};

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot(): TripStoreState {
  return state;
}

function getServerSnapshot(): TripStoreState {
  return DEFAULT_STATE;
}

export function useTripStore(): TripStoreState {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
