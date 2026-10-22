import type { CityId } from "@/data/types";

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

export interface UserGeoCoords {
  lat: number;
  lng: number;
  labelHe: string;
}

export interface TripStoreState {
  // Persisted display preference
  isNightMode: boolean;
  offlineSavedCities: CityId[];

  // Interactive session state
  selectedCityId: CityId | null;
  focusedPlaceId: string | null;
  sheetSnap: SheetSnapPoint;
  isTimelineExpanded: boolean;
  isLayersSheetOpen: boolean;
  isCityZoomMapOpen: boolean;
  isTodayCardOpen: boolean;
  isRoutePlaying: boolean;
  userCoords: UserGeoCoords | null;
  currentDayIndex: number; // 0..32 (6.11 -> 8.12)
  use2DFallback: boolean;
  prefersReducedMotion: boolean;
  isSearchOpen: boolean;
  mapDragMode: MapDragMode;
  cameraCommand: { type: CameraCommandType; seq: number } | null;
  map2DView: { x: number; y: number; zoom: number };
  layerToggles: LayerToggles;
}

export const STORAGE_KEY = "taiwan_3d_trip_state_v1";

export const DEFAULT_STATE: TripStoreState = {
  isNightMode: false,
  offlineSavedCities: [],

  selectedCityId: null,
  focusedPlaceId: null,
  sheetSnap: "closed",
  isTimelineExpanded: false,
  isLayersSheetOpen: false,
  isCityZoomMapOpen: false,
  isTodayCardOpen: false,
  isRoutePlaying: false,
  userCoords: null,
  currentDayIndex: 0,
  use2DFallback: false,
  prefersReducedMotion: false,
  isSearchOpen: false,
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
