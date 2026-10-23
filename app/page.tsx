"use client";

import { useEffect } from "react";
import { MapCanvas } from "@/components/3d/MapCanvas";
import { LayerToggles } from "@/components/ui/LayerToggles";
import { TimelineScrubber } from "@/components/ui/TimelineScrubber";
import { CityDrawer } from "@/components/ui/CityDrawer";
import { MapNavigationPad } from "@/components/ui/MapNavigationPad";
import { getTripTodayStatus } from "@/components/ui/TodayCardModal";
import { tripActions } from "@/lib/store/useTripStore";
import { seedSheetHistory } from "@/lib/store/sheetUrl";
import { CITY_IDS } from "@/lib/data/schemas";
import type { CityId } from "@/data/types";

export default function HomePage() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const cityParam = params.get("city");
    const placeParam = params.get("place");
    if (cityParam && (CITY_IDS as readonly string[]).includes(cityParam)) {
      tripActions.selectCity(cityParam as CityId, "half", "url");
      if (placeParam) {
        tripActions.focusPlace(placeParam, cityParam as CityId, "url");
      }
      seedSheetHistory(cityParam, placeParam);
      return;
    }

    const todayStatus = getTripTodayStatus(params.get("today"));
    if (todayStatus.phase === "during") {
      tripActions.setCurrentDayIndex(todayStatus.dayIndex);
      tripActions.setTodayCardOpen(true);
      return;
    }
    const seenKey = "tw-today-card-seen";
    if (!window.sessionStorage.getItem(seenKey)) {
      window.sessionStorage.setItem(seenKey, "1");
      tripActions.setTodayCardOpen(true);
    }
  }, []);

  useEffect(() => {
    const onPop = () => {
      const params = new URLSearchParams(window.location.search);
      const cityParam = params.get("city");
      const placeParam = params.get("place");
      if (cityParam && (CITY_IDS as readonly string[]).includes(cityParam)) {
        tripActions.selectCity(cityParam as CityId, "half", "history");
        tripActions.focusPlace(placeParam, cityParam as CityId, "history");
        return;
      }
      tripActions.selectCity(null, "closed", "history");
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  return (
    <div
      dir="rtl"
      className="relative h-dvh w-screen overflow-hidden select-none"
    >
      {/* Full-bleed 3D Taiwan Map Hero */}
      <MapCanvas />

      {/* Top Horizontally Scrollable Category Chips + "שכבות" Sheet Trigger */}
      <div
        style={{ top: "calc(3.65rem + env(safe-area-inset-top))" }}
        className="pointer-events-none fixed right-2.5 left-2.5 z-20 md:right-5 md:left-5"
      >
        <LayerToggles />
      </div>

      {/* Geolocation "Near Me" + Recenter FABs */}
      <div
        style={{ bottom: "calc(8.25rem + env(safe-area-inset-bottom))" }}
        className="pointer-events-none fixed left-3 z-20 md:left-6 lg:!bottom-24"
      >
        <MapNavigationPad />
      </div>

      {/* Multi-Snap Bottom Sheet (Peek 20% / Half 55% / Full) */}
      <CityDrawer />

      {/* Collapsed 64px Timeline Pill (Tap to Expand into Sheet) */}
      <div
        style={{ bottom: "calc(4rem + env(safe-area-inset-bottom))" }}
        className="pointer-events-none fixed right-2.5 left-2.5 z-20 md:right-6 md:left-6 lg:!bottom-4"
      >
        <TimelineScrubber />
      </div>
    </div>
  );
}
