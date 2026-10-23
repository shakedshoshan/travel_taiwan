"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { WorldHtml } from "./WorldHtml";
import { getAllCities } from "@/lib/data/selectors";
import { OFFSHORE_ISLANDS } from "@/lib/data/taiwanGeo";
import { latLngToWorld3D } from "@/lib/data/coordinates";
import { useTripStore } from "@/lib/store/useTripStore";
import { triggerHapticTap } from "@/lib/haptics";
import type { CityId } from "@/data/types";
import { SingleCityPin } from "./pins/SingleCityPin";

interface CityPinsProps {
  selectedCityId: CityId | null;
  activeTimelineCityId: CityId;
  isNightMode: boolean;
  onSelectCity: (cityId: CityId) => void;
}

export function CityPins({
  selectedCityId,
  activeTimelineCityId,
  isNightMode,
  onSelectCity,
}: CityPinsProps) {
  const store = useTripStore();
  const cities = getAllCities();
  const pulseRingRef = useRef<THREE.Mesh>(null);

  // Offshore islands world positions for subtle labels
  const offshoreMarkers = useMemo(
    () =>
      OFFSHORE_ISLANDS.map((isl) => ({
        ...isl,
        world: latLngToWorld3D(isl.centerLat, isl.centerLng, 0.16),
      })),
    []
  );

  // User "Near Me" Geolocation 3D Pulsing Blue Dot (P1 #6)
  const userWorldPos = useMemo(() => {
    if (!store.userCoords) return null;
    return latLngToWorld3D(store.userCoords.lat, store.userCoords.lng, 0.24);
  }, [store.userCoords]);

  useFrame(({ clock }) => {
    if (pulseRingRef.current && !store.prefersReducedMotion) {
      const t = clock.getElapsedTime();
      const s = 1 + ((t * 1.4) % 1.2) * 1.5;
      pulseRingRef.current.scale.set(s, s, 1);
    }
  });

  return (
    <group name="city-pins">
      {cities.map((city, idx) => (
        <SingleCityPin
          key={city.id}
          city={city}
          index={idx}
          isSelected={selectedCityId === city.id}
          isTimelineActive={activeTimelineCityId === city.id}
          isNightMode={isNightMode}
          prefersReducedMotion={store.prefersReducedMotion}
          onSelectCity={onSelectCity}
        />
      ))}

      {/* Offshore Island Mini Labels (Penghu, Xiaoliuqiu, Green Island, Orchid Island) */}
      {offshoreMarkers.map((isl) => {
        const targetCityId: CityId =
          isl.id === "xiaoliuqiu"
            ? "pingtung"
            : isl.id === "green-island" || isl.id === "orchid-island"
              ? "taitung"
              : "chiayi";
        return (
          <group
            key={isl.id}
            position={[isl.world.x, isl.world.y, isl.world.z]}
            onClick={(e) => {
              e.stopPropagation();
              triggerHapticTap();
              onSelectCity(targetCityId);
            }}
          >
            <WorldHtml
              position={[0, 0.18, 0]}
              anchor="bottom"
              screenOffset={[0, -4]}
              clampToViewport
              avoidOverlap
              zIndexRange={[14, 0]}
            >
              <button
                type="button"
                dir="rtl"
                aria-label={`${isl.nameHe} (${isl.nameEn})`}
                title={`${isl.nameHe} (${isl.nameEn})`}
                onClick={(e) => {
                  e.stopPropagation();
                  triggerHapticTap();
                  onSelectCity(targetCityId);
                }}
                className="flex min-h-[44px] min-w-[44px] cursor-pointer select-none items-center justify-center whitespace-nowrap rounded-full border border-teal-300/60 bg-slate-900/90 px-3 text-[13px] font-bold text-teal-50 shadow-sm backdrop-blur-xs [text-shadow:0_1px_2px_#020617,0_0_8px_#020617] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
              >
                {isl.nameHe}
              </button>
            </WorldHtml>
          </group>
        );
      })}

      {/* Geolocation Pulsing Blue Dot on the 3D Map */}
      {userWorldPos && store.userCoords && (
        <group
          name="near-me-blue-dot"
          position={[userWorldPos.x, userWorldPos.y, userWorldPos.z]}
        >
          <mesh
            ref={pulseRingRef}
            position={[0, -0.18, 0]}
            rotation={[-Math.PI / 2, 0, 0]}
          >
            <ringGeometry args={[0.16, 0.34, 32]} />
            <meshBasicMaterial
              color="#38bdf8"
              transparent
              opacity={0.75}
              side={THREE.DoubleSide}
            />
          </mesh>
          <mesh position={[0, 0, 0]}>
            <sphereGeometry args={[0.16, 20, 20]} />
            <meshStandardMaterial
              color="#0284c7"
              emissive="#38bdf8"
              emissiveIntensity={2.2}
              roughness={0.15}
            />
          </mesh>
          <mesh position={[0, 0, 0]}>
            <sphereGeometry args={[0.07, 12, 12]} />
            <meshBasicMaterial color="#ffffff" />
          </mesh>
          <WorldHtml
            position={[0, 0.22, 0]}
            anchor="bottom"
            screenOffset={[0, -6]}
            clampToViewport
            zIndexRange={[34, 0]}
          >
            <div
              dir="rtl"
              title={store.userCoords.labelHe}
              className="pointer-events-none select-none max-w-[8rem] truncate whitespace-nowrap rounded-full border border-white bg-sky-600 px-2.5 py-0.5 text-[10px] font-black text-white shadow-lg"
            >
              📍 {store.userCoords.labelHe}
            </div>
          </WorldHtml>
        </group>
      )}
    </group>
  );
}
