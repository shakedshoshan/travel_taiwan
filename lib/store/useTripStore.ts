"use client";

import { useSyncExternalStore } from "react";
import type { CityId } from "@/data/types";
import { triggerHapticTap } from "@/lib/haptics";
import {
  backOneSheetLevel,
  exitToOverview,
  pushCityEntry,
  pushPlaceEntry,
  type SheetHistorySource,
} from "./sheetUrl";
import { sheetSnapAfterPlaceFocus } from "./sheetSnapForPlace";
import {
  DEFAULT_STATE,
  STORAGE_KEY,
  type CameraCommandType,
  type CityCategory,
  type LayerToggles,
  type MapDragMode,
  type SheetSnapPoint,
  type TripStoreState,
  type UserGeoCoords,
} from "./tripStoreTypes";

export type {
  CameraCommandType,
  CityCategory,
  LayerToggles,
  MapDragMode,
  SheetSnapPoint,
  TripStoreState,
  UserGeoCoords,
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
      offlineSavedCities: next.offlineSavedCities,
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
        offlineSavedCities: Array.isArray(parsed.offlineSavedCities)
          ? parsed.offlineSavedCities
          : state.offlineSavedCities,
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

  selectCity(
    cityId: CityId | null,
    initialSnap: SheetSnapPoint = "peek",
    source: SheetHistorySource = "user"
  ) {
    if (cityId && source === "user") triggerHapticTap();
    if (
      source === "user" &&
      cityId &&
      state.selectedCityId === cityId &&
      state.focusedPlaceId
    ) {
      tripActions.goBack();
      return;
    }
    if (
      source === "user" &&
      cityId &&
      state.selectedCityId === cityId &&
      !state.focusedPlaceId
    ) {
      return;
    }
    setState((prev) => ({
      selectedCityId: cityId,
      focusedPlaceId: null,
      sheetSnap: cityId === null ? "closed" : initialSnap,
      isLayersSheetOpen: false,
      cityCategory: prev.selectedCityId === cityId ? prev.cityCategory : "all",
    }));
    if (source !== "user") return;
    if (cityId) pushCityEntry(cityId);
    else exitToOverview();
  },

  goBack() {
    const params =
      typeof window === "undefined"
        ? null
        : new URLSearchParams(window.location.search);
    const city = params?.get("city");
    const place = params?.get("place");
    if (place && city) {
      setState((prev) => ({
        selectedCityId: (city as CityId) || prev.selectedCityId,
        focusedPlaceId: null,
        sheetSnap: "peek",
      }));
    } else {
      setState({
        selectedCityId: null,
        focusedPlaceId: null,
        sheetSnap: "closed",
        cityCategory: "all",
      });
    }
    backOneSheetLevel();
  },

  setCityCategory(cityCategory: CityCategory) {
    const hadPlace = Boolean(state.focusedPlaceId);
    setState({
      cityCategory,
      focusedPlaceId: null,
      sheetSnap: state.selectedCityId ? state.sheetSnap : "closed",
    });
    if (
      hadPlace &&
      typeof window !== "undefined" &&
      window.history.state?.level === "place"
    ) {
      backOneSheetLevel();
    }
  },

  setSheetSnap(sheetSnap: SheetSnapPoint) {
    setState((prev) => ({
      sheetSnap,
      selectedCityId: sheetSnap === "closed" ? null : prev.selectedCityId,
      focusedPlaceId: sheetSnap === "closed" ? null : prev.focusedPlaceId,
    }));
  },

  setLayersSheetOpen(isLayersSheetOpen: boolean) {
    setState({ isLayersSheetOpen });
  },

  setUserCoords(userCoords: UserGeoCoords | null) {
    setState({ userCoords });
  },

  markCitySavedOffline(cityId: CityId) {
    setState((prev) => {
      if (prev.offlineSavedCities.includes(cityId)) return {};
      return { offlineSavedCities: [...prev.offlineSavedCities, cityId] };
    }, true);
  },

  focusPlace(
    placeId: string | null,
    cityId?: CityId | null,
    source: SheetHistorySource = "user"
  ) {
    if (placeId && source === "user") triggerHapticTap();
    let nextCityId: CityId | null = null;
    setState((prev) => {
      nextCityId = cityId !== undefined ? cityId : prev.selectedCityId;
      return {
        focusedPlaceId: placeId,
        selectedCityId: nextCityId,
        sheetSnap: sheetSnapAfterPlaceFocus(
          placeId,
          nextCityId,
          prev.sheetSnap
        ),
        isLayersSheetOpen: false,
      };
    });
    if (source !== "user" || !nextCityId) return;
    if (placeId) pushPlaceEntry(nextCityId, placeId);
    else if (typeof window !== "undefined" && window.history.state?.level === "place") {
      backOneSheetLevel();
    }
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
