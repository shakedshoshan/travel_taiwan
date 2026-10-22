"use client";

import { useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { WorldHtml } from "./WorldHtml";
import {
  getAllCities,
  getCityBundle,
  type EnrichedCity,
} from "@/lib/data/selectors";
import { OFFSHORE_ISLANDS } from "@/lib/data/taiwanGeo";
import { latLngToWorld3D } from "@/lib/data/coordinates";
import { tripActions, useTripStore } from "@/lib/store/useTripStore";
import type { CityId } from "@/data/types";

interface CityPinsProps {
  selectedCityId: CityId | null;
  activeTimelineCityId: CityId;
  isNightMode: boolean;
  onSelectCity: (cityId: CityId) => void;
}

interface SingleCityPinProps {
  city: EnrichedCity;
  index: number;
  isSelected: boolean;
  isTimelineActive: boolean;
  isNightMode: boolean;
  prefersReducedMotion: boolean;
  labelNudge: { x: number; z: number };
  onSelectCity: (cityId: CityId) => void;
}

/**
 * Fixed offsets so each name sits in open space beside its pin.
 * Positive Z is south. Taipei is pulled south, clear of the filter bar.
 * Sun Moon Lake goes west of the ridge; Alishan goes south of it.
 * Taitung goes west, clear of Green Island.
 */
const LABEL_NUDGE: Record<string, { x: number; z: number }> = {
  taipei: { x: -1.7, z: 4.35 },
  taichung: { x: -0.95, z: -0.7 },
  "sun-moon-lake": { x: -2.25, z: 0.35 },
  alishan: { x: 0.15, z: 1.55 },
  tainan: { x: -0.7, z: 0.1 },
  kaohsiung: { x: -0.95, z: 0.05 },
  hualien: { x: 1.05, z: 0.05 },
  taitung: { x: -1.45, z: -0.35 },
};

function computeLabelNudges(
  cities: readonly EnrichedCity[]
): Map<string, { x: number; z: number }> {
  const nudges = new Map<string, { x: number; z: number }>();
  for (const city of cities) {
    nudges.set(city.id, LABEL_NUDGE[city.id] ?? { x: 0, z: 0 });
  }
  return nudges;
}

function SingleCityPin({
  city,
  index,
  isSelected,
  isTimelineActive,
  isNightMode,
  prefersReducedMotion,
  labelNudge,
  onSelectCity,
}: SingleCityPinProps) {
  const groupRef = useRef<THREE.Group>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  const counts = useMemo(() => {
    const b = getCityBundle(city.id);
    return {
      hotels: b.hotels.length,
      food: b.food.length,
      attractions: b.attractions.length,
      total: b.hotels.length + b.food.length + b.attractions.length,
    };
  }, [city.id]);

  const isOnRoute = city.onRoute;
  const baseScale = isOnRoute ? 1.05 : 0.65;
  const activeMultiplier = isSelected
    ? 1.38
    : hovered
      ? 1.22
      : isTimelineActive
        ? 1.16
        : 1.0;

  const pinScaleTarget = useMemo(() => new THREE.Vector3(), []);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (groupRef.current) {
      const bobOffset = prefersReducedMotion
        ? 0
        : Math.sin(t * (isOnRoute ? 2.4 : 1.6) + index * 0.85) *
          (isOnRoute ? 0.07 : 0.03);
      groupRef.current.position.y = city.worldY + 0.35 + bobOffset;

      const targetScale = baseScale * activeMultiplier;
      pinScaleTarget.set(targetScale, targetScale, targetScale);
      groupRef.current.scale.lerp(pinScaleTarget, 0.15);
    }

    if (ringRef.current && !prefersReducedMotion) {
      const pulse = 1 + Math.sin(t * 3.5 + index) * 0.16;
      ringRef.current.scale.set(pulse, pulse, 1);
    }
  });

  const pinColor = isSelected
    ? "#facc15"
    : isTimelineActive
      ? "#ff5a36"
      : isOnRoute
        ? "#ff6b4a"
        : isNightMode
          ? "#64748b"
          : "#94a3b8";

  const emissiveIntensity = isSelected
    ? 1.8
    : hovered
      ? 1.4
      : isTimelineActive
        ? 1.15
        : isOnRoute
          ? isNightMode
            ? 0.9
            : 0.45
          : 0.12;

  return (
    <group position={[city.worldX, 0, city.worldZ]}>
      {/* Ground target ring on the island surface */}
      {isOnRoute && (
        <mesh
          ref={ringRef}
          position={[0, city.worldY + 0.03, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <ringGeometry args={[0.18, 0.28, 28]} />
          <meshBasicMaterial
            color={isSelected || isTimelineActive ? "#facc15" : "#ff5a36"}
            transparent
            opacity={isSelected || hovered ? 0.95 : 0.65}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}

      {/* Floating 3D Pin */}
      <group
        ref={groupRef}
        position={[0, city.worldY + 0.35, 0]}
        onClick={(e) => {
          e.stopPropagation();
          if (isSelected) {
            tripActions.enterCityZoomMap(city.id);
          } else {
            onSelectCity(city.id);
          }
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={(e) => {
          e.stopPropagation();
          setHovered(false);
          document.body.style.cursor = "auto";
        }}
      >
        {/* Invisible >=44px equivalent 3D hit sphere for outdoor touch accuracy */}
        <mesh position={[0, 0.04, 0]}>
          <sphereGeometry args={[0.56, 10, 10]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        </mesh>

        {/* Pin stem cone pointing down */}
        <mesh position={[0, -0.14, 0]} rotation={[Math.PI, 0, 0]} castShadow>
          <coneGeometry args={[0.12, 0.28, 16]} />
          <meshStandardMaterial
            color={pinColor}
            emissive={pinColor}
            emissiveIntensity={emissiveIntensity * 0.6}
            roughness={0.28}
            metalness={0.2}
            transparent={!isOnRoute}
            opacity={isOnRoute ? 1 : 0.68}
          />
        </mesh>

        {/* Pin head sphere */}
        <mesh position={[0, 0.06, 0]} castShadow>
          <sphereGeometry args={[0.16, 20, 20]} />
          <meshStandardMaterial
            color={pinColor}
            emissive={pinColor}
            emissiveIntensity={emissiveIntensity}
            roughness={0.22}
            metalness={0.25}
            transparent={!isOnRoute}
            opacity={isOnRoute ? 1 : 0.72}
          />
        </mesh>

        {/* Inner white jewel */}
        <mesh position={[0, 0.06, 0]}>
          <sphereGeometry args={[0.075, 12, 12]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>

        {/* Persistent label for on-route cities or hover tooltip for any city */}
      </group>
      {(isOnRoute || hovered || isSelected) && (
          <WorldHtml
            position={[
              labelNudge.x,
              city.worldY + 0.77,
              labelNudge.z,
            ]}
            center
            distanceFactor={16}
            zIndexRange={[20, 0]}
          >
            <div
              dir="rtl"
              onClick={(e) => {
                e.stopPropagation();
                onSelectCity(city.id);
              }}
              className={`relative cursor-pointer select-none rounded-full px-2.5 py-1 text-xs font-bold shadow-lg after:absolute after:-inset-2.5 after:content-[''] ${
                city.id === "sun-moon-lake"
                  ? "max-w-[5.4rem] whitespace-normal text-center leading-snug"
                  : "whitespace-nowrap"
              } ${
                isSelected
                  ? "scale-110 bg-amber-400 text-slate-950 ring-2 ring-white"
                  : hovered
                    ? "scale-105 bg-slate-900/95 text-white ring-2 ring-amber-400"
                    : isTimelineActive
                      ? "bg-orange-500 text-white ring-1 ring-white/80"
                      : isOnRoute
                        ? "bg-white/95 text-slate-900 backdrop-blur-md dark:bg-slate-900/95 dark:text-white"
                        : "bg-slate-800/85 text-slate-200"
              }`}
            >
              <div className="flex items-center gap-1.5">
                <span>{city.nameHe}</span>
              </div>
              {hovered && (
                <div className="mt-0.5 text-[10px] font-medium opacity-90">
                  {city.onRoute
                    ? `${city.days} ימים • ${city.dates.join(" | ")}`
                    : "מחוץ לציר הלינה הראשי • לחצו לפתיחה"}
                </div>
              )}
              {(hovered || isSelected) && counts.total > 0 && (
                <div className="mt-1 flex items-center justify-between gap-2 border-t border-slate-950/15 pt-1 text-[10px] font-bold">
                  <span>
                    🏨 {counts.hotels} • 🍜 {counts.food} • ★{" "}
                    {counts.attractions}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      tripActions.enterCityZoomMap(city.id);
                    }}
                    className="rounded-full bg-slate-950 px-2 py-0.5 text-[9.5px] font-black text-amber-300 hover:bg-slate-800"
                  >
                    זום למפת יעד 3D 🔍
                  </button>
                </div>
              )}
            </div>
          </WorldHtml>
        )}
    </group>
  );
}

export function CityPins({
  selectedCityId,
  activeTimelineCityId,
  isNightMode,
  onSelectCity,
}: CityPinsProps) {
  const store = useTripStore();
  const cities = getAllCities();
  const labelNudges = useMemo(() => computeLabelNudges(cities), [cities]);

  // Optional Kenting (קנטינג) off-route dashed marker on the southern cape
  const kentingWorld = useMemo(
    () => latLngToWorld3D(21.9483, 120.7798, 0.14),
    []
  );

  // Offshore islands world positions for subtle labels
  const offshoreMarkers = useMemo(
    () =>
      OFFSHORE_ISLANDS.map((isl) => ({
        ...isl,
        world: latLngToWorld3D(isl.centerLat, isl.centerLng, 0.16),
      })),
    []
  );

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
          labelNudge={labelNudges.get(city.id) ?? { x: 0.35, z: 0 }}
          onSelectCity={onSelectCity}
        />
      ))}

      {/* Optional Kenting (קנטינג) Off-Route Dashed Pin */}
      <group
        position={[kentingWorld.x, kentingWorld.y, kentingWorld.z]}
        onClick={(e) => {
          e.stopPropagation();
          onSelectCity("pingtung");
        }}
      >
        <mesh position={[0, 0.15, 0]}>
          <sphereGeometry args={[0.48, 8, 8]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        </mesh>
        <mesh position={[0, 0.12, 0]}>
          <sphereGeometry args={[0.11, 14, 14]} />
          <meshStandardMaterial
            color="#38bdf8"
            emissive="#0284c7"
            emissiveIntensity={0.6}
          />
        </mesh>
        <WorldHtml
          position={[0.35, 0.62, -4.05]}
          center
          distanceFactor={16}
          zIndexRange={[18, 0]}
        >
          <button
            type="button"
            dir="rtl"
            onClick={(e) => {
              e.stopPropagation();
              onSelectCity("pingtung");
            }}
            className="relative cursor-pointer select-none whitespace-nowrap rounded-full border-2 border-dashed border-sky-400/90 bg-slate-900/85 px-2.5 py-0.5 text-[10.5px] font-bold text-sky-200 shadow-md after:absolute after:-inset-2.5 after:content-['']"
          >
            קנטינג (אופציונלי)
          </button>
        </WorldHtml>
      </group>

      {/* Offshore Island Mini Labels (Penghu, Xiaoliuqiu, Green Island, Orchid Island) */}
      {offshoreMarkers.map((isl) => (
        <group
          key={isl.id}
          position={[isl.world.x, isl.world.y, isl.world.z]}
          onClick={(e) => {
            e.stopPropagation();
            if (isl.id === "xiaoliuqiu") onSelectCity("pingtung");
            else if (isl.id === "green-island" || isl.id === "orchid-island")
              onSelectCity("taitung");
          }}
        >
          <WorldHtml
            position={[
              isl.id === "xiaoliuqiu" ? -3.15 : isl.id === "orchid-island" ? 0.55 : 0.15,
              0.22,
              isl.id === "xiaoliuqiu" ? -1.55 : isl.id === "orchid-island" ? -2.15 : 0.15,
            ]}
            center
            distanceFactor={18}
            zIndexRange={[14, 0]}
          >
            <div
              dir="rtl"
              className="pointer-events-none select-none whitespace-nowrap rounded-full border border-teal-300/40 bg-slate-900/70 px-2 py-0.5 text-[9.5px] font-semibold text-teal-100 backdrop-blur-xs"
            >
              {isl.nameHe}
            </div>
          </WorldHtml>
        </group>
      ))}
    </group>
  );
}
