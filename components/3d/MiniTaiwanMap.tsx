"use client";

import "./threeCompat";
import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { TaiwanIsland } from "./TaiwanIsland";
import { OceanWater } from "./OceanWater";
import { CityPins } from "./CityPins";
import { CameraRig } from "./CameraRig";
import { Map2DFallback } from "./Map2DFallback";
import { WorldHtmlHost } from "./WorldHtml";
import { getTimelineDays } from "@/lib/data/selectors";
import { tripActions, useTripStore } from "@/lib/store/useTripStore";
import type { CityId } from "@/data/types";

interface MiniTaiwanMapProps {
  activeCityId: CityId;
  activeLegOrder?: number;
  focusedPlaceId?: string | null;
}

export function MiniTaiwanMap({
  activeCityId,
  activeLegOrder,
  focusedPlaceId = null,
}: MiniTaiwanMapProps) {
  const store = useTripStore();
  const days = getTimelineDays();

  const currentDay =
    (activeLegOrder
      ? days.find((d) => d.legOrder === activeLegOrder)
      : days.find((d) => d.cityId === activeCityId)) ?? days[0];

  if (store.use2DFallback) {
    return (
      <div className="h-full w-full overflow-hidden rounded-3xl">
        <Map2DFallback
          selectedCityId={activeCityId}
          currentDay={currentDay}
          isNightMode={store.isNightMode}
          layerToggles={store.layerToggles}
          onSelectCity={(cityId) => tripActions.selectCity(cityId)}
          onSelectPlace={() => {}}
          compact
        />
      </div>
    );
  }

  return (
    <div
      data-map-canvas-root
      className={`relative h-full w-full overflow-hidden rounded-3xl ${
        store.isNightMode
          ? "bg-gradient-to-b from-slate-950 via-slate-900 to-sky-950"
          : "bg-gradient-to-b from-sky-200 via-cyan-100 to-emerald-100"
      }`}
    >
      <Canvas
        dpr={[1, 1.5]}
        camera={{ position: [-4.5, 18.5, 15.5], fov: 42, near: 0.1, far: 140 }}
      >
        <ambientLight intensity={store.isNightMode ? 0.65 : 1.2} />
        <directionalLight
          position={[10, 18, 8]}
          intensity={store.isNightMode ? 0.9 : 1.8}
        />

        <Suspense fallback={null}>
          <TaiwanIsland isNightMode={store.isNightMode} />
          <OceanWater isNightMode={store.isNightMode} />
          <CityPins
            selectedCityId={activeCityId}
            activeTimelineCityId={currentDay.cityId}
            isNightMode={store.isNightMode}
            onSelectCity={(cityId) => tripActions.selectCity(cityId)}
          />
        </Suspense>

        <CameraRig
          selectedCityId={activeCityId}
          focusedPlaceId={focusedPlaceId}
        />
      </Canvas>
      <WorldHtmlHost />
    </div>
  );
}
