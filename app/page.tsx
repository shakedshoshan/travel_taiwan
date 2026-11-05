"use client";

import { useEffect } from "react";
import { MapCanvas } from "@/components/3d/MapCanvas";
import { LayerToggles } from "@/components/ui/LayerToggles";
import { CityModeBar } from "@/components/ui/city/CityModeBar";
import { CityModeSheet } from "@/components/ui/city/CityModeSheet";
import { MapNavigationPad } from "@/components/ui/MapNavigationPad";
import { tripActions, useTripStore } from "@/lib/store/useTripStore";
import { seedSheetHistory } from "@/lib/store/sheetUrl";
import { CITY_IDS } from "@/lib/data/schemas";
import type { CityId } from "@/data/types";

export default function HomePage() {
  const cityMode = Boolean(useTripStore().selectedCityId);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const cityParam = params.get("city");
    const placeParam = params.get("place");
    if (cityParam && (CITY_IDS as readonly string[]).includes(cityParam)) {
      tripActions.selectCity(cityParam as CityId, "peek", "url");
      if (placeParam) {
        tripActions.focusPlace(placeParam, cityParam as CityId, "url");
      }
      seedSheetHistory(cityParam, placeParam);
    }
  }, []);

  useEffect(() => {
    const onPop = () => {
      const params = new URLSearchParams(window.location.search);
      const cityParam = params.get("city");
      const placeParam = params.get("place");
      if (cityParam && (CITY_IDS as readonly string[]).includes(cityParam)) {
        tripActions.selectCity(cityParam as CityId, "peek", "history");
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
      className="relative h-dvh w-full overflow-hidden select-none"
    >
      {/* Full-bleed 3D Taiwan Map Hero */}
      <MapCanvas />

      <CityModeBar />

      {!cityMode && (
        <div
          style={{ top: "calc(3.65rem + env(safe-area-inset-top))" }}
          data-map-chrome="1"
          className="pointer-events-none fixed right-2.5 left-2.5 z-20 md:right-5 md:left-5"
        >
          <LayerToggles />
        </div>
      )}

      {!cityMode && (
        <div
          style={{ bottom: "calc(4.75rem + env(safe-area-inset-bottom))" }}
          data-map-chrome="1"
          className="pointer-events-none fixed left-3 z-20 md:left-6 lg:!bottom-6"
        >
          <MapNavigationPad />
        </div>
      )}

      <CityModeSheet />
    </div>
  );
}
