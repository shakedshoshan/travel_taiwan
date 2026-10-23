"use client";

import "./threeCompat";
import { Suspense, useEffect, useState } from "react";
import * as THREE from "three";
import { Canvas, useThree } from "@react-three/fiber";
import { DemandFrames } from "./DemandFrames";
import { bindDefaultLoadingManager, markLoadStage, useLoadProgress } from "./loadProgress";
import { AdaptiveDpr, AdaptiveEvents, Stars } from "@react-three/drei";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import { TaiwanIsland } from "./TaiwanIsland";
import { OceanWater } from "./OceanWater";
import { OCEAN_HORIZON_DAY, OCEAN_HORIZON_NIGHT } from "./island/oceanBuilder";
import { CityPins } from "./CityPins";
import { CategoryMarkers } from "./CategoryMarkers";
import { DelightDetails } from "./DelightDetails";
import {
  CityDestination3DScene,
  CityDestinationHUD,
} from "./CityDestination3DMap";
import { CameraRig } from "./CameraRig";
import { Map2DFallback } from "./Map2DFallback";
import { TaiwanLoadingScreen } from "./TaiwanLoadingScreen";
import { WorldHtmlHost } from "./WorldHtml";
import { tripActions, useTripStore } from "@/lib/store/useTripStore";
import { getTimelineDays } from "@/lib/data/selectors";
import type { EnrichedPlace } from "@/lib/data/loaders";

/** The sun only moves when day/night changes, so the shadow map can stay frozen. */
function configureStaticShadows(gl: THREE.WebGLRenderer) {
  gl.shadowMap.autoUpdate = false;
  let frames = 0;
  let id = 0;
  const tick = () => {
    gl.shadowMap.needsUpdate = true;
    frames += 1;
    if (frames < 10) id = window.requestAnimationFrame(tick);
  };
  id = window.requestAnimationFrame(tick);
  return () => window.cancelAnimationFrame(id);
}

function StaticShadows({ isNightMode }: { isNightMode: boolean }) {
  const gl = useThree((state) => state.gl);
  useEffect(() => configureStaticShadows(gl), [gl, isNightMode]);
  return null;
}

function checkWebGLAvailable(): boolean {
  if (typeof window === "undefined") return true;
  try {
    const canvas = document.createElement("canvas");
    return !!(
      window.WebGLRenderingContext &&
      (canvas.getContext("webgl") || canvas.getContext("experimental-webgl"))
    );
  } catch {
    return false;
  }
}

export function MapCanvas() {
  const store = useTripStore();
  const loadProgress = useLoadProgress();
  const [coarsePointer, setCoarsePointer] = useState(false);
  const [paintReady, setPaintReady] = useState(false);
  const [showAllCityLabels, setShowAllCityLabels] = useState(true);
  const [cityCategoryFilter, setCityCategoryFilter] = useState<
    "all" | "hotel" | "food" | "attraction" | "nature"
  >("all");

  const timelineDays = getTimelineDays();
  const currentDay =
    timelineDays[store.currentDayIndex] ?? timelineDays[0];

  useEffect(() => {
    tripActions.hydrate();
    const supported = checkWebGLAvailable();
    if (!supported) {
      tripActions.setUse2DFallback(true);
    }
    const media = window.matchMedia("(pointer: coarse)");
    const applyPointer = () => setCoarsePointer(media.matches);
    applyPointer();
    media.addEventListener("change", applyPointer);
    let second = 0;
    const first = window.requestAnimationFrame(() => {
      second = window.requestAnimationFrame(() => setPaintReady(true));
    });
    return () => {
      media.removeEventListener("change", applyPointer);
      window.cancelAnimationFrame(first);
      window.cancelAnimationFrame(second);
    };
  }, []);

  const handleSelectPlace = (place: EnrichedPlace) => {
    tripActions.focusPlace(place.id, place.cityId);
  };

  if (store.use2DFallback) {
    return (
      <div className="relative h-full w-full">
        <Map2DFallback
          selectedCityId={store.selectedCityId}
          currentDay={currentDay}
          isNightMode={store.isNightMode}
          layerToggles={store.layerToggles}
          onSelectCity={(cityId) => tripActions.selectCity(cityId)}
          onSelectPlace={handleSelectPlace}
        />
      </div>
    );
  }

  return (
    <div
      data-map-canvas-root
      className="relative h-full w-full touch-none transition-colors duration-700"
      style={{
        backgroundColor: store.isNightMode
          ? OCEAN_HORIZON_NIGHT
          : OCEAN_HORIZON_DAY,
      }}
    >
      <TaiwanLoadingScreen visible={!paintReady || loadProgress < 100} progress={paintReady ? loadProgress : 8} />

      {paintReady && <Canvas
        frameloop="demand"
        shadows={{ type: THREE.PCFShadowMap }}
        dpr={[1, 2]}
        camera={{ position: [-4.5, 19.5, 16.5], fov: 42, near: 0.1, far: 160 }}
        gl={{
          antialias: true,
          powerPreference: "high-performance",
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 0.92,
        }}
        onCreated={() => {
          bindDefaultLoadingManager();
          markLoadStage("frame");
        }}
        onPointerMissed={() => {
          // Clicking empty ocean closes city drawer if open
        }}
      >
        <DemandFrames />
        <AdaptiveDpr pixelated />
        <AdaptiveEvents />
        <StaticShadows isNightMode={store.isNightMode} />

        <color
          attach="background"
          args={[store.isNightMode ? OCEAN_HORIZON_NIGHT : OCEAN_HORIZON_DAY]}
        />
        <fog
          attach="fog"
          args={[
            store.isNightMode ? OCEAN_HORIZON_NIGHT : OCEAN_HORIZON_DAY,
            28,
            90,
          ]}
        />

        {/* Lighting */}
        <ambientLight
          intensity={store.isNightMode ? 0.45 : 0.62}
          color={store.isNightMode ? "#93c5fd" : "#fff7e8"}
        />
        <directionalLight
          castShadow
          position={store.isNightMode ? [-8, 16, -6] : [12, 22, 10]}
          intensity={store.isNightMode ? 0.7 : 1.25}
          color={store.isNightMode ? "#60a5fa" : "#fff4e0"}
          shadow-mapSize-width={coarsePointer ? 512 : 1024}
          shadow-mapSize-height={coarsePointer ? 512 : 1024}
          shadow-camera-near={1}
          shadow-camera-far={60}
          shadow-camera-left={-16}
          shadow-camera-right={16}
          shadow-camera-top={18}
          shadow-camera-bottom={-18}
        />
        <hemisphereLight
          args={[
            store.isNightMode ? "#1e293b" : "#bae6fd",
            store.isNightMode ? "#0f172a" : "#fde68a",
            store.isNightMode ? 0.35 : 0.38,
          ]}
        />

        {/* Night market warm point lights over Taipei, Taichung, Tainan, Kaohsiung */}
        {store.isNightMode && (
          <group>
            <Stars
              radius={55}
              depth={35}
              count={coarsePointer ? 400 : 900}
              factor={3.5}
              saturation={0.5}
              fade
              speed={0.8}
            />
            <pointLight
              position={[3.7, 2.2, -10.8]}
              color="#ff5a36"
              intensity={4.5}
              distance={8}
            />
            <pointLight
              position={[-2.1, 2.0, -4.0]}
              color="#fbbf24"
              intensity={3.5}
              distance={7}
            />
            <pointLight
              position={[-5.1, 1.8, 5.2]}
              color="#f43f5e"
              intensity={4.0}
              distance={8}
            />
          </group>
        )}

        <Suspense fallback={null}>
          <OceanWater isNightMode={store.isNightMode} />
          {store.isCityZoomMapOpen && store.selectedCityId ? (
            <CityDestination3DScene
              cityId={store.selectedCityId}
              isNightMode={store.isNightMode}
              showAllLabels={showAllCityLabels}
              categoryFilter={cityCategoryFilter}
            />
          ) : (
            <>
              <TaiwanIsland isNightMode={store.isNightMode} />
              <CityPins
                selectedCityId={store.selectedCityId}
                activeTimelineCityId={currentDay.cityId}
                isNightMode={store.isNightMode}
                onSelectCity={(cityId) => tripActions.selectCity(cityId)}
              />
              <CategoryMarkers
                layerToggles={store.layerToggles}
                isNightMode={store.isNightMode}
                selectedCityId={store.selectedCityId}
                focusedPlaceId={store.focusedPlaceId}
                onSelectPlace={handleSelectPlace}
              />
              <DelightDetails isNightMode={store.isNightMode} />
            </>
          )}
        </Suspense>

        <CameraRig
          selectedCityId={store.selectedCityId}
          focusedPlaceId={store.focusedPlaceId}
        />

        {store.isNightMode && !coarsePointer && (
          <EffectComposer>
            <Bloom
              luminanceThreshold={0.78}
              mipmapBlur
              intensity={0.9}
              radius={0.65}
            />
          </EffectComposer>
        )}
      </Canvas>}
      {paintReady && <WorldHtmlHost />}
      {store.isCityZoomMapOpen && store.selectedCityId && (
        <CityDestinationHUD
          cityId={store.selectedCityId}
          showAllLabels={showAllCityLabels}
          onToggleAllLabels={() => setShowAllCityLabels((prev) => !prev)}
          categoryFilter={cityCategoryFilter}
          onChangeCategoryFilter={setCityCategoryFilter}
        />
      )}
    </div>
  );
}
