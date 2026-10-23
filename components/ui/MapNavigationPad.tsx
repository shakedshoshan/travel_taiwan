"use client";

import { useState } from "react";
import { LocateFixed, Navigation } from "lucide-react";
import { getAllCities, getCityById, getTimelineDays } from "@/lib/data/selectors";
import {
  computeDistanceKm,
  resolveNearMeCoordinates,
} from "@/lib/data/foodAndPlaceMeta";
import { tripActions, useTripStore } from "@/lib/store/useTripStore";

export function MapNavigationPad() {
  const store = useTripStore();
  const [locationDenied, setLocationDenied] = useState(false);

  const hiddenBySheet =
    store.sheetSnap === "half" ||
    store.sheetSnap === "full" ||
    store.isTimelineExpanded;

  if (hiddenBySheet) return null;

  const handleGeolocationClick = () => {
    if (store.userCoords || locationDenied) {
      tripActions.setUserCoords(null);
      setLocationDenied(false);
      return;
    }

    const days = getTimelineDays();
    const currentDay = days[store.currentDayIndex] ?? days[0];
    const fallbackCity = getCityById(store.selectedCityId ?? currentDay.cityId);

    resolveNearMeCoordinates(fallbackCity, (coords) => {
      setLocationDenied(false);
      tripActions.setUserCoords(coords);
      // Find closest city to fly to / open
      const cities = getAllCities();
      const closestCity = [...cities].sort(
        (a, b) =>
          computeDistanceKm(coords.lat, coords.lng, a.lat, a.lng) -
          computeDistanceKm(coords.lat, coords.lng, b.lat, b.lng)
      )[0];
      if (closestCity) {
        tripActions.selectCity(closestCity.id, "peek");
      }
    }, () => {
      tripActions.setUserCoords(null);
      setLocationDenied(true);
    });
  };

  return (
    <div dir="rtl" className="pointer-events-auto flex flex-col gap-2">
      {/* "Near Me" Geolocation FAB with Pulsing Blue Dot (P1 #6) */}
      <button
        type="button"
        onClick={handleGeolocationClick}
        aria-label={
          locationDenied
            ? "הגישה למיקום נדחתה"
            : store.userCoords
              ? `קרוב אליי פעיל (${store.userCoords.labelHe}) – לחצו לכיבוי`
              : "קרוב אליי – הצג מיקום נוכחי על המפה"
        }
        title={
          locationDenied
            ? "הגישה למיקום נדחתה"
            : store.userCoords
              ? `קרוב אליי: ${store.userCoords.labelHe}`
              : "קרוב אליי (מיקום במפה)"
        }
        className={`glass-panel toy-button relative flex min-h-[48px] min-w-[48px] items-center justify-center rounded-2xl shadow-xl transition-colors ${
          store.userCoords
            ? "bg-sky-600 text-white ring-2 ring-sky-300"
            : "text-slate-900 hover:bg-sky-500 hover:text-white dark:text-white"
        }`}
      >
        <Navigation className="h-4 w-4 text-sky-500" />
        {/* Pulsing Blue Dot Indicator */}
        <span className="absolute top-2 right-2 flex h-2.5 w-2.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-sky-400 opacity-85" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-sky-500 ring-1 ring-white" />
        </span>
      </button>

      {/* Recenter Whole Island FAB */}
      <button
        type="button"
        onClick={() => {
          tripActions.selectCity(null);
          tripActions.focusPlace(null, null);
          tripActions.dispatchCameraCommand("reset");
        }}
        aria-label="מרכז מפה לכל האי"
        title="מרכז מפה לכל האי"
        className="glass-panel toy-button flex min-h-[48px] min-w-[48px] items-center justify-center rounded-2xl text-slate-900 shadow-xl hover:bg-amber-400 hover:text-slate-950 dark:text-white dark:hover:bg-amber-400 dark:hover:text-slate-950"
      >
        <LocateFixed className="h-5 w-5 text-orange-500" />
      </button>
      {locationDenied && (
        <p className="max-w-[10rem] rounded-xl bg-slate-950/90 px-2 py-1 text-xs font-bold text-white">
          הגישה למיקום נדחתה
        </p>
      )}
    </div>
  );
}
