"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { WorldHtml } from "./WorldHtml";
import { getAllCities, getAllPlaces } from "@/lib/data/selectors";
import { OFFSHORE_ISLANDS } from "@/lib/data/taiwanGeo";
import { latLngToWorld3D } from "@/lib/data/coordinates";
import { markLoadStage } from "./loadProgress";
import { useTripStore } from "@/lib/store/useTripStore";
import { triggerHapticTap } from "@/lib/haptics";
import type { CityId } from "@/data/types";
import { SingleCityPin } from "./pins/SingleCityPin";

interface CityPinsProps {
  selectedCityId: CityId | null;
  activeTimelineCityId: CityId;
  isNightMode: boolean;
  onSelectCity: (cityId: CityId) => void;
  /** Place-page mini map: mount only this city's label. */
  onlyLabelCityId?: CityId | null;
}

export function CityPins({
  selectedCityId,
  activeTimelineCityId,
  isNightMode,
  onSelectCity,
  onlyLabelCityId = null,
}: CityPinsProps) {
  const store = useTripStore();
  const cities = getAllCities();
  const pulseRingRef = useRef<THREE.Mesh>(null);

  // Offshore islands world positions for subtle labels
  const offshoreMarkers = useMemo(() => {
    const islands: Array<{
      id: string;
      nameHe: string;
      nameEn: string;
      world: ReturnType<typeof latLngToWorld3D>;
      targetCityId: CityId;
    }> = OFFSHORE_ISLANDS.map((isl) => ({
      id: isl.id,
      nameHe: isl.nameHe,
      nameEn: isl.nameEn,
      world: latLngToWorld3D(isl.centerLat, isl.centerLng, 0.16),
      targetCityId:
        isl.id === "xiaoliuqiu"
          ? ("pingtung" as CityId)
          : isl.id === "green-island" || isl.id === "orchid-island"
            ? ("taitung" as CityId)
            : ("chiayi" as CityId),
    }));
    const islets = getAllPlaces().filter(
      (place) =>
        place.nameEn === "Guishan Island" || place.nameEn === "Keelung Islet"
    );
    for (const place of islets) {
      islands.push({
        id: place.id,
        nameHe: place.name,
        nameEn: place.nameEn ?? place.name,
        world: latLngToWorld3D(
          place.resolvedCoords.lat,
          place.resolvedCoords.lng,
          0.16
        ),
        targetCityId: place.cityId,
      });
    }
    return islands;
  }, []);

  // User "Near Me" Geolocation 3D Pulsing Blue Dot (P1 #6)
  const userWorldPos = useMemo(() => {
    if (!store.userCoords) return null;
    return latLngToWorld3D(store.userCoords.lat, store.userCoords.lng, 0.24);
  }, [store.userCoords]);

  useEffect(() => {
    markLoadStage("pins");
  }, []);

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
          onlyLabelCityId={onlyLabelCityId}
        />
      ))}

      {/* Offshore Island Mini Labels (Penghu, Xiaoliuqiu, Green Island, Orchid Island) */}
      {onlyLabelCityId == null &&
        offshoreMarkers.map((isl) => (
          <group
            key={isl.id}
            position={[isl.world.x, isl.world.y, isl.world.z]}
            onClick={(e) => {
              e.stopPropagation();
              triggerHapticTap();
              onSelectCity(isl.targetCityId);
            }}
          >
            <WorldHtml
              position={[0, 0.45, 0]}
              anchor="bottom"
              screenOffset={[0, -4]}
              hideWhenOffscreen
              labelPriority={15}
              showWhenFar={false}
              ariaHidden
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
                  onSelectCity(isl.targetCityId);
                }}
                className="flex min-h-11 min-w-11 cursor-pointer select-none items-center justify-center whitespace-nowrap rounded-full border border-teal-200/80 bg-slate-950/90 px-3 text-[13px] font-bold text-teal-50 shadow-sm backdrop-blur-xs [text-shadow:0_0_1px_#fff,0_1px_2px_#020617,0_0_10px_#020617] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
              >
                {isl.nameHe}
              </button>
            </WorldHtml>
          </group>
        ))}

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
            position={[0, 0.45, 0]}
            anchor="bottom"
            screenOffset={[0, -6]}
            hideWhenOffscreen
            ariaHidden
            zIndexRange={[34, 0]}
          >
            <div
              dir="rtl"
              title={store.userCoords.labelHe}
              className="pointer-events-none max-w-[8rem] truncate rounded-full border border-white bg-sky-600 px-2.5 py-0.5 text-xs font-black whitespace-nowrap text-white shadow-lg select-none"
            >
              📍 {store.userCoords.labelHe}
            </div>
          </WorldHtml>
        </group>
      )}
    </group>
  );
}
