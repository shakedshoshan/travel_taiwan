"use client";

import { useSyncExternalStore } from "react";
import type { CityId } from "@/data/types";
import { getAllCities, getHotels } from "@/lib/data/selectors";

export interface LayerToggles {
  attractions: boolean;
  nature: boolean;
  food: boolean;
  markets: boolean;
  michelinBib: boolean;
  hiddenLocal: boolean;
  hotels: boolean;
}

export type MapDragMode = "pan" | "rotate";
export type SheetSnapPoint = "closed" | "peek" | "half" | "full";

export type CameraCommandType =
  | "pan-north"
  | "pan-south"
  | "pan-east"
  | "pan-west"
  | "rotate-left"
  | "rotate-right"
  | "tilt-toggle"
  | "zoom-in"
  | "zoom-out"
  | "reset";

export interface TripStoreState {
  // Persisted to localStorage
  favorites: string[];
  donePlaces: string[];
  selectedHotels: Partial<Record<CityId, string>>;
  dailyFoodBudget: number;
  isNightMode: boolean;

  // Interactive session state
  selectedCityId: CityId | null;
  focusedPlaceId: string | null;
  sheetSnap: SheetSnapPoint;
  isTimelineExpanded: boolean;
  isLayersSheetOpen: boolean;
  isCityZoomMapOpen: boolean;
  currentDayIndex: number; // 0..32 (6.11 -> 8.12)
  isPlaying: boolean;
  use2DFallback: boolean;
  prefersReducedMotion: boolean;
  isSearchOpen: boolean;
  isBudgetOpen: boolean;
  mapDragMode: MapDragMode;
  cameraCommand: { type: CameraCommandType; seq: number } | null;
  map2DView: { x: number; y: number; zoom: number };
  layerToggles: LayerToggles;
}

const STORAGE_KEY = "taiwan_3d_trip_state_v1";

function buildDefaultSelectedHotels(): Partial<Record<CityId, string>> {
  const cities = getAllCities();
  const hotels = getHotels();
  const defaults: Partial<Record<CityId, string>> = {};

  for (const city of cities) {
    const cityHotels = hotels.filter((h) => h.cityId === city.id);
    if (cityHotels.length > 0) {
      const preferred =
        cityHotels.find((h) => h.tier === "quality") ?? cityHotels[0];
      defaults[city.id] = preferred.id;
    }
  }
  return defaults;
}

const DEFAULT_STATE: TripStoreState = {
  favorites: [],
  donePlaces: [],
  selectedHotels: buildDefaultSelectedHotels(),
  dailyFoodBudget: 850,
  isNightMode: false,

  selectedCityId: null,
  focusedPlaceId: null,
  sheetSnap: "closed",
  isTimelineExpanded: false,
  isLayersSheetOpen: false,
  isCityZoomMapOpen: false,
  currentDayIndex: 0,
  isPlaying: false,
  use2DFallback: false,
  prefersReducedMotion: false,
  isSearchOpen: false,
  isBudgetOpen: false,
  mapDragMode: "pan",
  cameraCommand: null,
  map2DView: { x: 0, y: 0, zoom: 1 },
  layerToggles: {
    attractions: true,
    nature: true,
    food: true,
    markets: true,
    michelinBib: true,
    hiddenLocal: true,
    hotels: true,
  },
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
      favorites: next.favorites,
      donePlaces: next.donePlaces,
      selectedHotels: next.selectedHotels,
      dailyFoodBudget: next.dailyFoodBudget,
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
        favorites: Array.isArray(parsed.favorites)
          ? parsed.favorites
          : state.favorites,
        donePlaces: Array.isArray(parsed.donePlaces)
          ? parsed.donePlaces
          : state.donePlaces,
        selectedHotels:
          parsed.selectedHotels && typeof parsed.selectedHotels === "object"
            ? { ...state.selectedHotels, ...parsed.selectedHotels }
            : state.selectedHotels,
        dailyFoodBudget:
          typeof parsed.dailyFoodBudget === "number" &&
          parsed.dailyFoodBudget >= 0
            ? parsed.dailyFoodBudget
            : state.dailyFoodBudget,
        isNightMode:
          typeof parsed.isNightMode === "boolean"
            ? parsed.isNightMode
            : state.isNightMode,
      };
    }

    // Check reduced motion preference (keep 3D island active, calm animations)
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

  toggleFavorite(placeId: string) {
    setState((prev) => {
      const exists = prev.favorites.includes(placeId);
      return {
        favorites: exists
          ? prev.favorites.filter((id) => id !== placeId)
          : [...prev.favorites, placeId],
      };
    }, true);
  },

  toggleDone(placeId: string) {
    setState((prev) => {
      const exists = prev.donePlaces.includes(placeId);
      return {
        donePlaces: exists
          ? prev.donePlaces.filter((id) => id !== placeId)
          : [...prev.donePlaces, placeId],
      };
    }, true);
  },

  selectHotelForCity(cityId: CityId, hotelId: string) {
    setState(
      (prev) => ({
        selectedHotels: {
          ...prev.selectedHotels,
          [cityId]: hotelId,
        },
      }),
      true
    );
  },

  setDailyFoodBudget(amount: number) {
    setState(
      { dailyFoodBudget: Math.max(0, Math.round(amount || 0)) },
      true
    );
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

  setIsPlaying(isPlaying: boolean) {
    setState({ isPlaying });
  },

  togglePlaying() {
    setState((prev) => ({ isPlaying: !prev.isPlaying }));
  },

  setUse2DFallback(use2DFallback: boolean) {
    setState({ use2DFallback });
  },

  setSearchOpen(isSearchOpen: boolean) {
    setState({ isSearchOpen });
  },

  setBudgetOpen(isBudgetOpen: boolean) {
    setState({ isBudgetOpen });
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
      else if (type === "zoom-in") next2D.zoom = Math.min(3.5, next2D.zoom * 1.25);
      else if (type === "zoom-out") next2D.zoom = Math.max(0.65, next2D.zoom / 1.25);
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
