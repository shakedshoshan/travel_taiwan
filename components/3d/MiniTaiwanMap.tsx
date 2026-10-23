"use client";

import "./threeCompat";
import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { DemandFrames } from "./DemandFrames";
import { TaiwanIsland } from "./TaiwanIsland";
import { OceanWater } from "./OceanWater";
import { KentingDetourLine } from "./delight/KentingDetourLine";
import { OCEAN_HORIZON_DAY, OCEAN_HORIZON_NIGHT } from "./island/oceanBuilder";
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
      className="relative h-full w-full overflow-hidden rounded-3xl"
      style={{
        backgroundColor: store.isNightMode
          ? OCEAN_HORIZON_NIGHT
          : OCEAN_HORIZON_DAY,
      }}
    >
      <Canvas
        frameloop="demand"
        dpr={[1, 2]}
        camera={{ position: [-4.5, 18.5, 15.5], fov: 42, near: 0.1, far: 140 }}
      >
        <DemandFrames />
        <ambientLight intensity={store.isNightMode ? 0.65 : 1.2} />
        <directionalLight
          position={[10, 18, 8]}
          intensity={store.isNightMode ? 0.9 : 1.8}
        />

        <Suspense fallback={null}>
          <TaiwanIsland isNightMode={store.isNightMode} />
          <color
            attach="background"
            args={[store.isNightMode ? OCEAN_HORIZON_NIGHT : OCEAN_HORIZON_DAY]}
          />
          <OceanWater isNightMode={store.isNightMode} />
          <KentingDetourLine />
          <CityPins
            selectedCityId={activeCityId}
            activeTimelineCityId={currentDay.cityId}
            isNightMode={store.isNightMode}
            onSelectCity={(cityId) => tripActions.selectCity(cityId)}
            onlyLabelCityId={activeCityId}
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
